import React, { useState, useEffect } from 'react';
import { Filter, Calendar, Users, BookOpen, Phone, MessageCircle, Download, TrendingDown, X, AlertTriangle, Search, FileText, Clock, RefreshCw } from 'lucide-react';
import ReportTable from '../components/ReportTable';
import { APIService } from '../utils/api';
import { LocalDBService } from '../utils/localdb';
import type { AbsenteeRecord } from '../types';

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

export default function Reports() {
  const [absentees, setAbsentees] = useState<AbsenteeRecord[]>([]);
  const [allAbsentees, setAllAbsentees] = useState<AbsenteeRecord[]>([]);
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

  useEffect(() => {
    // Update available options when data changes
    if (allAbsentees.length > 0) {
      const fields = [...new Set(allAbsentees.map(record => record.fieldName))];
      const courses = [...new Set(allAbsentees.map(record => record.courseTitle))];
      setAvailableFields(fields);
      setAvailableCourses(courses);
    }
  }, [allAbsentees]);

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
        reportData = await APIService.getAbsenteeReport(filterParams);
        console.log('API report data received:', reportData);
        
        if (reportData && reportData.length > 0) {
          console.log('Successfully loaded', reportData.length, 'records from API');
        } else {
          console.log('No data returned from API, checking for empty result vs error');
        }
        
      } catch (apiError) {
        console.log('API failed, will not use fallback data for reports:', apiError);
        // For reports, we want to show that there's no data rather than showing stale local data
        reportData = [];
        setError('Unable to fetch latest report data from database. Please check your connection and try again.');
      }

      // Store all data for filtering
      setAllAbsentees(reportData || []);

      // Apply client-side filters
      let filteredData = [...(reportData || [])];

      // Apply date filters
      if (filters.reportType === 'custom' || filters.dateFrom || filters.dateTo) {
        const fromDate = new Date(filters.dateFrom);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date

        filteredData = filteredData.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= fromDate && recordDate <= toDate;
        });
      } else {
        // Apply report type filters
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        switch (filters.reportType) {
          case 'daily':
            const todayStr = new Date().toISOString().split('T')[0];
            filteredData = filteredData.filter(record => 
              record.date.split('T')[0] === todayStr
            );
            break;
          case 'weekly':
            filteredData = filteredData.filter(record => 
              new Date(record.date) >= startOfWeek
            );
            break;
          case 'monthly':
            filteredData = filteredData.filter(record => 
              new Date(record.date) >= startOfMonth
            );
            break;
        }
      }

      // Apply other filters
      if (filters.fieldName) {
        filteredData = filteredData.filter(record => 
          record.fieldName.toLowerCase().includes(filters.fieldName.toLowerCase())
        );
      }

      if (filters.level) {
        filteredData = filteredData.filter(record => record.level === filters.level);
      }

      if (filters.courseTitle) {
        filteredData = filteredData.filter(record => 
          record.courseTitle.toLowerCase().includes(filters.courseTitle.toLowerCase())
        );
      }

      if (filters.studentName) {
        filteredData = filteredData.filter(record => 
          record.studentName.toLowerCase().includes(filters.studentName.toLowerCase())
        );
      }

      if (filters.matricule) {
        filteredData = filteredData.filter(record => 
          record.matricule.toLowerCase().includes(filters.matricule.toLowerCase())
        );
      }

      console.log('Final filtered data:', filteredData);
      setAbsentees(filteredData);
      
      if (filteredData.length > 0) {
        LocalDBService.cacheData('rollcall_cached_reports', filteredData);
      }

    } catch (error) {
      console.error('Failed to load absentee report:', error);
      setError('Failed to load absentee report. Please try again.');
      setAbsentees([]);
    } finally {
      setLoading(false);
    }
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
    const csvContent = [
      ['Student Name', 'Matricule', 'Field', 'Level', 'Course', 'Parent Name', 'Parent Phone', 'Date'].join(','),
      ...absentees.map(record => [
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
    a.download = `absentee-report-${filters.reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getReportTitle = () => {
    switch (filters.reportType) {
      case 'daily':
        return 'Daily Absentee Report';
      case 'weekly':
        return 'Weekly Absentee Report';
      case 'monthly':
        return 'Monthly Absentee Report';
      case 'custom':
        return 'Custom Absentee Report';
      default:
        return 'Absentee Report';
    }
  };

  const getReportDescription = () => {
    switch (filters.reportType) {
      case 'daily':
        return `Today's absentees (${new Date().toLocaleDateString()})`;
      case 'weekly':
        return 'This week\'s absentees';
      case 'monthly':
        return 'This month\'s absentees';
      case 'custom':
        return `Custom period: ${filters.dateFrom} to ${filters.dateTo}`;
      default:
        return 'Student absentee records';
    }
  };

  // Group absentees by field for better organization
  const getGroupedAbsentees = () => {
    const grouped = absentees.reduce((acc, record) => {
      const key = record.fieldName;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
      return acc;
    }, {} as Record<string, AbsenteeRecord[]>);

    return Object.entries(grouped).map(([fieldName, records]) => ({
      fieldName,
      records,
      count: records.length
    }));
  };

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
          
          {absentees.length > 0 && (
            <button
              onClick={exportReport}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
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

      {/* Summary Stats */}
      {absentees.length > 0 && (
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {[...new Set(absentees.map(a => a.fieldName))].length}
                </p>
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
                  {[...new Set(absentees.map(a => a.courseTitle))].length}
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
                  {[...new Set(absentees.map(a => a.parentPhone))].length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {/* Date Range - Only show for custom report type */}
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

                {/* Field */}
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
                    {availableFields.map(field => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level */}
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
                    {availableLevels.map(level => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Course</span>
                  </label>
                  <select
                    value={filters.courseTitle}
                    onChange={(e) => handleFilterChange('courseTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Courses</option>
                    {availableCourses.map(course => (
                      <option key={course} value={course}>
                        {course}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                Try refreshing the data or check if attendance has been submitted recently.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading reports...</span>
        </div>
      )}

      {/* Grouped Absentee Display */}
      {!loading && absentees.length > 0 && (
        <div className="space-y-6">
          {getGroupedAbsentees().map(({ fieldName, records, count }) => (
            <div key={fieldName} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {fieldName}
                  </h3>
                  <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-red-900 dark:text-red-200">
                    {count} absentees
                  </span>
                </div>
              </div>
              
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
                        Date
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
                    {records.map((record) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {record.courseTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(record.date).toLocaleDateString()}
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
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && absentees.length === 0 && (
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
      )}
    </div>
  );
}