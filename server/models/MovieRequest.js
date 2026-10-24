import mongoose from 'mongoose';

const movieRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    releaseYear: {
      type: Number,
      min: [1888, 'Year must be valid'],
      max: [2100, 'Year must be valid'],
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: ''
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'added', 'declined'],
      default: 'pending'
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

movieRequestSchema.index({ user: 1, createdAt: -1 });
movieRequestSchema.index({ createdAt: -1 });

export const MovieRequest = mongoose.model('MovieRequest', movieRequestSchema);
export default MovieRequest;
