import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, User, LogOut, ClipboardList } from 'lucide-react';
import Sidebar from './Sidebar';
import ProfileModal from './ProfileModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-white transition-colors">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        onProfileClick={() => setShowProfile(true)}
        user={user}
      />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b-2 border-black sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-black hover:bg-blue-50"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Page title */}
              <div className="flex items-center space-x-4">
                <ClipboardList className="w-6 h-6 text-blue-600" />
                <div className="hidden lg:block">
                  <h1 className="text-xl font-semibold text-black">
                    IME Rollcall System
                  </h1>
                </div>
              </div>

              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {/* Database Status */}
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 hidden sm:block">Database Connected</span>
                </div>

                {/* Profile & Logout */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowProfile(true)}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    title="Profile"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}