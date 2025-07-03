import React from 'react';
import { Phone } from 'lucide-react';
import type { Student } from '../types';

interface StudentItemProps {
  student: Student;
  onTogglePresence: (studentId: string, isPresent: boolean) => void;
  onCallParent: (phoneNumber: string) => void;
}

export default function StudentItem({ student, onTogglePresence, onCallParent }: StudentItemProps) {
  const handleToggle = (isPresent: boolean) => {
    onTogglePresence(student.id, isPresent);
  };

  const handleCallParent = () => {
    onCallParent(student.parentPhone);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {student.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {student.matricule}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Call Parent Button */}
          <button
            onClick={handleCallParent}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Call Parent"
          >
            <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Present/Absent Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleToggle(true)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                student.isPresent === true
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600'
              }`}
            >
              Present
            </button>
            <button
              onClick={() => handleToggle(false)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                student.isPresent === false
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-600'
              }`}
            >
              Absent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}