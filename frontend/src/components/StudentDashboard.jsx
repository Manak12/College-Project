import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sidebar } from './Sidebar';
import {
  Users,
  Clock,
  Calendar,
  Play,
  LogOut,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// Cookie helper function
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

export function StudentDashboard({ onJoinClass, onSignOut }) {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get authentication data from cookies
  const getAuthData = () => {
    const authData = {
      token: getCookie('authToken'),
      userId: getCookie('userId'),
      name: getCookie('userName'),
      email: getCookie('userEmail'),
      role: getCookie('userRole')
    };

    console.log('Auth data from cookies:', {
      token: authData.token ? 'present' : 'missing',
      userId: authData.userId || 'missing',
      name: authData.name || 'missing',
      role: authData.role || 'missing'
    });

    return authData;
  };

  // Fetch lectures from API
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const { token } = getAuthData();

        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }

        console.log('Fetching lectures with token from cookies');

        const response = await fetch('http://localhost:5001/api/lectures', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Lectures API response status:', response.status);

        if (!response.ok) {
          if (response.status === 401) {
            setError('Session expired. Please log in again.');
          } else {
            throw new Error('Failed to fetch lectures');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Lectures data received:', data);

        // Transform API data to match component structure
        const transformedClasses = data.lectures.map(lecture => {
          // Use the date and time strings directly from the backend
          const dateStr = lecture.date || new Date(lecture.createdAt).toLocaleDateString();

          // Format time to HH:MM AM/PM
          let timeStr = lecture.time;
          if (!timeStr) {
            timeStr = new Date(lecture.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          } else {
            // If time is already a string, try to parse and reformat it
            try {
              // Handle various time formats
              const timeParts = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?/i);
              if (timeParts) {
                let hours = parseInt(timeParts[1]);
                const minutes = timeParts[2];
                const ampm = timeParts[4];

                // If no AM/PM specified, assume 24-hour format
                if (!ampm) {
                  const period = hours >= 12 ? 'PM' : 'AM';
                  hours = hours % 12 || 12;
                  timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
                } else {
                  // Already has AM/PM, just ensure proper formatting
                  timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm.toUpperCase()}`;
                }
              }
            } catch (e) {
              // If parsing fails, keep original
              console.warn('Could not parse time:', timeStr);
            }
          }

          return {
            id: lecture._id,
            lectureId: lecture._id, // Add lectureId explicitly for live class view
            name: lecture.topic || 'Untitled Lecture',
            faculty: lecture.teacherId?.name || 'Unknown Teacher',
            facultyEmail: lecture.teacherId?.email || '',
            time: timeStr,
            date: dateStr,
            participants: Math.floor(Math.random() * 50) + 10,
            status: lecture.status,
            isLive: lecture.status === 'live',
            isUpcoming: lecture.status === 'pending',
            isCompleted: lecture.status === 'completed',
            isCancelled: lecture.status === 'cancelled',
            scheduledAt: lecture.dateTime,
            createdAt: lecture.createdAt,
            subject: lecture.subject,
            topic: lecture.topic
          };
        });

        console.log('Transformed classes:', transformedClasses);
        setClasses(transformedClasses);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching lectures:', err);
        setError(err.message || 'Failed to load lectures');
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  const liveClasses = classes.filter(c => c.status === 'live');
  const upcomingClasses = classes.filter(c => c.status === 'pending');
  const completedClasses = classes.filter(c => c.status === 'completed');
  const cancelledClasses = classes.filter(c => c.status === 'cancelled');

  const handleJoinClass = (classItem) => {
    // Allow joining if class is live OR upcoming (pending)
    if (classItem.isLive || classItem.isUpcoming) {
      console.log('Joining class:', classItem.id);

      const authData = getAuthData();
      console.log('Passing auth data to live class:', {
        token: authData.token ? 'present' : 'missing',
        userId: authData.userId || 'missing',
        name: authData.name || 'missing'
      });

      // Also store in localStorage as backup for the live class view
      try {
        const backupData = {
          success: true,
          token: authData.token,
          _id: authData.userId,
          name: authData.name,
          role: authData.role
        };
        localStorage.setItem('user', JSON.stringify(backupData));
        console.log('Stored backup auth data in localStorage');
      } catch (e) {
        console.warn('Could not store backup auth data:', e);
      }

      // Call parent with updated parameters including lectureId and studentId
      onJoinClass({
        classId: classItem.id,
        lectureId: classItem.lectureId, // Pass the lectureId
        className: classItem.name,
        facultyName: classItem.faculty,
        studentId: authData.userId, // Pass the studentId from auth data
        token: authData.token // Pass the token
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading lectures...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-foreground">Error Loading Lectures</h2>
            </div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Retry
              </Button>
              <Button
                onClick={onSignOut}
                variant="outline"
                className="border-border text-foreground"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Function to render class cards
  const renderClassCard = (classItem, index, type) => (
    <motion.div
      key={classItem.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`bg-card border-border hover:border-primary/50 transition-colors relative overflow-hidden ${type === 'completed' ? 'opacity-80' : type === 'cancelled' ? 'opacity-60' : ''
        }`}>
        {type === 'live' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50"></div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg text-card-foreground">{classItem.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{classItem.description}</p>
              {classItem.subject && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {classItem.subject}
                </Badge>
              )}
            </div>
            {type === 'live' && (
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                LIVE
              </Badge>
            )}
            {type === 'upcoming' && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                <Clock className="w-3 h-3 mr-1" />
                UPCOMING
              </Badge>
            )}
            {type === 'completed' && (
              <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                COMPLETED
              </Badge>
            )}
            {type === 'cancelled' && (
              <Badge variant="outline" className="bg-red-500/20 text-red-600 border-red-500/30">
                <XCircle className="w-3 h-3 mr-1" />
                CANCELLED
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-muted-foreground">
                <Avatar className="w-6 h-6 mr-2">
                  <AvatarFallback className="text-xs">
                    {classItem.faculty.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {classItem.faculty}
              </div>
              {/* <div className="flex items-center text-muted-foreground">
                <Users className="w-4 h-4 mr-1" />
                {classItem.participants}
              </div> */}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {classItem.time}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {classItem.date}
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              {type === 'live' && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => handleJoinClass(classItem)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Join Live Class
                  </Button>
                </motion.div>
              )}
              {type === 'upcoming' && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => handleJoinClass(classItem)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Join Live Class
                  </Button>
                </motion.div>
              )}
              {type === 'completed' && (
                <Button
                  disabled
                  variant="outline"
                  className="w-full border-border text-muted-foreground cursor-not-allowed"
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Class Completed
                </Button>
              )}
              {type === 'cancelled' && (
                <Button
                  disabled
                  variant="outline"
                  className="w-full border-red-200 text-red-600 cursor-not-allowed"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Class Cancelled
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="mt-8">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-semibold text-foreground"
              >
                STUDENT DASHBOARD
              </motion.h1>
              <p className="text-muted-foreground mt-1">Welcome back, join your classes</p>
            </div>
            {classes.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-primary border-2 border-background"></div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={onSignOut}
            variant="outline"
            className="border-border text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* No classes message */}
        {classes.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Lectures Available</h3>
              <p className="text-muted-foreground">There are no lectures scheduled at the moment.</p>
            </div>
          </div>
        )}

        {/* Live Classes Section */}
        {liveClasses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
              <div className="w-3 h-3 bg-primary rounded-full mr-3 animate-pulse"></div>
              Live Classes ({liveClasses.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {liveClasses.map((classItem, index) =>
                  renderClassCard(classItem, index, 'live')
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Upcoming Classes Section */}
        {upcomingClasses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-3 text-yellow-600" />
              Upcoming Classes ({upcomingClasses.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {upcomingClasses.map((classItem, index) =>
                  renderClassCard(classItem, index, 'upcoming')
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Completed Classes Section */}
        {completedClasses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-3 text-green-600" />
              Completed Classes ({completedClasses.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {completedClasses.map((classItem, index) =>
                  renderClassCard(classItem, index, 'completed')
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Cancelled Classes Section */}
        {cancelledClasses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
              <XCircle className="w-5 h-5 mr-3 text-red-600" />
              Cancelled Classes ({cancelledClasses.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {cancelledClasses.map((classItem, index) =>
                  renderClassCard(classItem, index, 'cancelled')
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    // </div >
  );
}