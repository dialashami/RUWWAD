import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AssignmentManagement.css';

function AssignmentManagement({ onNavigate }) { // إضافة onNavigate كـ prop
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [instructionFile, setInstructionFile] = useState(null);

  // States للنوافذ المنبثقة الجديدة
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradingMode, setGradingMode] = useState(''); // 'single' or 'bulk'

  // بيانات الواجبات
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // Helper to get teacher ID from token or localStorage
  const getTeacherId = () => {
    let teacherId = null;
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        teacherId = parsed?._id || parsed?.id || null;
      }
    } catch {
      // ignore parsing errors
    }

    // Fallback: decode from JWT token
    if (!teacherId) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const [, payloadBase64] = token.split('.') || [];
          if (payloadBase64) {
            const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadJson);
            teacherId = payload.userId || payload._id || payload.id || null;
          }
        } catch {
          // ignore decoding errors
        }
      }
    }
    return teacherId;
  };

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

  // Fetch assignments from backend on mount
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoadingAssignments(false);
          return;
        }

        const teacherId = getTeacherId();
        const url = teacherId
          ? `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/assignments?teacher=${teacherId}`
          : `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/assignments`;

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error('Failed to fetch assignments:', res.status);
          setLoadingAssignments(false);
          return;
        }

        const data = await res.json();
        console.log('Assignments received:', data);

        if (Array.isArray(data)) {
          const mapped = data.map((a) => ({
            id: a._id || a.id,
            title: a.title || 'Untitled Assignment',
            subject: a.subject || 'Subject',
            grade: a.grade || 'All Grades',
            dueDate: a.dueDate ? a.dueDate.split('T')[0] : '',
            displayDate: a.dueDate
              ? new Date(a.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'No date',
            totalStudents: a.totalStudents || 0,
            submitted: a.submitted || (a.submissions?.length || 0),
            graded: a.graded || (a.submissions?.filter(s => s.isGraded).length || 0),
            status: a.status || 'upcoming',
            lastEdited: formatTimeAgo(a.updatedAt),
            description: a.description || 'No description provided.',
            points: a.points || 100,
            passingScore: a.passingScore || 60,
            instructions: a.description || '',
            instructionsFileName: a.instructionsFileName || null,
            instructionsFileUrl: a.instructionsFileUrl || null,
          }));
          setAssignments(mapped);
        }
      } catch (err) {
        console.error('Error fetching assignments:', err);
      } finally {
        setLoadingAssignments(false);
      }
    };

    fetchAssignments();
  }, []);

  // بيانات الطلاب - dynamic from API
  const [students, setStudents] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Fetch submissions for a specific assignment
  const fetchSubmissions = async (assignmentId) => {
    setLoadingSubmissions(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoadingSubmissions(false);
        return;
      }

      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/assignments/${assignmentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error('Failed to fetch assignment submissions:', res.status);
        setLoadingSubmissions(false);
        return;
      }

      const data = await res.json();
      console.log('Assignment with submissions:', data);

      // Map submissions to student format
      if (data.submissions && Array.isArray(data.submissions)) {
        const mappedStudents = data.submissions.map((sub, index) => {
          // Determine file name
          let displayFileName = sub.fileName;
          if (!displayFileName && sub.file) {
            // If it's a base64 data URL, we can't extract filename from it
            if (sub.file.startsWith('data:')) {
              displayFileName = 'Submitted File';
            } else {
              displayFileName = sub.file.split('/').pop();
            }
          }
          
          return {
            id: sub._id || sub.student?._id || index + 1,
            studentId: sub.student?._id || sub.student,
            name: sub.student?.firstName && sub.student?.lastName 
              ? `${sub.student.firstName} ${sub.student.lastName}`
              : sub.student?.firstName || sub.studentName || `Student ${index + 1}`,
            submitted: true,
            grade: sub.grade || null,
            feedback: sub.feedback || '',
            comment: sub.comment || '',
            submittedDate: sub.submittedAt 
              ? new Date(sub.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
              : 'Unknown',
            file: sub.file || null,
            fileName: displayFileName,
            fileUrl: sub.file || null,
            isGraded: sub.isGraded || false
          };
        });
        setStudents(mappedStudents);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setStudents([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Download a single student's submission file
  const handleDownloadFile = async (student) => {
    if (!student.fileUrl && !student.file) {
      alert('No file available for download');
      return;
    }
    
    const fileUrl = student.fileUrl || student.file;
    const fileName = student.fileName || `${student.name.replace(/\s+/g, '_')}_submission`;
    
    try {
      // If it's a data URL (base64), convert and download
      if (fileUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // If it's a regular URL, fetch and download
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      // Fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
  };

  // Download all submitted files as individual downloads
  const handleDownloadAllFiles = async () => {
    const submittedStudents = students.filter(s => s.submitted && (s.fileUrl || s.file));
    
    if (submittedStudents.length === 0) {
      alert('No files available for download');
      return;
    }
    
    const confirmDownload = window.confirm(
      `This will download ${submittedStudents.length} file(s). Continue?`
    );
    
    if (!confirmDownload) return;
    
    // Download each file with a small delay to prevent browser blocking
    for (let i = 0; i < submittedStudents.length; i++) {
      const student = submittedStudents[i];
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between downloads
      handleDownloadFile(student);
    }
  };

  // بيانات النموذج
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: '',
    universityMajor: '',
    dueDate: '',
    totalStudents: 0,
    points: 100,
    passingScore: 60,
    instructions: '',
    status: 'upcoming'
  });

  const [loadingStudentCount, setLoadingStudentCount] = useState(false);

  // Fetch student count by grade
  const fetchStudentCount = async (grade, universityMajor = null) => {
    if (!grade) {
      setFormData(prev => ({ ...prev, totalStudents: 0 }));
      return;
    }
    
    setLoadingStudentCount(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/users/student-count?grade=${encodeURIComponent(grade)}`;
      
      if (grade === 'University' && universityMajor) {
        url += `&universityMajor=${encodeURIComponent(universityMajor)}`;
      }
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, totalStudents: data.count }));
      }
    } catch (error) {
      console.error('Error fetching student count:', error);
    } finally {
      setLoadingStudentCount(false);
    }
  };

  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: ''
  });

  const [bulkGradeData, setBulkGradeData] = useState({
    score: '',
    feedback: ''
  });

  // ✅ إزالة handleNavigation القديم واستخدام onNavigate مباشرة
  const handleNavigation = (page) => {
    onNavigate(page); // استخدام الـ prop من TeacherHome
  };

  // معالجة تغيير الحقول
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Fetch student count when grade changes
    if (name === 'grade') {
      if (value === 'University') {
        // Wait for universityMajor to be selected
        setFormData(prev => ({ ...prev, totalStudents: 0, universityMajor: '' }));
      } else {
        fetchStudentCount(value);
      }
    }
    
    // Fetch student count when universityMajor changes (for university grade)
    if (name === 'universityMajor' && formData.grade === 'University') {
      fetchStudentCount('University', value);
    }
  };

  // معالجة تغيير التقدير الفردي
  const handleGradeChange = (e) => {
    const { name, value } = e.target;
    setGradeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // معالجة تغيير التقدير الجماعي
  const handleBulkGradeChange = (e) => {
    const { name, value } = e.target;
    setBulkGradeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // فتح نافذة المشاهدات
  const handleViewSubmissions = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsModal(true);
    // Fetch submissions from backend
    fetchSubmissions(assignment.id);
  };

  // فتح نافذة التقدير الفردي
  const handleGradeStudent = (assignment, student) => {
    setSelectedAssignment(assignment);
    setSelectedStudent(student);
    setGradingMode('single');
    setGradeData({
      score: student.grade || '',
      feedback: 'Good work! Keep it up.'
    });
    setShowGradeModal(true);
  };

  // فتح نافذة التقدير الجماعي
  const handleBulkGrade = (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedStudent(null);
    setGradingMode('bulk');
    setBulkGradeData({
      score: '',
      feedback: 'Good work everyone!'
    });
    setShowGradeModal(true);
  };

// فتح نافذة التعديل
const handleEdit = (assignment) => {
  setSelectedAssignment(assignment);

  setFormData({
    title: assignment.title,
    subject: assignment.subject,
    grade: assignment.grade,
    universityMajor: assignment.universityMajor || '',
    dueDate: assignment.dueDate,
    totalStudents: assignment.totalStudents,
    points: assignment.points,
    passingScore: assignment.passingScore,
    instructions: assignment.instructionsFileName || assignment.instructions || '',
    status: assignment.status
  });

  // Fetch current student count for this grade
  if (assignment.grade === 'University' && assignment.universityMajor) {
    fetchStudentCount(assignment.grade, assignment.universityMajor);
  } else if (assignment.grade) {
    fetchStudentCount(assignment.grade);
  }

  setInstructionFile(null);
  setShowEditModal(true);
};



  // فتح/إغلاق قائمة المزيد
  const toggleMoreMenu = (assignmentId) => {
    setShowMoreMenu(showMoreMenu === assignmentId ? null : assignmentId);
  };

  // إغلاق جميع النوافذ
  const closeAllModals = () => {
    setShowCreateModal(false);
    setShowSubmissionsModal(false);
    setShowGradeModal(false);
    setShowEditModal(false);
    setShowMoreMenu(null);
    setSelectedAssignment(null);
    setSelectedStudent(null);
    setGradingMode('');
  };

const handleSaveEdit = async () => {
  if (!formData.title || !formData.subject || !formData.grade || !formData.dueDate) {
    alert("Please fill in all required fields (*)");
    return;
  }

  const token = localStorage.getItem('token');
  
  // Prepare update data for backend
  const updateData = {
    title: formData.title,
    subject: formData.subject,
    grade: formData.grade,
    dueDate: formData.dueDate,
    totalStudents: parseInt(formData.totalStudents),
    points: parseInt(formData.points),
    passingScore: parseInt(formData.passingScore),
    status: formData.status,
    description: formData.instructions || selectedAssignment.description,
  };

  // If new PDF file selected, add file info
  if (instructionFile) {
    updateData.instructionsFileName = instructionFile.name;
    // Note: For actual file upload, you'd need to implement file upload to server
  }

  try {
    // Call backend API to update assignment
    if (token && selectedAssignment.id) {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to update assignment:', res.status, errorData);
        throw new Error(errorData.message || 'Failed to update assignment');
      }

      const updated = await res.json();
      console.log('Assignment updated:', updated);
    }

    // Update local state
    const updatedAssignments = assignments.map((assignment) => {
      if (assignment.id !== selectedAssignment.id) return assignment;

      const baseUpdated = {
        ...assignment,
        title: formData.title,
        subject: formData.subject,
        grade: formData.grade,
        dueDate: formData.dueDate,
        displayDate: new Date(formData.dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        totalStudents: parseInt(formData.totalStudents),
        points: parseInt(formData.points),
        passingScore: parseInt(formData.passingScore),
        status: formData.status,
        lastEdited: 'just now',
      };

      if (!instructionFile) {
        return {
          ...baseUpdated,
          instructions: assignment.instructions,
          instructionsFileName: assignment.instructionsFileName,
          instructionsFileUrl: assignment.instructionsFileUrl,
          description: assignment.description,
        };
      }

      const newFileUrl = URL.createObjectURL(instructionFile);
      return {
        ...baseUpdated,
        instructions: instructionFile.name,
        instructionsFileName: instructionFile.name,
        instructionsFileUrl: newFileUrl,
        description: instructionFile.name,
      };
    });

    setAssignments(updatedAssignments);
    setInstructionFile(null);
    closeAllModals();
  } catch (err) {
    console.error('Error updating assignment:', err);
    alert('Could not update assignment. Please try again.');
  }
};


// حفظ التقدير الفردي
const handleSaveGrade = async () => {
  if (!gradeData.score) {
    alert("Please enter a score");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (token && selectedAssignment && selectedStudent) {
      // Call backend API to grade submission
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/assignments/${selectedAssignment.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submissionId: selectedStudent.id,
          grade: parseInt(gradeData.score),
          feedback: gradeData.feedback || '',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to save grade. Please try again.');
        return;
      }
    }

    // تحديث بيانات الطالب
    const updatedStudents = students.map(student =>
      student.id === selectedStudent.id
        ? { ...student, grade: parseInt(gradeData.score), isGraded: true }
        : student
    );

    setStudents(updatedStudents);

    // تحديث عدد الواجبات المصححة
    const gradedCount = updatedStudents.filter(s => s.submitted && s.grade !== null).length;
    const updatedAssignments = assignments.map(assignment =>
      assignment.id === selectedAssignment.id
        ? { ...assignment, graded: gradedCount }
        : assignment
    );

    setAssignments(updatedAssignments);
    alert('Grade saved successfully!');
    closeAllModals();
  } catch (err) {
    console.error('Error saving grade:', err);
    alert('Error saving grade. Please try again.');
  }
};

// حفظ التقدير الجماعي
const handleSaveBulkGrade = () => {
  if (!bulkGradeData.score) {
    alert("Please enter a score");
    return;
  }

  // تحديث جميع الطلاب الذين سلموا ولم يتم تقييمهم بعد
  const updatedStudents = students.map(student =>
    student.submitted && student.grade === null
      ? { ...student, grade: parseInt(bulkGradeData.score) }
      : student
  );

  setStudents(updatedStudents);

  // تحديث عدد الواجبات المصححة
  const gradedCount = updatedStudents.filter(s => s.submitted && s.grade !== null).length;
  const updatedAssignments = assignments.map(assignment =>
    assignment.id === selectedAssignment.id
      ? { ...assignment, graded: gradedCount }
      : assignment
  );

  setAssignments(updatedAssignments);
  closeAllModals();
};

  // حذف الواجب
  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      const token = localStorage.getItem('token');
      
      try {
        // Call backend API to delete assignment
        if (token && assignmentId) {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/assignments/${assignmentId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('Failed to delete assignment:', res.status, errorData);
            throw new Error(errorData.message || 'Failed to delete assignment');
          }

          console.log('Assignment deleted successfully');
        }

        // Update local state
        const updatedAssignments = assignments.filter(assignment => assignment.id !== assignmentId);
        setAssignments(updatedAssignments);
        setShowMoreMenu(null);
      } catch (err) {
        console.error('Error deleting assignment:', err);
        alert('Could not delete assignment. Please try again.');
      }
    }
  };

const handleCreateAssignment = async () => {
  // ✅ تحقق من الحقول الإلزامية
  if (!formData.title || !formData.subject || !formData.grade || !formData.dueDate) {
    alert("Please fill in all required fields (*)");
    return;
  }

  // ✅ لازم يكون في ملف PDF مرفق للتعليمات
  if (!instructionFile) {
    alert("Please attach a PDF file for the assignment instructions.");
    return;
  }

  setIsCreating(true);

  const token = localStorage.getItem('token');
  const teacherId = getTeacherId();

  // نعمل URL مؤقت للـ PDF (للـ preview داخل الفرونت)
  const fileUrl = URL.createObjectURL(instructionFile);

  try {
    // Prepare data for backend
    const assignmentData = {
      title: formData.title,
      subject: formData.subject,
      grade: formData.grade,
      universityMajor: formData.universityMajor,
      dueDate: formData.dueDate,
      totalStudents: parseInt(formData.totalStudents),
      points: parseInt(formData.points),
      passingScore: parseInt(formData.passingScore),
      status: formData.status,
      description: instructionFile.name,
      instructionsFileName: instructionFile.name,
      teacher: teacherId,
    };

    let createdId = Date.now();

    // Call backend API to create assignment
    if (token && teacherId) {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignmentData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to create assignment:', res.status, errorData);
        throw new Error(errorData.message || 'Failed to create assignment');
      }

      const created = await res.json();
      console.log('Assignment created:', created);
      createdId = created._id || created.id || createdId;
    }

    const newAssignment = {
      id: createdId,
      title: formData.title,
      subject: formData.subject,
      grade: formData.grade,
      universityMajor: formData.universityMajor,
      dueDate: formData.dueDate,
      displayDate: new Date(formData.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      totalStudents: parseInt(formData.totalStudents),
      submitted: 0,
      graded: 0,
      status: formData.status,
      lastEdited: "just now",
      description: instructionFile.name,
      points: parseInt(formData.points),
      passingScore: parseInt(formData.passingScore),
      instructions: instructionFile.name,
      instructionsFileName: instructionFile.name,
      instructionsFileUrl: fileUrl,
    };

    setAssignments([newAssignment, ...assignments]);
    closeAllModals();

    // إعادة تعيين النموذج
    setFormData({
      title: '',
      subject: '',
      grade: '',
      universityMajor: '',
      dueDate: '',
      totalStudents: 62,
      points: 100,
      passingScore: 60,
      instructions: '',
      status: 'upcoming'
    });
    setCharCount(0);
    setInstructionFile(null);
  } catch (err) {
    console.error('Error creating assignment:', err);
    alert('Could not create assignment. Please try again.');
  } finally {
    setIsCreating(false);
  }
};


  // فلترة الواجبات حسب التبويب والبحث
  const filteredAssignments = assignments.filter(assignment => {
    const matchesTab = activeTab === 'All' ? true : assignment.status === activeTab.toLowerCase();
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // الحصول على تاريخ الغد للتحديد الافتراضي
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="assignment-management">
      {/* ✅ إزالة السايدبار تماماً */}

      {/* المحتوى الرئيسي فقط */}
      <div className="assignment-main-content">
        <div className="content-container">

          {/* الرأس */}
          <div className="assignment-header">
            <div className="header-content">
              <div className="header-text">
                <h1>Assignment Management</h1>
                <p>Create, grade, and monitor student assignments</p>
              </div>
              
            </div>

       
          </div>

          {/* شريط الإجراءات */}
          <div className="action-bar">
            <button className="create-assignment-btn" onClick={() => setShowCreateModal(true)}>
              <i className="fas fa-plus"></i>
              Create New Assignment
            </button>
            <div className="filter-options">
              <select className="filter-select" value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
                <option>All</option>
                <option>Active</option>
                <option>Upcoming</option>
                <option>Closed</option>
              </select>
              <button className="filter-btn">
                <i className="fas fa-filter"></i>
                Filter
              </button>
            </div>
          </div>

          {/* التبويبات */}
          <div className="assignment-tabs">
            {['All', 'Active', 'Upcoming', 'Closed'].map(tab => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                <span className="tab-count">
                  {tab === 'All' ? assignments.length :
                    assignments.filter(a => a.status === tab.toLowerCase()).length}
                </span>
              </button>
            ))}
          </div>

          {/* شبكة الواجبات */}
          <div className="assignments-grid">
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="assignment-card">
                  <div className="assignment-card-header">
                    <div className="assignment-header-section">
                      <div className="assignment-title-section">
                        <h3>{assignment.title}</h3>
                        <p className="assignment-subject-grade">
                          <i className="fas fa-book-open"></i>
                          {assignment.subject} • {assignment.grade}
                        </p>
                      </div>
                      <span className={`status-badge ${assignment.status}`}>
                        <i className={`fas ${
                          assignment.status === 'active' ? 'fa-play-circle' :
                            assignment.status === 'upcoming' ? 'fa-clock' :
                              'fa-check-circle'
                        }`}></i>
                        {assignment.status}
                      </span>
                    </div>
                  </div>

                  <div className="assignment-description">{assignment.description}</div>

                  <div className="assignment-details">
                    <div className="detail-item">
                      <i className="fas fa-calendar-day"></i>
                      <span>Due: {assignment.displayDate}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-users"></i>
                      <span>{assignment.totalStudents} Students</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-edit"></i>
                      <span>Edited {assignment.lastEdited}</span>
                    </div>
                  </div>

                  <div className="assignment-progress">
                    <div className="progress-section">
                      <div className="progress-header">
                        <span>Submission Progress</span>
                        <span>{assignment.submitted}/{assignment.totalStudents}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill submitted"
                          style={{ width: `${(assignment.submitted / assignment.totalStudents) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="progress-section">
                      <div className="progress-header">
                        <span>Grading Progress</span>
                        <span>{assignment.graded}/{assignment.submitted || 1}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill graded"
                          style={{ width: `${(assignment.graded / (assignment.submitted || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="assignment-meta">
                    <div className="meta-item">
                      <i className="fas fa-paper-plane"></i>
                      <span>{assignment.submitted} Submitted</span>
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-check-circle"></i>
                      <span>{assignment.graded} Graded</span>
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-clock"></i>
                      <span>{assignment.totalStudents - assignment.submitted} Pending</span>
                    </div>
                  </div>

                  <div className="assignment-actions">
                    <button 
                      className="action-btn view-submissions"
                      onClick={() => handleViewSubmissions(assignment)}
                    >
                      <i className="fas fa-eye"></i>
                      View Submissions
                    </button>
                    <button 
                      className="action-btn grade"
                      onClick={() => handleBulkGrade(assignment)}
                    >
                      <i className="fas fa-check-double"></i>
                      Grade
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(assignment)}
                    >
                      <i className="fas fa-edit"></i>
                      Edit
                    </button>
                    <div className="more-actions-container">
                      <button 
                        className="action-btn more"
                        onClick={() => toggleMoreMenu(assignment.id)}
                      >
                        <i className="fas fa-ellipsis-h"></i>
                      </button>
                      {showMoreMenu === assignment.id && (
                        <div className="more-menu">
                          <button onClick={() => handleViewSubmissions(assignment)}>
                            <i className="fas fa-eye"></i> View Submissions
                          </button>
                          <button onClick={() => handleBulkGrade(assignment)}>
                            <i className="fas fa-check-double"></i> Grade All
                          </button>
                          <button onClick={() => handleEdit(assignment)}>
                            <i className="fas fa-edit"></i> Edit Assignment
                          </button>
                          <button onClick={() => {
                            navigator.clipboard.writeText(assignment.title);
                            setShowMoreMenu(null);
                          }}>
                            <i className="fas fa-copy"></i> Copy Title
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-assignments">
                <i className="fas fa-tasks"></i>
                <h3>No assignments found</h3>
                <p>Try changing your search or filter criteria</p>
              </div>
            )}
          </div>

          {/* قسم تحميل المزيد */}
          <div className="load-more-section">
            <button className="load-more-btn">
              <i className="fas fa-redo"></i>
              Load More Assignments
            </button>
            <div className="pagination-info">
              Showing {filteredAssignments.length} of {assignments.length} assignments
            </div>
          </div>
        </div>
      </div>

      {/* نافذة إنشاء الواجب */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !isCreating && closeAllModals()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Assignment</h2>
            <div className="modal-form">
              <div className="form-group">
                <label data-required="*">Assignment Title</label>
                <input 
                  type="text" 
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter assignment title" 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label data-required="*">Subject</label>
                  <select 
                    name="subject"
                    className="form-select"
                    value={formData.subject}
                    onChange={handleInputChange}
                  >
                    <option value="">Select subject</option>
                    <option>Mathematics</option>
                    <option>English</option>
                    <option>Science</option>
                    <option>History</option>
                    <option>Biology</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>Arabic</option>
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

                <div className="form-group">
                  <label data-required="*">Grade</label>
                  <select 
                    name="grade"
                    className="form-select"
                    value={formData.grade}
                    onChange={handleInputChange}
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
              </div>

              {formData.grade === 'University' && (
                <div className="form-row">
                  <div className="form-group">
                    <label data-required="*">Specialization</label>
                    <select
                      name="universityMajor"
                      className="form-select"
                      value={formData.universityMajor}
                      onChange={handleInputChange}
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
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label data-required="*">Due Date</label>
                  <input 
                    type="date" 
                    name="dueDate"
                    className="form-input"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    min={getTomorrowDate()}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                  <span className={`status-preview ${formData.status}`}>
                    {formData.status}
                  </span>
                </div>
              </div>
 
 <div className="form-group">
  <label>Instructions (PDF)</label>

  {/* 🔹 عرض ملف الـ PDF الحالي لو موجود */}
  {selectedAssignment && selectedAssignment.instructionsFileUrl ? (
    <div style={{ marginBottom: '10px' }}>
      <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '6px' }}>
        Current file: <strong>{selectedAssignment.instructionsFileName}</strong>
      </p>

      {/* عرض PDF داخل iframe */}
      <iframe
        src={selectedAssignment.instructionsFileUrl}
        title="Instructions PDF"
        style={{
          width: '100%',
          height: '260px',
          borderRadius: '10px',
          border: '1px solid #e5e7eb'
        }}
      ></iframe>

      {/* رابط فتحه في تاب جديدة */}
      <a
        href={selectedAssignment.instructionsFileUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-block',
          marginTop: '6px',
          fontSize: '13px',
          color: '#2563eb',
          textDecoration: 'none',
          fontWeight: 500
        }}
      >
        Open PDF in new tab
      </a>
    </div>
  ) : (
    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
      No PDF attached for this assignment yet.
    </p>
  )}

  {/* 🔹 استبدال ملف الـ PDF بواحد جديد */}
  <div style={{ marginTop: '10px' }}>
    <label style={{ fontSize: '13px', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
      Replace PDF (optional)
    </label>
    <input
      type="file"
      accept="application/pdf"
      onChange={(e) => {
        const file = e.target.files?.[0] || null;
        setInstructionFile(file);

        setFormData(prev => ({
          ...prev,
          instructions: file ? file.name : prev.instructions
        }));
      }}
    />
    {instructionFile && (
      <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
        New file selected: <strong>{instructionFile.name}</strong>
      </p>
    )}
  </div>
</div>




              <div className="form-row">
                <div className="form-group">
                  <label>Total Points</label>
                  <input 
                    type="number" 
                    name="points"
                    className="form-input"
                    value={formData.points}
                    onChange={handleInputChange}
                    min="0"
                    max="1000"
                  />
                </div>

                <div className="form-group">
                  <label>Passing Score</label>
                  <input 
                    type="number" 
                    name="passingScore"
                    className="form-input"
                    value={formData.passingScore}
                    onChange={handleInputChange}
                    min="0"
                    max={formData.points}
                  />
                </div>

                <div className="form-group">
                  <label>Total Students {loadingStudentCount && <span style={{fontSize: '12px', color: '#666'}}>(loading...)</span>}</label>
                  <input 
                    type="number" 
                    name="totalStudents"
                    className="form-input"
                    value={formData.totalStudents}
                    readOnly
                    disabled
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                    title="Auto-calculated based on grade selection"
                  />
                  <small style={{color: '#666', fontSize: '11px'}}>Auto-calculated based on grade</small>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn" 
                  onClick={closeAllModals}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button 
                  className={`create-btn ${isCreating ? 'loading' : ''}`}
                  onClick={handleCreateAssignment}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة المشاهدات */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Submissions - {selectedAssignment.title}</h2>
            <div className="submissions-content">
              <div className="submissions-header">
                <div className="submission-stats">
                  <span>Total Students: {selectedAssignment.totalStudents}</span>
                  <span>Submitted: {selectedAssignment.submitted}</span>
                  <span>Graded: {selectedAssignment.graded}</span>
                </div>
                {/* Download All Button */}
                {students.filter(s => s.submitted && (s.fileUrl || s.file)).length > 0 && (
                  <button
                    onClick={handleDownloadAllFiles}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }}
                  >
                    <i className="fas fa-download"></i>
                    Download All Files ({students.filter(s => s.submitted && (s.fileUrl || s.file)).length})
                  </button>
                )}
              </div>
              
              <div className="students-list">
                <h3>Student Submissions</h3>
                {loadingSubmissions ? (
                  <div className="loading-submissions" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    Loading submissions...
                  </div>
                ) : students.length === 0 ? (
                  <div className="no-submissions" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No submissions yet for this assignment.
                  </div>
                ) : (
                  students.map(student => (
                    <div key={student.id} className="student-item">
                      <div className="student-info">
                        <span className="student-name">{student.name}</span>
                        <span className={`submission-status ${student.submitted ? 'submitted' : 'pending'}`}>
                          {student.submitted ? `Submitted on ${student.submittedDate}` : 'Not submitted'}
                        </span>
                        {/* Show file info if available */}
                        {student.submitted && (student.fileUrl || student.file) && (
                          <div style={{
                            marginTop: '6px',
                            padding: '8px 12px',
                            background: '#f0f9ff',
                            borderRadius: '6px',
                            border: '1px solid #bae6fd',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <i className="fas fa-file-alt" style={{ color: '#0284c7' }}></i>
                            <span style={{ 
                              fontSize: '0.85rem', 
                              color: '#0369a1',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {student.fileName || 'Submitted File'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="student-grade">
                        {student.grade ? (
                          <span className="grade-badge">{student.grade}/100</span>
                        ) : student.submitted ? (
                          <span className="grade-pending">Not graded</span>
                        ) : (
                          <span className="grade-pending">Not submitted</span>
                        )}
                      </div>
                      <div className="student-actions">
                        {student.submitted && (
                          <>
                            {(student.fileUrl || student.file) && (
                              <button 
                                className="action-btn download"
                                onClick={() => handleDownloadFile(student)}
                                title={`Download ${student.fileName || 'file'}`}
                                style={{
                                  background: '#10b981',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#059669';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = '#10b981';
                                }}
                              >
                                <i className="fas fa-download"></i>
                                Download
                              </button>
                            )}
                            <button 
                              className="action-btn grade"
                              onClick={() => handleGradeStudent(selectedAssignment, student)}
                              title="Grade submission"
                              style={{
                                background: '#3498db',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = '#3498db';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = '#3498db';
                              }}
                            >
                              <i className="fas fa-edit"></i>
                              Grade
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="modal-actions">
                <button className="cancel-btn" onClick={closeAllModals}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة التقدير */}
      {showGradeModal && selectedAssignment && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {gradingMode === 'single' && selectedStudent 
                ? `Grade - ${selectedStudent.name}` 
                : 'Grade All Submissions'}
            </h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Score *</label>
                <input 
                  type="number" 
                  name="score"
                  className="form-input"
                  value={gradingMode === 'single' ? gradeData.score : bulkGradeData.score}
                  onChange={gradingMode === 'single' ? handleGradeChange : handleBulkGradeChange}
                  min="0"
                  max="100"
                  placeholder="Enter score (0-100)"
                />
              </div>
              
              <div className="form-group">
                <label>Feedback</label>
                <textarea 
                  name="feedback"
                  className="form-textarea"
                  value={gradingMode === 'single' ? gradeData.feedback : bulkGradeData.feedback}
                  onChange={gradingMode === 'single' ? handleGradeChange : handleBulkGradeChange}
                  placeholder={
                    gradingMode === 'single' 
                      ? "Enter feedback for the student..." 
                      : "Enter general feedback for all students..."
                  }
                  rows="4"
                ></textarea>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={closeAllModals}>
                  Cancel
                </button>
                <button 
                  className="create-btn" 
                  onClick={gradingMode === 'single' ? handleSaveGrade : handleSaveBulkGrade}
                >
                  {gradingMode === 'single' ? 'Save Grade' : 'Apply to All Ungraded'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة التعديل - المحتوى الكامل */}
       {/* نافذة التعديل - المحتوى الكامل */}
{showEditModal && selectedAssignment && (
  <div className="modal-overlay" onClick={closeAllModals}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <h2>Edit Assignment</h2>
      <div className="modal-form">
        <div className="form-group">
          <label data-required="*">Assignment Title</label>
          <input
            type="text"
            name="title"
            className="form-input"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter assignment title"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label data-required="*">Subject</label>
            <select
              name="subject"
              className="form-select"
              value={formData.subject}
              onChange={handleInputChange}
            >
              <option value="">Select subject</option>
              <option>Mathematics</option>
              <option>English</option>
              <option>Science</option>
              <option>History</option>
              <option>Biology</option>
              <option>Physics</option>
              <option>Chemistry</option>
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

          <div className="form-group">
            <label data-required="*">Grade</label>
            <select
              name="grade"
              className="form-select"
              value={formData.grade}
              onChange={handleInputChange}
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
              <option>Unviersity</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label data-required="*">Due Date</label>
            <input
              type="date"
              name="dueDate"
              className="form-input"
              value={formData.dueDate}
              onChange={handleInputChange}
              min={getTomorrowDate()}
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
            <span className={`status-preview ${formData.status}`}>
              {formData.status}
            </span>
          </div>
        </div>

        {/* 🔹 PDF Instructions في التعديل */}
        <div className="form-group">
          <label>Instructions (PDF)</label>

          {/* عرض الملف الحالي لو موجود */}
          {selectedAssignment.instructionsFileUrl ? (
            <div style={{ marginBottom: '10px' }}>
              <p
                style={{
                  fontSize: '13px',
                  color: '#4b5563',
                  marginBottom: '6px',
                }}
              >
                Current file:{' '}
                <strong>
                  {selectedAssignment.instructionsFileName ||
                    selectedAssignment.instructions}
                </strong>
              </p>

              <iframe
                src={selectedAssignment.instructionsFileUrl}
                title="Instructions PDF"
                style={{
                  width: '100%',
                  height: '260px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                }}
              ></iframe>

              <a
                href={selectedAssignment.instructionsFileUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: '6px',
                  fontSize: '13px',
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Open PDF in new tab
              </a>
            </div>
          ) : (
            <p
              style={{
                fontSize: '13px',
                color: '#6b7280',
                marginBottom: '6px',
              }}
            >
              No PDF attached for this assignment yet.
            </p>
          )}

          {/* استبدال ملف الـ PDF بواحد جديد */}
          <div style={{ marginTop: '10px' }}>
            <label
              style={{
                fontSize: '13px',
                color: '#4b5563',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Replace PDF (optional)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setInstructionFile(file);

                setFormData((prev) => ({
                  ...prev,
                  instructions: file ? file.name : prev.instructions,
                }));
              }}
            />
            {instructionFile && (
              <p
                style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#6b7280',
                }}
              >
                New file selected: <strong>{instructionFile.name}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Total Points</label>
            <input
              type="number"
              name="points"
              className="form-input"
              value={formData.points}
              onChange={handleInputChange}
              min="0"
              max="1000"
            />
          </div>

          <div className="form-group">
            <label>Passing Score</label>
            <input
              type="number"
              name="passingScore"
              className="form-input"
              value={formData.passingScore}
              onChange={handleInputChange}
              min="0"
              max={formData.points}
            />
          </div>

          <div className="form-group">
            <label>Total Students {loadingStudentCount && <span style={{fontSize: '12px', color: '#666'}}>(loading...)</span>}</label>
            <input
              type="number"
              name="totalStudents"
              className="form-input"
              value={formData.totalStudents}
              readOnly
              disabled
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              title="Auto-calculated based on grade selection"
            />
            <small style={{color: '#666', fontSize: '11px'}}>Auto-calculated based on grade</small>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={closeAllModals}>
            Cancel
          </button>
          <button className="create-btn" onClick={handleSaveEdit}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default AssignmentManagement;