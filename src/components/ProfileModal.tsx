import React, { useState } from 'react';
import { X, User, Mail, Phone, Save, Edit } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ProfileModalProps {
  user: User;
  onClose: () => void;
}

export default function ProfileModal({ user, onClose }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: '+1234567890',
    department: 'Computer Science',
    role: user.role,
    employeeId: 'EMP001'
  });

  const handleSave = () => {
    console.log('Saving profile data:', formData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-2 border-black">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black">
          <h2 className="text-xl font-bold text-black">
            Admin Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Profile Picture */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black disabled:bg-white disabled:text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black disabled:bg-white disabled:text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black disabled:bg-white disabled:text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black disabled:bg-white disabled:text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Role
              </label>
              <input
                type="text"
                value={formData.role}
                disabled
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Employee ID
              </label>
              <input
                type="text"
                value={formData.employeeId}
                disabled
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 text-black bg-white border-2 border-black hover:bg-black hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}