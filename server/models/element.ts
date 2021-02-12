import mongoose from 'mongoose'

export const ElementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
})