import { Types } from 'mongoose';
import { Booking } from '../models/Booking';
import { Comment } from '../models/Comment';
import { Movie } from '../models/Movie';
import { User } from '../models/User';
import { IComment, ICommentRequest } from '../types';
import { COMMENT_STATUS, ERROR_MESSAGES, PAGINATION } from '../utils/constants';
import { getIO } from '../socket';
import NotificationService from './NotificationService';

export class CommentService {
  static async getMovieComments(
    movieId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT
  ) {
    const skip = (page - 1) * limit;
    const query = { movie: movieId, status: COMMENT_STATUS.APPROVED };

    const comments = await Comment.find(query)
      .populate('user', 'name role')
      .populate('replies.user', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments(query);

    return {
      comments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  static async getManageComments(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: { movieId?: string; status?: string }
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (filters?.movieId) query.movie = filters.movieId;
    if (filters?.status) query.status = filters.status;

    const comments = await Comment.find(query)
      .populate('movie', 'title')
      .populate('user', 'name email role')
      .populate('replies.user', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments(query);

    return {
      comments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  static async createComment(userId: string, commentData: ICommentRequest): Promise<IComment> {
    const movie = await Movie.findById(commentData.movie);
    if (!movie) {
      const error: any = new Error(ERROR_MESSAGES.MOVIE_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    if (commentData.booking) {
      const booking = await Booking.findOne({
        _id: commentData.booking,
        user: userId,
      });
      if (!booking) {
        const error: any = new Error(ERROR_MESSAGES.BOOKING_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }
    }

    const comment = await Comment.create({
      ...commentData,
      user: userId,
      status: COMMENT_STATUS.APPROVED,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name role')
      .populate('replies.user', 'name role');

    getIO()?.to(`movie:${commentData.movie}`).emit('comments:new', populatedComment);

    return populatedComment as unknown as IComment;
  }

  static async replyToComment(commentId: string, userId: string, content: string): Promise<IComment> {
    const user = await User.findById(userId).select('role name');
    if (!user) {
      const error: any = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      const error: any = new Error('Comment not found');
      error.statusCode = 404;
      throw error;
    }

    comment.replies.push({
      _id: new Types.ObjectId(),
      user: userId,
      role: user.role,
      content,
      createdAt: new Date(),
    });

    await comment.save();

    const populatedComment = await Comment.findById(commentId)
      .populate('user', 'name role')
      .populate('replies.user', 'name role');

    getIO()?.to(`movie:${comment.movie.toString()}`).emit('comments:reply', populatedComment);

    if (comment.user.toString() !== userId) {
      const movie = await Movie.findById(comment.movie).select('title');
      await NotificationService.createNotification(
        NotificationService.buildCommentReplyNotification(
          comment.user.toString(),
          String(user.name || 'Someone'),
          String(movie?.title || 'a movie'),
          content
        )
      );
    }

    return populatedComment as unknown as IComment;
  }

  static async updateCommentStatus(commentId: string, status: string): Promise<IComment> {
    const comment = await Comment.findByIdAndUpdate(commentId, { status }, { new: true })
      .populate('user', 'name role')
      .populate('replies.user', 'name role');

    if (!comment) {
      const error: any = new Error('Comment not found');
      error.statusCode = 404;
      throw error;
    }

    getIO()?.to(`movie:${comment.movie.toString()}`).emit('comments:status', comment);

    return comment as unknown as IComment;
  }
}

export default CommentService;
