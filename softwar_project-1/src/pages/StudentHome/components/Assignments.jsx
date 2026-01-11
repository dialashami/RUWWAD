 


// // Assignments.jsx
// import { useState } from 'react';
// import { Calendar, Upload, FileText, CheckCircle2, Clock, AlertCircle, Download } from 'lucide-react';
 

// const assignments = [
//   {
//     id: 1,
//     title: 'Calculus Problem Set #5',
//     subject: 'Mathematics',
//     description: 'Complete exercises 1-20 from Chapter 5 covering derivatives and integrals.',
//     dueDate: 'Oct 14, 2025',
//     dueTime: '11:59 PM',
//     status: 'pending',
//     progress: 80,
//     grade: null,
//     submittedDate: null,
//     feedback: null,
//     attachments: ['problem-set-5.pdf'],
//   },
//   {
//     id: 2,
//     title: 'Physics Lab Report - Mechanics',
//     subject: 'Physics',
//     description: 'Write a detailed report on the mechanics experiment conducted in class.',
//     dueDate: 'Oct 15, 2025',
//     dueTime: '11:59 PM',
//     status: 'pending',
//     progress: 45,
//     grade: null,
//     submittedDate: null,
//     feedback: null,
//     attachments: ['lab-instructions.pdf', 'data-template.xlsx'],
//   },
//   {
//     id: 3,
//     title: 'Organic Chemistry Essay',
//     subject: 'Chemistry',
//     description: 'Research essay on the applications of organic chemistry in modern medicine.',
//     dueDate: 'Oct 16, 2025',
//     dueTime: '11:59 PM',
//     status: 'pending',
//     progress: 20,
//     grade: null,
//     submittedDate: null,
//     feedback: null,
//     attachments: ['essay-guidelines.pdf'],
//   },
//   {
//     id: 4,
//     title: 'Cell Biology Research Paper',
//     subject: 'Biology',
//     description: 'Detailed analysis of cellular processes and their significance.',
//     dueDate: 'Oct 10, 2025',
//     dueTime: '11:59 PM',
//     status: 'graded',
//     progress: 100,
//     grade: 95,
//     submittedDate: 'Oct 9, 2025',
//     feedback: 'Excellent work! Your analysis was thorough and well-researched.',
//     attachments: [],
//   },
//   {
//     id: 5,
//     title: 'Trigonometry Practice Problems',
//     subject: 'Mathematics',
//     description: 'Solve all problems from the trigonometry workbook pages 45-60.',
//     dueDate: 'Oct 12, 2025',
//     dueTime: '11:59 PM',
//     status: 'late',
//     progress: 0,
//     grade: null,
//     submittedDate: null,
//     feedback: null,
//     attachments: ['workbook-problems.pdf'],
//   },
//   {
//     id: 6,
//     title: 'Quantum Physics Presentation',
//     subject: 'Physics',
//     description: 'Create a 10-minute presentation on quantum mechanics principles.',
//     dueDate: 'Oct 8, 2025',
//     dueTime: '11:59 PM',
//     status: 'graded',
//     progress: 100,
//     grade: 88,
//     submittedDate: 'Oct 7, 2025',
//     feedback: 'Good presentation, but could use more visual aids.',
//     attachments: [],
//   },
// ];

// const statusConfig = {
//   pending: {
//     icon: Clock,
//     color: 'text-primary',
//     bg: 'bg-primary-light',
//     badge: 'badge-primary',
//     label: 'Pending',
//   },
//   late: {
//     icon: AlertCircle,
//     color: 'text-danger',
//     bg: 'bg-danger-light',
//     badge: 'badge-danger',
//     label: 'Overdue',
//   },
//   graded: {
//     icon: CheckCircle2,
//     color: 'text-success',
//     bg: 'bg-success-light',
//     badge: 'badge-success',
//     label: 'Graded',
//   },
// };

// export function Assignments() {
//   const [activeTab, setActiveTab] = useState('all');
//   const [selectedAssignment, setSelectedAssignment] = useState(null);

//   const filteredAssignments = assignments.filter((assignment) => {
//     if (activeTab === 'all') return true;
//     if (activeTab === 'pending') return assignment.status === 'pending';
//     if (activeTab === 'graded') return assignment.status === 'graded';
//     if (activeTab === 'late') return assignment.status === 'late';
//     return true;
//   });

//   const stats = {
//     total: assignments.length,
//     pending: assignments.filter(a => a.status === 'pending').length,
//     graded: assignments.filter(a => a.status === 'graded').length,
//     late: assignments.filter(a => a.status === 'late').length,
//   };

//   return (
//     <div className="assignments-container">
//       {/* Header */}
//       <div className="assignments-header">
//         <div className="header-content">
//           <h1 className="assignments-title">
//             Assignments 📚
//           </h1>
//           <p className="assignments-subtitle">
//             Manage your assignments and submissions
//           </p>
//         </div>

     
//       </div>

//       {/* Tabs */}
//       <div className="tabs-container">
//         <div className="tabs-list">
//           <button 
//             className={`tab-trigger ${activeTab === 'all' ? 'active' : ''}`}
//             onClick={() => setActiveTab('all')}
//           >
//             All
//           </button>
//           <button 
//             className={`tab-trigger ${activeTab === 'pending' ? 'active' : ''}`}
//             onClick={() => setActiveTab('pending')}
//           >
//             Pending
//           </button>
//           <button 
//             className={`tab-trigger ${activeTab === 'graded' ? 'active' : ''}`}
//             onClick={() => setActiveTab('graded')}
//           >
//             Graded
//           </button>
//           <button 
//             className={`tab-trigger ${activeTab === 'late' ? 'active' : ''}`}
//             onClick={() => setActiveTab('late')}
//           >
//             Overdue
//           </button>
//         </div>
//       </div>

//       {/* Assignments List */}
//       <div className="assignments-list">
//         {filteredAssignments.map((assignment, index) => {
//           const config = statusConfig[assignment.status];
//           const Icon = config.icon;

//           return (
//             <div
//               key={assignment.id}
//               className="assignment-card"
//             >
//               <div className="assignment-content">
//                 {/* Icon */}
//                 <div className={`assignment-icon ${config.bg}`}>
//                   <Icon className={`assignment-icon-svg ${config.color}`} />
//                 </div>

//                 {/* Content */}
//                 <div className="assignment-details">
//                   <div className="assignment-header">
//                     <div className="assignment-title-section">
//                       <div className="title-row">
//                         <h3 className="assignment-title-text">
//                           {assignment.title}
//                         </h3>
//                         <span className={`status-badge ${config.badge}`}>
//                           {config.label}
//                         </span>
//                       </div>
//                       <div className="assignment-meta">
//                         <span className="subject">{assignment.subject}</span>
//                         <span className="meta-separator">•</span>
//                         <div className="due-date">
//                           <Calendar className="calendar-icon" />
//                           <span>
//                             Due: {assignment.dueDate} at {assignment.dueTime}
//                           </span>
//                         </div>
//                       </div>
//                       <p className="assignment-description">
//                         {assignment.description}
//                       </p>

//                       {/* Progress for pending assignments */}
//                       {assignment.status === 'pending' && (
//                         <div className="progress-section">
//                           <div className="progress-header">
//                             <span className="progress-label">Progress</span>
//                             <span className="progress-value">{assignment.progress}%</span>
//                           </div>
//                           <div className="progress-bar">
//                             <div 
//                               className="progress-fill"
//                               style={{ width: `${assignment.progress}%` }}
//                             ></div>
//                           </div>
//                         </div>
//                       )}

//                       {/* Grade and feedback for graded assignments */}
//                       {assignment.status === 'graded' && (
//                         <div className="grade-section">
//                           <div className="grade-content">
//                             <div className="grade-info">
//                               <p className="grade-label">Grade</p>
//                               <p className="grade-value">{assignment.grade}%</p>
//                             </div>
//                             <div className="feedback-info">
//                               <p className="feedback-label">Teacher Feedback</p>
//                               <p className="feedback-text">
//                                 {assignment.feedback}
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       )}

//                       {/* Attachments */}
//                       {assignment.attachments.length > 0 && (
//                         <div className="attachments-section">
//                           {assignment.attachments.map((file, idx) => (
//                             <button
//                               key={idx}
//                               className="attachment-button"
//                             >
//                               <Download className="download-icon" />
//                               {file}
//                             </button>
//                           ))}
//                         </div>
//                       )}

//                       {/* Actions */}
//                       <div className="actions-section">
//                         {assignment.status === 'pending' && (
//                           <>
//                             <button className="btn-primary">
//                               <Upload className="btn-icon" />
//                               Submit Assignment
//                             </button>
//                             <button className="btn-outline">
//                               <FileText className="btn-icon" />
//                               View Details
//                             </button>
//                           </>
//                         )}
//                         {assignment.status === 'late' && (
//                           <button className="btn-danger">
//                             <Upload className="btn-icon" />
//                             Submit Late
//                           </button>
//                         )}
//                         {assignment.status === 'graded' && (
//                           <button className="btn-outline">
//                             View Submission
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


// الي فوق بدون برمجة البوتونز 
 


// Assignments.jsx
import { useState, useEffect } from 'react';
import { Calendar, Upload, FileText, CheckCircle2, Clock, AlertCircle, Download, X } from 'lucide-react';
import { useStudent } from '../context/StudentContext';

// Fallback mock assignments (used if backend returns empty)
const initialAssignments = [
  {
    id: 1,
    title: 'Calculus Problem Set #5',
    subject: 'Mathematics',
    description: 'Complete exercises 1-20 from Chapter 5 covering derivatives and integrals.',
    dueDate: 'Oct 14, 2025',
    dueTime: '11:59 PM',
    status: 'pending',
    progress: 80,
    grade: null,
    submittedDate: null,
    feedback: null,
    attachments: ['problem-set-5.pdf'],
  },
  {
    id: 2,
    title: 'Physics Lab Report - Mechanics',
    subject: 'Physics',
    description: 'Write a detailed report on the mechanics experiment conducted in class.',
    dueDate: 'Oct 15, 2025',
    dueTime: '11:59 PM',
    status: 'pending',
    progress: 45,
    grade: null,
    submittedDate: null,
    feedback: null,
    attachments: ['lab-instructions.pdf', 'data-template.xlsx'],
  },
];

// تعريف statusConfig داخل الملف
const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-primary',
    bg: 'bg-primary-light',
    badge: 'badge-primary',
    label: 'Pending',
  },
  late: {
    icon: AlertCircle,
    color: 'text-danger',
    bg: 'bg-danger-light',
    badge: 'badge-danger',
    label: 'Overdue',
  },
  graded: {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success-light',
    badge: 'badge-success',
    label: 'Graded',
  },
};

export function Assignments() {
  // Get student data from context
  const { student, assignments: contextAssignments, refreshData } = useStudent();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentsList, setAssignmentsList] = useState(initialAssignments);
  const [activeModal, setActiveModal] = useState(null); // 'submit', 'details', 'submission'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submissionText, setSubmissionText] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch assignments from backend based on student's grade/major
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Use student data from context
        const grade = student.grade || null;
        const major = student.studentType === 'university' ? student.grade : null;
        const studentId = student.id || null;

        // Build URL with filters
        let url = `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/assignments`;
        const params = [];
        if (grade) params.push(`grade=${encodeURIComponent(grade)}`);
        if (major) params.push(`specialization=${encodeURIComponent(major)}`);
        if (params.length) {
          url += `?${params.join('&')}`;
        }

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          setLoading(false);
          return;
        }

        // Map backend data to component format
        const mapped = data.map((assignment) => {
          const dueDate = new Date(assignment.dueDate);
          const now = new Date();
          
          // Check if student has submitted
          const studentSubmission = assignment.submissions?.find(
            s => s.student === studentId || s.student?._id === studentId
          );
          
          // Determine status
          let status = 'pending';
          let progress = 0;
          let submittedDate = null;
          let studentGrade = null;
          let feedback = null;

          if (studentSubmission) {
            submittedDate = new Date(studentSubmission.submittedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            progress = 100;
            
            if (studentSubmission.isGraded) {
              status = 'graded';
              studentGrade = studentSubmission.grade;
              feedback = studentSubmission.feedback;
            } else {
              status = 'pending'; // submitted but not graded yet
            }
          } else if (dueDate < now) {
            status = 'late';
            progress = 0;
          } else {
            status = 'pending';
          }

          return {
            id: assignment._id || assignment.id,
            title: assignment.title || 'Untitled Assignment',
            subject: assignment.subject || assignment.course?.title || 'Course',
            description: assignment.description || 'No description provided.',
            dueDate: dueDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            dueTime: dueDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            status,
            progress,
            grade: studentGrade,
            submittedDate,
            feedback,
            attachments: assignment.attachments || [],
            instructionsFileUrl: assignment.instructionsFileUrl,
            instructionsFileName: assignment.instructionsFileName,
            points: assignment.points || 100,
            teacherName: assignment.teacher 
              ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}`
              : 'Teacher',
          };
        });

        setAssignmentsList(mapped);
      } catch (err) {
        console.error('Error fetching assignments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [student.id, student.grade]);

  const filteredAssignments = assignmentsList.filter((assignment) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return assignment.status === 'pending';
    if (activeTab === 'graded') return assignment.status === 'graded';
    if (activeTab === 'late') return assignment.status === 'late';
    return true;
  });

  const stats = {
    total: assignmentsList.length,
    pending: assignmentsList.filter(a => a.status === 'pending').length,
    graded: assignmentsList.filter(a => a.status === 'graded').length,
    late: assignmentsList.filter(a => a.status === 'late').length,
  };

  // دوال معالجة الأزرار
  const handleSubmitAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setActiveModal('submit');
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setActiveModal('details');
  };

  const handleViewSubmission = (assignment) => {
    setSelectedAssignment(assignment);
    setActiveModal('submission');
  };

  const handleDownloadAttachment = (fileName, assignmentId) => {
    console.log(`Downloading ${fileName} for assignment ${assignmentId}`);
    // محاكاة عملية التحميل
    const link = document.createElement('a');
    link.href = '#';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitLate = (assignment) => {
    setSelectedAssignment(assignment);
    setActiveModal('submit');
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeUploadedFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async () => {
    if (!selectedAssignment) return;

    try {
      const token = localStorage.getItem('token');
      let studentId = null;
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          studentId = parsed?._id || parsed?.id || null;
        }
      } catch {
        // ignore
      }

      if (!token || !studentId) {
        alert('You must be logged in to submit assignments.');
        return;
      }

      // Submit to backend
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          file: uploadedFiles.length > 0 ? uploadedFiles[0].name : null,
          comment: submissionText.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.message === 'Already submitted') {
          alert('You have already submitted this assignment.');
        } else {
          alert(errorData.message || 'Failed to submit assignment. Please try again.');
        }
        return;
      }

      // Success - update local state
      const updatedAssignments = assignmentsList.map(assignment => 
        assignment.id === selectedAssignment.id 
          ? { 
              ...assignment, 
              status: 'pending', // submitted but awaiting grade
              progress: 100,
              submittedDate: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }),
            }
          : assignment
      );

      setAssignmentsList(updatedAssignments);
      setActiveModal(null);
      setSelectedAssignment(null);
      setUploadedFiles([]);
      setSubmissionText('');
      
      alert('Assignment submitted successfully!');
      
      // Refresh data
      if (refreshData) {
        refreshData();
      }
    } catch (err) {
      console.error('Error submitting assignment:', err);
      alert('Error submitting assignment. Please try again.');
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedAssignment(null);
    setUploadedFiles([]);
    setSubmissionText('');
  };

  return (
    <div className="assignments-container">
      {/* Header */}
      <div className="assignments-header">
        <div className="header-content">
          <h1 className="assignments-title">
            Assignments 
          </h1>
          <p className="assignments-subtitle">
            Manage your assignments and submissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-list">
          <button 
            className={`tab-trigger ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({stats.total})
          </button>
          <button 
            className={`tab-trigger ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button 
            className={`tab-trigger ${activeTab === 'graded' ? 'active' : ''}`}
            onClick={() => setActiveTab('graded')}
          >
            Graded ({stats.graded})
          </button>
          <button 
            className={`tab-trigger ${activeTab === 'late' ? 'active' : ''}`}
            onClick={() => setActiveTab('late')}
          >
            Overdue ({stats.late})
          </button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="assignments-list">
        {filteredAssignments.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-icon" />
            <h3>No assignments found</h3>
            <p>There are no assignments in this category.</p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const config = statusConfig[assignment.status];
            const Icon = config.icon;

            return (
              <div
                key={assignment.id}
                className="assignment-card"
              >
                <div className="assignment-content">
                  {/* Icon */}
                  <div className={`assignment-icon ${config.bg}`}>
                    <Icon className={`assignment-icon-svg ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="assignment-details">
                    <div className="assignment-header">
                      <div className="assignment-title-section">
                        <div className="title-row">
                          <h3 className="assignment-title-text">
                            {assignment.title}
                          </h3>
                          <span className={`status-badge ${config.badge}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="assignment-meta">
                          <span className="subject">{assignment.subject}</span>
                          <span className="meta-separator">•</span>
                          <div className="due-date">
                            <Calendar className="calendar-icon" />
                            <span>
                              Due: {assignment.dueDate} at {assignment.dueTime}
                            </span>
                          </div>
                        </div>
                        <p className="assignment-description">
                          {assignment.description}
                        </p>

                        {/* Progress for pending assignments */}
                        {assignment.status === 'pending' && (
                          <div className="progress-section">
                            <div className="progress-header">
                              <span className="progress-label">Progress</span>
                              <span className="progress-value">{assignment.progress}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${assignment.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Grade and feedback for graded assignments */}
                        {assignment.status === 'graded' && (
                          <div className="grade-section">
                            <div className="grade-content">
                              <div className="grade-info">
                                <p className="grade-label">Grade</p>
                                <p className="grade-value">{assignment.grade}%</p>
                              </div>
                              <div className="feedback-info">
                                <p className="feedback-label">Teacher Feedback</p>
                                <p className="feedback-text">
                                  {assignment.feedback}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Attachments */}
                        {assignment.attachments.length > 0 && (
                          <div className="attachments-section">
                            <p className="attachments-label">Attachments:</p>
                            <div className="attachments-list">
                              {assignment.attachments.map((file, idx) => (
                                <button
                                  key={idx}
                                  className="attachment-button"
                                  onClick={() => handleDownloadAttachment(file, assignment.id)}
                                >
                                  <Download className="download-icon" />
                                  {file}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="actions-section">
                          {assignment.status === 'pending' && (
                            <>
                              <button 
                                className="btn-primary"
                                onClick={() => handleSubmitAssignment(assignment)}
                              >
                                <Upload className="btn-icon" />
                                Submit Assignment
                              </button>
                              <button 
                                className="btn-outline"
                                onClick={() => handleViewDetails(assignment)}
                              >
                                <FileText className="btn-icon" />
                                View Details
                              </button>
                            </>
                          )}
                          {assignment.status === 'late' && (
                            <button 
                              className="btn-danger"
                              onClick={() => handleSubmitLate(assignment)}
                            >
                              <Upload className="btn-icon" />
                              Submit Late
                            </button>
                          )}
                          {assignment.status === 'graded' && (
                            <button 
                              className="btn-outline"
                              onClick={() => handleViewSubmission(assignment)}
                            >
                              View Submission
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal لتقديم الواجب */}
      {activeModal === 'submit' && selectedAssignment && (
        <div className="modal-backdrop">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>Submit Assignment</h2>
              <button className="close-button" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="assignment-info">
                <h3>{selectedAssignment.title}</h3>
                <p className="subject-badge">{selectedAssignment.subject}</p>
                <p className="due-date-warning">
                  Due: {selectedAssignment.dueDate} at {selectedAssignment.dueTime}
                  {selectedAssignment.status === 'late' && (
                    <span className="late-indicator"> (LATE SUBMISSION)</span>
                  )}
                </p>
              </div>

              <div className="upload-section">
                <h4>Upload Files</h4>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="upload-label">
                    <Upload size={48} className="upload-icon" />
                    <span>Click to upload or drag and drop</span>
                    <span className="file-types">PDF, DOC, DOCX, ZIP (Max: 10MB)</span>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files">
                    <h5>Uploaded Files:</h5>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <FileText size={16} />
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button 
                          className="remove-file"
                          onClick={() => removeUploadedFile(index)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-submission">
                <h4>Additional Comments</h4>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Add any additional comments or notes for your teacher..."
                  rows={4}
                  className="submission-textarea"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-outline" onClick={closeModal}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleFinalSubmit}
                disabled={uploadedFiles.length === 0 && submissionText.trim() === ''}
              >
                Submit Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal لعرض التفاصيل */}
      {activeModal === 'details' && selectedAssignment && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Assignment Details</h2>
              <button className="close-button" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>{selectedAssignment.title}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Subject:</strong>
                    <span>{selectedAssignment.subject}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Due Date:</strong>
                    <span>{selectedAssignment.dueDate} at {selectedAssignment.dueTime}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong>
                    <span className={`status-text ${selectedAssignment.status}`}>
                      {statusConfig[selectedAssignment.status].label}
                    </span>
                  </div>
                  {selectedAssignment.progress > 0 && (
                    <div className="detail-item">
                      <strong>Progress:</strong>
                      <span>{selectedAssignment.progress}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="description-section">
                <h4>Description</h4>
                <p>{selectedAssignment.description}</p>
              </div>

              {selectedAssignment.attachments.length > 0 && (
                <div className="attachments-section">
                  <h4>Attachments</h4>
                  <div className="attachments-list">
                    {selectedAssignment.attachments.map((file, index) => (
                      <button
                        key={index}
                        className="attachment-download"
                        onClick={() => handleDownloadAttachment(file, selectedAssignment.id)}
                      >
                        <Download size={16} />
                        {file}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal لعرض التقديم */}
      {activeModal === 'submission' && selectedAssignment && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Submission Details</h2>
              <button className="close-button" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="submission-header">
                <h3>{selectedAssignment.title}</h3>
                <div className="grade-display">
                  <span className="grade-label">Final Grade:</span>
                  <span className="grade-value">{selectedAssignment.grade}%</span>
                </div>
              </div>

              <div className="submission-info">
                <div className="info-item">
                  <strong>Submitted on:</strong>
                  <span>{selectedAssignment.submittedDate}</span>
                </div>
                <div className="info-item">
                  <strong>Status:</strong>
                  <span className="status-graded">Graded</span>
                </div>
              </div>

              <div className="feedback-section">
                <h4>Teacher Feedback</h4>
                <div className="feedback-content">
                  <p>{selectedAssignment.feedback}</p>
                </div>
              </div>

              <div className="submission-preview">
                <h4>Your Submission</h4>
                <div className="preview-content">
                  <p>📄 assignment_submission.pdf</p>
                  <p>📄 additional_materials.zip</p>
                  <p className="submission-comment">
                    <strong>Your comments:</strong> "I have completed the assignment as per the requirements."
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-outline">
                <Download size={16} />
                Download Submission
              </button>
              <button className="btn-primary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS الإضافي */}
      <style jsx>{`
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    backdrop-filter: blur(10px);
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-content {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 24px;
    padding: 0;
    max-width: 520px;
    width: 100%;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 0 100px rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(59, 130, 246, 0.3) 50%, 
      transparent 100%);
  }

  .modal-content.large {
    max-width: 640px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32px 32px 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    position: relative;
  }

  .modal-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 32px;
    right: 32px;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(203, 213, 225, 0.6) 50%, 
      transparent 100%);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .close-button {
    background: rgba(241, 245, 249, 0.8);
    border: none;
    cursor: pointer;
    color: #64748b;
    padding: 8px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .close-button:hover {
    background: #f1f5f9;
    color: #475569;
    transform: rotate(90deg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .modal-body {
    padding: 32px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 24px 32px 32px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-top: 1px solid rgba(241, 245, 249, 0.8);
  }

  .assignment-info {
    background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
    border: 1px solid rgba(191, 219, 254, 0.5);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }

  .assignment-info::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%);
  }

  .assignment-info h3 {
    margin: 0 0 12px 0;
    font-size: 1.375rem;
    font-weight: 700;
    color: #1e293b;
  }

  .subject-badge {
    display: inline-block;
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .due-date-warning {
    color: #dc2626;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(220, 38, 38, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(220, 38, 38, 0.2);
  }

  .late-indicator {
    color: #dc2626;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .upload-section {
    margin: 32px 0;
  }

  .upload-section h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 16px;
  }

  .file-upload-area {
    border: 2px dashed #cbd5e1;
    border-radius: 20px;
    padding: 48px 32px;
    text-align: center;
    margin-top: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    position: relative;
    overflow: hidden;
  }

  .file-upload-area:hover {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
  }

  .file-upload-area::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(59, 130, 246, 0.1), 
      transparent);
    transition: left 0.6s ease;
  }

  .file-upload-area:hover::before {
    left: 100%;
  }

  .file-input {
    display: none;
  }

  .upload-label {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .upload-icon {
    color: #94a3b8;
    transition: all 0.3s ease;
  }

  .file-upload-area:hover .upload-icon {
    color: #3b82f6;
    transform: scale(1.1);
  }

  .file-types {
    font-size: 0.875rem;
    color: #64748b;
  }

  .uploaded-files {
    margin-top: 24px;
  }

  .uploaded-files h5 {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 12px;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 16px;
    margin-bottom: 8px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .file-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background: linear-gradient(180deg, #10b981 0%, #34d399 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .file-item:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .file-item:hover::before {
    opacity: 1;
  }

  .file-name {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1e293b;
  }

  .file-size {
    color: #64748b;
    font-size: 0.75rem;
    background: rgba(241, 245, 249, 0.8);
    padding: 4px 8px;
    border-radius: 8px;
  }

  .remove-file {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .remove-file:hover {
    background: rgba(239, 68, 68, 0.1);
    transform: scale(1.1);
  }

  .text-submission {
    margin-top: 32px;
  }

  .text-submission h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 16px;
  }

  .submission-textarea {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 16px;
    resize: vertical;
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.5;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  }

  .submission-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 
      0 0 0 3px rgba(59, 130, 246, 0.1),
      0 4px 12px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }

  .detail-grid {
    display: grid;
    gap: 16px;
    margin: 24px 0;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-radius: 16px;
    border: 1px solid rgba(226, 232, 240, 0.8);
  }

  .detail-item strong {
    font-weight: 600;
    color: #475569;
  }

  .detail-item span {
    font-weight: 500;
    color: #1e293b;
  }

  .status-text.pending { 
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    padding: 6px 12px;
    border-radius: 12px;
    font-weight: 600;
  }
  .status-text.late { 
    color: #dc2626;
    background: rgba(220, 38, 38, 0.1);
    padding: 6px 12px;
    border-radius: 12px;
    font-weight: 600;
  }
  .status-text.graded { 
    color: #059669;
    background: rgba(5, 150, 105, 0.1);
    padding: 6px 12px;
    border-radius: 12px;
    font-weight: 600;
  }

  .grade-display {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.5rem;
    padding: 20px;
    background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
    border-radius: 20px;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .grade-label {
    font-weight: 600;
    color: #065f46;
  }

  .grade-value {
    font-weight: bold;
    color: #059669;
    font-size: 2rem;
  }

  .feedback-content {
    background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
    padding: 24px;
    border-radius: 20px;
    border-left: 4px solid #10b981;
    position: relative;
    overflow: hidden;
  }

  .feedback-content::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
  }

  .submission-preview {
    margin-top: 24px;
  }

  .preview-content {
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    padding: 24px;
    border-radius: 20px;
    border: 1px solid rgba(226, 232, 240, 0.8);
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 
      0 8px 25px rgba(59, 130, 246, 0.4),
      0 0 0 1px rgba(59, 130, 246, 0.1);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-outline {
    background: transparent;
    color: #475569;
    border: 1px solid #cbd5e1;
    padding: 12px 24px;
    border-radius: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-outline:hover {
    background: #f8fafc;
    border-color: #94a3b8;
    transform: translateY(-1px);
  }
`}</style>
    </div>
  );
}