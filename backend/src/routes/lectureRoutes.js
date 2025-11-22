import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { createLecture, changeLectureStatus, getLectures, updateLecture, deleteLecture } from '../controller/lectureController.js';

const router = express.Router();

// Only a teacher can do this
router.post('/', protect, authorize('teacher'), createLecture);

router.get('/', protect, getLectures);

// Only a teacher can do this
router.patch('/:id/status', protect, authorize('teacher'), changeLectureStatus);

// PATCH update for pending upcoming
router.patch('/:id', protect, authorize('teacher'), updateLecture);

// DELETE lecture
router.delete('/:id', protect, authorize('teacher'), deleteLecture);

export default router;