import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer:   { type: String }, // optional
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lectureId:    { type: mongoose.Schema.Types.ObjectId, ref: "Lecture", required: true },
  isIMP:        { type: Boolean, default: false },
  status:       { type: String, enum: ["unanswered", "answered"], default: "unanswered" },
  createdAt:    { type: Date, default: Date.now },
  answeredAt:   { type: Date },
  isValid:{type: Boolean, default:true}
});

export default mongoose.model("Question", questionSchema);
