

//  import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import '../styles/lesson-management.css';

// function LessonManagement() {
//   const navigate = useNavigate();
//   const [showModal, setShowModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState(''); // ✅ إضافة state للبحث

//   const [lessons, setLessons] = useState([
//     { id: 1, title: "Quadratic Equations", subject: "Mathematics", status: "published", duration: "45 min", lastEdited: "2 days ago", description: "Complete guide to solving quadratic equations." },
//     { id: 2, title: "Trigonometry Basics", subject: "Mathematics", status: "published", duration: "60 min", lastEdited: "3 days ago", description: "Introduction to trigonometric functions." },
//     { id: 3, title: "Algebraic Expressions", subject: "Mathematics", status: "draft", duration: "50 min", lastEdited: "1 hour ago", description: "Understanding and simplifying algebraic expressions." }
//   ]);

//   // form state
//   const [formData, setFormData] = useState({
//     title: '',
//     subject: '',
//     grade: '',
//     duration: '',
//     status: 'Draft',
//     description: '',
//     objectives: '',
//     materials: ''
//   });

//   const handleNavigation = (page) => {
//     if (page === 'dashboard') navigate('/');
//   };

//   // handle input change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   // handle lesson creation
//   const handleCreateLesson = () => {
//     if (!formData.title || !formData.subject || !formData.grade || !formData.duration) {
//       alert("Please fill in all required fields (*)");
//       return;
//     }

//     const newLesson = {
//       id: lessons.length + 1,
//       title: formData.title,
//       subject: formData.subject,
//       status: formData.status.toLowerCase(),
//       duration: formData.duration,
//       lastEdited: "just now",
//       description: formData.description || "No description provided."
//     };

//     setLessons([newLesson, ...lessons]); // add to top
//     setShowModal(false);

//     // reset form
//     setFormData({
//       title: '',
//       subject: '',
//       grade: '',
//       duration: '',
//       status: 'Draft',
//       description: '',
//       objectives: '',
//       materials: ''
//     });
//   };

//   // ✅ فلترة الدروس حسب عنوان الدرس
//   const filteredLessons = lessons.filter((lesson) =>
//     lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="lesson-management">
//       {/* Sidebar */}
//       <div className="lesson-sidebar">
//         <div className="sidebar-header">
//           <h2>Ruwwad</h2>
//           <p>Teacher Portal</p>
//         </div>
//         <ul className="sidebar-nav">
//           <li onClick={() => handleNavigation('dashboard')}>
//             <i className="fas fa-chart-line"></i> Dashboard
//           </li>
//           <li className="active"><i className="fas fa-book"></i> Lessons</li>
//           <li><i className="fas fa-tasks"></i> Assignments</li>
//           <li><i className="fas fa-chart-bar"></i> Analytics</li>
//           <li><i className="fas fa-bell"></i> Notifications</li>
//           <li><i className="fas fa-robot"></i> A Assistant</li>
//           <li><i className="fas fa-cog"></i> Account</li>
//         </ul>

//         <div className="teacher-profile-sidebar">
//           <div className="profile-avatar">
//             <i className="fas fa-user"></i>
//           </div>
//           <div className="profile-info-sidebar">
//             <h4>Sarah Johnson</h4>
//             <p>Mathematics Teacher</p>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="lesson-main-content">
//         <div className="content-container">
//           <div className="lesson-header">
//             <div className="header-content">
//               <div className="header-text">
//                 <h1>Lesson Management</h1>
//                 <p>Create, edit, and organize your lessons</p>
//               </div>
//               <div className="header-stats">
//                 <div className="stat-item">
//                   <span className="stat-number">{lessons.length}</span>
//                   <span className="stat-label">Total Lessons</span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-number">{lessons.filter(l => l.status === 'published').length}</span>
//                   <span className="stat-label">Published</span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-number">{lessons.filter(l => l.status === 'draft').length}</span>
//                   <span className="stat-label">Drafts</span>
//                 </div>
//               </div>
//             </div>

//             {/* ✅ مربع البحث */}
//             <div className="search-container">
//               <input
//                 type="text"
//                 className="search-input"
//                 placeholder="Search by lesson title..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               <i className="fas fa-search search-icon"></i>
//             </div>
//           </div>

//           {/* Action Bar */}
//           <div className="action-bar">
//             <button className="create-lesson-btn" onClick={() => setShowModal(true)}>
//               <i className="fas fa-plus"></i> Create New Lesson
//             </button>
//           </div>

//           {/* ✅ عرض الدروس بعد الفلترة */}
//           <div className="lessons-grid">
//             {filteredLessons.length > 0 ? (
//               filteredLessons.map((lesson) => (
//                 <div key={lesson.id} className="lesson-card">
//                   <div className="lesson-card-header">
//                     <div className="lesson-header-section">
//                       <div className="lesson-title-section">
//                         <h3>{lesson.title}</h3>
//                         <p className="lesson-subject">
//                           <i className="fas fa-book-open"></i>{lesson.subject}
//                         </p>
//                       </div>
//                       <span className={`status-badge ${lesson.status}`}>
//                         <i className={`fas ${lesson.status === 'published' ? 'fa-check-circle' : 'fa-edit'}`}></i>
//                         {lesson.status}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="lesson-description">{lesson.description}</div>
//                 </div>
//               ))
//             ) : (
//               <p className="no-results">No lessons found.</p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div className="modal-overlay">
//           <div className="create-lesson-modal">
//             <h2>Create New Lesson</h2>

//             <div className="modal-form">
//               <div className="form-row">
//                 <div className="form-group">
//                   <label>Lesson Title *</label>
//                   <input name="title" value={formData.title} onChange={handleChange} type="text" placeholder="Enter lesson title" />
//                 </div>
//                 <div className="form-group">
//                   <label>Subject *</label>
//                   <select name="subject" value={formData.subject} onChange={handleChange}>
//                     <option value="">Select subject</option>
//                     <option>Mathematics</option>
//                     <option>Science</option>
//                     <option>English</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="form-row">
//                 <div className="form-group">
//                   <label>Grade *</label>
//                   <select name="grade" value={formData.grade} onChange={handleChange}>
//                     <option value="">Select grade</option>
//                     <option>Grade 6</option>
//                     <option>Grade 7</option>
//                     <option>Grade 8</option>
//                   </select>
//                 </div>
//                 <div className="form-group">
//                   <label>Duration *</label>
//                   <input name="duration" value={formData.duration} onChange={handleChange} type="text" placeholder="e.g., 45 min" />
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label>Status</label>
//                 <select name="status" value={formData.status} onChange={handleChange}>
//                   <option>Draft</option>
//                   <option>Published</option>
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label>Description</label>
//                 <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter lesson description..."></textarea>
//               </div>

//               <div className="form-group">
//                 <label>Learning Objectives (one per line)</label>
//                 <textarea name="objectives" value={formData.objectives} onChange={handleChange} placeholder="List the learning objectives..."></textarea>
//               </div>

//               <div className="form-group">
//                 <label>Materials (one per line)</label>
//                 <textarea name="materials" value={formData.materials} onChange={handleChange} placeholder="List required materials..."></textarea>
//               </div>

//               <div className="modal-actions">
//                 <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
//                 <button className="create-btn" onClick={handleCreateLesson}>Create Lesson</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default LessonManagement;
/////////////////////////////////////////////////////// بدي الي فوق /////////////////////////////



// الكود الي تحت قبل الزوم 

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import '../styles/lesson-management.css';

// function LessonManagement({ onNavigate }) { // ✅ إضافة onNavigate كـ prop
//   const navigate = useNavigate();
//   const [showModal, setShowModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');

//   const [lessons, setLessons] = useState([
//     { id: 1, title: "Quadratic Equations", subject: "Mathematics", status: "published", duration: "45 min", lastEdited: "2 days ago", description: "Complete guide to solving quadratic equations." },
//     { id: 2, title: "Trigonometry Basics", subject: "Mathematics", status: "published", duration: "60 min", lastEdited: "3 days ago", description: "Introduction to trigonometric functions." },
//     { id: 3, title: "Algebraic Expressions", subject: "Mathematics", status: "draft", duration: "50 min", lastEdited: "1 hour ago", description: "Understanding and simplifying algebraic expressions." }
//   ]);

//   // form state
//   const [formData, setFormData] = useState({
//     title: '',
//     subject: '',
//     grade: '',
//     duration: '',
//     status: 'Draft',
//     description: '',
//     objectives: '',
//     materials: ''
//   });

//   // ✅ إزالة handleNavigation القديم واستخدام onNavigate مباشرة
//   const handleNavigation = (page) => {
//     onNavigate(page); // استخدام الـ prop من TeacherHome
//   };

//   // handle input change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   // handle lesson creation
//   const handleCreateLesson = () => {
//     if (!formData.title || !formData.subject || !formData.grade || !formData.duration) {
//       alert("Please fill in all required fields (*)");
//       return;
//     }

//     const newLesson = {
//       id: lessons.length + 1,
//       title: formData.title,
//       subject: formData.subject,
//       status: formData.status.toLowerCase(),
//       duration: formData.duration,
//       lastEdited: "just now",
//       description: formData.description || "No description provided."
//     };

//     setLessons([newLesson, ...lessons]);
//     setShowModal(false);

//     // reset form
//     setFormData({
//       title: '',
//       subject: '',
//       grade: '',
//       duration: '',
//       status: 'Draft',
//       description: '',
//       objectives: '',
//       materials: ''
//     });
//   };

//   // ✅ فلترة الدروس حسب عنوان الدرس
//   const filteredLessons = lessons.filter((lesson) =>
//     lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="lesson-management">
//       {/* ✅ إزالة السايدبار تماماً */}

//       {/* Main Content فقط */}
//       <div className="lesson-main-content">
//         <div className="content-container">
//           <div className="lesson-header">
//             <div className="header-content">
//               <div className="header-text">
//                 <h1>Lesson Management</h1>
//                 <p>Create, edit, and organize your lessons</p>
//               </div>
             
//             </div>

           
//           </div>

//           {/* Action Bar */}
//           <div className="action-bar">
//             <button className="create-lesson-btn" onClick={() => setShowModal(true)}>
//               <i className="fas fa-plus"></i> Create New Lesson
//             </button>
//           </div>

//           {/* ✅ عرض الدروس بعد الفلترة */}
//           <div className="lessons-grid">
//             {filteredLessons.length > 0 ? (
//               filteredLessons.map((lesson) => (
//                 <div key={lesson.id} className="lesson-card">
//                   <div className="lesson-card-header">
//                     <div className="lesson-header-section">
//                       <div className="lesson-title-section">
//                         <h3>{lesson.title}</h3>
//                         <p className="lesson-subject">
//                           <i className="fas fa-book-open"></i>{lesson.subject}
//                         </p>
//                       </div>
//                       <span className={`status-badge ${lesson.status}`}>
//                         <i className={`fas ${lesson.status === 'published' ? 'fa-check-circle' : 'fa-edit'}`}></i>
//                         {lesson.status}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="lesson-description">{lesson.description}</div>
//                 </div>
//               ))
//             ) : (
//               <p className="no-results">No lessons found.</p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div className="modal-overlay">
//           <div className="create-lesson-modal">
//             <h2>Create New Lesson</h2>

//             <div className="modal-form">
//               <div className="form-row">
//                 <div className="form-group">
//                   <label>Lesson Title *</label>
//                   <input name="title" value={formData.title} onChange={handleChange} type="text" placeholder="Enter lesson title" />
//                 </div>
//                 <div className="form-group">
//                   <label>Subject *</label>
//                   <select name="subject" value={formData.subject} onChange={handleChange}>
//                     <option value="">Select subject</option>
//                     <option>Mathematics</option>
//                     <option>Science</option>
//                     <option>English</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="form-row">
//                 <div className="form-group">
//                   <label>Grade *</label>
//                   <select name="grade" value={formData.grade} onChange={handleChange}>
//                     <option value="">Select grade</option>
//                     <option>Grade 6</option>
//                     <option>Grade 7</option>
//                     <option>Grade 8</option>
//                   </select>
//                 </div>
//                 <div className="form-group">
//                   <label>Duration *</label>
//                   <input name="duration" value={formData.duration} onChange={handleChange} type="text" placeholder="e.g., 45 min" />
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label>Status</label>
//                 <select name="status" value={formData.status} onChange={handleChange}>
//                   <option>Draft</option>
//                   <option>Published</option>
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label>Description</label>
//                 <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter lesson description..."></textarea>
//               </div>

//               <div className="form-group">
//                 <label>Learning Objectives (one per line)</label>
//                 <textarea name="objectives" value={formData.objectives} onChange={handleChange} placeholder="List the learning objectives..."></textarea>
//               </div>

//               <div className="form-group">
//                 <label>Materials (one per line)</label>
//                 <textarea name="materials" value={formData.materials} onChange={handleChange} placeholder="List required materials..."></textarea>
//               </div>

//               <div className="modal-actions">
//                 <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
//                 <button className="create-btn" onClick={handleCreateLesson}>Create Lesson</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default LessonManagement;

// الكود الي فوق قبل الزوم 



// الكود الي تحت قبل اضافة الفيديوهات 

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import '../styles/lesson-management.css';

// function LessonManagement({ onNavigate }) { // ✅ إضافة onNavigate كـ prop
//   const navigate = useNavigate();
//   const [showModal, setShowModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');

//   const [lessons, setLessons] = useState([
//     { id: 1, title: "Quadratic Equations", subject: "Mathematics", status: "published", duration: "45 min", lastEdited: "2 days ago", description: "Complete guide to solving quadratic equations." },
//     { id: 2, title: "Trigonometry Basics", subject: "Mathematics", status: "published", duration: "60 min", lastEdited: "3 days ago", description: "Introduction to trigonometric functions." },
//     { id: 3, title: "Algebraic Expressions", subject: "Mathematics", status: "draft", duration: "50 min", lastEdited: "1 hour ago", description: "Understanding and simplifying algebraic expressions." }
//   ]);

//   // form state
//   const [formData, setFormData] = useState({
//     title: '',
//     subject: '',
//     grade: '',
//     duration: '',
//     status: 'Draft',
//     description: '',
//     objectives: '',
//     materials: ''
//   });

//   // 🔹 Zoom meeting state
//   const [zoomMeeting, setZoomMeeting] = useState(null);
//   const [zoomLoading, setZoomLoading] = useState(false);
//   const [zoomError, setZoomError] = useState('');

//   // 🔹 إيميل المعلم على Zoom (عدّليه)
//   const teacherZoomEmail = 'dana1310.eng@gmail.com';

//   const handleNavigation = (page) => {
//     onNavigate(page); // استخدام الـ prop من TeacherHome
//   };

//   // handle input change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   // handle lesson creation
//   const handleCreateLesson = () => {
//     if (!formData.title || !formData.subject || !formData.grade || !formData.duration) {
//       alert("Please fill in all required fields (*)");
//       return;
//     }

//     const newLesson = {
//       id: lessons.length + 1,
//       title: formData.title,
//       subject: formData.subject,
//       status: formData.status.toLowerCase(),
//       duration: formData.duration,
//       lastEdited: "just now",
//       description: formData.description || "No description provided."
//     };

//     setLessons([newLesson, ...lessons]);
//     setShowModal(false);

//     // reset form
//     setFormData({
//       title: '',
//       subject: '',
//       grade: '',
//       duration: '',
//       status: 'Draft',
//       description: '',
//       objectives: '',
//       materials: ''
//     });
//   };

//   // ✅ فلترة الدروس حسب عنوان الدرس
//   const filteredLessons = lessons.filter((lesson) =>
//     lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // 🔹 إنشاء اجتماع Zoom
//   const handleCreateZoomMeeting = async () => {
//     try {
//       setZoomLoading(true);
//       setZoomError('');
//       setZoomMeeting(null);

//       if (!teacherZoomEmail) {
//         setZoomError('Zoom email is not configured.');
//         setZoomLoading(false);
//         return;
//       }

//       // نحاول نطلع رقم الدقائق من duration لو مكتوب "45 min"
//       const durationMinutes =
//         parseInt(formData.duration) || 45;

//       const body = {
//         topic: formData.title || 'Online Lesson',
//         duration: durationMinutes,
//         zoomEmail: teacherZoomEmail
//       };

//       const res = await fetch('/api/zoom/create-meeting', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(body)
//       });

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => ({}));
//         throw new Error(errorData.message || 'Failed to create Zoom meeting');
//       }

//       const data = await res.json();
//       setZoomMeeting(data);
//     } catch (err) {
//       setZoomError(err.message || 'Unexpected error');
//     } finally {
//       setZoomLoading(false);
//     }
//   };

//   return (
//     <div className="lesson-management">
//       {/* Main Content فقط */}
//       <div className="lesson-main-content">
//         <div className="content-container">
//           <div className="lesson-header">
//             <div className="header-content">
//               <div className="header-text">
//                 <h1>Lesson Management</h1>
//                 <p>Create, edit, and organize your lessons</p>
//               </div>
//             </div>
//           </div>

//           {/* Action Bar */}
//           <div className="action-bar">
//             <button
//               className="create-lesson-btn"
//               onClick={() => setShowModal(true)}
//             >
//               <i className="fas fa-plus"></i> Create New Lesson
//             </button>

//             {/* 🔹 زر إنشاء اجتماع Zoom */}
//             <button
//               className="create-lesson-btn"
//               onClick={handleCreateZoomMeeting}
//               disabled={zoomLoading}
//               style={{ marginLeft: '12px' }}
//             >
//               {zoomLoading ? 'Creating Zoom Meeting...' : 'Create Zoom Meeting'}
//             </button>
//           </div>

//           {/* 🔹 عرض نتيجة إنشاء اجتماع Zoom */}
//           {zoomError && (
//             <p className="zoom-error" style={{ color: 'red', marginTop: '8px' }}>
//               {zoomError}
//             </p>
//           )}

//           {zoomMeeting && (
//             <div className="zoom-meeting-info" style={{ marginTop: '12px' }}>
//               <h3>Zoom Meeting Created</h3>
//               <p><strong>Topic:</strong> {zoomMeeting.topic}</p>
//               <p>
//                 <strong>Teacher (Start link): </strong>
//                 <a href={zoomMeeting.start_url} target="_blank" rel="noreferrer">
//                   Start Meeting
//                 </a>
//               </p>
//               <p>
//                 <strong>Students (Join link): </strong>
//                 <a href={zoomMeeting.join_url} target="_blank" rel="noreferrer">
//                   Join Meeting
//                 </a>
//               </p>
//               {zoomMeeting.password && (
//                 <p><strong>Password:</strong> {zoomMeeting.password}</p>
//               )}
//             </div>
//           )}

//           {/* ✅ عرض الدروس بعد الفلترة */}
//           <div className="lessons-grid">
//             {filteredLessons.length > 0 ? (
//               filteredLessons.map((lesson) => (
//                 <div key={lesson.id} className="lesson-card">
//                   <div className="lesson-card-header">
//                     <div className="lesson-header-section">
//                       <div className="lesson-title-section">
//                         <h3>{lesson.title}</h3>
//                         <p className="lesson-subject">
//                           <i className="fas fa-book-open"></i>{lesson.subject}
//                         </p>
//                       </div>
//                       <span className={`status-badge ${lesson.status}`}>
//                         <i className={`fas ${lesson.status === 'published' ? 'fa-check-circle' : 'fa-edit'}`}></i>
//                         {lesson.status}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="lesson-description">{lesson.description}</div>
//                 </div>
//               ))
//             ) : (
//               <p className="no-results">No lessons found.</p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div className="modal-overlay">
//           <div className="create-lesson-modal">
//             <h2>Create New Lesson</h2>

//             <div className="modal-form">
//               <div className="form-row">
//                 <div className="form-group">
//                   <label>Lesson Title *</label>
//                   <input name="title" value={formData.title} onChange={handleChange} type="text" placeholder="Enter lesson title" />
//                 </div>
//                 <div className="form-group">
//                   <label>Subject *</label>
//                   <select name="subject" value={formData.subject} onChange={handleChange}>
//                     <option value="">Select subject</option>
//                     <option>Mathematics</option>
//                     <option>Science</option>
//                     <option>English</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="form-row">
//                 <div className="form-group">
//                   <label>Grade *</label>
//                   <select name="grade" value={formData.grade} onChange={handleChange}>
//                     <option value="">Select grade</option>
//                     <option>Grade 6</option>
//                     <option>Grade 7</option>
//                     <option>Grade 8</option>
//                   </select>
//                 </div>
//                 <div className="form-group">
//                   <label>Duration *</label>
//                   <input name="duration" value={formData.duration} onChange={handleChange} type="text" placeholder="e.g., 45 min" />
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label>Status</label>
//                 <select name="status" value={formData.status} onChange={handleChange}>
//                   <option>Draft</option>
//                   <option>Published</option>
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label>Description</label>
//                 <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter lesson description..."></textarea>
//               </div>

//               <div className="form-group">
//                 <label>Learning Objectives (one per line)</label>
//                 <textarea name="objectives" value={formData.objectives} onChange={handleChange} placeholder="List the learning objectives..."></textarea>
//               </div>

//               <div className="form-group">
//                 <label>Materials (one per line)</label>
//                 <textarea name="materials" value={formData.materials} onChange={handleChange} placeholder="List required materials..."></textarea>
//               </div>

//               <div className="modal-actions">
//                 <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
//                 <button className="create-btn" onClick={handleCreateLesson}>Create Lesson</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default LessonManagement;
// الكود الي فوق قبل الفيديوهات 

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/lesson-management.css';
import CourseDetail from './CourseDetail';
import CourseChaptersManager from './CourseChaptersManager';

function LessonManagement({ onNavigate }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [showChaptersManager, setShowChaptersManager] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  // Handle delete course
  const handleDeleteCourse = async (lesson, e) => {
    e.stopPropagation();
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the course "${lesson.title}"?\n\nThis will permanently remove:\n- All course content\n- All chapters and slides\n- All student progress\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to delete a course');
        return;
      }
      
      const courseId = lesson._id || lesson.id;
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${courseId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete course');
      }
      
      // Remove course from local state
      setLessons(prev => prev.filter(l => (l._id || l.id) !== courseId));
      alert(`Course "${lesson.title}" has been deleted successfully.`);
      
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(`Failed to delete course: ${error.message}`);
    }
  };

  // form state
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    subjectType: 'other',
    grade: '',
    universityMajor: '',
    duration: '',
    numberOfChapters: 1,
    status: 'Draft',
    description: '',
    objectives: '',
    materials: ''
  });

  // Load courses for the logged-in teacher from backend
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingLessons(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoadingLessons(false);
          return;
        }

        let teacherId = null;
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            teacherId = parsed?._id || parsed?.id || null;
          }
        } catch {
          // ignore parsing errors and try decoding from token instead
        }

        // Fallback: decode userId from JWT payload if not found in localStorage.user
        if (!teacherId) {
          try {
            const [, payloadBase64] = token.split('.') || [];
            if (payloadBase64) {
              const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
              const payload = JSON.parse(payloadJson);
              teacherId = payload.userId || payload._id || payload.id || null;
            }
          } catch {
            // if decoding fails, continue without filtering
          }
        }

        console.log('Fetching courses for teacher:', teacherId);
        
        // Use query parameter to filter by teacher on backend
        const url = teacherId 
          ? `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses?teacher=${teacherId}`
          : `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses`;
          
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error('Failed to fetch courses:', res.status);
          setLoadingLessons(false);
          return;
        }

        const data = await res.json();
        console.log('Courses received:', data);
        
        if (!Array.isArray(data)) {
          setLoadingLessons(false);
          return;
        }

        // Data is already filtered by backend, but double-check on frontend too
        const filtered = data.filter((course) => {
          if (!teacherId) return true;
          const teacher = course.teacher;
          // Handle both populated object and string ID
          const courseTeacherId = typeof teacher === 'string' 
            ? teacher 
            : (teacher?._id || teacher?.id);
          return courseTeacherId === teacherId;
        });

        // Map to display format
        const mapped = filtered.map((course) => ({
          id: course._id || course.id,
          _id: course._id || course.id,
          title: course.title || 'Untitled Course',
          subject: course.subject || 'Course',
          subjectType: course.subjectType || 'other',
          grade: course.grade || 'All Grades',
          status: course.isActive === false ? 'draft' : 'published',
          duration: course.duration || '45 min',
          lastEdited: course.updatedAt
            ? formatTimeAgo(course.updatedAt)
            : 'recently',
          description: course.description || 'No description provided.',
          students: course.students?.length || 0,
          zoomLink: course.zoomLink || null,
          isChapterBased: course.isChapterBased || false,
          numberOfChapters: course.numberOfChapters || 0,
          chapters: course.chapters || [],
        }));

        setLessons(mapped);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchCourses();
  }, []);

  // Helper to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // 🔹 Zoom meeting state
  const [zoomMeeting, setZoomMeeting] = useState(null);
  const [zoomLoading, setZoomLoading] = useState(false);
  const [zoomError, setZoomError] = useState('');

  // 🔹 إيميل المعلم على Zoom
  const teacherZoomEmail = 'dana1310.eng@gmail.com';

  const handleNavigation = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // ✅ فتح صفحة تعديل/فيديوهات الدرس
  const handleOpenLesson = (lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      setSelectedLesson(lesson);
      setShowCourseDetail(true);
    }
  };

  // handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // handle lesson creation (persist to backend)
  const handleCreateLesson = async () => {
    if (!formData.title || !formData.subject || !formData.grade || !formData.duration) {
      alert("Please fill in all required fields (*)");
      return;
    }

    const token = localStorage.getItem('token');
    let teacherId = null;

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        teacherId = parsed?._id || parsed?.id || null;
      }
    } catch {
      // ignore parsing errors, we will try decoding from token
    }

    // Fallback: decode userId from JWT payload if not found in localStorage.user
    if (!teacherId && token) {
      try {
        const [, payloadBase64] = token.split('.') || [];
        if (payloadBase64) {
          const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(payloadJson);
          teacherId = payload.userId || payload._id || payload.id || null;
        }
      } catch {
        // fall back to local-only create if decoding fails
      }
    }

    // If we don't have a token or teacherId, fall back to local state only
    if (!token || !teacherId) {
      const newLesson = {
        id: lessons.length + 1,
        title: formData.title,
        subject: formData.subject,
        status: formData.status.toLowerCase(),
        duration: formData.duration,
        lastEdited: "just now",
        description: formData.description || "No description provided."
      };

      setLessons([newLesson, ...lessons]);
      setShowModal(false);

      setFormData({
        title: '',
        subject: '',
        subjectType: 'other',
        grade: '',
        universityMajor: '',
        duration: '',
        numberOfChapters: 1,
        status: 'Draft',
        description: '',
        objectives: '',
        materials: ''
      });

      // Success - lesson created locally
      return;
    }

    try {
      const body = {
        title: formData.title,
        description: formData.description,
        teacher: teacherId,
        subject: formData.subject,
        subjectType: formData.subjectType || 'other',
        grade: formData.grade,
        universityMajor: formData.grade === 'University' ? formData.universityMajor : null,
        duration: formData.duration,
        numberOfChapters: parseInt(formData.numberOfChapters) || 1,
        isChapterBased: true,
        isActive: formData.status?.toLowerCase() === 'published',
      };

      console.log('Creating course with data:', body);
      
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to create course:', res.status, errorData);
        throw new Error(errorData.message || 'Failed to create course');
      }

      const created = await res.json();
      console.log('Course created successfully:', created);

      const newLesson = {
        id: created._id || created.id || Date.now(),
        _id: created._id || created.id || Date.now(),
        title: created.title || formData.title,
        subject: created.subject || formData.subject,
        subjectType: created.subjectType || formData.subjectType || 'other',
        status: created.isActive === false ? 'draft' : 'published',
        duration: created.duration || formData.duration,
        lastEdited: created.updatedAt
          ? new Date(created.updatedAt).toLocaleDateString('en-US')
          : 'just now',
        description: created.description || formData.description || 'No description provided.',
        isChapterBased: created.isChapterBased !== false,
        numberOfChapters: created.numberOfChapters || parseInt(formData.numberOfChapters) || 1,
        chapters: created.chapters || [],
        grade: created.grade || formData.grade,
      };

      setLessons([newLesson, ...lessons]);
      
      // Automatically open chapters manager for the new course
      setSelectedLesson(newLesson);
      setShowChaptersManager(true);
      
      setShowModal(false);

      setFormData({
        title: '',
        subject: '',
        subjectType: 'other',
        grade: '',
        universityMajor: '',
        duration: '',
        numberOfChapters: 1,
        status: 'Draft',
        description: '',
        objectives: '',
        materials: ''
      });

      // Success - lesson created and added to list
    } catch (err) {
      console.error('Error creating lesson/course:', err);
      alert('Could not save lesson to the server. Please try again.');
    }
  };

  // ✅ فلترة الدروس حسب عنوان الدرس
  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // State for selecting a course to attach Zoom meeting
  const [selectedCourseForZoom, setSelectedCourseForZoom] = useState(null);

  // 🔹 إنشاء اجتماع Zoom وحفظه في الكورس
  const handleCreateZoomMeeting = async () => {
    try {
      setZoomLoading(true);
      setZoomError('');
      setZoomMeeting(null);

      if (!teacherZoomEmail) {
        setZoomError('Zoom email is not configured.');
        setZoomLoading(false);
        return;
      }

      // نحاول نطلع رقم الدقائق من duration لو مكتوب "45 min"
      const durationMinutes = parseInt(formData.duration) || 45;

      const body = {
        topic: formData.title || 'Online Lesson',
        duration: durationMinutes,
        zoomEmail: teacherZoomEmail
      };

      const res = await fetch('/api/zoom/create-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create Zoom meeting');
      }

      const data = await res.json();
      setZoomMeeting(data);

      // Save Zoom link to selected course if one is selected
      if (selectedCourseForZoom && data.join_url) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${selectedCourseForZoom}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                zoomLink: data.join_url,
                zoomMeetingId: data.id?.toString(),
                zoomPassword: data.password || '',
              }),
            });
            // Update local state
            setLessons(prev => prev.map(lesson => 
              lesson.id === selectedCourseForZoom 
                ? { ...lesson, zoomLink: data.join_url }
                : lesson
            ));
          } catch (err) {
            console.error('Failed to save Zoom link to course:', err);
          }
        }
      }
    } catch (err) {
      setZoomError(err.message || 'Unexpected error');
    } finally {
      setZoomLoading(false);
    }
  };

  return (
    <div className="lesson-management">
      {/* Main Content فقط */}
      <div className="lesson-main-content">
        <div className="content-container">
          <div className="lesson-header">
            <div className="header-content">
              <div className="header-text">
                <h1>Lesson Management</h1>
                <p>Create, edit, and organize your lessons</p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="action-bar">
            <button
              className="create-lesson-btn"
              onClick={() => setShowModal(true)}
            >
              <i className="fas fa-plus"></i> Create New Lesson
            </button>

            {/* 🔹 Course selector for Zoom meeting */}
            <select
              className="zoom-course-select"
              value={selectedCourseForZoom || ''}
              onChange={(e) => setSelectedCourseForZoom(e.target.value)}
              style={{ marginLeft: '12px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              <option value="">Select course for Zoom...</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>

            {/* 🔹 زر إنشاء اجتماع Zoom */}
            <button
              className="create-lesson-btn"
              onClick={handleCreateZoomMeeting}
              disabled={zoomLoading || !selectedCourseForZoom}
              style={{ marginLeft: '12px' }}
            >
              {zoomLoading ? 'Creating Zoom Meeting...' : 'Create Zoom Meeting'}
            </button>

            {/* 🔍 سيرش بسيط على العنوان (اختياري تحطيه في CSS مناسب) */}
            <input
              type="text"
              className="lesson-search-input"
              placeholder="Search by lesson title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginLeft: 'auto' }}
            />
          </div>

          {/* 🔹 عرض نتيجة إنشاء اجتماع Zoom */}
          {zoomError && (
            <p className="zoom-error" style={{ color: 'red', marginTop: '8px' }}>
              {zoomError}
            </p>
          )}

          {zoomMeeting && (
            <div className="zoom-meeting-info" style={{ marginTop: '12px' }}>
              <h3>Zoom Meeting Created</h3>
              <p><strong>Topic:</strong> {zoomMeeting.topic}</p>
              <p>
                <strong>Teacher (Start link): </strong>
                <a href={zoomMeeting.start_url} target="_blank" rel="noreferrer">
                  Start Meeting
                </a>
              </p>
              <p>
                <strong>Students (Join link): </strong>
                <a href={zoomMeeting.join_url} target="_blank" rel="noreferrer">
                  Join Meeting
                </a>
              </p>
              {zoomMeeting.password && (
                <p><strong>Password:</strong> {zoomMeeting.password}</p>
              )}
            </div>
          )}

          {/* ✅ عرض الدروس بعد الفلترة */}
          <div className="lessons-grid">
            {loadingLessons ? (
              <div className="loading-state" style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '40px',
                color: '#666'
              }}>
                <p>Loading your lessons...</p>
              </div>
            ) : filteredLessons.length > 0 ? (
              filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="lesson-card"
                  onClick={() => handleOpenLesson(lesson.id)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <div className="lesson-card-header">
                    <div className="lesson-header-section">
                      <div className="lesson-title-section">
                        <h3>{lesson.title}</h3>
                        <p className="lesson-subject">
                          <i className="fas fa-book-open"></i> {lesson.subject}
                          {lesson.subjectType && lesson.subjectType !== 'other' && (
                            <span style={{ marginLeft: '8px', color: '#3498db' }}>
                              ({lesson.subjectType})
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`status-badge ${lesson.status}`}>
                        <i className={`fas ${lesson.status === 'published' ? 'fa-check-circle' : 'fa-edit'}`}></i>
                        {lesson.status}
                      </span>
                    </div>
                  </div>
                  <div className="lesson-description">{lesson.description}</div>
                  <div className="lesson-meta" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '12px',
                    fontSize: '0.85rem',
                    color: '#666'
                  }}>
                    <span><i className="fas fa-clock"></i> {lesson.duration}</span>
                    <span><i className="fas fa-graduation-cap"></i> {lesson.grade}</span>
                    <span><i className="fas fa-users"></i> {lesson.students || 0} students</span>
                  </div>
                  <div className="lesson-footer" style={{ 
                    marginTop: '10px', 
                    paddingTop: '10px', 
                    borderTop: '1px solid #eee',
                    fontSize: '0.8rem',
                    color: '#999',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Last edited: {lesson.lastEdited}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {lesson.zoomLink && (
                        <span style={{ color: '#2D8CFF' }}>
                          <i className="fas fa-video"></i> Zoom Ready
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLesson(lesson);
                          setShowCourseDetail(true);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fas fa-cog"></i> Manage Course
                      </button>
                      <button
                        onClick={(e) => handleDeleteCourse(lesson, e)}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fas fa-trash"></i> Delete Course
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '60px 20px',
                background: '#f8f9fa',
                borderRadius: '12px'
              }}>
                <i className="fas fa-book" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
                <h3 style={{ color: '#666', marginBottom: '8px' }}>No Courses Yet</h3>
                <p style={{ color: '#999' }}>Click "Create New Course" to add your first course with chapters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="create-lesson-modal">
            <h2>Create New Course</h2>

            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Course Title *</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    type="text"
                    placeholder="Enter course title"
                  />
                </div>
                <div className="form-group">
                  <label>Subject Type *</label>
                  <select
                    name="subjectType"
                    value={formData.subjectType}
                    onChange={handleChange}
                  >
                    <option value="other">Select subject type</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="biology">Biology</option>
                    <option value="english">English</option>
                    <option value="arabic">Arabic</option>
                    <option value="history">History</option>
                    <option value="geography">Geography</option>
                    <option value="computer_science">Computer Science</option>
                    <option value="programming">Programming</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Subject Name *</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="">Select subject</option>
                    <option>Mathematics</option>
                    <option>Sciences</option>
                    <option>English</option>
                    <option>Arabic</option>
                    <option>Technology</option>
                    <option>Religion </option>
                    <option>Computer Engineering</option>
                    <option>Architectural Engineering</option>
                    <option>Civil Engineering</option>
                    <option>Electrical Engineering</option>
                    <option>Industrial Engineering</option>
                    <option>Mechanical Engineering</option>
                    <option>Mechatronics Engineering</option>
                    <option>Chemical Engineering</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Grade *</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                  >
                    <option value="">Select grade</option>
                    <option>Grade 1</option>
                    <option>Grade 2</option>
                    <option>Grade 3</option>
                    <option>Grade 4</option>
                    <option>Grade 5</option>
                    <option>Grade 6</option>
                    <option>Grade 7</option>
                    <option>Grade 8</option>
                    <option>Grade 9</option>
                    <option>Grade 10</option>
                    <option>Grade 11</option>
                    <option>Grade 12</option>
                    <option>University</option>
                  </select>
                </div>
                {formData.grade === 'University' && (
                  <div className="form-group">
                    <label>Specialization *</label>
                    <select
                      name="universityMajor"
                      value={formData.universityMajor}
                      onChange={handleChange}
                    >
                      <option value="">Select specialization</option>
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Architectural Engineering">Architectural Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Industrial Engineering">Industrial Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Mechatronics Engineering">Mechatronics Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration *</label>
                  <input
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    type="text"
                    placeholder="e.g., 45 min"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option>Draft</option>
                  <option>Published</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter lesson description..."
                ></textarea>
              </div>

              <div className="form-group">
                <label>Learning Objectives (one per line)</label>
                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleChange}
                  placeholder="List the learning objectives..."
                ></textarea>
              </div>

              <div className="form-group">
                <label>Materials (one per line)</label>
                <textarea
                  name="materials"
                  value={formData.materials}
                  onChange={handleChange}
                  placeholder="List required materials..."
                ></textarea>
              </div>

              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="create-btn"
                  onClick={handleCreateLesson}
                >
                  Create Lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail Modal */}
      {showCourseDetail && selectedLesson && (
        <div className="modal-overlay" onClick={() => setShowCourseDetail(false)}>
          <div 
            className="modal course-detail-modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'auto', padding: 0 }}
          >
            <CourseDetail
              courseId={selectedLesson.id}
              courseTitle={selectedLesson.title}
              isTeacher={true}
              onClose={() => setShowCourseDetail(false)}
            />
          </div>
        </div>
      )}

      {/* Course Chapters Manager Modal */}
      {showChaptersManager && selectedLesson && (
        <div className="modal-overlay" onClick={() => setShowChaptersManager(false)}>
          <div 
            className="modal chapters-manager-modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: 1000, maxHeight: '95vh', overflow: 'auto', padding: 0, borderRadius: 12 }}
          >
            <CourseChaptersManager
              course={selectedLesson}
              onBack={() => setShowChaptersManager(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default LessonManagement;
