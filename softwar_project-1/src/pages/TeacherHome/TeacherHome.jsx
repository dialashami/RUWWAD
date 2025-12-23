 

 

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import Notifications from './components/Notifications';
import LessonManagement from './components/LessonManagement';
import AssignmentManagement from './components/AssignmentManagement';
import { ChatCenter } from "./components/ChatCenter"; // ✅ شات
import FeedbackStar from './components/FeedbackStar';  

// import ProgressPage from './components/ProgressPage';
import AITutorPage from './components/AITutorPage';
import Settings from './components/Settings';
import './TeacherHome.css';

export default function TeacherHome() {

  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'lessons':
        return <LessonManagement />;
      case 'assignments':
        return <AssignmentManagement />;
      case 'chat':                              
         return <ChatCenter currentRole="teacher" />; 
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

  // return (
  //   <div className="teacher-home">
  //     <Sidebar activeItem={activePage} onItemChange={setActivePage} />
      
  //     <div className="main-content">
  //       <Navigation />
  //       {renderPage()}
  //     </div>
  //   </div>
  // );
  return (
    <div className="student-home">
      <Sidebar activeItem={activePage} onItemChange={setActivePage} />
      
      <div className="main-content">
        <Navigation />
        {renderPage()}
      </div>

      { }
      <FeedbackStar />
    </div>
  );
}
