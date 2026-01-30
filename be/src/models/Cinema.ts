import { Schema, model } from 'mongoose';
import { ICinema } from '../types';

const cinemaSchema = new Schema<ICinema>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a cinema name'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide an address'],
      trim: true,
    },
    facilities: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Cinema = model<ICinema>('Cinema', cinemaSchema);
