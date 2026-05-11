import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    likedby: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    targetType: {
      type: String,
      enum: ["video", "comment", "tweet"],
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

//  prevent duplicate likes
likeSchema.index(
  { likedby: 1, targetId: 1, targetType: 1 },
  { unique: true }
);

//  fast lookup for counts
likeSchema.index({ targetId: 1, targetType: 1 });

export const Like = mongoose.model("Like", likeSchema);