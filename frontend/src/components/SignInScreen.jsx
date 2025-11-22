import React from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GraduationCap, Users } from 'lucide-react';

export function SignInScreen({ onSignIn }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-primary rounded-full"></div>
            </div>
          </div>
          <h1 className="text-4xl font-semibold text-foreground mb-2">Welcome to EduPlatform</h1>
          <p className="text-muted-foreground text-lg">Choose your role to get started</p>
        </motion.div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition-colors">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">Student</CardTitle>
                <p className="text-muted-foreground">Join live classes and ask questions</p>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    View all available classes
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Join live sessions
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Ask questions to faculty
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    View class discussions
                  </li>
                </ul>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={() => onSignIn('student')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="lg"
                  >
                    Sign in as Student
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Faculty Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/30 transition-colors">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">Faculty</CardTitle>
                <p className="text-muted-foreground">Create and manage classes</p>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    Create new classrooms
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    Go live for students
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    Manage student questions
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    Track class analytics
                  </li>
                </ul>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={() => onSignIn('faculty')}
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    size="lg"
                  >
                    Sign in as Faculty
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground text-sm">
            New to the platform? Contact your administrator for access.
          </p>
        </motion.div>
      </div>
    </div>
  );
}