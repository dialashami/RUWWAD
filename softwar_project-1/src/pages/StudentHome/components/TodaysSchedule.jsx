import { Calendar, Clock, Video, Users } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

const schedule = [
  {
    id: 1,
    time: '09:00 AM',
    subject: 'Mathematics',
    topic: 'Algebra Review',
    type: 'Live Class',
    icon: Video,
    color: 'bg-blue-500',
  },
  {
    id: 2,
    time: '11:00 AM',
    subject: 'Physics',
    topic: 'Newton\'s Laws',
    type: 'Recorded',
    icon: Calendar,
    color: 'bg-purple-500',
  },
  {
    id: 3,
    time: '02:00 PM',
    subject: 'Chemistry',
    topic: 'Lab Session',
    type: 'Group Study',
    icon: Users,
    color: 'bg-green-500',
  },
  {
    id: 4,
    time: '04:00 PM',
    subject: 'Biology',
    topic: 'Genetics Quiz',
    type: 'Assessment',
    icon: Clock,
    color: 'bg-orange-500',
  },
];

export function TodaysSchedule() {
  return (
    <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[#0F172A]" style={{ fontSize: '20px', fontWeight: '600' }}>
          Today's Schedule
        </h3>
        <Badge variant="secondary" className="bg-[#4F46E5]/10 text-[#4F46E5] border-0">
          {schedule.length} Classes
        </Badge>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {schedule.map((item, index) => (
          <div key={item.id} className="flex gap-4 relative">
            {/* Timeline Line */}
            {index !== schedule.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
            )}

            {/* Time */}
            <div className="w-24 flex-shrink-0 pt-1">
              <span className="text-gray-600" style={{ fontSize: '14px', fontWeight: '600' }}>
                {item.time}
              </span>
            </div>

            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 relative z-10`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#0F172A] mb-1" style={{ fontSize: '16px', fontWeight: '600' }}>
                    {item.subject}
                  </p>
                  <p className="text-gray-600" style={{ fontSize: '14px' }}>
                    {item.topic}
                  </p>
                </div>
                <Badge variant="outline" className="border-gray-300 text-gray-600">
                  {item.type}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
