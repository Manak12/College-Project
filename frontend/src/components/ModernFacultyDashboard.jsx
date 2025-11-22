import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sidebar } from './Sidebar.jsx';
import {
  Plus,
  Video,
  Users,
  Calendar,
  Play,
  Pause,
  MessageCircle,
  Clock,
  LogOut,
  History,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Trash
} from 'lucide-react';

// Utility helpers
const API_BASE_URL = 'http://localhost:5001/api';

const formatLectureTime = (timeStr) => {
  if (!timeStr) return '—';
  const parsed = new Date(`1970-01-01T${timeStr}`);
  if (Number.isNaN(parsed.getTime())) return timeStr;
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatLectureDate = (dateStr, timeStr) => {
  if (!dateStr) return 'Unknown Date';
  const isoLike = timeStr ? `${dateStr}T${timeStr}` : dateStr;
  const parsed = new Date(isoLike);
  if (Number.isNaN(parsed.getTime())) {
    const fallback = new Date(dateStr);
    return Number.isNaN(fallback.getTime())
      ? dateStr
      : fallback.toLocaleDateString();
  }
  return parsed.toLocaleDateString();
};

// API helper functions
const getAuthToken = () => {
  const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };
  return getCookie('authToken') || localStorage.getItem('authToken');
};

const apiCall = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export function ModernFacultyDashboard({ onGoLive, onSignOut, lectureHistory = [] }) {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLectureTopic, setNewLectureTopic] = useState('');
  const [newLectureSubject, setNewLectureSubject] = useState('');
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [showQuestionsView, setShowQuestionsView] = useState(false);

  // API-related state
  const [lectures, setLectures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingLecture, setIsCreatingLecture] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);

  // Add new state for date, time, duration:
  const [newLectureDate, setNewLectureDate] = useState('');
  const [newLectureTime, setNewLectureTime] = useState('');
  const [newLectureDuration, setNewLectureDuration] = useState('');

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState(null);

  // Filter completed lectures for history section
  const completedLectures = lectures.filter(lecture => lecture.status === 'completed');

  // Combine API completed lectures with prop lecture history
  const allCompletedLectures = [...completedLectures, ...lectureHistory];

  // Filter active lectures (not completed) for the main dashboard
  const activeLectures = lectures.filter(lecture => lecture.status !== 'completed');

  // Fetch lectures from API
  const fetchLectures = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await apiCall('/lectures');

      // Transform API response to match component structure
      const transformedLectures = response.lectures?.map(lecture => {
        const normalizedStatus = lecture.status === 'scheduled' ? 'pending' : (lecture.status || 'pending');
        const formattedTime = formatLectureTime(lecture.time);
        const formattedDate = formatLectureDate(lecture.date, lecture.time);
        return {
          id: lecture._id,
          lectureId: lecture._id, // Keep original ID for API calls
          name: lecture.topic,
          description: lecture.subject,
          faculty: lecture.teacherId?.name || 'You',
          time: formattedTime,
          date: formattedDate,
          participants: lecture.participants || 0, // Get actual participant count
          isLive: normalizedStatus === 'live',
          isOwner: true, // Teacher can only see their own lectures
          status: normalizedStatus,
          createdAt: lecture.createdAt,
          // Add fields that might be useful for history
          totalQuestions: lecture.questions?.length || 0,
          duration: lecture.duration || '45m', // Default duration if not provided
          questions: lecture.questions || [] // Include questions for viewing
        };
      }) || [];

      setLectures(transformedLectures);
    } catch (err) {
      console.error('Error fetching lectures:', err);
      setError(`Failed to load lectures: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Create new lecture via API
  const createLecture = async () => {
    // Form validation for all required fields
    if (!newLectureTopic.trim() || !newLectureSubject.trim() || !newLectureDate.trim() || !newLectureTime.trim() || !newLectureDuration.trim()) {
      setError('All fields (topic, subject, date, time, duration) are required');
      return;
    }
    // check if duration is a number and > 0
    if (isNaN(Number(newLectureDuration)) || Number(newLectureDuration) <= 0) {
      setError('Duration must be a positive number (in minutes)');
      return;
    }
    try {
      setIsCreatingLecture(true);
      setError(null);
      // Submit API with correct keys
      const lectureData = {
        topic: newLectureTopic.trim(),
        subject: newLectureSubject.trim(),
        description: newLectureSubject.trim(), // description is duplicate for now (adjust if real field needed)
        date: newLectureDate.trim(),
        time: newLectureTime.trim(),
        duration: Number(newLectureDuration),
      };
      const response = await apiCall('/lectures', {
        method: 'POST',
        body: JSON.stringify(lectureData)
      });
      // Add the new lecture to local state
      const normalizedStatus = response.lecture.status === 'scheduled' ? 'pending' : response.lecture.status;
      const newLecture = {
        id: response.lecture._id,
        lectureId: response.lecture._id,
        name: response.lecture.topic,
        description: response.lecture.subject,
        faculty: 'You',
        time: formatLectureTime(response.lecture.time),
        date: formatLectureDate(response.lecture.date, response.lecture.time),
        participants: 0,
        isLive: false,
        isOwner: true,
        status: normalizedStatus || 'pending',
        createdAt: response.lecture.createdAt,
        totalQuestions: 0,
        duration: response.lecture.duration,
        questions: []
      };
      setLectures(prev => [newLecture, ...prev]);
      setNewLectureTopic('');
      setNewLectureSubject('');
      setNewLectureDate('');
      setNewLectureTime('');
      setNewLectureDuration('');
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message || 'Failed to create lecture');
    } finally {
      setIsCreatingLecture(false);
    }
  };

  // Update lecture status to 'live'
  const updateLectureStatus = async (lectureId, status) => {
    try {
      await apiCall(`/lectures/${lectureId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      // Update local state
      setLectures(prev => prev.map(lecture =>
        lecture.lectureId === lectureId
          ? { ...lecture, isLive: status === 'live', status }
          : lecture
      ));

    } catch (err) {
      console.error('Error updating lecture status:', err);
      alert(`Failed to update lecture status: ${err.message}`);
    }
  };

  // Delete lecture
  const confirmDelete = (lectureId) => {
    setLectureToDelete(lectureId);
    setShowDeleteModal(true);
  };

  const handleDeleteLecture = async () => {
    if (!lectureToDelete) return;

    try {
      await apiCall(`/lectures/${lectureToDelete}`, {
        method: 'DELETE'
      });

      // Remove from local state
      setLectures(prev => prev.filter(lecture => lecture.lectureId !== lectureToDelete));
      setShowDeleteModal(false);
      setLectureToDelete(null);
    } catch (err) {
      console.error('Error deleting lecture:', err);
      alert(`Failed to delete lecture: ${err.message}`);
    }
  };

  // Load lectures on component mount
  useEffect(() => {
    fetchLectures();
  }, []);

  // Fetch questions for a specific lecture
  const fetchLectureQuestions = async (lectureId) => {
    try {
      setIsLoadingQuestions(true);
      setQuestionsError(null);

      const response = await apiCall(`/questions?lectureId=${lectureId}`);

      // Transform questions data to match component structure
      const transformedQuestions = response.questions?.map(question => ({
        id: question._id || question.id,
        text: question.text || question.question,
        studentName: question.studentId?.name || question.studentName || question.student || 'Anonymous',
        studentEmail: question.studentId?.email || question.email || '',
        timestamp: question.timestamp || question.createdAt,
        isAnswered: question.status === 'answered' || question.isAnswered || question.answered || false,
        isStarred: question.isIMP || question.isStarred || false,
        status: question.status || 'unanswered',
        isValid: question.isValid !== false,
        answeredAt: question.answeredAt,
        answer: question.answer || question.response || (question.status === 'answered' ? 'This question was answered during the live session.' : null)
      })) || [];

      return transformedQuestions;
    } catch (err) {
      console.error('Error fetching lecture questions:', err);
      setQuestionsError(`Failed to load questions: ${err.message}`);
      return [];
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleViewLectureQuestions = async (lecture) => {
    setSelectedLecture(lecture);
    setShowQuestionsView(true);

    // If this is a completed lecture from API, fetch fresh questions data
    if (lecture.lectureId && lecture.status === 'completed') {
      const questions = await fetchLectureQuestions(lecture.lectureId);

      // Update the selected lecture with fresh questions data
      setSelectedLecture(prev => ({
        ...prev,
        questions: questions,
        totalQuestions: questions.length
      }));
    }
  };

  const handleBackToDashboard = () => {
    setSelectedLecture(null);
    setShowQuestionsView(false);
    setQuestionsError(null);
    setIsLoadingQuestions(false);
  };

  const handleGoLive = async (lectureId) => {
    const lecture = lectures.find(l => l.lectureId === lectureId);
    if (!lecture) {
      console.error('Lecture not found:', lectureId);
      return;
    }

    try {
      // Update lecture status to 'live' in backend
      await updateLectureStatus(lectureId, 'live');

      // Call parent's onGoLive function with lecture data
      onGoLive(lectureId, lecture.name, lecture.lectureId);
    } catch (err) {
      console.error('Error going live:', err);
    }
  };

  const handleStopLive = async (lectureId) => {
    try {
      // Update lecture status to 'completed' in backend
      await updateLectureStatus(lectureId, 'completed');
    } catch (err) {
      console.error('Error stopping live:', err);
    }
  };

  const handleRefresh = () => {
    fetchLectures(true);
  };

  // Loading state
  if (isLoading && lectures.length === 0) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading lectures...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-semibold text-foreground"
              >
                DASHBOARD
              </motion.h1>
              <p className="text-muted-foreground mt-1">Welcome Back, Professor</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="border-border text-foreground"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Lecture
              </Button>
            </motion.div>
            <Button
              onClick={onSignOut}
              variant="outline"
              className="border-border text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Active Lectures Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Active Lectures</h2>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {activeLectures.length} active
            </Badge>
          </div>

          {activeLectures.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 text-lg mb-2">No active lectures</p>
              <p className="text-gray-400 mb-4">Create your first lecture to get started</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Lecture
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {activeLectures.map((lecture, index) => (
                  <motion.div
                    key={lecture.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-card-foreground">{lecture.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{lecture.description}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {lecture.isLive && (
                              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                                <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                                LIVE
                              </Badge>
                            )}
                            <Badge variant="outline" className={`text-xs ${
                              lecture.status === 'pending' ? 'bg-yellow-40 text-yellow-700 border-yellow-200' :
                              lecture.status === 'live' ? 'bg-green-50 text-green-700 border-green-200' :
                              lecture.status === 'completed' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {lecture.status.charAt(0).toUpperCase() + lecture.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Avatar className="w-6 h-6 mr-2">
                                <AvatarFallback className="text-xs">
                                  {lecture.faculty.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {lecture.faculty}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {lecture.time}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {lecture.date}
                            </div>
                          </div>

                          {lecture.isOwner && (
                            <div className="pt-2 border-t border-border">
                              {(!lecture.isLive) && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleGoLive(lecture.lectureId)}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                    size="sm"
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Go Live
                                  </Button>
                                  <Button
                                    onClick={() => confirmDelete(lecture.lectureId)}
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                    size="sm"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              {lecture.isLive && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleStopLive(lecture.lectureId)}
                                    variant="outline"
                                    className="flex-1 border-border text-card-foreground"
                                    size="sm"
                                  >
                                    <Pause className="w-4 h-4 mr-2" />
                                    Stop
                                  </Button>
                                  <Button
                                    onClick={() => handleGoLive(lecture.lectureId)}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                    size="sm"
                                  >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    View Questions
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Lecture History Section - Now shows all completed lectures */}
        {allCompletedLectures.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Lecture History</h2>
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {allCompletedLectures.length} completed
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {allCompletedLectures.map((lecture, index) => (
                  <motion.div
                    key={lecture.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => handleViewLectureQuestions(lecture)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-card-foreground">{lecture.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{lecture.description}</p>
                          </div>
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            Completed
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {lecture.date ? (
                                typeof lecture.date === 'string' && lecture.date !== 'Today' ? lecture.date :
                                  new Date(lecture.createdAt || Date.now()).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                              ) : 'Unknown Date'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-card border-border max-w-[40%]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full !bg-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>

            <DialogTitle className="text-center text-xl text-card-foreground">
              Delete Lecture?
            </DialogTitle>

            <DialogDescription className="text-center text-muted-foreground pt-2">
              Are you sure you want to delete this lecture? This action cannot be undone and will permanently remove the class.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-4 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="w-24 border-border text-card-foreground"
            >
              Cancel
            </Button>

            <Button
              onClick={handleDeleteLecture}
              className="w-24 !bg-red-600 !hover:bg-red-700 text-white border-none"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Questions List View Modal */}
      <Dialog open={showQuestionsView} onOpenChange={setShowQuestionsView}>
        <DialogContent className="bg-[#2d3748] border-[#4a5568] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b border-[#4a5568] bg-[#2d3748] flex-shrink-0">
            <DialogTitle className="text-white text-2xl font-bold">
              Questions from {selectedLecture?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-300 mt-2">
              All questions asked during this lecture session
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Questions Container */}
          <div
            data-scroll-container="questions"
            className="flex-1 overflow-y-auto p-6 bg-[#4a5568]"
            style={{
              maxHeight: '65vh',
              minHeight: '400px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#718096 #5a6377',
              backgroundColor: '#4a5568'
            }}
          >
            {/* Loading Questions State */}
            {isLoadingQuestions ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-slate-300">Loading questions...</p>
                </div>
              </div>
            ) : questionsError ? (
              <div className="text-center py-16">
                <div className="bg-red-900 border border-red-600 rounded-2xl p-8">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <h3 className="text-white text-xl font-semibold mb-2">Error Loading Questions</h3>
                  <p className="text-red-300 text-base mb-4">{questionsError}</p>
                  <Button
                    onClick={() => handleViewLectureQuestions(selectedLecture)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            ) : selectedLecture?.questions && selectedLecture.questions.length > 0 ? (
              <div className="space-y-4">
                {selectedLecture.questions.map((question, index) => (
                  <motion.div
                    key={question.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#5a6377] rounded-xl p-5 shadow-lg border border-[#6b7391] hover:bg-[#6b7391] transition-all duration-200"
                    style={{ backgroundColor: '#5a6377' }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Student Avatar with Orange Color */}
                      <div className="w-12 h-12 bg-[#f6ad55] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: '#f6ad55' }}>
                        {question.studentName && question.studentName !== 'Anonymous' ?
                          question.studentName.substring(0, 2).toUpperCase() : 'AN'}
                      </div>

                      {/* Question Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-white font-semibold text-lg">
                              {question.studentName || 'Anonymous Student'}
                            </h4>
                            <p className="text-gray-300 text-sm">
                              {question.timestamp ?
                                new Date(question.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) :
                                'Time not available'
                              }
                            </p>
                          </div>
                          <Badge
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${question.isAnswered || question.status === 'answered'
                              ? "bg-orange-100 text-orange-800 border border-orange-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                              }`}
                          >
                            {question.isAnswered || question.status === 'answered' ? 'Answered' : 'Unanswered'}
                          </Badge>
                        </div>

                        <p className="text-white text-base leading-relaxed">
                          {question.text || question.question}
                        </p>

                        {/* Answer Section */}
                        {(question.answer || question.response || (question.isAnswered || question.status === 'answered')) && (
                          <div className="mt-4">
                            <div className="bg-slate-700 rounded-lg border border-slate-600 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                                <p className="text-green-400 font-semibold text-sm">Answer:</p>
                              </div>
                              <p className="text-white leading-relaxed text-base">
                                {question.answer || question.response || 'This question was answered during the live session.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Pending indicator for unanswered questions */}
                        {!(question.isAnswered || question.status === 'answered') && (
                          <div className="mt-4">
                            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-yellow-500 rounded-full"></div>
                                <p className="text-yellow-300 font-medium text-sm">This question is still pending response</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="bg-[#5a6377] rounded-2xl p-16 border border-[#6b7391]" style={{ backgroundColor: '#5a6377' }}>
                  <MessageCircle className="w-20 h-20 mx-auto mb-6 text-gray-400" />
                  <h3 className="text-white text-2xl font-semibold mb-3">No Questions Asked</h3>
                  <p className="text-gray-300 text-lg">
                    This lecture session had no student questions
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-600 bg-slate-900 flex-shrink-0">
            <div className="text-slate-300 text-sm font-medium flex items-center gap-4">
              <span>
                {selectedLecture?.date && selectedLecture.date !== 'Today' ?
                  (typeof selectedLecture.date === 'string' ? selectedLecture.date :
                    new Date(selectedLecture.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })) :
                  new Date(selectedLecture?.createdAt || Date.now()).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })
                }
              </span>
              {selectedLecture?.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedLecture.duration}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Refresh Questions Button (only for API lectures) */}
              {selectedLecture?.lectureId && !isLoadingQuestions && (
                <Button
                  onClick={() => handleViewLectureQuestions(selectedLecture)}
                  variant="outline"
                  className="bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600 px-4 py-2 text-sm"
                  disabled={isLoadingQuestions}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              )}
              {/* Scroll to Top Button */}
              {selectedLecture?.questions && selectedLecture.questions.length > 5 && !isLoadingQuestions && (
                <Button
                  onClick={() => {
                    const container = document.querySelector('[data-scroll-container="questions"]');
                    if (container) {
                      container.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  variant="outline"
                  className="bg-[#4a5568] text-gray-300 hover:bg-[#5a6377] border-[#5a6377] px-4 py-2 text-sm rounded-lg"
                  style={{ backgroundColor: '#4a5568' }}
                >
                  ↑ Back to Top
                </Button>
              )}
              <Button
                onClick={handleBackToDashboard}
                className="bg-[#667eea] text-white hover:bg-[#5a6fd8] px-6 py-2 font-medium rounded-lg"
                style={{ backgroundColor: '#667eea' }}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Classroom Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Create New Lecture</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the details for your new lecture to get started with teaching.
            </DialogDescription>
          </DialogHeader>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label className="text-sm text-card-foreground mb-2 block">Lecture Topic</label>
              <Input
                value={newLectureTopic}
                onChange={e => setNewLectureTopic(e.target.value)}
                placeholder="Enter lecture topic"
                className="bg-input-background border-border text-card-foreground"
                disabled={isCreatingLecture}
              />
            </div>
            <div>
              <label className="text-sm text-card-foreground mb-2 block">Subject</label>
              <Textarea
                value={newLectureSubject}
                onChange={e => setNewLectureSubject(e.target.value)}
                placeholder="Enter subject description"
                className="bg-input-background border-border text-card-foreground"
                rows={3}
                disabled={isCreatingLecture}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm text-card-foreground mb-2 block">Date</label>
                <Input
                  type="date"
                  value={newLectureDate}
                  onChange={e => setNewLectureDate(e.target.value)}
                  className="bg-input-background border-border text-card-foreground"
                  disabled={isCreatingLecture}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-card-foreground mb-2 block">Time</label>
                <Input
                  type="time"
                  value={newLectureTime}
                  onChange={e => setNewLectureTime(e.target.value)}
                  className="bg-input-background border-border text-card-foreground"
                  disabled={isCreatingLecture}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-card-foreground mb-2 block">Duration (minutes)</label>
                <Input
                  type="number"
                  min="1"
                  value={newLectureDuration}
                  onChange={e => setNewLectureDuration(e.target.value)}
                  placeholder="e.g. 45"
                  className="bg-input-background border-border text-card-foreground"
                  disabled={isCreatingLecture}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewLectureTopic('');
                  setNewLectureSubject('');
                  setNewLectureDate('');
                  setNewLectureTime('');
                  setNewLectureDuration('');
                }}
                className="flex-1 border-border text-card-foreground"
                disabled={isCreatingLecture}
              >
                Cancel
              </Button>
              <motion.div whileHover={{ scale: isCreatingLecture ? 1 : 1.02 }} whileTap={{ scale: isCreatingLecture ? 1 : 0.98 }} className="flex-1">
                <Button
                  onClick={createLecture}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isCreatingLecture || !newLectureTopic.trim() || !newLectureSubject.trim() || !newLectureDate.trim() || !newLectureTime.trim() || !newLectureDuration.trim()}
                >
                  {isCreatingLecture ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Lecture
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}