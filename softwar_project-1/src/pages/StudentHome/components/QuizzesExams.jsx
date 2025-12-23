import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Award, Play, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';

const quizzes = [
  {
    id: 1,
    title: 'Algebra Fundamentals Quiz',
    subject: 'Mathematics',
    type: 'quiz',
    questions: 20,
    duration: 30,
    deadline: 'Oct 15, 2025',
    status: 'available',
    score: null,
    difficulty: 'Medium',
    attempts: 0,
    maxAttempts: 3,
  },
  {
    id: 2,
    title: 'Physics Midterm Exam',
    subject: 'Physics',
    type: 'exam',
    questions: 50,
    duration: 120,
    deadline: 'Oct 20, 2025',
    status: 'upcoming',
    score: null,
    difficulty: 'Hard',
    attempts: 0,
    maxAttempts: 1,
  },
  {
    id: 3,
    title: 'Organic Chemistry Test',
    subject: 'Chemistry',
    type: 'quiz',
    questions: 15,
    duration: 25,
    deadline: 'Oct 12, 2025',
    status: 'completed',
    score: 92,
    difficulty: 'Medium',
    attempts: 1,
    maxAttempts: 2,
  },
  {
    id: 4,
    title: 'Cell Biology Assessment',
    subject: 'Biology',
    type: 'quiz',
    questions: 25,
    duration: 40,
    deadline: 'Oct 14, 2025',
    status: 'in-progress',
    score: null,
    difficulty: 'Easy',
    attempts: 1,
    maxAttempts: 3,
  },
  {
    id: 5,
    title: 'Calculus Final Exam',
    subject: 'Mathematics',
    type: 'exam',
    questions: 60,
    duration: 180,
    deadline: 'Oct 25, 2025',
    status: 'upcoming',
    score: null,
    difficulty: 'Hard',
    attempts: 0,
    maxAttempts: 1,
  },
  {
    id: 6,
    title: 'Quantum Mechanics Quiz',
    subject: 'Physics',
    type: 'quiz',
    questions: 18,
    duration: 35,
    deadline: 'Oct 10, 2025',
    status: 'completed',
    score: 88,
    difficulty: 'Hard',
    attempts: 2,
    maxAttempts: 3,
  },
];

const statusConfig = {
  available: {
    icon: Play,
    color: 'text-[#4F46E5]',
    bg: 'bg-[#4F46E5]/10',
    badge: 'bg-gradient-to-r from-[#4F46E5] to-[#9333EA] text-white',
    label: 'Start Now',
  },
  upcoming: {
    icon: Calendar,
    color: 'text-[#FACC15]',
    bg: 'bg-[#FACC15]/10',
    badge: 'bg-[#FACC15] text-[#0F172A]',
    label: 'Upcoming',
  },
  'in-progress': {
    icon: Clock,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    badge: 'bg-orange-500 text-white',
    label: 'Resume',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-[#22C55E]',
    bg: 'bg-[#22C55E]/10',
    badge: 'bg-[#22C55E] text-white',
    label: 'Completed',
  },
};

export function QuizzesExams() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'quizzes') return quiz.type === 'quiz';
    if (activeTab === 'exams') return quiz.type === 'exam';
    if (activeTab === 'completed') return quiz.status === 'completed';
    return true;
  });

  const stats = {
    total: quizzes.length,
    completed: quizzes.filter(q => q.status === 'completed').length,
    average: Math.round(quizzes.filter(q => q.score !== null).reduce((acc, q) => acc + (q.score || 0), 0) / quizzes.filter(q => q.score !== null).length),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0F172A] flex items-center gap-2" style={{ fontSize: '32px', fontWeight: '700' }}>
            Quizzes & Exams 📝
          </h1>
          <p className="text-gray-600 mt-1" style={{ fontSize: '16px' }}>
            Test your knowledge and track your progress
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5]/10 to-[#9333EA]/10">
            <p className="text-gray-600" style={{ fontSize: '12px', fontWeight: '600' }}>
              Completed
            </p>
            <p className="text-[#4F46E5]" style={{ fontSize: '24px', fontWeight: '700' }}>
              {stats.completed}/{stats.total}
            </p>
          </div>
          <div className="px-6 py-3 rounded-xl bg-[#22C55E]/10">
            <p className="text-gray-600" style={{ fontSize: '12px', fontWeight: '600' }}>
              Average Score
            </p>
            <p className="text-[#22C55E]" style={{ fontSize: '24px', fontWeight: '700' }}>
              {stats.average}%
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1 rounded-full">
          <TabsTrigger value="all" className="rounded-full px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4F46E5] data-[state=active]:to-[#9333EA] data-[state=active]:text-white">
            All
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="rounded-full px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4F46E5] data-[state=active]:to-[#9333EA] data-[state=active]:text-white">
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="exams" className="rounded-full px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4F46E5] data-[state=active]:to-[#9333EA] data-[state=active]:text-white">
            Exams
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-full px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4F46E5] data-[state=active]:to-[#9333EA] data-[state=active]:text-white">
            Completed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Quizzes/Exams List */}
      <div className="space-y-4">
        {filteredQuizzes.map((quiz, index) => {
          const config = statusConfig[quiz.status ];
          const Icon = config.icon;

          return (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all">
                <div className="flex items-center gap-6">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-8 h-8 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-[#0F172A]" style={{ fontSize: '18px', fontWeight: '600' }}>
                            {quiz.title}
                          </h3>
                          <Badge className={config.badge} style={{ fontSize: '11px' }}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                          <span style={{ fontSize: '14px' }}>{quiz.subject}</span>
                          <span className="text-gray-400">•</span>
                          <span style={{ fontSize: '14px' }} className="capitalize">{quiz.type}</span>
                          <span className="text-gray-400">•</span>
                          <span style={{ fontSize: '14px' }}>{quiz.difficulty}</span>
                        </div>
                      </div>
                      {quiz.score !== null && (
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-[#FACC15]" />
                            <span className="text-[#0F172A]" style={{ fontSize: '24px', fontWeight: '700' }}>
                              {quiz.score}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600" style={{ fontSize: '14px' }}>
                          {quiz.questions} questions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600" style={{ fontSize: '14px' }}>
                          {quiz.duration} min
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600" style={{ fontSize: '14px' }}>
                          Due: {quiz.deadline}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600" style={{ fontSize: '14px' }}>
                          {quiz.attempts}/{quiz.maxAttempts} attempts
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {quiz.status === 'available' && (
                        <Button className="bg-gradient-to-r from-[#4F46E5] to-[#9333EA] hover:opacity-90 text-white rounded-xl">
                          <Play className="w-4 h-4 mr-2" />
                          Start Quiz
                        </Button>
                      )}
                      {quiz.status === 'in-progress' && (
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                          <Clock className="w-4 h-4 mr-2" />
                          Resume
                        </Button>
                      )}
                      {quiz.status === 'completed' && (
                        <Button variant="outline" className="rounded-xl border-gray-300">
                          View Results
                        </Button>
                      )}
                      {quiz.status === 'upcoming' && (
                        <Button variant="outline" className="rounded-xl border-gray-300" disabled>
                          Not Available Yet
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
