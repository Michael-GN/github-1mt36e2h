import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Clock, MapPin, User, Filter, Printer, Download } from 'lucide-react';
import { APIService } from '../utils/api';
import { LocalDBService } from '../utils/localdb';
import type { TimetableEntry, Field, Course } from '../types';

// Demo data for fallback
const getDemoTimetableData = (): TimetableEntry[] => [
  {
    id: '1',
    day: 'Monday',
    timeSlot: '08:00 - 10:00',
    course: 'Database Systems',
    field: 'Computer Science',
    level: 'Level 200',
    room: 'Lab 101',
    lecturer: 'Dr. Smith'
  },
  {
    id: '2',
    day: 'Monday',
    timeSlot: '10:00 - 12:00',
    course: 'Programming Fundamentals',
    field: 'Computer Science',
    level: 'Level 100',
    room: 'Room 205',
    lecturer: 'Prof. Wilson'
  },
  {
    id: '3',
    day: 'Tuesday',
    timeSlot: '08:00 - 10:00',
    course: 'Software Engineering Principles',
    field: 'Software Engineering',
    level: 'Level 200',
    room: 'Room 103',
    lecturer: 'Dr. Johnson'
  },
  {
    id: '4',
    day: 'Tuesday',
    timeSlot: '14:00 - 16:00',
    course: 'Web Development Basics',
    field: 'Information Technology',
    level: 'Level 100',
    room: 'Lab 201',
    lecturer: 'Ms. Davis'
  },
  {
    id: '5',
    day: 'Wednesday',
    timeSlot: '10:00 - 12:00',
    course: 'Network Fundamentals',
    field: 'Cybersecurity',
    level: 'Level 200',
    room: 'Room 301',
    lecturer: 'Prof. Brown'
  }
];

const getDemoFieldsData = (): Field[] => [
  { id: '1', name: 'Computer Science', code: 'CS', totalStudents: 320, levels: ['Level 100', 'Level 200'] },
  { id: '2', name: 'Software Engineering', code: 'SE', totalStudents: 280, levels: ['Level 100', 'Level 200'] },
  { id: '3', name: 'Information Technology', code: 'IT', totalStudents: 250, levels: ['Level 100', 'Level 200'] },
  { id: '4', name: 'Cybersecurity', code: 'CYB', totalStudents: 180, levels: ['Level 100', 'Level 200'] },
  { id: '5', name: 'Data Science', code: 'DS', totalStudents: 220, levels: ['Level 100', 'Level 200'] }
];

const timeSlots = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00', // Break time
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00'
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function Timetable() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    day: '',
    timeSlot: '',
    course: '',
    field: '',
    level: '',
    room: '',
    lecturer: ''
  });

  useEffect(() => {
    loadTimetableData();
    loadFieldsData();
  }, []);

  const loadTimetableData = async () => {
    try {
      setLoading(true);
      setError(null);

      let timetableData;
      try {
        timetableData = await APIService.getTimetable();
      } catch (apiError) {
        timetableData = LocalDBService.getCachedData('rollcall_cached_timetable');
        
        if (!timetableData || timetableData.length === 0) {
          console.log('Using demo timetable data as fallback');
          timetableData = getDemoTimetableData();
        }
      }

      setTimetable(timetableData || []);
      LocalDBService.cacheData('rollcall_cached_timetable', timetableData);

    } catch (error) {
      console.error('Failed to load timetable:', error);
      setError('Failed to load timetable data.');
    } finally {
      setLoading(false);
    }
  };

  const loadFieldsData = async () => {
    try {
      let fieldsData;
      try {
        fieldsData = await APIService.getFields();
      } catch (apiError) {
        fieldsData = LocalDBService.getCachedData('rollcall_cached_fields');
        
        if (!fieldsData || fieldsData.length === 0) {
          console.log('Using demo fields data as fallback');
          fieldsData = getDemoFieldsData();
        }
      }

      setFields(fieldsData || []);
      
      if (!selectedField && fieldsData && fieldsData.length > 0) {
        setSelectedField(fieldsData[0].name);
      }
      
      LocalDBService.cacheData('rollcall_cached_fields', fieldsData);

    } catch (error) {
      console.error('Failed to load fields:', error);
    }
  };

  const handleAddEntry = () => {
    setShowAddForm(true);
    setFormData({
      day: '',
      timeSlot: '',
      course: '',
      field: selectedField,
      level: '',
      room: '',
      lecturer: ''
    });
  };

  const handleEditEntry = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      day: entry.day,
      timeSlot: entry.timeSlot,
      course: entry.course,
      field: entry.field,
      level: entry.level,
      room: entry.room,
      lecturer: entry.lecturer
    });
  };

  const checkTimeSlotConflict = (day: string, timeSlot: string, room: string, excludeId?: string) => {
    return timetable.find(entry => 
      entry.day === day &&
      entry.timeSlot === timeSlot &&
      entry.room === room &&
      entry.id !== excludeId
    );
  };

  const handleSaveEntry = async () => {
    if (!formData.day || !formData.timeSlot || !formData.course || !formData.field || !formData.level || !formData.room || !formData.lecturer) {
      setError('Please fill in all fields.');
      return;
    }

    const roomConflict = checkTimeSlotConflict(formData.day, formData.timeSlot, formData.room, editingEntry?.id);
    if (roomConflict) {
      setError(`Room conflict: ${formData.room} is already occupied at ${formData.day} ${formData.timeSlot} by ${roomConflict.course} (${roomConflict.field})`);
      return;
    }

    const fieldConflict = timetable.find(entry => 
      entry.field === formData.field &&
      entry.day === formData.day &&
      entry.timeSlot === formData.timeSlot &&
      entry.course !== formData.course &&
      entry.id !== editingEntry?.id
    );

    if (fieldConflict) {
      setError(`Field conflict: ${formData.field} already has a different class (${fieldConflict.course}) at ${formData.day} ${formData.timeSlot}. Only common courses can share time slots.`);
      return;
    }

    try {
      const entryData = {
        ...formData,
        id: editingEntry?.id || Date.now().toString()
      };

      if (editingEntry) {
        setTimetable(prev => prev.map(entry => 
          entry.id === editingEntry.id ? entryData : entry
        ));
      } else {
        setTimetable(prev => [...prev, entryData]);
      }

      try {
        if (editingEntry) {
          await APIService.updateTimetableEntry(entryData);
        } else {
          await APIService.addTimetableEntry(entryData);
        }
      } catch (apiError) {
        console.log('API save failed, data saved locally');
      }

      setEditingEntry(null);
      setShowAddForm(false);
      setFormData({
        day: '',
        timeSlot: '',
        course: '',
        field: selectedField,
        level: '',
        room: '',
        lecturer: ''
      });
      setError(null);

    } catch (error) {
      console.error('Failed to save entry:', error);
      setError('Failed to save timetable entry.');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) {
      return;
    }

    try {
      setTimetable(prev => prev.filter(entry => entry.id !== entryId));
      
      try {
        await APIService.deleteTimetableEntry(entryId);
      } catch (apiError) {
        console.log('API delete failed, entry removed locally');
      }

    } catch (error) {
      console.error('Failed to delete entry:', error);
      setError('Failed to delete timetable entry.');
    }
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setShowAddForm(false);
    setFormData({
      day: '',
      timeSlot: '',
      course: '',
      field: selectedField,
      level: '',
      room: '',
      lecturer: ''
    });
    setError(null);
  };

  const getEntriesForSlot = (day: string, timeSlot: string) => {
    return timetable.filter(entry => 
      entry.day === day && 
      entry.timeSlot === timeSlot && 
      entry.field === selectedField
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const isBreakTime = (timeSlot: string) => {
    return timeSlot === '13:00 - 14:00';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-black">Loading timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">
            Timetable Management
          </h1>
          <p className="text-black mt-1">
            Manage weekly class schedules for each field
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            disabled={!selectedField}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-black disabled:cursor-not-allowed transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleAddEntry}
            disabled={!selectedField}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-black disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Field Selection */}
      <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-black">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-black" />
          <label className="text-sm font-medium text-black">
            Select Field:
          </label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black"
          >
            <option value="">Choose a field</option>
            {fields.map(field => (
              <option key={field.id} value={field.name}>
                {field.name} ({field.code})
              </option>
            ))}
          </select>
          {selectedField && (
            <span className="text-sm text-black">
              Viewing timetable for {selectedField}
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-600 rounded-lg p-4">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingEntry) && (
        <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-black">
          <h3 className="text-lg font-medium text-black mb-4">
            {editingEntry ? 'Edit Timetable Entry' : `Add New Entry for ${selectedField}`}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Day
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black"
              >
                <option value="">Select Day</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Time Slot
              </label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData(prev => ({ ...prev, timeSlot: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black"
              >
                <option value="">Select Time Slot</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot} disabled={isBreakTime(slot)}>
                    {slot} {isBreakTime(slot) ? '(Break Time)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Course
              </label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black"
                placeholder="Enter course name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Field
              </label>
              <input
                type="text"
                value={formData.field}
                readOnly
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black"
              >
                <option value="">Select Level</option>
                <option value="Level 100">Level 100</option>
                <option value="Level 200">Level 200</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Room
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black"
                placeholder="Enter room number"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-black mb-2">
                Lecturer
              </label>
              <input
                type="text"
                value={formData.lecturer}
                onChange={(e) => setFormData(prev => ({ ...prev, lecturer: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black"
                placeholder="Enter lecturer name"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={handleSaveEntry}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Entry</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-6 py-2 text-black bg-white border-2 border-black hover:bg-black hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      {selectedField ? (
        <div className="bg-white rounded-lg shadow-sm border-2 border-black overflow-hidden print-container">
          {/* Print Header */}
          <div className="px-6 py-4 border-b-2 border-black print:block">
            <div className="flex items-center justify-between print:flex-col print:items-center print:space-y-4">
              <div className="print:text-center">
                <div className="flex items-center space-x-4 print:flex-col print:space-x-0 print:space-y-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center print:w-16 print:h-16">
                    <Clock className="w-6 h-6 text-white print:w-8 print:h-8" />
                  </div>
                  <div className="print:text-center">
                    <h3 className="text-lg font-semibold text-black print:text-xl">
                      Weekly Timetable - {selectedField}
                    </h3>
                    <p className="text-sm text-black print:text-base">
                      IME Business and Engineering School • Academic Year 2024-2025
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-black print:text-center">
                <p>Generated on: {new Date().toLocaleDateString()}</p>
                <p>Time: 08:00 - 13:00 | 14:00 - 17:00</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full print:text-sm">
              <thead className="bg-blue-600 text-white print:bg-blue-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-32 print:border print:border-black">
                    Time
                  </th>
                  {days.map(day => (
                    <th key={day} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider print:border print:border-black">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-black print:bg-white">
                {timeSlots.map(timeSlot => (
                  <tr key={timeSlot} className={isBreakTime(timeSlot) ? 'bg-red-50 print:bg-red-100' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black bg-blue-50 print:bg-blue-100 print:border print:border-black">
                      {timeSlot}
                      {isBreakTime(timeSlot) && (
                        <div className="text-xs text-red-600 print:text-red-800">
                          BREAK
                        </div>
                      )}
                    </td>
                    {days.map(day => {
                      const entries = getEntriesForSlot(day, timeSlot);
                      return (
                        <td key={`${day}-${timeSlot}`} className="px-6 py-4 align-top print:border print:border-black">
                          {isBreakTime(timeSlot) ? (
                            <div className="text-center text-red-600 font-medium print:text-red-800">
                              LUNCH BREAK
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {entries.map(entry => (
                                <div
                                  key={entry.id}
                                  className="bg-blue-50 border-2 border-blue-600 rounded-lg p-3 relative group print:bg-blue-100 print:border-blue-600"
                                >
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => handleEditEntry(entry)}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEntry(entry.id)}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="pr-8 print:pr-0">
                                    <div className="font-medium text-black text-sm print:text-black">
                                      {entry.course}
                                    </div>
                                    <div className="text-xs text-black mt-1 print:text-black">
                                      {entry.level}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2 text-xs text-black print:text-black">
                                      <div className="flex items-center space-x-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{entry.room}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <User className="w-3 h-3" />
                                        <span>{entry.lecturer}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Print Footer */}
          <div className="hidden print:block p-4 border-t-2 border-black text-center text-xs text-black">
            <p>IME Business and Engineering School - Timetable Management System</p>
            <p>For any changes or updates, contact the Academic Office</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center border-2 border-black">
          <Clock className="w-12 h-12 text-black mx-auto mb-4" />
          <p className="text-black">Please select a field to view its timetable.</p>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 0.5in;
            size: landscape;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}