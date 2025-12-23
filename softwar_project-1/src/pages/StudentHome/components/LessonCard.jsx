// import { motion } from 'framer-motion';
// import { Card } from './ui/card';
// import { Badge } from './ui/badge';
// import { Button } from './ui/button';
// import { Progress } from './ui/progress';
// import { Play, Eye } from 'lucide-react';

// interface LessonCardProps {
//   id: number;
//   title: string;
//   subject: string;
//   grade: string;
//   description: string;
//   progress: number;
//   status: 'new' | 'in-progress' | 'completed';
//   thumbnail: string;
//   icon: string;
// }

// const statusConfig = {
//   new: {
//     label: 'New',
//     className: 'bg-gradient-to-r from-[#4F46E5] to-[#9333EA] text-white',
//   },
//   'in-progress': {
//     label: 'In Progress',
//     className: 'bg-[#FACC15] text-[#0F172A]',
//   },
//   completed: {
//     label: 'Completed',
//     className: 'bg-[#22C55E] text-white',
//   },
// };

// export function LessonCard({
//   title,
//   subject,
//   grade,
//   description,
//   progress,
//   status,
//   thumbnail,
//   icon,
// }: LessonCardProps) {
//   const statusInfo = statusConfig[status];

//   return (
//     <motion.div
//       whileHover={{ y: -8, transition: { duration: 0.2 } }}
//       className="group"
//     >
//       <Card className="overflow-hidden rounded-2xl border-0 shadow-lg bg-white transition-all duration-300 group-hover:shadow-2xl relative">
//         {/* Gradient Shadow on Hover */}
//         <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl">
//           <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] to-[#9333EA]" />
//         </div>

//         {/* Thumbnail */}
//         <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
//           <img
//             src={thumbnail}
//             alt={title}
//             className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
//           />
//           {/* Icon Overlay */}
//           <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
//             <span style={{ fontSize: '24px' }}>{icon}</span>
//           </div>
//           {/* Status Badge */}
//           <div className="absolute top-4 right-4">
//             <Badge className={`${statusInfo.className} border-0 shadow-lg`}>
//               {statusInfo.label}
//             </Badge>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-6 space-y-4">
//           {/* Header */}
//           <div className="space-y-2">
//             <div className="flex items-center gap-2 text-gray-500">
//               <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
//                 {grade}
//               </span>
//               <span className="text-gray-400">•</span>
//               <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
//                 {subject}
//               </span>
//             </div>
//             <h3 className="text-[#0F172A]" style={{ fontSize: '18px', fontWeight: '600' }}>
//               {title}
//             </h3>
//           </div>

//           {/* Description */}
//           <p className="text-gray-600 line-clamp-2" style={{ fontSize: '14px' }}>
//             {description}
//           </p>

//           {/* Progress */}
//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <span className="text-gray-600" style={{ fontSize: '12px', fontWeight: '600' }}>
//                 Progress
//               </span>
//               <span className="text-[#4F46E5]" style={{ fontSize: '12px', fontWeight: '600' }}>
//                 {progress}%
//               </span>
//             </div>
//             <Progress value={progress} className="h-2" />
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-2 pt-2">
//             <Button
//               className="flex-1 bg-gradient-to-r from-[#4F46E5] to-[#9333EA] hover:opacity-90 text-white rounded-xl"
//             >
//               <Play className="w-4 h-4 mr-2" />
//               Continue
//             </Button>
//             <Button
//               variant="outline"
//               className="rounded-xl border-gray-300 hover:bg-gray-100"
//             >
//               <Eye className="w-4 h-4" />
//             </Button>
//           </div>
//         </div>
//       </Card>
//     </motion.div>
//   );
// }
import { motion } from 'framer-motion';
import { Play, Eye } from 'lucide-react';

// مكونات UI مبسطة بديلة
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, className = "" }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const Button = ({ children, className = "", variant = "default", ...props }) => {
  const baseClasses = "px-4 py-2 rounded-lg transition-colors flex items-center justify-center";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
  };
  
  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Progress = ({ value, className = "" }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-gradient-to-r from-[#4F46E5] to-[#9333EA] h-2 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

const statusConfig = {
  new: {
    label: 'New',
    className: 'bg-gradient-to-r from-[#4F46E5] to-[#9333EA] text-white',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-[#FACC15] text-[#0F172A]',
  },
  completed: {
    label: 'Completed',
    className: 'bg-[#22C55E] text-white',
  },
};

export function LessonCard({
  title,
  subject,
  grade,
  description,
  progress,
  status,
  thumbnail,
  icon,
}) {
  const statusInfo = statusConfig[status];

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="overflow-hidden rounded-2xl border-0 shadow-lg bg-white transition-all duration-300 group-hover:shadow-2xl relative">
        {/* Gradient Shadow on Hover */}
        <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] to-[#9333EA]" />
        </div>

        {/* Thumbnail */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {/* Icon Overlay */}
          <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <span style={{ fontSize: '24px' }}>{icon}</span>
          </div>
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <Badge className={`${statusInfo.className} border-0 shadow-lg`}>
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                {grade}
              </span>
              <span className="text-gray-400">•</span>
              <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                {subject}
              </span>
            </div>
            <h3 className="text-[#0F172A]" style={{ fontSize: '18px', fontWeight: '600' }}>
              {title}
            </h3>
          </div>

          {/* Description */}
          <p className="text-gray-600 line-clamp-2" style={{ fontSize: '14px' }}>
            {description}
          </p>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600" style={{ fontSize: '12px', fontWeight: '600' }}>
                Progress
              </span>
              <span className="text-[#4F46E5]" style={{ fontSize: '12px', fontWeight: '600' }}>
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-gradient-to-r from-[#4F46E5] to-[#9333EA] hover:opacity-90 text-white rounded-xl"
              onClick={() => console.log('Continue lesson:', title)}
            >
              <Play className="w-4 h-4 mr-2" />
              Continue
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-gray-300 hover:bg-gray-100"
              onClick={() => console.log('Preview lesson:', title)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}