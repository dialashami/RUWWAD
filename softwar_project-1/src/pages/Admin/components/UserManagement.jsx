import { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Mail,
  Edit,
  Trash2,
  Eye,
  Upload,
  X,
  Phone,
  Award,
  BookOpen,
  TrendingUp,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE = 'http://localhost:3000/api';

// ==================== UserModal Component ====================
function UserModal({ type, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    grade: '',
    subject: '',
    children: 1,
    parent: '',
    department: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getTitle = () => {
    switch (type) {
      case 'students':
        return 'Add New Student';
      case 'teachers':
        return 'Add New Teacher';
      case 'parents':
        return 'Add New Parent';
      default:
        return 'Add New User';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-gray-900">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@domain.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="05xxxxxxxx"
              />
            </div>

            {type === 'students' && (
              <>
                <div>
                  <label className="block text-gray-700 mb-2">Grade Level *</label>
                  <select
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Grade</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                    <option value="University">University</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Parent Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.parent}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter parent name"
                  />
                </div>
              </>
            )}

            {type === 'teachers' && (
              <>
                <div>
                  <label className="block text-gray-700 mb-2">Subject *</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Arabic">Arabic Language</option>
                    <option value="English">English Language</option>
                    <option value="History">History</option>
                    <option value="Geography">Geography</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Department *</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Science Department"
                  />
                </div>
              </>
            )}

            {type === 'parents' && (
              <div>
                <label className="block text-gray-700 mb-2">Number of Children *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.children}
                  onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== UserDetailsModal Component ====================
function UserDetailsModal({ user, type, onClose, onSave, onSendMessage, onDelete, parentsList = [] }) {
  const [showCourses, setShowCourses] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(user);

  useEffect(() => {
    // Only update formData from user prop if not currently editing or saving
    if (!isEditing && !isSaving) {
      setFormData(user);
    }
  }, [user, isEditing, isSaving]);

  const handleChange = (field, value) => {
    // Convert numeric fields to numbers
    let processedValue = value;
    if (field === 'avgScore' || field === 'achievements' || field === 'rating') {
      processedValue = value === '' ? 0 : parseFloat(value);
    }
    setFormData((prev) => ({
      ...prev,
      [field]: processedValue,
    }));
  };

  const handleSave = async () => {
    console.log('handleSave clicked, formData:', formData);
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(formData);
        console.log('onSave completed successfully');
      } catch (error) {
        console.error('onSave error:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      console.log('onSave is not defined!');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  const handleSendMessageClick = () => {
    if (onSendMessage) {
      onSendMessage(formData);
    }
    onClose();
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-start gap-6 mb-8 pb-8 border-b border-gray-200">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl">
              {formData.name?.charAt(0)}
            </div>
            <div className="flex-1">
              {/* Name */}
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <h3 className="text-gray-900 mb-2">{formData.name}</h3>
              )}

              {/* Email + Phone */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    formData.email
                  )}
                </div>
                {formData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      formData.phone
                    )}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="mt-3">
                {isEditing ? (
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="px-3 py-1 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      formData.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {formData.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {type === 'students' && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Education Level</div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <select
                        value={formData.studentType || 'school'}
                        onChange={(e) => handleChange('studentType', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="school">School</option>
                        <option value="university">University</option>
                      </select>
                      {formData.studentType === 'university' ? (
                        <select
                          value={formData.universityMajor || ''}
                          onChange={(e) => handleChange('universityMajor', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Major</option>
                          <option value="Computer Engineering">Computer Engineering</option>
                          <option value="Architectural Engineering">Architectural Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                          <option value="Electrical Engineering">Electrical Engineering</option>
                          <option value="Industrial Engineering">Industrial Engineering</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Mechatronics Engineering">Mechatronics Engineering</option>
                          <option value="Chemical Engineering">Chemical Engineering</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <select
                          value={formData.schoolGrade || ''}
                          onChange={(e) => handleChange('schoolGrade', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Grade</option>
                          <option value="grade1">Grade 1</option>
                          <option value="grade2">Grade 2</option>
                          <option value="grade3">Grade 3</option>
                          <option value="grade4">Grade 4</option>
                          <option value="grade5">Grade 5</option>
                          <option value="grade6">Grade 6</option>
                          <option value="grade7">Grade 7</option>
                          <option value="grade8">Grade 8</option>
                          <option value="grade9">Grade 9</option>
                          <option value="grade10">Grade 10</option>
                          <option value="grade11">Grade 11</option>
                          <option value="grade12">Grade 12</option>
                        </select>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-900">
                      {formData.studentType === 'university' ? (
                        <span>University - {formData.universityMajor || 'No major specified'}</span>
                      ) : formData.studentType === 'school' ? (
                        <span>School - {formData.schoolGrade ? formData.schoolGrade.replace('grade', 'Grade ') : 'No grade specified'}</span>
                      ) : formData.schoolGrade ? (
                        <span>School - {formData.schoolGrade.replace('grade', 'Grade ')}</span>
                      ) : formData.universityMajor ? (
                        <span>University - {formData.universityMajor}</span>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Parent</div>
                  {isEditing ? (
                    <select
                      value={formData.parentId || ''}
                      onChange={(e) => {
                        const selectedParent = parentsList.find(p => p.id === e.target.value);
                        handleChange('parentId', e.target.value);
                        handleChange('parent', selectedParent ? selectedParent.name : '');
                        handleChange('parentEmail', selectedParent ? selectedParent.email : '');
                      }}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Parent</option>
                      {parentsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-gray-900">
                      {formData.parent ? (
                        <div>
                          <span className="font-medium">{formData.parent}</span>
                          {formData.parentEmail && (
                            <span className="text-sm text-gray-500 ml-2">({formData.parentEmail})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No parent linked</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Enrollment Date</div>
                  <div className="text-gray-900">{formData.enrollDate || 'N/A'}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Enrolled Courses</div>
                  <div className="text-gray-900">
                    <span className="font-medium">{formData.courses || 0}</span> courses
                    {formData.courseNames && formData.courseNames.length > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        {formData.courseNames.slice(0, 3).join(', ')}
                        {formData.courseNames.length > 3 && ` +${formData.courseNames.length - 3} more`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Average Score</div>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.avgScore || ''}
                      onChange={(e) => handleChange('avgScore', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-gray-900 flex items-center gap-2">
                      {formData.avgScore || 0}%
                      {formData.avgScore >= 80 && <span className="text-xs text-green-600">Excellent</span>}
                      {formData.avgScore >= 60 && formData.avgScore < 80 && <span className="text-xs text-yellow-600">Good</span>}
                      {formData.avgScore < 60 && formData.avgScore > 0 && <span className="text-xs text-red-600">Needs Improvement</span>}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Last Active</div>
                  <div className="text-gray-900">{formData.lastActive || 'N/A'}</div>
                </div>
              </>
            )}

            {type === 'teachers' && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Teacher Type</div>
                  <div className="text-gray-900">
                    {formData.teacherType ? {
                      'school': 'School Teacher',
                      'university': 'University Teacher'
                    }[formData.teacherType] || formData.teacherType : 'N/A'}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    {formData.teacherType === 'university' ? 'Specialization' : 'Subject'}
                  </div>
                  <div className="text-gray-900">
                    {formData.teacherType === 'university' ? (
                      formData.specialization || 'N/A'
                    ) : (
                      formData.subject ? {
                        'math': 'Mathematics',
                        'science': 'Science',
                        'english': 'English',
                        'history': 'History',
                        'arabic': 'Arabic',
                        'islamic': 'Islamic Studies',
                        'chemistry': 'Chemistry',
                        'physics': 'Physics',
                        'biology': 'Biology'
                      }[formData.subject] || formData.subject : 'N/A'
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Number of Courses</div>
                  <div className="text-gray-900">
                    {formData.courseCount || 0} courses
                    {formData.teacherCourseNames?.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.teacherCourseNames.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Number of Students</div>
                  <div className="text-gray-900">
                    {formData.students || 0} students
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Rating (out of 100)</div>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.rating || ''}
                      onChange={(e) => handleChange('rating', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-gray-900 flex items-center gap-2">
                      {formData.rating || 0}%
                      {formData.rating >= 80 && <span className="text-xs text-green-600">Excellent</span>}
                      {formData.rating >= 60 && formData.rating < 80 && <span className="text-xs text-yellow-600">Good</span>}
                      {formData.rating < 60 && formData.rating > 0 && <span className="text-xs text-red-600">Needs Improvement</span>}
                    </div>
                  )}
                </div>
              </>
            )}

            {type === 'parents' && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Number of Children</div>
                  <div className="text-gray-900">{formData.children || 0}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Last Login</div>
                  <div className="text-gray-900">{formData.lastLogin || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                  <div className="text-sm text-gray-600 mb-1">Children Names</div>
                  <div className="text-gray-900">
                    {formData.childrenNames?.length > 0 ? formData.childrenNames.join(' • ') : 'N/A'}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Performance Stats for Students */}
          {type === 'students' && (
            <div className="mb-8">
              <h3 className="text-gray-900 mb-4">Academic Performance</h3>

              <div className="flex gap-4">
                {/* Active Courses card */}
                <button
                  type="button"
                  onClick={() => setShowCourses((prev) => !prev)}
                  className="flex-1 bg-blue-50 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors"
                >
                  <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl text-gray-900 mb-1">
                    {formData.courseNames
                      ? formData.courseNames.length
                      : formData.courses}
                  </div>
                  <div className="text-sm text-gray-600">Active Courses</div>
                  <div className="mt-1 text-xs text-blue-700">
                    {showCourses ? 'Hide courses' : 'View courses'}
                  </div>
                </button>
              </div>

              {/* Courses list */}
              {showCourses && formData.courseNames && (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Enrolled Courses
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        All active courses for this student
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      {formData.courseNames.length} courses
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {formData.courseNames.map((course, index) => (
                      <div
                        key={course + index}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-400 w-6 text-right">
                            {index + 1}.
                          </span>
                          <span className="text-sm text-gray-900">
                            {course}
                          </span>
                        </div>
                        <span className="text-[11px] uppercase tracking-wide text-blue-600 font-semibold">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            {!isEditing ? (
              <>
                <button
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleSendMessageClick}
                >
                  Send Message
                </button>
                <button
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={() => onDelete(user.id)}
                >
                  Delete Account
                </button>
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Details
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== UserManagement Component ====================

export function UserManagement({ onOpenCommunication }) {
  const [activeTab, setActiveTab] = useState('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [users, setUsers] = useState({
    students: [],
    teachers: [],
    parents: [],
  });

  const token = localStorage.getItem('token');

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Fetch users from backend
  const fetchUsers = async () => {
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all user types
      const [studentsRes, teachersRes, parentsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users?role=student&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/users?role=teacher&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/users?role=parent&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [studentsData, teachersData, parentsData] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        parentsRes.json(),
      ]);

      // Debug: log teacher data from backend
      console.log('Teachers from backend:', teachersData.users?.map(t => ({ name: t.firstName, subject: t.subject, rating: t.rating })));

      // Transform backend data to match frontend format
      const transformUser = (user, role) => ({
        id: user._id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        phone: user.phone || '',
        status: user.isActive !== false ? 'active' : 'inactive',
        lastActive: formatRelativeTime(user.lastLogin || user.updatedAt),
        lastLogin: formatRelativeTime(user.lastLogin || user.updatedAt),
        createdAt: user.createdAt,
        // Student specific
        studentType: user.studentType || '', // 'school' or 'university'
        schoolGrade: user.schoolGrade || '', // e.g., 'grade10'
        universityMajor: user.universityMajor || '', // e.g., 'Computer Engineering'
        grade: user.grade || user.schoolGrade || user.studentType || '',
        parent: user.parentName || '', // Parent's full name from backend
        parentEmail: user.parentEmail || '',
        parentId: user.parentId || '',
        enrollDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        courses: user.enrolledCoursesCount || user.enrolledCourses?.length || 0, // Enrolled courses count from backend
        courseNames: user.enrolledCourses || [], // Course names from backend
        avgScore: user.avgScore || 0,
        achievements: user.achievements || 0,
        // Teacher specific
        teacherType: user.teacherType || '',
        subject: user.subject || '',
        specialization: user.specialization || '',
        courseCount: user.courseCount || 0, // Number of courses by teacher
        teacherCourseNames: user.courseNames || [], // Course names for teacher
        students: user.studentCount || 0, // Student count from backend
        rating: user.rating || 0,
        // Parent specific
        children: user.children?.length || 0,
        childrenNames: user.children?.map(c => `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || c) || [],
        occupation: user.occupation || '',
      });

      setUsers({
        students: (studentsData.users || []).map(u => transformUser(u, 'student')),
        teachers: (teachersData.users || []).map(u => transformUser(u, 'teacher')),
        parents: (parentsData.users || []).map(u => transformUser(u, 'parent')),
      });

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const tabs = [
    { id: 'students', label: 'Students', count: users.students.length },
    { id: 'teachers', label: 'Teachers', count: users.teachers.length },
    { id: 'parents', label: 'Parents', count: users.parents.length },
  ];

  const handleAddUser = async (userData) => {
    try {
      // Map activeTab to role
      const roleMap = { students: 'student', teachers: 'teacher', parents: 'parent' };
      const role = roleMap[activeTab];

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: userData.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ').slice(1).join(' ') || '',
          email: userData.email,
          password: 'defaultPassword123',
          role: role,
          phone: userData.phone,
          grade: userData.grade,
          subject: userData.subject,
          department: userData.department,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add user');
      }

      // Refresh users list
      await fetchUsers();
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding user:', err);
      alert(`Error adding user: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        alert('User deleted successfully!');
        await fetchUsers();
        // Close the modal if it's open
        setSelectedUser(null);
      } else {
        alert('Failed to delete user: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Error deleting user: ' + err.message);
    }
  };

  // PDF Export function
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const currentUsers = users[activeTab];
    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    
    // Add title
    doc.setFontSize(18);
    doc.text(`${tabName} Report`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total ${tabName}: ${currentUsers.length}`, 14, 36);

    // Define columns based on active tab
    let columns = [];
    let rows = [];

    if (activeTab === 'students') {
      columns = ['Name', 'Email', 'Phone', 'Grade', 'Status', 'Avg Score'];
      rows = currentUsers.map(user => [
        user.name || '',
        user.email || '',
        user.phone || '',
        user.grade || '',
        user.status || '',
        user.avgScore || 0
      ]);
    } else if (activeTab === 'teachers') {
      columns = ['Name', 'Email', 'Phone', 'Teacher Type', 'Subject/Specialization', 'Status', 'Rating'];
      rows = currentUsers.map(user => [
        user.name || '',
        user.email || '',
        user.phone || '',
        user.teacherType === 'school' ? 'School' : user.teacherType === 'university' ? 'University' : '',
        user.teacherType === 'university' ? (user.specialization || '') : (user.subject || ''),
        user.status || '',
        user.rating || 0
      ]);
    } else if (activeTab === 'parents') {
      columns = ['Name', 'Email', 'Phone', 'Children', 'Status'];
      rows = currentUsers.map(user => [
        user.name || '',
        user.email || '',
        user.phone || '',
        user.children || 0,
        user.status || ''
      ]);
    }

    // Generate table
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 42,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    // Save the PDF
    doc.save(`${tabName}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleToggleStatus = async (userId) => {
    const user = users[activeTab].find(u => u.id === userId);
    const newStatus = user?.status === 'active' ? 'inactive' : 'active';

    // Update local state immediately for responsiveness
    setUsers((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((u) =>
        u.id === userId
          ? { ...u, status: newStatus }
          : u
      ),
    }));

    // Try to update on backend
    try {
      await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus === 'active' }),
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    // Build request body
    const requestBody = {
      firstName: updatedUser.name?.split(' ')[0] || '',
      lastName: updatedUser.name?.split(' ').slice(1).join(' ') || '',
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      isActive: updatedUser.status === 'active',
      avgScore: parseFloat(updatedUser.avgScore) || 0,
      achievements: parseInt(updatedUser.achievements) || 0,
    };

    // Add role-specific fields
    if (updatedUser.studentType) requestBody.studentType = updatedUser.studentType;
    if (updatedUser.schoolGrade) requestBody.schoolGrade = updatedUser.schoolGrade;
    if (updatedUser.universityMajor) requestBody.universityMajor = updatedUser.universityMajor;
    if (updatedUser.parentId) requestBody.parent = updatedUser.parentId;
    if (updatedUser.subject) requestBody.subject = updatedUser.subject;
    // Teacher rating (out of 100)
    if (updatedUser.rating !== undefined) requestBody.rating = parseFloat(updatedUser.rating) || 0;

    try {
      const response = await fetch(`${API_BASE}/admin/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Changes saved successfully!');
        // Refresh the users list
        await fetchUsers();
      } else {
        alert('Failed to save: ' + (data.message || response.statusText));
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };

  const filteredUsers = users[activeTab].filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesGrade =
      filterGrade === 'all' || user.grade === filterGrade;

    return (
      matchesSearch &&
      matchesStatus &&
      (activeTab !== 'students' || matchesGrade)
    );
  });

  const exportToCSV = () => {
    alert('Exporting data to CSV file...');
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-gray-900 mb-2">User Management</h1>
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={fetchUsers}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">
            Manage all platform users and their permissions
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterGrade('all');
                }}
                className={`px-6 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {activeTab === 'students' && (
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Grades</option>
                <option value="Grade 9">Grade 1</option>
                <option value="Grade 10">Grade 2</option>
                <option value="Grade 11">Grade 3</option>
                <option value="Grade 12">Grade 4</option>
                <option value="Grade 9">Grade 5</option>
                <option value="Grade 10">Grade 6</option>
                <option value="Grade 11">Grade 7</option>
                <option value="Grade 12">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
                <option value="Grade 12">University</option>
              </select>
            )}
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredUsers.length} of {users[activeTab].length}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-gray-700">
                    {activeTab === 'students' && 'Grade'}
                    {activeTab === 'teachers' && 'Subject'}
                    {activeTab === 'parents' && 'Children'}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700">
                    {activeTab === 'students' && 'Last Active'}
                    {activeTab === 'teachers' && 'Students'}
                    {activeTab === 'parents' && 'Last Login'}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-900">{user.name}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {user.grade || user.subject || user.children}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          user.status === 'active'
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        } transition-colors`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active'
                              ? 'bg-green-600'
                              : 'bg-gray-600'
                          }`}
                        ></div>
                        {user.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {user.lastActive || user.students || user.lastLogin}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                         
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Send Message"
                          onClick={() =>
                            onOpenCommunication && onOpenCommunication(user)
                          }
                        >
                          <Mail className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <UserModal
          type={activeTab}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddUser}
        />
      )}

      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          type={activeTab}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          onSave={handleUpdateUser}
          onSendMessage={(userToMessage) => {
            if (onOpenCommunication) {
              onOpenCommunication(userToMessage);
            }
          }}
          onDelete={handleDeleteUser}
          parentsList={users.parents}
        />
      )}
    </div>
  );
}
