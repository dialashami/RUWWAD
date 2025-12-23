
// import { motion } from 'framer-motion';
// import {
//   LayoutDashboard,
//   BookOpen,
//   // FileText,
//   CheckSquare,
//   TrendingUp,
//   Bell,
//   Bot,
//   Settings,
//   LogOut,
//    MessageCircle, 
// } from 'lucide-react';

// const menuItems = [
//   { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
//   { id: 'lessons', icon: BookOpen, label: 'My Lessons' },
//   { id: 'assignments', icon: CheckSquare, label: 'Assignments' },
//     { id: 'chat', icon: MessageCircle, label: 'Messages' },
//   { id: 'progress', icon: TrendingUp, label: 'Progress' },
//   { id: 'notifications', icon: Bell, label: 'Notifications' },
//   { id: 'ai-tutor', icon: Bot, label: 'AI Tutor' },
//   { id: 'settings', icon: Settings, label: 'Settings' },
   
// ];

// export function Sidebar({ activeItem, onItemChange }) {
  
//   // دالة للتعامل مع الضغط على اللوجو
//   const handleLogoClick = () => {
//     console.log('Logo clicked - changing to dashboard');
//     if (onItemChange) {
//       onItemChange('dashboard');
//     } else {
//       console.error('onItemChange function is not defined');
//     }
//   };

//   return (
//     <div className="sidebar">
//       {/* Logo Section */}
//       <div className="sidebar-header">
//         <motion.div 
//           className="logo-container cursor-pointer"
//           onClick={handleLogoClick}
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//         >
//           <img 
//             src="/logoRUWWAD1.png" 
//             alt="Ruwwad Logo" 
//             className="logo-image"
//           />
//         </motion.div>
//       </div>

//       {/* Navigation Menu */}
//       <nav className="flex-1 px-3 py-4 space-y-1">
//         {menuItems.map((item) => {
//           const Icon = item.icon;
//           const isActive = activeItem === item.id;

//           return (
//             <motion.button
//               key={item.id}
//               onClick={() => {
//                 console.log('Clicked:', item.id);
//                 onItemChange(item.id);
//               }}
//               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
//                 isActive
//                   ? 'bg-blue-100 text-blue-700'
//                   : 'text-gray-600 hover:bg-gray-100'
//               }`}
//               whileHover={{ x: 4 }}
//               whileTap={{ scale: 0.98 }}
//             >
//               <Icon className="w-5 h-5" />
//               <span className="font-medium">{item.label}</span>
              
//               {item.id === 'notifications' && (
//                 <div className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
//                   <span className="text-white text-xs font-semibold">3</span>
//                 </div>
//               )}
//             </motion.button>
//           );
//         })}
//       </nav>

//       {/* Profile Section */}
//       <div className="p-4 space-y-3">
//         <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
//           <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
//             <span className="text-gray-600 font-medium">AM</span>
//           </div>
//           <div className="flex flex-col">
//             <span className="text-gray-900 font-semibold">Amira Hassan</span>
//             <span className="text-gray-500 text-sm">Grade 10</span>
//           </div>
//         </div>

//         <button className="w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-gray-300 hover:bg-red-50 hover:text-red-600 transition-colors">
//           <LogOut className="w-4 h-4" />
//           <span className="font-medium">Logout</span>
//         </button>
//       </div>
//     </div>
//   );
// }

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  TrendingUp,
  Bell,
  Bot,
  Settings,
  LogOut,
  MessageCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../../slices/authSlice';
import { useStudent } from '../context/StudentContext';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'lessons', icon: BookOpen, label: 'My Lessons' },
  { id: 'assignments', icon: CheckSquare, label: 'Assignments' },
  { id: 'chat', icon: MessageCircle, label: 'Messages' },
  { id: 'progress', icon: TrendingUp, label: 'Progress' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'ai-tutor', icon: Bot, label: 'AI Tutor' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ activeItem, onItemChange }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get dynamic student data from context
  const { student, getInitials, getFullName, getGradeDisplay, stats } = useStudent();

  const handleLogoClick = () => {
    if (onItemChange) {
      onItemChange('dashboard');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="sidebar">
      {/* Logo Section */}
      <div className="sidebar-header">
        <motion.div
          className="logo-container cursor-pointer"
          onClick={handleLogoClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src="/logoRUWWAD1.png"
            alt="Ruwwad Logo"
            className="logo-image"
          />
        </motion.div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          // Get notification count from stats
          const notificationCount = item.id === 'notifications' 
            ? stats.unreadNotifications 
            : item.id === 'chat' 
              ? stats.unreadMessages 
              : 0;

          return (
            <motion.button
              key={item.id}
              onClick={() => onItemChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>

              {notificationCount > 0 && (
                <div className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Profile Section - Dynamic */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          {student.profilePicture ? (
            <img 
              src={student.profilePicture} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-medium">{getInitials()}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-gray-900 font-semibold">{getFullName()}</span>
            <span className="text-gray-500 text-sm">{getGradeDisplay()}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-gray-300 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
