import React, { useState, useEffect } from 'react';
import { Search, Filter, Phone, Mail, User, BookOpen, Users, Edit, Plus, X, Save, Upload, Eye, ArrowLeft } from 'lucide-react';
import ImportStudentsModal from '../components/ImportStudentsModal';
import StudentAbsenteeHours from '../components/StudentAbsenteeHours';
import { APIService } from '../utils/api';
import { LocalDBService } from '../utils/localdb';
import type { Student, Field } from '../types';

interface FilterState {
  field: string;
  level: string;
  search: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    field: '',
    level: '',
    search: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAbsenteeHours, setShowAbsenteeHours] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingFieldStudents, setViewingFieldStudents] = useState<{field: string, level?: string} | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    matricule: '',
    field: '',
    level: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    photo: ''
  });

  useEffect(() => {
    loadStudentsData();
    loadFieldsData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, filters, viewingFieldStudents]);

  const loadStudentsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const studentsData = await APIService.getStudents();
      setStudents(studentsData || []);
      LocalDBService.cacheData('rollcall_cached_students', studentsData);

    } catch (error) {
      console.error('Failed to load students:', error);
      setError('Failed to load students data.');
    } finally {
      setLoading(false);
    }
  };

  const loadFieldsData = async () => {
    try {
      const fieldsData = await APIService.getFields();
      setFields(fieldsData || []);
      LocalDBService.cacheData('rollcall_cached_fields', fieldsData);

    } catch (error) {
      console.error('Failed to load fields:', error);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // If viewing specific field students, filter by that field first
    if (viewingFieldStudents) {
      filtered = filtered.filter(student => {
        const matchesField = student.field === viewingFieldStudents.field;
        const matchesLevel = !viewingFieldStudents.level || student.level === viewingFieldStudents.level;
        return matchesField && matchesLevel;
      });
    } else {
      // Apply regular filters
      if (filters.field) {
        filtered = filtered.filter(student => student.field === filters.field);
      }

      if (filters.level) {
        filtered = filtered.filter(student => student.level === filters.level);
      }
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm) ||
        student.matricule.toLowerCase().includes(searchTerm) ||
        student.parentName.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      field: '',
      level: '',
      search: '',
    });
    setViewingFieldStudents(null);
  };

  const handleViewFieldStudents = (fieldName: string, level?: string) => {
    setViewingFieldStudents({ field: fieldName, level });
    setFilters({ field: '', level: '', search: '' }); // Clear other filters
  };

  const handleCallParent = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber).catch(console.error);
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleEmailParent = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleAddStudent = () => {
    setShowAddForm(true);
    setEditingStudent(null);
    setFormData({
      name: '',
      matricule: '',
      field: viewingFieldStudents?.field || '',
      level: viewingFieldStudents?.level || '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      photo: ''
    });
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowAddForm(true);
    setFormData({
      name: student.name,
      matricule: student.matricule,
      field: student.field,
      level: student.level,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
      photo: student.photo || ''
    });
  };

  const handleSaveStudent = async () => {
    if (!formData.name || !formData.matricule || !formData.field || !formData.level || !formData.parentName || !formData.parentPhone) {
      setError('Please fill in all required fields.');
      return;
    }

    const existingStudent = students.find(student => 
      student.matricule === formData.matricule && 
      student.id !== editingStudent?.id
    );

    if (existingStudent) {
      setError('A student with this matricule already exists.');
      return;
    }

    try {
      const studentData = {
        ...formData,
        id: editingStudent?.id || Date.now().toString()
      };

      if (editingStudent) {
        await APIService.updateStudent(studentData);
        setStudents(prev => prev.map(student => 
          student.id === editingStudent.id ? studentData : student
        ));
      } else {
        await APIService.addStudent(studentData);
        setStudents(prev => [...prev, studentData]);
      }

      setShowAddForm(false);
      setEditingStudent(null);
      setFormData({
        name: '',
        matricule: '',
        field: '',
        level: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        photo: ''
      });
      setError(null);

    } catch (error) {
      console.error('Failed to save student:', error);
      setError('Failed to save student data.');
    }
  };

  const handleImportStudents = (importedStudents: any[]) => {
    setStudents(prev => [...prev, ...importedStudents]);
    setShowImportModal(false);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingStudent(null);
    setFormData({
      name: '',
      matricule: '',
      field: '',
      level: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      photo: ''
    });
    setError(null);
  };

  const getFieldStats = () => {
    return fields.map(field => {
      const fieldStudents = students.filter(student => student.field === field.name);
      return {
        ...field,
        actualStudents: fieldStudents.length,
        levels: ['Level 100', 'Level 200'].map(level => ({
          name: level,
          count: fieldStudents.filter(student => student.level === level).length
        }))
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading students...</p>
        </div>
      </div>
    );
  }

  if (showAbsenteeHours) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Absentee Hours</h1>
          <button
            onClick={() => setShowAbsenteeHours(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Students
          </button>
        </div>
        <StudentAbsenteeHours students={students} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center space-x-4">
              {viewingFieldStudents && (
                <button
                  onClick={() => setViewingFieldStudents(null)}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {viewingFieldStudents 
                    ? `${viewingFieldStudents.field} Students${viewingFieldStudents.level ? ` - ${viewingFieldStudents.level}` : ''}`
                    : 'Student Management'
                  }
                </h1>
                <p className="text-blue-100 mt-1">
                  {viewingFieldStudents 
                    ? `Viewing students in ${viewingFieldStudents.field}${viewingFieldStudents.level ? ` (${viewingFieldStudents.level})` : ''}`
                    : 'Manage student information and parent contacts'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            {!viewingFieldStudents && (
              <button
                onClick={() => setShowAbsenteeHours(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Absentee Hours</span>
              </button>
            )}
            
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            
            <button 
              onClick={handleAddStudent}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </div>

      {/* Field Statistics - Only show when not viewing specific field students */}
      {!viewingFieldStudents && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFieldStats().map((field) => (
            <div key={field.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {field.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {field.code}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {field.actualStudents}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    students
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {field.levels.map((level) => (
                  <div key={level.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{level.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{level.count}</span>
                      {level.count > 0 && (
                        <button
                          onClick={() => handleViewFieldStudents(field.name, level.name)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                          title={`View ${level.name} students`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleViewFieldStudents(field.name)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View All Students</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Add/Edit Student Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {editingStudent ? 'Edit Student' : 'Add New Student'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Student Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter student name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Matricule *
              </label>
              <input
                type="text"
                value={formData.matricule}
                onChange={(e) => setFormData(prev => ({ ...prev, matricule: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., CS200/001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Field *
              </label>
              <select
                value={formData.field}
                onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value, level: '' }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={!!viewingFieldStudents?.field}
              >
                <option value="">Select Field</option>
                {fields.map(field => (
                  <option key={field.id} value={field.name}>{field.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Level *
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={!formData.field || !!viewingFieldStudents?.level}
              >
                <option value="">Select Level</option>
                <option value="Level 100">Level 100</option>
                <option value="Level 200">Level 200</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Parent Name *
              </label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter parent name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Parent Phone *
              </label>
              <input
                type="tel"
                value={formData.parentPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Parent Email
              </label>
              <input
                type="email"
                value={formData.parentEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="parent@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photo URL
              </label>
              <input
                type="url"
                value={formData.photo}
                onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-8">
            <button
              onClick={handleSaveStudent}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Save Student</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students by name, matricule, or parent name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredStudents.length} of {students.length} students
            {viewingFieldStudents && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200">
                {viewingFieldStudents.field}{viewingFieldStudents.level && ` - ${viewingFieldStudents.level}`}
              </span>
            )}
          </span>
          
          {!viewingFieldStudents && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          )}
        </div>

        {/* Filters - Only show when not viewing specific field students */}
        {showFilters && !viewingFieldStudents && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filter Students</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field
                </label>
                <select
                  value={filters.field}
                  onChange={(e) => handleFilterChange('field', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Fields</option>
                  {fields.map(field => (
                    <option key={field.id} value={field.name}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Level
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Levels</option>
                  <option value="Level 100">Level 100</option>
                  <option value="Level 200">Level 200</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-4">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-start space-x-4">
              <img
                src={student.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                alt={student.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-600"
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {student.matricule}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleEditStudent(student)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen className="w-4 h-4" />
                    <span>{student.field}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{student.level}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Parent Contact
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">{student.parentName}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{student.parentPhone}</span>
                  </div>
                  <button
                    onClick={() => handleCallParent(student.parentPhone)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                    title="Call Parent"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
                
                {student.parentEmail && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white truncate">{student.parentEmail}</span>
                    </div>
                    <button
                      onClick={() => handleEmailParent(student.parentEmail!)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                      title="Email Parent"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No students found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {viewingFieldStudents
              ? `No students found in ${viewingFieldStudents.field}${viewingFieldStudents.level ? ` - ${viewingFieldStudents.level}` : ''}.`
              : filters.search || filters.field || filters.level
              ? 'Try adjusting your search criteria or filters.'
              : 'No students have been added yet.'}
          </p>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportStudentsModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportStudents}
          availableFields={fields.map(f => f.name)}
        />
      )}
    </div>
  );
}