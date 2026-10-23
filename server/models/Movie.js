import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    releaseYear: {
      type: Number,
      min: [1888, 'Year must be 1888 or later'],
      max: [2100, 'Year must be 2100 or earlier']
    },
    genre: {
      type: String,
      trim: true,
      default: 'General'
    },
    runtime: {
      type: Number, // in minutes
      min: [0, 'Runtime must be non-negative']
    },
    posterPath: {
      type: String, // Filename inside uploads/posters
      default: null
    },
    videoPath: {
      type: String, // Filename inside uploads/videos
      required: [true, 'Video file is required']
    },
    videoOriginalName: {
      type: String,
      default: ''
    },
    videoMimeType: {
      type: String,
      default: 'video/mp4'
    },
    videoSize: {
      type: Number, // Size in bytes
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Virtual for formatted runtime
movieSchema.virtual('formattedRuntime').get(function () {
  if (!this.runtime) return null;
  const hours = Math.floor(this.runtime / 60);
  const minutes = this.runtime % 60;
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  }
  return `${minutes}m`;
});

// Configure toJSON to include virtuals
movieSchema.set('toJSON', { virtuals: true });
movieSchema.set('toObject', { virtuals: true });

export const Movie = mongoose.model('Movie', movieSchema);
