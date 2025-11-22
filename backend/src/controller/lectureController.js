import Lecture from "../models/lectureModel.js";
import User from "../models/userModel.js";

export async function createLecture(req, res) {
  try {
    const { topic, subject, description, date, time, duration } = req.body;
    const teacherId = req.user._id;
    if (!topic || !subject || !date || !time || !duration) {
      return res.status(400).json({ error: "All fields (topic, subject, date, time, duration) are required" });
    }
    // Prevent duplicate pending classes (same teacher/topic/subject/date/time)
    const duplicateLecture = await Lecture.exists({
      topic, subject, teacherId, date, time, status: 'pending'
    });
    if (duplicateLecture) {
      return res.status(400).json({ error: "A pending class for this topic, subject, and time already exists." });
    }
    // Create
    const lecture = await Lecture.create({
      topic, teacherId, subject, description, date, time, duration, status: 'pending'
    });
    res.status(201).json({ message: "Class created successfully", lecture });
  } catch (err) {
    console.error("Error scheduling class:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function changeLectureStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const loggedInUserId = req.user._id;
    if (!status || !["pending", "live", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Status required: pending, live, completed, or cancelled." });
    }
    const lecture = await Lecture.findById(id);
    if (!lecture) return res.status(404).json({ error: "Lecture not found" });
    if (lecture.teacherId.toString() !== loggedInUserId.toString()) {
      return res.status(403).json({ error: "Not authorised to update this class" });
    }
    // Cannot change completed/cancelled classes further
    if (["completed", "cancelled"].includes(lecture.status)) {
      return res.status(400).json({ error: "Class is already " + lecture.status + ", can't update." });
    }
    // Only allow cancel if current date/time is before class
    if (status === "cancelled") {
      const classDateTime = new Date(`${lecture.date}T${lecture.time}`);
      if (Date.now() >= classDateTime.getTime()) {
        return res.status(400).json({ error: "Cannot cancel a class that has already started or passed." });
      }
    }
    lecture.status = status;
    await lecture.save();
    return res.status(200).json({ message: "Class status updated", lecture });
  } catch (err) {
    console.error("Error updating class status:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateLecture(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.user._id;
    const lecture = await Lecture.findById(id);
    if (!lecture) return res.status(404).json({ error: "Lecture not found" });
    if (lecture.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ error: "Not authorised to edit this class" });
    }
    if (lecture.status !== 'pending') {
      return res.status(400).json({ error: "Only pending classes can be edited." });
    }
    // Can only edit if in the future
    const classDateTime = new Date(`${lecture.date}T${lecture.time}`);
    if (Date.now() >= classDateTime.getTime()) {
      return res.status(400).json({ error: "Cannot edit class that has started or passed." });
    }
    // Only accept changes to topic, subject, description, date, time, duration
    const allowedFields = ['topic', 'subject', 'description', 'date', 'time', 'duration'];
    allowedFields.forEach(field => {
      if (typeof req.body[field] !== 'undefined') {
        lecture[field] = req.body[field];
      }
    });
    await lecture.save();
    res.status(200).json({ message: "Lecture updated.", lecture });
  } catch (err) {
    console.error("Error updating lecture:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


export async function getLectures(req, res) {
  try {

    const loggedInUser = req.user;
    const { teacherId } = req.query; // Optional filter from query string

    const filter = {};

    if (loggedInUser.role === 'teacher') {
      // If the user is a teacher, they can ONLY see their own lectures.
      filter.teacherId = loggedInUser._id;
    } else if (loggedInUser.role === 'student') {
      // If the user is a student, they can see all lectures by default.
      if (teacherId) {
        filter.teacherId = teacherId;
      }
    }

    // 3. Execute the database query with the constructed filter
    const lectures = await Lecture.find(filter)
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: lectures.length,
      lectures
    });

  } catch (err) {
    console.error("Error fetching lectures:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteLecture(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.user._id;

    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    // Verify ownership
    if (lecture.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ error: "Not authorised to delete this class" });
    }

    await Lecture.findByIdAndDelete(id);
    res.status(200).json({ message: "Lecture deleted successfully", id });
  } catch (err) {
    console.error("Error deleting lecture:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}