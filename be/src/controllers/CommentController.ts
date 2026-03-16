import { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants';
import { IApiResponse } from '../types';
import CommentService from '../services/CommentService';
import logger from '../utils/logger';

export class CommentController {
  static async getMovieComments(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await CommentService.getMovieComments(req.params.movieId, page, limit);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Comments retrieved successfully',
        data: result.comments,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get movie comments error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async createComment(req: Request, res: Response) {
    try {
      const comment = await CommentService.createComment(req.user!.userId, req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.COMMENT_CREATED,
        data: comment,
      });
    } catch (error: any) {
      logger.error('Create comment error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getManageComments(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await CommentService.getManageComments(page, limit, {
        movieId: req.query.movieId as string | undefined,
        status: req.query.status as string | undefined,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Comments retrieved successfully',
        data: result.comments,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Get manage comments error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async replyToComment(req: Request, res: Response) {
    try {
      const comment = await CommentService.replyToComment(req.params.commentId, req.user!.userId, req.body.content);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.COMMENT_REPLIED,
        data: comment,
      });
    } catch (error: any) {
      logger.error('Reply to comment error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateCommentStatus(req: Request, res: Response) {
    try {
      const comment = await CommentService.updateCommentStatus(req.params.commentId, req.body.status);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.COMMENT_STATUS_UPDATED,
        data: comment,
      });
    } catch (error: any) {
      logger.error('Update comment status error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default CommentController;
