import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true
    },
    tagline: {
      type: String,
      default: 'Featured Movie',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    imageUrl: {
      type: String,
      required: [true, 'Thumbnail or backdrop image URL is required'],
      trim: true
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      default: null
    },
    linkUrl: {
      type: String,
      default: '',
      trim: true
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Banner = mongoose.model('Banner', bannerSchema);
