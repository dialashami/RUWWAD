// import { useState } from 'react';
// import { Sidebar } from './components/Sidebar';
// import { Navigation } from './components/Navigation';
// import { Dashboard } from './components/Dashboard';
// import  Notifications from './components/Notifications';
// import { MyLessons } from './components/MyLessons';
// import { Assignments } from './components/Assignments';
// import  ProgressPage  from './components/ProgressPage';
// import  AITutorPage  from './components/AITutorPage';
// import  Settings  from './components/Settings';
// import { ChatCenter } from './components/ChatCenter';

// import './StudentHome.css';

// export default function StudentHome() {
//   const [activePage, setActivePage] = useState('dashboard');

//   const renderPage = () => {
//     switch (activePage) {
//       case 'dashboard':
//         return <Dashboard />;
//       case 'lessons':
//         return <MyLessons />;
//       case 'assignments':
//         return <Assignments />;
//       case 'chat':
//         return <ChatCenter currentRole="student" />;
//       case 'progress':
//         return <ProgressPage />;
//           case 'notifications':
//         return <Notifications />;
//       case 'ai-tutor':
//         return <AITutorPage />;
//       case 'settings':
//         return <Settings />;
//       default:
//         return <Dashboard />;
//     }
//   };

//   return (
//     <div className="student-home">
//       <Sidebar activeItem={activePage} onItemChange={setActivePage} />
      
//       <div className="main-content">
//         <Navigation />
//         {renderPage()}
//       </div>
//     </div>
//   );
// }
import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import Notifications from './components/Notifications';
import { MyLessons } from './components/MyLessons';
import { Assignments } from './components/Assignments';
import ProgressPage from './components/ProgressPage';
import AITutorPage from './components/AITutorPage';
import Settings from './components/Settings';
import { ChatCenter } from './components/ChatCenter';
import FeedbackStar from './components/FeedbackStar';
import { StudentProvider } from './context/StudentContext';

import './StudentHome.css';

export default function StudentHome() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'lessons':
        return <MyLessons />;
      case 'assignments':
        return <Assignments />;
      case 'chat':
        return <ChatCenter currentRole="student" />;
      case 'progress':
        return <ProgressPage />;
      case 'notifications':
        return <Notifications />;
      case 'ai-tutor':
        return <AITutorPage />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <StudentProvider>
      <div className="student-home">
        <Sidebar activeItem={activePage} onItemChange={setActivePage} />
        
        <div className="main-content">
          <Navigation />
          {renderPage()}
        </div>

        {/* Floating feedback button */}
        <FeedbackStar />
      </div>
    </StudentProvider>
  );
}
