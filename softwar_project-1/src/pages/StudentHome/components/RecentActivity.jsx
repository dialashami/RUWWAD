import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Star, MessageCircle, Sparkles } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'quiz',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    iconBg: 'bg-green-100',
    title: 'Completed Physics Quiz',
    description: 'Scored 95% on Newton\'s Laws assessment',
    time: '2 hours ago',
    badge: '95%',
    badgeColor: 'bg-green-500',
  },
  {
    id: 2,
    type: 'feedback',
    icon: MessageCircle,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-100',
    title: 'Teacher Feedback Received',
    description: 'Ms. Sarah commented on your Chemistry lab report',
    time: '5 hours ago',
    badge: 'New',
    badgeColor: 'bg-blue-500',
  },
  {
    id: 3,
    type: 'achievement',
    icon: Star,
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-100',
    title: 'Achievement Unlocked',
    description: 'Earned "Math Master" badge for 10 consecutive quizzes',
    time: '1 day ago',
    badge: '🏆',
    badgeColor: 'bg-yellow-500',
  },
  {
    id: 4,
    type: 'ai',
    icon: Sparkles,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-100',
    title: 'AI Study Suggestion',
    description: 'Review Organic Chemistry chapter 3 based on quiz performance',
    time: '1 day ago',
    badge: 'AI',
    badgeColor: 'bg-purple-500',
  },
  {
    id: 5,
    type: 'quiz',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    iconBg: 'bg-green-100',
    title: 'Completed Biology Quiz',
    description: 'Scored 88% on Cell Structure assessment',
    time: '2 days ago',
    badge: '88%',
    badgeColor: 'bg-green-500',
  },
];

export function RecentActivity() {
  return (
    <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[#0F172A]" style={{ fontSize: '20px', fontWeight: '600' }}>
          Recent Activity
        </h3>
        <button className="text-[#4F46E5]" style={{ fontSize: '14px', fontWeight: '600' }}>
          View All
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg ${activity.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${activity.iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[#0F172A]" style={{ fontSize: '15px', fontWeight: '600' }}>
                    {activity.title}
                  </p>
                  <Badge className={`${activity.badgeColor} text-white border-0 flex-shrink-0`}>
                    {activity.badge}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-2" style={{ fontSize: '13px' }}>
                  {activity.description}
                </p>
                <span className="text-gray-400" style={{ fontSize: '12px' }}>
                  {activity.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
