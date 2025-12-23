// import { useState } from 'react';
// import { Sidebar } from './components/Sidebar';
// import { DashboardOverview } from './components/DashboardOverview';
// import { UserManagement } from './components/UserManagement';
// import { ContentManagement } from './components/ContentManagement';
// import { CommunicationCenter } from './components/CommunicationCenter';
// import { NotificationManagement } from './components/NotificationManagement';
// import { SystemSettings } from './components/SystemSettings';
// import { AIInsights } from './components/AIInsights';
// import './Admin.css';

// export function Admin() {
//   const [activeSection, setActiveSection] = useState('dashboard');

//   const renderContent = () => {
//     switch (activeSection) {
//       case 'dashboard':
//         return <DashboardOverview />;
//       case 'users':
//         return <UserManagement />;
//       case 'content':
//         return <ContentManagement />;
//       case 'communication':
//         return <CommunicationCenter />;
//       case 'notifications':
//         return <NotificationManagement />;
//       case 'ai-insights':
//         return <AIInsights />;
//       case 'settings':
//         return <SystemSettings />;
//       default:
//         return <DashboardOverview />;
//     }
//   };

//   return (
//     <div className="admin-layout">
//       <Sidebar 
//         activeSection={activeSection} 
//         onSectionChange={setActiveSection} 
//       />
//       <main className="admin-main">
//         {renderContent()}
//       </main>
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { UserManagement } from './components/UserManagement';
import { CommunicationCenter } from './components/CommunicationCenter';
import { NotificationManagement } from './components/NotificationManagement';
import { SystemSettings } from './components/SystemSettings';
import './Admin.css';

const API_BASE = 'http://localhost:3000/api';

export function Admin() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [communicationTargetName, setCommunicationTargetName] = useState(null);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);

  const fetchAdminUnreadCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAdminUnreadCount(0);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json().catch(() => ({}));
      const count = typeof data.count === 'number' ? data.count : 0;
      setAdminUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch admin unread notification count:', err);
    }
  };

  useEffect(() => {
    fetchAdminUnreadCount();
  }, []);

  const handleOpenCommunication = (user) => {
    setCommunicationTargetName(user.name);     // الاسم اللي رح نفتحه في الـ chat
    setActiveSection('communication');         // روح على Communication Center
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UserManagement onOpenCommunication={handleOpenCommunication} />;
      
      case 'communication':
        return (
          <CommunicationCenter
            initialChatName={communicationTargetName}
            initialTab="messages"
          />
        );
      case 'notifications':
        return (
          <NotificationManagement
            onUnreadCountChange={fetchAdminUnreadCount}
          />
        );
      
      case 'settings':
        return <SystemSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        notificationCount={adminUnreadCount}
      />
      <main className="admin-main">{renderContent()}</main>
    </div>
  );
}
