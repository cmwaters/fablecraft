import mongoose from 'mongoose'

export const CommentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  }
})