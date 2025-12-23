// import React from 'react';
// import { useAuth } from '../hooks/useAuth';

// export function TeacherSidebar({ activeView, setActiveView }) {
//   const { logout } = useAuth();

//   const menuItems = [
//     { id: 'dashboard', label: 'Dashboard', icon: '📊' },
//     { id: 'lessons', label: 'Lessons', icon: '📚' },
//     { id: 'assignments', label: 'Assignments', icon: '📝' },
//     { id: 'analytics', label: 'Analytics', icon: '📈' },
//     { id: 'notifications', label: 'Notifications', icon: '🔔' },
//     { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖' },
//     { id: 'account', label: 'Account', icon: '👤' },
//   ];

//444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444

// import React from 'react';
 
// export function TeacherSidebar({ activeView, setActiveView }) {
//   const menuItems = [
//     { id: 'dashboard', icon: 'fas fa-chart-line', label: 'Dashboard' },
//     { id: 'lessons', icon: 'fas fa-book', label: 'Lessons' },
//     { id: 'assignments', icon: 'fas fa-tasks', label: 'Assignments' },
//     { id: 'analytics', icon: 'fas fa-chart-bar', label: 'Analytics' },
//     { id: 'notifications', icon: 'fas fa-bell', label: 'Notifications' },
//     { id: 'ai-assistant', icon: 'fas fa-robot', label: 'AI Assistant' },
//     { id: 'account', icon: 'fas fa-cog', label: 'Account' }
//   ];

//   return (
//     <div className="teacher-sidebar">
//       <div className="sidebar-header">
//         <h2>Ruwwad</h2>
//         <p>Teacher Portal</p>
//       </div>
      
//       <ul className="sidebar-nav">
//         {menuItems.map((item) => (
//           <li 
//             key={item.id}
//             className={activeView === item.id ? 'active' : ''}
//             onClick={() => setActiveView(item.id)}
//           >
//             <i className={item.icon}></i>
//             {item.label}
//           </li>
//         ))}
//       </ul>

//       <div className="teacher-profile-sidebar">
//         <div className="profile-avatar">
//           <i className="fas fa-user"></i>
//         </div>
//         <div className="profile-info-sidebar">
//           <h4>Sarah Johnson</h4>
//           <p>Mathematics Teacher</p>
//         </div>
//       </div>
//     </div>
//   );
// }


//55555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555

  /**return (
    <aside className="teacher-sidebar">
      <div className="sidebar-header">
        <h2>Teacher Dashboard</h2>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          🚪 Logout
        </button>
      </div>
    </aside>
  ); */
