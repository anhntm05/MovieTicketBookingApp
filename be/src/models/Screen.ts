import { Schema, model } from 'mongoose';
import { IScreen } from '../types';
import { SCREEN_STATUS } from '../utils/constants';

const screenSchema = new Schema<any>(
  {
    cinema: {
      type: Schema.Types.ObjectId,
      ref: 'Cinema',
      required: [true, 'Please provide a cinema'],
    },
    name: {
      type: String,
      required: [true, 'Please provide a screen name'],
      trim: true,
    },
    totalSeats: {
      type: Number,
      required: [true, 'Please provide total seats count'],
      min: 1,
    },
    seatLayout: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: [SCREEN_STATUS.ACTIVE, SCREEN_STATUS.MAINTENANCE],
      default: SCREEN_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

export const Screen = model<IScreen>('Screen', screenSchema);
