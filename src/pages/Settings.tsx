import React, { useState } from 'react';
import { Moon, Sun, Smartphone, Trash2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { LocalDBService } from '../utils/localdb';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [clearingData, setClearingData] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearData = async () => {
    setClearingData(true);
    try {
      LocalDBService.clearCache();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setClearingData(false);
    }
  };

  const installPWA = () => {
    alert('To install this app:\n\n1. Open the browser menu\n2. Look for "Add to Home Screen" or "Install App"\n3. Follow the prompts');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">
          Settings
        </h1>
        <p className="text-black mt-1">
          Manage your app preferences and data
        </p>
      </div>

      {/* Sync Status - Disabled */}
      <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-black">
        <h3 className="text-lg font-medium text-black mb-4">
          Database Connection
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-black">
                Direct Database Connection
              </p>
              <p className="text-xs text-black">
                Attendance is saved directly to the database
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-black">
        <h3 className="text-lg font-medium text-black mb-4">
          Appearance
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-blue-600" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600" />
            )}
            <div>
              <p className="text-sm font-medium text-black">
                {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </p>
              <p className="text-xs text-black">
                Choose your preferred color scheme
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-black transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              theme === 'dark' ? 'bg-blue-600' : 'bg-white'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* App Installation */}
      <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-black">
        <h3 className="text-lg font-medium text-black mb-4">
          App Installation
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-black">
                Install as App
              </p>
              <p className="text-xs text-black">
                Add to home screen for better experience
              </p>
            </div>
          </div>
          
          <button
            onClick={installPWA}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Install
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-black">
        <h3 className="text-lg font-medium text-black mb-4">
          Data Management
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-black">
                  Clear Cache Data
                </p>
                <p className="text-xs text-black">
                  Remove cached data and reset the app
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={clearingData}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-black disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {clearingData ? 'Clearing...' : 'Clear Cache'}
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-black">
        <h3 className="text-lg font-medium text-black mb-4">
          App Information
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-black">Version:</span>
            <span className="font-medium text-black">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">Built for:</span>
            <span className="font-medium text-black">IME University</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">Platform:</span>
            <span className="font-medium text-black">Progressive Web App</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">Database:</span>
            <span className="font-medium text-green-600">Direct Connection</span>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border-2 border-black">
            <h3 className="text-lg font-medium text-black mb-4">
              Confirm Clear Cache
            </h3>
            <p className="text-black mb-6">
              This will remove all cached data. Attendance records are saved directly to the database and will not be affected.
              Are you sure you want to continue?
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleClearData}
                disabled={clearingData}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-black disabled:cursor-not-allowed transition-colors"
              >
                {clearingData ? 'Clearing...' : 'Yes, Clear Cache'}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 text-black bg-white border-2 border-black hover:bg-black hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}