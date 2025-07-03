import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportStudentsModalProps {
  onClose: () => void;
  onImport: (students: any[]) => void;
  availableFields: string[];
}

export default function ImportStudentsModal({ onClose, onImport, availableFields }: ImportStudentsModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = [
    { key: 'name', label: 'Student Name' },
    { key: 'matricule', label: 'Matricule' },
    { key: 'field', label: 'Field' },
    { key: 'level', label: 'Level' },
    { key: 'parentName', label: 'Parent Name' },
    { key: 'parentPhone', label: 'Parent Phone' },
  ];

  const optionalFields = [
    { key: 'parentEmail', label: 'Parent Email' },
    { key: 'photo', label: 'Photo URL' },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type)) {
      setErrors(['Please upload an Excel (.xlsx, .xls) or CSV file']);
      return;
    }

    setFile(file);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook;
        
        if (file.type === 'text/csv') {
          workbook = XLSX.read(data, { type: 'string' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          setErrors(['File must contain at least a header row and one data row']);
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));

        const preview = rows.slice(0, 5).map((row: any) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

        setPreviewData(preview);

        // Auto-map fields based on common column names
        const autoMapping: Record<string, string> = {};
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('name') && !lowerHeader.includes('parent')) {
            autoMapping['name'] = header;
          } else if (lowerHeader.includes('matricule') || lowerHeader.includes('student_id')) {
            autoMapping['matricule'] = header;
          } else if (lowerHeader.includes('field') || lowerHeader.includes('department')) {
            autoMapping['field'] = header;
          } else if (lowerHeader.includes('level') || lowerHeader.includes('year')) {
            autoMapping['level'] = header;
          } else if (lowerHeader.includes('parent') && lowerHeader.includes('name')) {
            autoMapping['parentName'] = header;
          } else if (lowerHeader.includes('parent') && lowerHeader.includes('phone')) {
            autoMapping['parentPhone'] = header;
          } else if (lowerHeader.includes('parent') && lowerHeader.includes('email')) {
            autoMapping['parentEmail'] = header;
          } else if (lowerHeader.includes('photo')) {
            autoMapping['photo'] = header;
          }
        });

        setMapping(autoMapping);

      } catch (error) {
        setErrors(['Error reading file. Please ensure it\'s a valid Excel or CSV file.']);
      }
    };

    if (file.type === 'text/csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const validateMapping = () => {
    const newErrors: string[] = [];
    
    requiredFields.forEach(field => {
      if (!mapping[field.key]) {
        newErrors.push(`${field.label} is required but not mapped`);
      }
    });

    // Validate field values
    if (mapping.field) {
      const fieldValues = previewData.map(row => row[mapping.field]).filter(Boolean);
      const invalidFields = fieldValues.filter(field => !availableFields.includes(field));
      if (invalidFields.length > 0) {
        newErrors.push(`Invalid field values found: ${invalidFields.join(', ')}`);
      }
    }

    // Validate level values
    if (mapping.level) {
      const levelValues = previewData.map(row => row[mapping.level]).filter(Boolean);
      const validLevels = ['Level 100', 'Level 200'];
      const invalidLevels = levelValues.filter(level => !validLevels.includes(level));
      if (invalidLevels.length > 0) {
        newErrors.push(`Invalid level values found: ${invalidLevels.join(', ')}. Valid levels are: ${validLevels.join(', ')}`);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleImport = () => {
    if (!validateMapping()) {
      return;
    }

    // Process all data from the file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook;
        
        if (file!.type === 'text/csv') {
          workbook = XLSX.read(data, { type: 'string' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));

        const students = rows.map((row: any, index) => {
          const student: any = {
            id: Date.now().toString() + index,
          };

          Object.entries(mapping).forEach(([fieldKey, columnName]) => {
            const columnIndex = headers.indexOf(columnName);
            if (columnIndex !== -1) {
              student[fieldKey] = row[columnIndex] || '';
            }
          });

          return student;
        });

        onImport(students);
        onClose();

      } catch (error) {
        setErrors(['Error processing file data']);
      }
    };

    if (file!.type === 'text/csv') {
      reader.readAsText(file!);
    } else {
      reader.readAsArrayBuffer(file!);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Student Name', 'Matricule', 'Field', 'Level', 'Parent Name', 'Parent Phone', 'Parent Email', 'Photo URL'],
      ['John Doe', 'CS200/001', 'Computer Science', 'Level 200', 'Jane Doe', '+1234567890', 'jane.doe@email.com', ''],
      ['Alice Smith', 'SE100/002', 'Software Engineering', 'Level 100', 'Bob Smith', '+1234567891', 'bob.smith@email.com', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students Template');
    XLSX.writeFile(wb, 'students_import_template.xlsx');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Import Students
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Download Template */}
          <div className="mb-6">
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Download the Excel template to see the expected format
            </p>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Supports Excel (.xlsx, .xls) and CSV files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose File
              </button>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="font-medium text-red-800 dark:text-red-200">Validation Errors</h3>
              </div>
              <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* File Info */}
          {file && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-800 dark:text-blue-200">{file.name}</span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            </div>
          )}

          {/* Field Mapping */}
          {previewData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Map Columns to Fields
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[...requiredFields, ...optionalFields].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field.label} {requiredFields.includes(field) && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={mapping[field.key] || ''}
                      onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select column...</option>
                      {Object.keys(previewData[0] || {}).map(column => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Preview (First 5 rows)
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {Object.keys(previewData[0] || {}).map(column => (
                        <th key={column} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.map((row, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-800">
                        {Object.values(row).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {previewData.length > 0 && (
              <button
                onClick={handleImport}
                disabled={errors.length > 0}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Import Students</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}