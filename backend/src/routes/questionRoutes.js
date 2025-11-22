import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { createQuestion, updateQuestionStatus, getQuestions, clearQuestion ,updateQuestion} from '../controller/questionController.js';

const router = express.Router();

//Get all questions for a lecture/student
router.get('/', protect, getQuestions);

//Create a new question
router.post('/', protect, createQuestion);

//Update a question's status
// Only a teacher can do this
router.patch('/:id/status', protect, authorize('teacher'), updateQuestionStatus);

//clears a question (only changes the isValid to false)
//only a teacher can do this
router.delete('/:id', protect, authorize('teacher'), clearQuestion);

// This allows an instructor to "organize" questions.
router.patch('/:id', protect, authorize('teacher'), updateQuestion);

export default router;