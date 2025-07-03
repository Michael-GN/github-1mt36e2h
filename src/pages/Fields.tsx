import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, BookOpen, Users } from 'lucide-react';
import { APIService } from '../utils/api';
import { LocalDBService } from '../utils/localdb';
import type { Field } from '../types';

export default function Fields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const fieldsData = await APIService.getFields();
      setFields(fieldsData || []);
      LocalDBService.cacheData('rollcall_cached_fields', fieldsData);
    } catch (error) {
      console.error('Failed to load fields:', error);
      setError('Failed to load fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    setShowAddField(true);
    setEditingField(null);
    setFieldForm({ name: '', code: '', description: '' });
    setError(null);
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setShowAddField(true);
    setFieldForm({
      name: field.name,
      code: field.code,
      description: field.description || ''
    });
    setError(null);
  };

  const handleSaveField = async () => {
    if (!fieldForm.name || !fieldForm.code) {
      setError('Field name and code are required.');
      return;
    }

    const existingField = fields.find(field => 
      field.code === fieldForm.code && field.id !== editingField?.id
    );

    if (existingField) {
      setError('A field with this code already exists.');
      return;
    }

    try {
      const fieldData = {
        ...fieldForm,
        id: editingField?.id || Date.now().toString(),
        totalStudents: editingField?.totalStudents || 0,
        levels: ['Level 100', 'Level 200']
      };

      if (editingField) {
        await APIService.updateField(fieldData);
        setFields(prev => prev.map(field => 
          field.id === editingField.id ? fieldData : field
        ));
      } else {
        await APIService.addField(fieldData);
        setFields(prev => [...prev, fieldData]);
      }

      setShowAddField(false);
      setEditingField(null);
      setFieldForm({ name: '', code: '', description: '' });
      setError(null);

    } catch (error) {
      console.error('Failed to save field:', error);
      setError('Failed to save field.');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
      return;
    }

    try {
      await APIService.deleteField(fieldId);
      setFields(prev => prev.filter(field => field.id !== fieldId));
    } catch (error) {
      console.error('Failed to delete field:', error);
      setError('Failed to delete field.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-red-500 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Field Management</h1>
            <p className="text-blue-100 mt-1">
              Manage academic fields and departments
            </p>
          </div>
          
          <button
            onClick={handleAddField}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors mt-4 sm:mt-0 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Field</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Add/Edit Field Form */}
      {showAddField && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingField ? 'Edit Field' : 'Add New Field'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Field Name *
              </label>
              <input
                type="text"
                value={fieldForm.name}
                onChange={(e) => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Computer Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Field Code *
              </label>
              <input
                type="text"
                value={fieldForm.code}
                onChange={(e) => setFieldForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., CS"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={fieldForm.description}
                onChange={(e) => setFieldForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Brief description"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-4">
            <button
              onClick={handleSaveField}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Field</span>
            </button>
            <button
              onClick={() => {
                setShowAddField(false);
                setEditingField(null);
                setFieldForm({ name: '', code: '', description: '' });
                setError(null);
              }}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading fields...</p>
          </div>
        ) : fields.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No fields added yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Add your first academic field to get started.</p>
          </div>
        ) : (
          fields.map((field) => (
            <div key={field.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{field.name}</h3>
                  <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded mt-1">
                    {field.code}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditField(field)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                    title="Edit Field"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                    title="Delete Field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {field.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{field.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">{field.totalStudents} students</span>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Levels: {field.levels.join(', ')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}