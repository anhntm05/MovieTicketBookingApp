import { Schema, model } from 'mongoose';
import { INotification } from '../types';

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['comment', 'booking_confirm', 'booking_cancel', 'promo'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    movieTitle: {
      type: String,
      trim: true,
      default: '',
    },
    actorName: {
      type: String,
      trim: true,
      default: '',
    },
    actorAvatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    unread: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = model<INotification>('Notification', notificationSchema);
