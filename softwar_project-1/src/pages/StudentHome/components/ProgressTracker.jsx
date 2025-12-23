import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Target, Flame, Award } from 'lucide-react';

const subjects = [
  { name: 'Mathematics', progress: 85, color: 'bg-blue-500' },
  { name: 'Physics', progress: 72, color: 'bg-purple-500' },
  { name: 'Chemistry', progress: 90, color: 'bg-green-500' },
  { name: 'Biology', progress: 68, color: 'bg-orange-500' },
  { name: 'English', progress: 95, color: 'bg-pink-500' },
];

const achievements = [
  { icon: Trophy, label: '10 Quizzes', color: 'text-yellow-500' },
  { icon: Target, label: '95% Avg', color: 'text-blue-500' },
  { icon: Flame, label: '7 Day Streak', color: 'text-orange-500' },
  { icon: Award, label: '5 Badges', color: 'text-purple-500' },
];

export function ProgressTracker() {
  const overallProgress = 82;

  return (
    <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
      {/* Header */}
      <h3 className="text-[#0F172A] mb-6" style={{ fontSize: '20px', fontWeight: '600' }}>
        Progress Tracker
      </h3>

      {/* Overall Progress Circle */}
      <div className="flex items-center gap-8 mb-8">
        <div className="relative w-32 h-32 flex-shrink-0">
          {/* Background Circle */}
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallProgress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#9333EA" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[#0F172A]" style={{ fontSize: '28px', fontWeight: '700' }}>
              {overallProgress}%
            </span>
            <span className="text-gray-500" style={{ fontSize: '12px' }}>
              Complete
            </span>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <achievement.icon className={`w-5 h-5 ${achievement.color}`} />
              </div>
              <span className="text-gray-700" style={{ fontSize: '14px', fontWeight: '600' }}>
                {achievement.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Progress Bars */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600" style={{ fontSize: '14px', fontWeight: '600' }}>
            By Subject
          </span>
        </div>
        {subjects.map((subject) => (
          <div key={subject.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#0F172A]" style={{ fontSize: '14px', fontWeight: '600' }}>
                {subject.name}
              </span>
              <span className="text-gray-600" style={{ fontSize: '14px' }}>
                {subject.progress}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${subject.color} rounded-full transition-all duration-500`}
                style={{ width: `${subject.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
