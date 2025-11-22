import React, { useState, useEffect } from 'react';
import { AuthScreen, deleteCookie } from './components/AuthScreen.jsx';
import { ModernFacultyDashboard } from './components/ModernFacultyDashboard.jsx';
import { LiveClassView } from './components/LiveClassView.jsx';
import { StudentDashboard } from './components/StudentDashboard.jsx';
import { StudentLiveClassView } from './components/StudentLiveClassView.jsx';

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

export default function App() {
  // Unified state management
  const [userType, setUserType] = useState(null);
  const [currentView, setCurrentView] = useState('signin');
  const [currentClassId, setCurrentClassId] = useState('');
  const [currentClassName, setCurrentClassName] = useState('');
  const [currentLectureId, setCurrentLectureId] = useState('');
  const [currentFacultyName, setCurrentFacultyName] = useState('');
  const [liveClassData, setLiveClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lectureHistory, setLectureHistory] = useState([]);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      const authToken = getCookie('authToken');
      const userRole = getCookie('userRole');

      if (authToken && userRole) {
        console.log('Found existing authentication:', {
          hasToken: !!authToken,
          role: userRole
        });

        // User is authenticated, restore their session
        if (userRole === 'student') {
          setUserType('student');
        } else if (userRole === 'teacher') {
          setUserType('faculty');
        }

        // Restore view state from localStorage
        const savedView = localStorage.getItem('currentView');
        const savedClassId = localStorage.getItem('currentClassId');
        const savedClassName = localStorage.getItem('currentClassName');
        const savedLectureId = localStorage.getItem('currentLectureId');
        const savedFacultyName = localStorage.getItem('currentFacultyName');
        const savedLiveClassData = localStorage.getItem('liveClassData');

        if (savedView === 'live' && savedClassId && userRole === 'teacher') {
          setCurrentClassId(savedClassId);
          setCurrentClassName(savedClassName || 'Unknown Class');
          setCurrentLectureId(savedLectureId || savedClassId);
          setCurrentView('live');
        } else if (savedView === 'student-live' && userRole === 'student') {
          if (savedLiveClassData) {
            try {
              setLiveClassData(JSON.parse(savedLiveClassData));
              setCurrentView('student-live');
            } catch (e) {
              console.error("Failed to parse saved live class data", e);
              setCurrentView('dashboard');
            }
          } else if (savedClassId) {
            // Fallback for old structure
            setCurrentClassId(savedClassId);
            setCurrentClassName(savedClassName);
            setCurrentFacultyName(savedFacultyName);
            setCurrentView('student-live');
          } else {
            setCurrentView('dashboard');
          }
        } else {
          setCurrentView('dashboard');
        }

      } else {
        // No valid authentication, show login
        setCurrentView('signin');
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Handle successful authentication
  const handleSignIn = (type) => {
    console.log('User signed in with role:', type);
    setUserType(type);
    setCurrentView('dashboard');
  };

  // Handle sign out
  const handleSignOut = () => {
    console.log('User signing out');

    // Clear cookies
    deleteCookie('authToken');
    deleteCookie('userRole');
    deleteCookie('userEmail');
    deleteCookie('userId');
    deleteCookie('userName');

    // Clear localStorage
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('currentView');
      localStorage.removeItem('currentClassId');
      localStorage.removeItem('currentClassName');
      localStorage.removeItem('currentLectureId');
      localStorage.removeItem('currentFacultyName');
      localStorage.removeItem('liveClassData');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }

    // Reset state
    setUserType(null);
    setCurrentView('signin');
    setCurrentClassId('');
    setCurrentClassName('');
    setCurrentLectureId('');
    setCurrentFacultyName('');
    setLiveClassData(null);
  };

  // Faculty handlers - Updated to handle lectureId
  const handleGoLive = (classId, className, lectureId) => {
    console.log('Going live with:', { classId, className, lectureId });

    setCurrentClassId(classId);
    setCurrentClassName(className || 'Unknown Class');
    setCurrentLectureId(lectureId || classId); // Use lectureId or fallback to classId
    setCurrentView('live');

    // Persist state
    localStorage.setItem('currentView', 'live');
    localStorage.setItem('currentClassId', classId);
    localStorage.setItem('currentClassName', className || 'Unknown Class');
    localStorage.setItem('currentLectureId', lectureId || classId);
  };

  const handleBackToDashboard = (endedClassData = null) => {
    // If class was ended, add it to lecture history
    if (endedClassData) {
      const newLectureEntry = {
        id: endedClassData.lectureId || Date.now().toString(),
        name: endedClassData.className,
        description: `Live lecture session - ${endedClassData.className}`,
        date: new Date().toISOString().split('T')[0],
        duration: endedClassData.duration || '~45m',
        participants: endedClassData.participants || 0,
        totalQuestions: endedClassData.totalQuestions || 0,
        answeredQuestions: endedClassData.answeredQuestions || 0,
        topics: endedClassData.topics || [],
        questions: endedClassData.questions || [],
        lectureId: endedClassData.lectureId
      };

      // Add to lecture history
      setLectureHistory(prev => [newLectureEntry, ...prev]);

      console.log('Added to lecture history:', newLectureEntry);
    }

    // Reset state and return to dashboard
    setCurrentView('dashboard');
    setCurrentClassId('');
    setCurrentClassName('');
    setCurrentLectureId('');
    setCurrentFacultyName('');
    setLiveClassData(null);

    // Clear persisted state
    localStorage.removeItem('currentView');
    localStorage.removeItem('currentClassId');
    localStorage.removeItem('currentClassName');
    localStorage.removeItem('currentLectureId');
    localStorage.removeItem('currentFacultyName');
    localStorage.removeItem('liveClassData');
  };

  // Student handlers - Updated for new data flow
  const handleJoinClass = (classData) => {
    console.log('App: Received class data for joining:', classData);

    // Validate required data for new flow
    if (classData && typeof classData === 'object' && classData.lectureId) {
      // New data structure from updated StudentDashboard
      if (!classData.studentId) {
        console.error('Missing studentId in class data');
        alert('Error: Missing student information. Please log in again.');
        return;
      }

      if (!classData.token) {
        console.error('Missing token in class data');
        alert('Error: Missing authentication token. Please log in again.');
        return;
      }

      // Store the complete class data for the live class view
      setLiveClassData(classData);
      setCurrentView('student-live');

      // Persist state
      localStorage.setItem('currentView', 'student-live');
      localStorage.setItem('liveClassData', JSON.stringify(classData));

    } else {
      // Fallback for old data structure (classId, className, facultyName)
      const classId = arguments[0];
      const className = arguments[1];
      const facultyName = arguments[2];

      setCurrentClassId(classId);
      setCurrentClassName(className);
      setCurrentFacultyName(facultyName);
      setCurrentView('student-live');

      // Persist state
      localStorage.setItem('currentView', 'student-live');
      localStorage.setItem('currentClassId', classId);
      localStorage.setItem('currentClassName', className);
      localStorage.setItem('currentFacultyName', facultyName);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render appropriate view based on current state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'signin':
        return <AuthScreen onSignIn={handleSignIn} />;

      case 'dashboard':
        if (userType === 'faculty') {
          return (
            <ModernFacultyDashboard
              onGoLive={handleGoLive}
              onSignOut={handleSignOut}
              lectureHistory={lectureHistory}
            />
          );
        } else if (userType === 'student') {
          return <StudentDashboard onJoinClass={handleJoinClass} onSignOut={handleSignOut} />;
        }
        return <AuthScreen onSignIn={handleSignIn} />;

      case 'live':
        if (userType === 'faculty') {
          return (
            <LiveClassView
              classId={currentClassId}
              className={currentClassName}
              lectureId={currentLectureId}
              onBack={handleBackToDashboard}
            />
          );
        }
        return <AuthScreen onSignIn={handleSignIn} />;

      case 'student-live':
        if (userType === 'student') {
          // Check if we have the new data structure
          if (liveClassData) {
            return (
              <StudentLiveClassView
                classData={liveClassData}
                onBack={handleBackToDashboard}
              />
            );
          } else {
            // Fallback to old structure
            return (
              <StudentLiveClassView
                classId={currentClassId}
                className={currentClassName}
                facultyName={currentFacultyName}
                onBack={handleBackToDashboard}
              />
            );
          }
        }
        return <AuthScreen onSignIn={handleSignIn} />;

      default:
        console.error('Unknown view:', currentView);
        return <AuthScreen onSignIn={handleSignIn} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentView()}
    </div>
  );
}