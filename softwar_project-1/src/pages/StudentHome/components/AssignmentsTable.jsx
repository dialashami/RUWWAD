import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

const assignments = [
  {
    id: 1,
    subject: 'Mathematics',
    title: 'Calculus Problem Set',
    dueDate: 'Oct 14, 2025',
    status: 'today',
    progress: 80,
  },
  {
    id: 2,
    subject: 'Physics',
    title: 'Lab Report - Mechanics',
    dueDate: 'Oct 15, 2025',
    status: 'upcoming',
    progress: 45,
  },
  {
    id: 3,
    subject: 'Chemistry',
    title: 'Organic Chemistry Essay',
    dueDate: 'Oct 16, 2025',
    status: 'upcoming',
    progress: 20,
  },
  {
    id: 4,
    subject: 'Biology',
    title: 'Cell Biology Quiz',
    dueDate: 'Oct 12, 2025',
    status: 'late',
    progress: 0,
  },
  {
    id: 5,
    subject: 'English',
    title: 'Literature Analysis',
    dueDate: 'Oct 18, 2025',
    status: 'upcoming',
    progress: 10,
  },
];

const statusConfig = {
  today: {
    label: 'Due Today',
    color: 'bg-[#FACC15] text-[#0F172A]',
    icon: Clock,
    iconColor: 'text-[#FACC15]',
  },
  upcoming: {
    label: 'Upcoming',
    color: 'bg-[#4F46E5] text-white',
    icon: CheckCircle2,
    iconColor: 'text-[#4F46E5]',
  },
  late: {
    label: 'Overdue',
    color: 'bg-red-500 text-white',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
};

export function AssignmentsTable() {
  return (
    <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[#0F172A]" style={{ fontSize: '20px', fontWeight: '600' }}>
          Assignments & Deadlines
        </h3>
        <Badge variant="secondary" className="bg-red-100 text-red-600 border-0">
          1 Overdue
        </Badge>
      </div>

      {/* Table */}
      <div className="space-y-3">
        {assignments.map((assignment) => {
          const config = statusConfig[assignment.status ];
          const Icon = config.icon;

          return (
            <div
              key={assignment.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[#0F172A] mb-1" style={{ fontSize: '16px', fontWeight: '600' }}>
                  {assignment.title}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500" style={{ fontSize: '13px' }}>
                    {assignment.subject}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500" style={{ fontSize: '13px' }}>
                    Due: {assignment.dueDate}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="w-32 flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600" style={{ fontSize: '12px' }}>Progress</span>
                  <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: '600' }}>
                    {assignment.progress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4F46E5] to-[#9333EA] rounded-full transition-all"
                    style={{ width: `${assignment.progress}%` }}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <Badge className={`${config.color} border-0 flex-shrink-0`}>
                {config.label}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Empty State Example (hidden, shown when no assignments) */}
      {assignments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600" style={{ fontSize: '16px' }}>
            No new assignments yet 🎯
          </p>
        </div>
      )}
    </Card>
  );
}
