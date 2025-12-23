import { useState } from 'react';
import { X, Upload } from 'lucide-react';

export function ContentModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    type: 'course',
    title: '',
    category: '',
    description: '',
    duration: '',
    author: 'Admin User',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-gray-900">Create New Educational Content</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">Content Type *</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'course' })}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    formData.type === 'course'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📚</div>
                    <div className="text-gray-900">Course</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'lesson' })}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    formData.type === 'lesson'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🎥</div>
                    <div className="text-gray-900">Lesson</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'assessment' })}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    formData.type === 'assessment'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📝</div>
                    <div className="text-gray-900">Assessment</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter content title"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Subject *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Arabic Language">Arabic Language</option>
                  <option value="English Language">English Language</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Duration *</label>
                <input
                  type="text"
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 45 minutes or 12 hours"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter content description"
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Upload Files</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">Drag and drop files here or</p>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Browse Files
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PDF, DOCX, PPTX, MP4, MP3
                  </p>
                </div>
              </div>
            </div>
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
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Publish Content
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}