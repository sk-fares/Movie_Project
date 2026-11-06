import mongoose from 'mongoose';

const inviteCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Invite code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, 'Invite code must be at least 3 characters'],
      maxlength: [50, 'Invite code cannot exceed 50 characters'],
      index: true
    },
    label: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Label cannot exceed 100 characters']
    },
    maxUses: {
      type: Number,
      default: null // null or 0 means unlimited uses
    },
    usedCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date,
      default: null // null means the code itself never expires
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Method to verify if code is currently usable
inviteCodeSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  if (this.maxUses !== null && this.maxUses > 0 && this.usedCount >= this.maxUses) return false;
  return true;
};

export const InviteCode = mongoose.model('InviteCode', inviteCodeSchema);
