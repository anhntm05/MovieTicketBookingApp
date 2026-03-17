import { Schema, model } from 'mongoose';
import { IComment, ICommentReply } from '../types';
import { COMMENT_STATUS, USER_ROLES } from '../utils/constants';

const commentReplySchema = new Schema<any>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a reply user'],
    },
    role: {
      type: String,
      enum: [USER_ROLES.CUSTOMER, USER_ROLES.STAFF, USER_ROLES.ADMIN],
      required: [true, 'Please provide a reply role'],
    },
    content: {
      type: String,
      required: [true, 'Please provide reply content'],
      trim: true,
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

const commentSchema = new Schema<any>(
  {
    movie: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Please provide a movie'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user'],
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: [true, 'Please provide comment content'],
      trim: true,
    },
    status: {
      type: String,
      enum: [COMMENT_STATUS.APPROVED, COMMENT_STATUS.HIDDEN],
      default: COMMENT_STATUS.APPROVED,
    },
    replies: {
      type: [commentReplySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ movie: 1, status: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });

export const Comment = model<IComment>('Comment', commentSchema);
