import { Schema, model } from 'mongoose';
import { IMovie } from '../types';
import { MOVIE_STATUS } from '../utils/constants';

const movieSchema = new Schema<any>(
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
    status: {
      type: String,
      enum: [MOVIE_STATUS.DRAFT, MOVIE_STATUS.PUBLISHED, MOVIE_STATUS.ARCHIVED],
      default: MOVIE_STATUS.PUBLISHED,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Movie = model<IMovie>('Movie', movieSchema);
