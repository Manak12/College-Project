import Question from "../models/questionModel.js";
import User from "../models/userModel.js";
import Lecture from "../models/lectureModel.js";
import { io } from "../server.js";

export async function createQuestion(req, res) {
    try {
        const { question, lectureId, isIMP } = req.body;
        const studentId = req.user._id;

        if (req.user.role !== 'student') {
            return res.status(403).json({ error: "Forbidden: Access allowed only for students" });
        }

        if (!question || !lectureId) {
            return res.status(400).json({ error: "question and lectureId are required" });
        }

        const lectureExists = await Lecture.exists({ _id: lectureId });
        if (!lectureExists) {
            return res.status(404).json({ error: "Lecture not found" });
        }

        const escaped = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const duplicate = await Question.findOne({
            lectureId,
            question: { $regex: new RegExp(`^${escaped}$`, "i") } // case-insensitive exact match
        });

        if (duplicate) {
            return res
                .status(409)
                .json({ error: "Question already exists in this lecture." });
        }

        // --- Create Question ---
        const que = await Question.create({
            question,
            studentId,
            lectureId,
            isIMP: isIMP || false
        });

        return res.status(201).json({
            message: "Question created successfully",
            question: que
        });
    } catch (err) {
        console.error("Error creating question:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function updateQuestionStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, answer } = req.body;

        if (!status) {
            return res.status(400).json({ error: "status is required" });
        }

        const allowed = ["answered", "unanswered"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
        }

        const updateData = {
            status,
            answeredAt: status === "answered" ? new Date() : null
        };

        if (answer !== undefined) {
            updateData.answer = answer;
        }

        const question = await Question.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        res.status(200).json({
            message: "Question status updated successfully",
            question
        });
    } catch (err) {
        console.error("Error updating question status:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function clearQuestion(req, res) {
    try {
        //only a teacher can access this
        // question id is from url parameters
        const { id } = req.params;

        const question = await Question.findByIdAndUpdate(
            id,
            { isValid: false },
            { new: true }
        );

        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        res.status(200).json({
            message: "Question cleared successfully",
            question
        });
    } catch (err) {
        console.error("Error clearing question:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}


export async function getQuestions(req, res) {
    try {
        const { studentId, lectureId } = req.query; // use query string for GET

        if (!studentId && !lectureId) {
            return res
                .status(400)
                .json({ error: "Provide at least studentId or lectureId" });
        }

        const filter = { isValid: true };
        if (studentId) filter.studentId = studentId;
        if (lectureId) filter.lectureId = lectureId;

        const questions = await Question.find(filter)
            .populate("studentId", "name email")
            .populate("lectureId", "topic subject")
            .sort({ createdAt: -1 });

        res.json({ count: questions.length, questions });
    } catch (err) {
        console.error("Error fetching questions:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function updateQuestion(req, res) {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            req.body, // This will pass { isIMP: true } or other fields
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }
        res.status(200).json({ message: "Question updated successfully", question });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
}

// Real-Time Socket.IO Event Registration
export function registerQuestionSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join a specific lecture room
        socket.on("join_lecture", (lectureId) => {
            if (lectureId) {
                socket.join(lectureId);
                console.log(`Socket ${socket.id} joined lecture room: ${lectureId}`);
            }
        });

        // Leave a specific lecture room
        socket.on("leave_lecture", (lectureId) => {
            if (lectureId) {
                socket.leave(lectureId);
                console.log(`Socket ${socket.id} left lecture room: ${lectureId}`);
            }
        });

        // Student asks a question
        socket.on("ask_question", async (data) => {
            try {
                // data: { question, lectureId, studentId, isIMP }
                const { question, lectureId, studentId, isIMP } = data;
                // Basic validation
                if (!question || !lectureId || !studentId) {
                    socket.emit("question_error", { error: "Missing data" });
                    return;
                }
                // Create question in DB
                const que = await Question.create({
                    question,
                    studentId,
                    lectureId,
                    isIMP: isIMP || false
                });

                // Populate student details for the frontend
                const populatedQue = await Question.findById(que._id)
                    .populate("studentId", "name email");

                // Notify all in the lecture room about new question
                io.to(lectureId).emit("question_created", { question: populatedQue });
            } catch (err) {
                console.error("Socket error ask_question:", err);
                socket.emit("question_error", { error: "Failed to create question" });
            }
        });

        // Teacher answers a question
        socket.on("answer_question", async (data) => {
            try {
                // data: { questionId, answer, lectureId }
                const { questionId, answer, lectureId } = data;

                if (!questionId || !answer) {
                    socket.emit("answer_error", { error: "Missing data" });
                    return;
                }

                // Update question with answer & status
                const updated = await Question.findByIdAndUpdate(
                    questionId,
                    { answer, status: "answered", answeredAt: new Date() },
                    { new: true }
                ).populate("studentId", "name email");

                if (updated) {
                    // If lectureId is provided, emit to room, otherwise emit globally (fallback)
                    if (lectureId) {
                        io.to(lectureId).emit("question_answered", { question: updated });
                    } else {
                        // Fallback if frontend doesn't send lectureId, though it should
                        io.emit("question_answered", { question: updated });
                    }
                } else {
                    socket.emit("answer_error", { error: "Question not found" });
                }
            } catch (err) {
                console.error("Socket error answer_question:", err);
                socket.emit("answer_error", { error: "Failed to answer question" });
            }
        });
    });
}