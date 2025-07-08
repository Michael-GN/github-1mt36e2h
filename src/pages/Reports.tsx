import React, { useState, useEffect } from 'react';
import { Filter, Calendar, Users, BookOpen, Phone, MessageCircle, Download, TrendingDown, X, AlertTriangle, Search, FileText, Clock, RefreshCw, ArrowLeft, Eye } from 'lucide-react';
import { APIService } from '../utils/api';
import { LocalDBService } from '../utils/localdb';
import type { AbsenteeRecord, Student, Field } from '../types';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  fieldName: string;
  level: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  courseTitle: string;
  studentName: string;
  matricule: string;
}

interface FieldReport {
  fieldName: string;
  totalAbsentees: number;
  students: AbsenteeRecord[];
  courses: string[];
}

export default function Reports() {
  const [absentees, setAbsentees] = useState<AbsenteeRecord[]>([]);
  const [fieldReports, setFieldReports] = useState<FieldReport[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    fieldName: '',
    level: '',
    reportType: 'daily',
    courseTitle: '',
    studentName: '',
    matricule: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Available options for filters
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [availableLevels] = useState([
    'Level 100', 'Level 200', 'Level 300', 'Level 400'
  ]);

  useEffect(() => {
    loadAbsenteeReport();
  }, [filters.reportType]);

  const generateDemoAbsenteeData = (): AbsenteeRecord[] => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const demoData: AbsenteeRecord[] = [
      {
        id: '1',
        studentName: 'Alice Johnson',
        matricule: 'CS200/001',
        fieldName: 'Computer Science',
        level: 'Level 200',
        courseTitle: 'Database Systems',
        courseCode: 'CS201',
        parentPhone: '+1234567890',
        parentName: 'John Johnson',
        parentEmail: 'john.johnson@email.com',
        date: today.toISOString(),
        sessionId: 'session-1',
        timeSlot: '08:00 - 10:00'
      },
      {
        id: '2',
        studentName: 'Bob Smith',
        matricule: 'SE200/002',
        fieldName: 'Software Engineering',
        level: 'Level 200',
        courseTitle: 'Software Architecture',
        courseCode: 'SE201',
        parentPhone: '+1234567891',
        parentName: 'Mary Smith',
        parentEmail: 'mary.smith@email.com',
        date: today.toISOString(),
        sessionId: 'session-2',
        timeSlot: '10:00 - 12:00'
      },
      {
        id: '3',
        studentName: 'Carol Davis',
        matricule: 'IT100/003',
        fieldName: 'Information Technology',
        level: 'Level 100',
        courseTitle: 'Web Development',
        courseCode: 'IT101',
        parentPhone: '+1234567892',
        parentName: 'Robert Davis',
        parentEmail: 'robert.davis@email.com',
        date: yesterday.toISOString(),
        sessionId: 'session-3',
        timeSlot: '14:00 - 16:00'
      },
      {
        id: '4',
        studentName: 'David Wilson',
        matricule: 'CYB200/004',
        fieldName: 'Cybersecurity',
        level: 'Level 200',
        courseTitle: 'Network Security',
        courseCode: 'CYB201',
        parentPhone: '+1234567893',
        parentName: 'Linda Wilson',
        parentEmail: 'linda.wilson@email.com',
        date: yesterday.toISOString(),
        sessionId: 'session-4',
        timeSlot: '08:00 - 10:00'
      },
      {
        id: '5',
        studentName: 'Emma Brown',
        matricule: 'DS100/005',
        fieldName: 'Data Science',
        level: 'Level 100',
        courseTitle: 'Statistics',
        courseCode: 'DS101',
        parentPhone: '+1234567894',
        parentName: 'Michael Brown',
        parentEmail: 'michael.brown@email.com',
        date: today.toISOString(),
        sessionId: 'session-5',
        timeSlot: '10:00 - 12:00'
      }
    ];

    return demoData;
  };

  const loadAbsenteeReport = async () => {
    setLoading(true);
    setError(null);
  
    try {
      console.log('Loading absentee report with filters:', filters);
      
      let reportData: AbsenteeRecord[] = [];
      
      try {
        // Try to get data from API first
        const filterParams = {
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
          report_type: filters.reportType,
          ...(filters.fieldName && { field: filters.fieldName }),
          ...(filters.level && { level: filters.level }),
          ...(filters.courseTitle && { course: filters.courseTitle }),
          ...(filters.studentName && { student_name: filters.studentName }),
          ...(filters.matricule && { matricule: filters.matricule }),
        };

        console.log('Fetching from API with params:', filterParams);
        const apiResponse = await APIService.getAbsenteeReport(filterParams);
        reportData = Array.isArray(apiResponse) ? apiResponse : [];
        console.log('API report data received:', reportData);
        
      } catch (apiError) {
        console.log('API failed, using demo data:', apiError);
        // Use demo data when API fails
        reportData = generateDemoAbsenteeData();
        setError('Using demo data - API connection failed. In production, this would show real attendance data.');
      }

      // Apply client-side filtering based on report type
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      switch (filters.reportType) {
        case 'daily':
          reportData = reportData.filter((record: AbsenteeRecord) => {
            const recordDate = new Date(record.date).toISOString().split('T')[0];
            return recordDate === todayStr;
          });
          break;
        case 'weekly':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          reportData = reportData.filter((record: AbsenteeRecord) => 
            new Date(record.date) >= startOfWeek
          );
          break;
        case 'monthly':
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          reportData = reportData.filter((record: AbsenteeRecord) => 
            new Date(record.date) >= startOfMonth
          );
          break;
        case 'custom':
          if (filters.dateFrom && filters.dateTo) {
            const fromDate = new Date(filters.dateFrom);
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);

            reportData = reportData.filter((record: AbsenteeRecord) => {
              const recordDate = new Date(record.date);
              return recordDate >= fromDate && recordDate <= toDate;
            });
          }
          break;
      }

      // Apply additional filters
      if (filters.fieldName) {
        reportData = reportData.filter((record: AbsenteeRecord) => 
          record.fieldName.toLowerCase().includes(filters.fieldName.toLowerCase())
        );
      }

      if (filters.level) {
        reportData = reportData.filter((record: AbsenteeRecord) => record.level === filters.level);
      }

      if (filters.courseTitle) {
        reportData = reportData.filter((record: AbsenteeRecord) => 
          record.courseTitle.toLowerCase().includes(filters.courseTitle.toLowerCase())
        );
      }

      if (filters.studentName) {
        reportData = reportData.filter((record: AbsenteeRecord) => 
          record.studentName.toLowerCase().includes(filters.studentName.toLowerCase())
        );
      }

      if (filters.matricule) {
        reportData = reportData.filter((record: AbsenteeRecord) => 
          record.matricule.toLowerCase().includes(filters.matricule.toLowerCase())
        );
      }

      console.log('Final filtered data:', reportData);
      setAbsentees(reportData);
      
      // Generate field reports
      const fieldReportsData = generateFieldReports(reportData);
      setFieldReports(fieldReportsData);
      
      // Update available options
      if (reportData.length > 0) {
        const fields = [...new Set(reportData.map((record: AbsenteeRecord) => record.fieldName))];
        const courses = [...new Set(reportData.map((record: AbsenteeRecord) => record.courseTitle))];
        setAvailableFields(fields);
        setAvailableCourses(courses);
        
        LocalDBService.cacheData('rollcall_cached_reports', reportData);
      }

    } catch (error) {
      console.error('Failed to load absentee report:', error);
      setError('Failed to load absentee report. Please try again.');
      setAbsentees([]);
      setFieldReports([]);
    } finally {
      setLoading(false);
    }
  };

  const generateFieldReports = (data: AbsenteeRecord[]): FieldReport[] => {
    const fieldMap = new Map<string, AbsenteeRecord[]>();
    
    data.forEach(record => {
      if (!fieldMap.has(record.fieldName)) {
        fieldMap.set(record.fieldName, []);
      }
      fieldMap.get(record.fieldName)!.push(record);
    });

    return Array.from(fieldMap.entries()).map(([fieldName, students]) => ({
      fieldName,
      totalAbsentees: students.length,
      students,
      courses: [...new Set(students.map(s => s.courseTitle))]
    })).sort((a, b) => b.totalAbsentees - a.totalAbsentees);
  };

  const handleRefreshReports = async () => {
    setRefreshing(true);
    await loadAbsenteeReport();
    setRefreshing(false);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadAbsenteeReport();
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      fieldName: '',
      level: '',
      reportType: 'daily',
      courseTitle: '',
      studentName: '',
      matricule: '',
    });
    setSelectedField(null);
  };

  const handleCallParent = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber).catch(console.error);
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleSendSMS = (phoneNumber: string, studentName: string) => {
    const message = `Hello, this is regarding ${studentName}'s attendance. Please contact the school for more information.`;
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `sms:${phoneNumber}?body=${encodedMessage}`;
  };

  const exportReport = () => {
    const dataToExport = selectedField 
      ? absentees.filter(record => record.fieldName === selectedField)
      : absentees;

    const csvContent = [
      ['Student Name', 'Matricule', 'Field', 'Level', 'Course', 'Parent Name', 'Parent Phone', 'Date'].join(','),
      ...dataToExport.map((record: AbsenteeRecord) => [
        record.studentName,
        record.matricule,
        record.fieldName,
        record.level,
        `${record.courseTitle} (${record.courseCode})`,
        record.parentName,
        record.parentPhone,
        new Date(record.date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `absentee-report-${selectedField || 'all-fields'}-${filters.reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getReportTitle = () => {
    const baseTitle = selectedField ? `${selectedField} - ` : '';
    switch (filters.reportType) {
      case 'daily':
        return `${baseTitle}Daily Absentee Report`;
      case 'weekly':
        return `${baseTitle}Weekly Absentee Report`;
      case 'monthly':
        return `${baseTitle}Monthly Absentee Report`;
      case 'custom':
        return `${baseTitle}Custom Absentee Report`;
      default:
        return `${baseTitle}Absentee Report`;
    }
  };

  const getReportDescription = () => {
    const baseDesc = selectedField ? `${selectedField} field - ` : '';
    switch (filters.reportType) {
      case 'daily':
        return `${baseDesc}Today's absentees (${new Date().toLocaleDateString()})`;
      case 'weekly':
        return `${baseDesc}This week's absentees`;
      case 'monthly':
        return `${baseDesc}This month's absentees`;
      case 'custom':
        return `${baseDesc}Custom period: ${filters.dateFrom} to ${filters.dateTo}`;
      default:
        return `${baseDesc}Student absentee records`;
    }
  };

  // Show field selection view
  if (!selectedField && fieldReports.length > 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getReportTitle()}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {getReportDescription()}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handleRefreshReports}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Advanced Filters</span>
            </button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1">
            {[
              { key: 'daily', label: 'Daily', icon: Calendar },
              { key: 'weekly', label: 'Weekly', icon: TrendingDown },
              { key: 'monthly', label: 'Monthly', icon: BookOpen },
              { key: 'custom', label: 'Custom', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleFilterChange('reportType', key as 'daily' | 'weekly' | 'monthly' | 'custom')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filters.reportType === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-yellow-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Absentees</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{absentees.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fields Affected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fieldReports.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Courses Affected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {[...new Set(absentees.map((a: AbsenteeRecord) => a.courseTitle))].length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Parents to Contact</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {[...new Set(absentees.map((a: AbsenteeRecord) => a.parentPhone))].length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Field Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fieldReports.map((fieldReport) => (
            <div key={fieldReport.fieldName} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {fieldReport.fieldName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {fieldReport.courses.length} courses affected
                  </p>
                </div>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-200">
                  {fieldReport.totalAbsentees} absent
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{fieldReport.totalAbsentees} students absent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{fieldReport.courses.slice(0, 2).join(', ')}{fieldReport.courses.length > 2 ? '...' : ''}</span>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedField(fieldReport.fieldName)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
            </div>
          ))}
        </div>

        {/* Advanced Filters Modal */}
        {showFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Advanced Filter Options
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filters.reportType === 'custom' && (
                    <>
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>From Date</span>
                        </label>
                        <input
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>To Date</span>
                        </label>
                        <input
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Field</span>
                    </label>
                    <select
                      value={filters.fieldName}
                      onChange={(e) => handleFilterChange('fieldName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Fields</option>
                      {availableFields.map((field: string) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Users className="w-4 h-4" />
                      <span>Level</span>
                    </label>
                    <select
                      value={filters.level}
                      onChange={(e) => handleFilterChange('level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Levels</option>
                      {availableLevels.map((level: string) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-6">
                  <button
                    onClick={handleApplyFilters}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Loading...' : 'Apply Filters'}
                  </button>
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show individual field report
  if (selectedField) {
    const fieldData = absentees.filter(record => record.fieldName === selectedField);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedField(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedField} - Absentee Report
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {fieldData.length} students absent • {getReportDescription()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={exportReport}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by student name..."
                value={filters.studentName}
                onChange={(e) => handleFilterChange('studentName', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by matricule..."
                value={filters.matricule}
                onChange={(e) => handleFilterChange('matricule', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Parent Contact
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {fieldData.map((record: AbsenteeRecord) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.studentName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.matricule}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {record.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {record.courseTitle}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {record.courseCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {record.timeSlot || 'Time not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {record.parentName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {record.parentPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleCallParent(record.parentPhone)}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          title="Call Parent"
                        >
                          <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleSendSMS(record.parentPhone, record.studentName)}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                          title="Send SMS"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {fieldData.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Absentees Found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No absentee records found for {selectedField} in the selected time period.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading reports...</span>
        </div>
      </div>
    );
  }

  // Empty state when no field reports
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getReportTitle()}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {getReportDescription()}
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleRefreshReports}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1">
          {[
            { key: 'daily', label: 'Daily', icon: Calendar },
            { key: 'weekly', label: 'Weekly', icon: TrendingDown },
            { key: 'monthly', label: 'Monthly', icon: BookOpen },
            { key: 'custom', label: 'Custom', icon: Clock }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleFilterChange('reportType', key as 'daily' | 'weekly' | 'monthly' | 'custom')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filters.reportType === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="text-yellow-800 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Absentees Found</h3>
        <p className="text-gray-500 dark:text-gray-400">
          No absentee records found for the selected criteria. This could mean:
        </p>
        <ul className="text-sm text-gray-500 dark:text-gray-400 mt-2 space-y-1">
          <li>• All students were present during the selected period</li>
          <li>• No rollcall sessions have been conducted yet</li>
          <li>• Try adjusting your filter criteria or refresh the data</li>
        </ul>
        <button
          onClick={handleRefreshReports}
          disabled={refreshing}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors mx-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>
    </div>
  );
}