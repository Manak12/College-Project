import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  topic: { type: String, required: true },
  description: { type: String },  // optional detailed summary
  subject: { type: String, required: true },
  // dateTime:   { type: Date },
  date: { type: String },
  time: { type: String },
  status: { type: String, enum: ["pending", "live", "completed", "cancelled"], default: "pending" },
}, { timestamps: true }); // adds createdAt and updatedAt automatically

export default mongoose.model("Lecture", lectureSchema);
