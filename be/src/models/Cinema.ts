import { Schema, model } from 'mongoose';
import { ICinema } from '../types';
import { CINEMA_STATUS } from '../utils/constants';

const cinemaSchema = new Schema<any>(
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
    status: {
      type: String,
      enum: [CINEMA_STATUS.ACTIVE, CINEMA_STATUS.INACTIVE],
      default: CINEMA_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

export const Cinema = model<ICinema>('Cinema', cinemaSchema);
