import { Schema, model } from 'mongoose';
import { IMovie } from '../types';

const movieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    duration: {
      type: Number,
      required: [true, 'Please provide a duration in minutes'],
    },
    genre: {
      type: [String],
      required: [true, 'Please provide at least one genre'],
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      required: [true, 'Please provide a rating'],
    },
    poster: {
      type: String,
      required: [true, 'Please provide a poster URL'],
    },
    trailer: {
      type: String,
      required: [true, 'Please provide a trailer URL'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Please provide a release date'],
    },
  },
  {
    timestamps: true,
  }
);

export const Movie = model<IMovie>('Movie', movieSchema);
