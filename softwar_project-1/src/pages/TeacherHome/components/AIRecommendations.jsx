// client/src/components/AIRecommendations.jsx
import { motion } from 'framer-motion';

import { Sparkles, Clock, BarChart3 } from 'lucide-react';
import { Card } from './ui';
import { Badge } from './ui';
import { Button } from './ui';

const recommendations = [
  {
    id: 1,
    subject: 'Physics',
    title: 'Quantum Mechanics Basics',
    difficulty: 'Intermediate',
    duration: '45 min',
    progress: 60,
    icon: '⚛️',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    subject: 'Mathematics',
    title: 'Advanced Calculus',
    difficulty: 'Advanced',
    duration: '60 min',
    progress: 30,
    icon: '📐',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 3,
    subject: 'Chemistry',
    title: 'Organic Compounds',
    difficulty: 'Beginner',
    duration: '30 min',
    progress: 0,
    icon: '🧪',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 4,
    subject: 'Biology',
    title: 'Cell Structure',
    difficulty: 'Intermediate',
    duration: '40 min',
    progress: 75,
    icon: '🔬',
    color: 'from-orange-500 to-red-500',
  },
];

export default function AIRecommendations() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#9333EA]" />
          <h2 className="text-[#0F172A]" style={{ fontSize: '24px', fontWeight: '600' }}>
            AI Recommendations
          </h2>
        </div>
        <Button variant="ghost" className="text-[#4F46E5]">
          View All
        </Button>
      </div>

      {/* Cards */}
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Card className="min-w-[320px] p-6 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer bg-white relative overflow-hidden">
              {/* Gradient Top Border */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rec.color}`} />

              {/* Icon + badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#F9FAFB] to-gray-100 flex items-center justify-center">
                  <span style={{ fontSize: '28px' }}>{rec.icon}</span>
                </div>
                <Badge variant="secondary" className="bg-[#4F46E5]/10 text-[#4F46E5] border-0">
                  {rec.difficulty}
                </Badge>
              </div>

              {/* Content */}
              <div className="space-y-2 mb-4">
                <p
                  className="text-gray-500"
                  style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}
                >
                  {rec.subject}
                </p>
                <h3 className="text-[#0F172A]" style={{ fontSize: '18px', fontWeight: '600' }}>
                  {rec.title}
                </h3>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span style={{ fontSize: '14px' }}>{rec.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span style={{ fontSize: '14px' }}>{rec.progress}%</span>
                </div>
              </div>

              {/* Progress */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4F46E5] to-[#9333EA] rounded-full transition-all"
                  style={{ width: `${rec.progress}%` }}
                />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
