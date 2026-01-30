import { Schema, model } from 'mongoose';
import { IScreen } from '../types';

const screenSchema = new Schema<IScreen>(
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
  },
  {
    timestamps: true,
  }
);

export const Screen = model<IScreen>('Screen', screenSchema);
