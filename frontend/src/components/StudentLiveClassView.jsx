import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Sidebar } from './Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  ArrowLeft,
  Send,
  MessageCircle,
  User,
  Users as UsersIcon,
  Clock,
  AlertCircle,
  RefreshCw,
  Star
} from 'lucide-react';
import { io } from 'socket.io-client';

// API service functions
const API_BASE_URL = 'http://localhost:5001/api';

const apiService = {
  // Create a new question
  async createQuestion(question, lectureId, token) {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        question,
        lectureId
      })
    });

    if (!response.ok) {
      // Try to parse error response from API
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If parsing fails, use the default message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Get all questions for a lecture
  async getAllQuestions(lectureId, token) {
    const response = await fetch(`${API_BASE_URL}/questions?lectureId=${lectureId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Try to parse error response from API
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If parsing fails, use the default message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }
};

export function StudentLiveClassView({
  classData, // Now receives an object with all the data
  onBack
}) {
  // Extract data from the classData prop
  const {
    classId,
    lectureId,
    className,
    facultyName,
    studentId,
    token
  } = classData || {};

  // Fallback to localStorage if props are not available
  const getCurrentUser = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      console.log('Current user data from localStorage:', userData);
      console.log('Props data:', {
        studentId,
        token,
        lectureId
      });

      return {
        studentId: studentId || userData._id,
        token: token || userData.token
      };
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return {
        studentId: studentId,
        token: token
      };
    }
  };

  const currentUser = getCurrentUser();
  const currentStudentId = currentUser.studentId;
  const currentToken = currentUser.token;
  const currentLectureId = lectureId;

  console.log('Live class view initialized with:', {
    classId,
    lectureId: currentLectureId,
    className,
    facultyName,
    studentId: currentStudentId,
    hasToken: !!currentToken
  });

  // Component state
  const [newQuestion, setNewQuestion] = useState('');
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Format timestamp to relative time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';

    const now = new Date();
    const questionTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - questionTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    return questionTime.toLocaleDateString();
  };

  // Format question data from API response
  const formatQuestionData = (apiResponse, currentStudentId) => {
    // Handle different API response structures
    let questionsArray = apiResponse;

    // If apiResponse is not an array, try to find the array in the response
    if (!Array.isArray(apiResponse)) {
      questionsArray = apiResponse.questions || apiResponse.data || apiResponse.results || [];
    }

    // Ensure we have an array to work with
    if (!Array.isArray(questionsArray)) {
      console.warn('API response is not in expected format:', apiResponse);
      return [];
    }

    console.log('Current Student ID for comparison:', currentStudentId);

    return questionsArray.map(q => {
      // Handle populated studentId object vs string
      const studentIdValue = typeof q.studentId === 'object' ? q.studentId._id : q.studentId;
      const studentName = typeof q.studentId === 'object' ? q.studentId.name : 'Anonymous';

      // Ensure both IDs are strings for comparison
      const normalizedStudentId = String(studentIdValue);
      const normalizedCurrentId = String(currentStudentId);

      const isMyQuestion = normalizedStudentId === normalizedCurrentId;

      // console.log(`Question by ${studentName} (${normalizedStudentId}) - Is mine? ${isMyQuestion}`);

      return {
        id: q._id || q.id,
        student: isMyQuestion ? 'You' : studentName,
        question: q.question,
        timestamp: formatTimestamp(q.createdAt || q.timestamp),
        isMyQuestion: isMyQuestion,
        studentId: normalizedStudentId,
        studentName: studentName,
        status: q.status,
        isIMP: q.isIMP,
        answer: q.answer // Include answer
      };
    });
  };

  // Socket connection
  useEffect(() => {
    if (!currentLectureId) return;

    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join_lecture', currentLectureId);
    });

    newSocket.on('question_created', ({ question }) => {
      console.log("New question received via socket:", question);
      setAllQuestions(prev => {
        // Check if question already exists to avoid duplicates
        if (prev.some(q => q.id === question._id)) return prev;

        const studentIdValue = typeof question.studentId === 'object' ? question.studentId._id : question.studentId;
        const studentName = typeof question.studentId === 'object' ? question.studentId.name : 'Anonymous';
        const normalizedStudentId = String(studentIdValue);
        const normalizedCurrentId = String(currentStudentId);
        const isMyQuestion = normalizedStudentId === normalizedCurrentId;

        return [
          {
            id: question._id,
            student: isMyQuestion ? 'You' : studentName,
            question: question.question,
            timestamp: formatTimestamp(question.createdAt),
            isMyQuestion: isMyQuestion,
            studentId: normalizedStudentId,
            studentName: studentName,
            status: question.status,
            isIMP: question.isIMP,
            answer: question.answer
          },
          ...prev
        ];
      });
    });

    newSocket.on('question_answered', ({ question }) => {
      console.log("Question answered via socket:", question);
      setAllQuestions(prev => prev.map(q =>
        q.id === question._id
          ? {
            ...q,
            status: question.status,
            answer: question.answer
          }
          : q
      ));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentLectureId, currentStudentId]);


  // Validate required props/data
  useEffect(() => {
    if (!currentLectureId) {
      setError('Lecture ID is missing. Please return to the dashboard and try again.');
      setLoading(false);
      return;
    }

    if (!currentStudentId) {
      setError('Student ID is missing. Please log in again.');
      setLoading(false);
      return;
    }

    if (!currentToken) {
      setError('Authentication token is missing. Please log in again.');
      setLoading(false);
      return;
    }
  }, [currentLectureId, currentStudentId, currentToken]);


  // Filter questions to get only the current user's questions
  const getMyQuestions = (allQuestions) => {
    return allQuestions.filter(question => question.isMyQuestion);
  };

  // Load questions on component mount
  useEffect(() => {
    if (currentLectureId && currentToken && currentStudentId) {
      loadQuestions();

      // Set up polling for real-time updates (every 30 seconds)
      const pollInterval = setInterval(loadQuestions, 30000);

      return () => clearInterval(pollInterval);
    }
  }, [currentLectureId, currentStudentId, currentToken]);

  const loadQuestions = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('Loading questions for lecture:', currentLectureId);

      // Fetch all questions
      const allQuestionsResponse = await apiService.getAllQuestions(currentLectureId, currentToken);
      console.log('API Response:', allQuestionsResponse);
      const formattedAllQuestions = formatQuestionData(allQuestionsResponse, currentStudentId);

      setAllQuestions(formattedAllQuestions);

    } catch (err) {
      console.error('Error loading questions:', err);
      setError(err.message || 'Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || !socket) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Use socket.io event
      socket.emit('ask_question', {
        question: newQuestion.trim(),
        lectureId: currentLectureId,
        studentId: currentStudentId,
        isIMP: false
      });
      setNewQuestion('');
      // Optional: Optimistic update or wait for socket event
      // setTimeout(() => loadQuestions(), 1000); // Socket should handle this

    } catch (err) {
      setSubmitError("Failed to submit question. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitQuestion();
    }
  };

  const handleRefresh = () => {
    loadQuestions(true);
  };

  // Get filtered questions
  const myQuestions = getMyQuestions(allQuestions);

  const QuestionsList = ({ questionsList, title }) => (
    <div className="space-y-4">
      <AnimatePresence>
        {questionsList.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-lg border transition-colors ${question.status === 'answered'
              ? 'bg-gray-100 border-gray-300'
              : (question.isMyQuestion
                ? 'bg-primary/10 border-primary/30'
                : 'bg-card border-border')
              }`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className={`text-sm ${question.isMyQuestion ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                  {question.student === 'You' ? 'Y' : question.student.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm font-medium ${question.isMyQuestion ? 'text-primary' : 'text-card-foreground'
                    }`}>
                    {question.student}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {question.timestamp}
                  </p>
                  {question.isIMP && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-black text-black" />
                      Important
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-card-foreground leading-relaxed">
                  {question.question}
                </p>
                {/* Display Answer if available */}
                {question.status === 'answered' && question.answer && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs font-semibold text-green-800 mb-1">Teacher's Answer:</p>
                    <p className="text-sm text-green-700">{question.answer}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const LoadingState = () => (
    <div className="flex items-center justify-center h-32 text-muted-foreground">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50 animate-spin" />
        <p>Loading questions...</p>
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className="flex items-center justify-center h-32 text-destructive">
      <div className="text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="mb-2">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadQuestions()}
          className="text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="classes" onItemClick={() => { }} onBack={onBack} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="border-border text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{className || 'Live Class'}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                    LIVE
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="w-4 h-4 mr-1" />
                    {facultyName || 'Unknown Teacher'}
                  </div>
                  {currentLectureId && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      Lecture ID: {currentLectureId.slice(-6)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-border text-foreground"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* General Error Display (for loading errors) */}
            {error && !loading && (
              <Card className="bg-destructive/10 border-destructive/30 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center text-destructive">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Question Input Section */}
            {!error && (
              <Card className="bg-card border-border mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-card-foreground">
                    <MessageCircle className="w-5 h-5 mr-2 text-primary" />
                    Ask a Question
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Submit Error Display (specific to question submission) */}
                  {submitError && (
                    <Card className="bg-destructive/10 border-destructive/30 mb-4">
                      <CardContent className="p-3">
                        <div className="flex items-center text-destructive">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm">{submitError}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-3">
                    <Input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your question here..."
                      className="flex-1 bg-input-background border-border text-card-foreground"
                      disabled={submitting}
                    />
                    <motion.div
                      whileHover={{ scale: submitting ? 1 : 1.02 }}
                      whileTap={{ scale: submitting ? 1 : 0.98 }}
                    >
                      <Button
                        onClick={handleSubmitQuestion}
                        disabled={!newQuestion.trim() || submitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {submitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questions Tabs */}
            {!error && (
              <Card className="bg-card border-border flex-1">
                <CardContent className="p-0 h-full">
                  <Tabs defaultValue="my-questions" className="h-full flex flex-col">
                    <div className="border-b border-border px-6 pt-6">
                      <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted">
                        <TabsTrigger value="my-questions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          <User className="w-4 h-4 mr-2" />
                          My Questions ({myQuestions.length})
                        </TabsTrigger>
                        <TabsTrigger value="all-questions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          <UsersIcon className="w-4 h-4 mr-2" />
                          All Questions ({allQuestions.length})
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <TabsContent value="my-questions" className="h-full mt-0">
                        <ScrollArea className="h-full px-6 py-6">
                          {loading ? (
                            <LoadingState />
                          ) : myQuestions.length > 0 ? (
                            <QuestionsList questionsList={myQuestions} title="My Questions" />
                          ) : (
                            <div className="flex items-center justify-center h-32 text-muted-foreground">
                              <div className="text-center">
                                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>You haven't asked any questions yet</p>
                                <p className="text-sm">Ask your first question above!</p>
                              </div>
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="all-questions" className="h-full mt-0">
                        <ScrollArea className="h-full px-6 py-6">
                          {loading ? (
                            <LoadingState />
                          ) : (
                            <QuestionsList questionsList={allQuestions} title="All Questions" />
                          )}
                        </ScrollArea>
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}