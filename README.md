# VidyaVichar - Interactive Classroom Question Management System

A modern educational platform designed to facilitate real-time interaction between faculty and students during interactive classes. The platform focuses on efficient question management, allowing students to ask questions and faculty to monitor, prioritize, and respond to student queries in real-time.

## Project Overview

ViyaVichar is built with the assumption that classes are actively ongoing, and serves as a centralized hub for managing student doubts and questions during live sessions. The platform provides distinct interfaces for students and faculty members, each with role-specific functionalities to enhance the learning experience.

## Key Features

### 👨‍🎓 Student Features
- **Class Discovery**: Browse and view all classes posted by faculty members
- **Live Class Participation**: Join live classes and engage in real-time
- **Question Management**: 
  - Post questions to faculty during live sessions
  - View personal question history
  - Browse questions posted by fellow students
  - Duplicate question prevention system


### Faculty Features
- **Class Management**: 
  - Create new classes with detailed descriptions
  - Go live for real-time student interaction
  - Monitor class participation and engagement
- **Question Monitoring**:
  - View all questions posted by students in real-time
  - Mark questions as answered/unanswered
  - Flag important questions for priority handling
  - Access complete question history after class ends


### Authentication System
- Role-based login (Student/Faculty)
- Secure signup process for new users
- Session management with logout functionality

##  Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS v4.0 with Shadcn/ui
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Authentication**: JWT with Cookies
- **UI Components**: Shadcn/ui component library
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Font**: Raleway (Google Fonts)

##  Design System

The platform uses a carefully crafted color palette optimized for educational environments:

- **Primary Background**: `#2d3250` (Deep Blue)
- **Secondary Background**: `#424769` (Medium Blue)
- **Accent Color**: `#fb917a` (Coral Orange)
- **Text Primary**: `#ffffff` (White)
- **Text Secondary**: `#676f6d` (Gray)

##  Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- MongoDB installed locally or a MongoDB Atlas connection string

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VidyaVichar
   ```


2. **Start the development server**
    - install some packages
    ```bash
            npm install express cors mongoose dotenv
            npm install --save-dev nodemon
    ```
    - run command
    ```bash
            cd backend
            node src/server.js
    ```
3. **Run frontend**  
    - install some packages
    ```bash
            npm install --save-dev vite
    ```
    - run command
    ```bash
            cd frontend
            npm run dev
    ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to access the application.

## Usage Guide

### For Students
1. **Sign Up/Login**: Choose "Student" role and provide your credentials
2. **Browse Classes**: View all available classes on the main dashboard
3. **Join Live Classes**: Click "Join Live" for ongoing sessions
4. **Ask Questions**: Submit questions during live classes
5. **Track Questions**: Monitor your question status

### For Faculty
1. **Sign Up/Login**: Choose "Faculty" role and provide your credentials
2. **Create Classes**: Use the "Create Class" button to set up new sessions
3. **Go Live**: Start live sessions for student interaction
4. **Manage Questions**: Monitor, prioritize, and respond to student queries
5. **Review History**: Access complete question logs after class completion

##  Project Structure

### Backend (Planned Architecture)
```
frontend/
├── node_modules/
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── AuthScreen.jsx
│   │       ├── FacultyDashboard.jsx
│   │       ├── LiveClassView.jsx
│   │       ├── ModernFacultyDashboard.jsx
│   │       ├── Sidebar.jsx
│   │       ├── SignInScreen.jsx
│   │       ├── StudentDashboard.jsx
│   │       └── StudentLiveClassView.jsx
│   ├── styles/
│   │   └── globals.css        # Tailwind v4 configuration and custom styles
│   ├── App.jsx               # Main application component
│   ├── index.css
│   └── main.jsx
├── components/
│   ├── FacultyDashboard.tsx    # Faculty interface with class management
│   ├── StudentDashboard.tsx    # Student interface for class participation
│   ├── LoginScreen.tsx         # Authentication and role selection
│   ├── figma/
│   │   └── ImageWithFallback.tsx
│   └── ui/                     # Shadcn/ui components
├── guidelines/
│   └── Guidelines.md           # Development guidelines and standards
├── styles/
│   └── globals.css            # Custom color scheme and typography
├── index.html                 # HTML entry point
├── package-lock.json
├── package.json               # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── .gitignore
├── App.tsx                   # Main React application component
├── Attributions.md           # Asset attributions and credits
├── README.md                 # Project documentation
└── IMP/                      # Important files and notes
```

### Backend (Planned Architecture)
```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── controllers.js      # Base controller utilities
│   │   ├── lectureController.js # Class/lecture management
│   │   └── questionController.js # Question handling and responses
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT authentication middleware
│   ├── models/
│   │   ├── lectureModel.js     # Class/lecture data model
│   │   ├── questionModel.js    # Question and answer data model
│   │   ├── userModel.js        # User (student/faculty) data model
│   ├── routes/
│   │   ├── authRoutes.js       # Authentication endpoints
│   │   ├── lectureRoutes.js    # Class management endpoints
│   │   ├── questionRoutes.js   # Question management endpoints
│   └── server.js              # Express server configuration
├── .env                       # Environment variables
└── babel.config.js            # Babel configuration
```


##  Current State

**Version**: Beta v1.1
**Status**: Functional MVP with Real-time Features
**Database**: MongoDB
**Real-time**: Socket.IO enabled for instant question updates and answers

### Features Implemented
- **Authentication**: Secure login/signup for Students and Faculty
- **Live Class**: Real-time question asking and answering
- **Dashboard**: Class management and history
- **Question Management**: Priority flagging, duplicate detection, and status tracking

## Limitations & Future Enhancements


### Planned Enhancements
1. **Advanced Features**
   - Video conferencing integration
   - File sharing capabilities
   - Assignment and quiz management
   - Advanced analytics and reporting

2. **Mobile Optimization**
   - Responsive design improvements
   - Progressive Web App (PWA) features
   - Mobile-specific interactions

3. **Accessibility**
   - Screen reader compatibility
   - Keyboard navigation support
   - High contrast mode


