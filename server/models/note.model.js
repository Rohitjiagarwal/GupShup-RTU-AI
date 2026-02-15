// server/models/note.model.js
import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false // 🔥 Important: Default is false so you can review it first
  },
  contributedBy: {
    type: String, // You can store User ID here later if you want
    default: "Anonymous"
  }
}, { timestamps: true });

const Note = mongoose.model("Note", noteSchema);
export default Note;