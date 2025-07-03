import React from 'react';
import { Clock, MapPin, Users } from 'lucide-react';
import type { Session } from '../types';

interface RollcallCardProps {
  session: Session;
}

export default function RollcallCard({ session }: RollcallCardProps) {
  const now = new Date();
  const startTime = new Date(`${now.toDateString()} ${session.startTime}`);
  const endTime = new Date(`${now.toDateString()} ${session.endTime}`);
  
  const isActive = now >= startTime && now <= endTime;
  const isPast = now > endTime;
  const isFuture = now < startTime;

  let statusColor = 'gray';
  let statusText = 'Scheduled';

  if (isActive) {
    statusColor = 'green';
    statusText = 'In Progress';
  } else if (isPast) {
    statusColor = 'red';
    statusText = 'Completed';
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border-l-4 ${
      isActive 
        ? 'border-green-500' 
        : isPast 
        ? 'border-red-500' 
        : 'border-gray-300 dark:border-gray-600'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {session.courseTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {session.className}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          statusColor === 'green' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : statusColor === 'red'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}>
          {statusText}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{session.startTime} - {session.endTime}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>{session.room}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{session.students.length} students</span>
        </div>
      </div>
    </div>
  );
}