import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (credentials: { email: string; password: string }) => void;
  loading: boolean;
  error: string | null;
}

export default function Login({ onLogin, loading, error }: LoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(formData);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 shadow-lg rounded-xl overflow-hidden border border-gray-300">
        
        {/* Left Column - Login Form */}
        <div className="p-8 space-y-6">
          {/* Logo & Title */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-black">IME Rollcall System</h2>
            <p className="mt-2 text-gray-600">Sign in to your discipline master account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black placeholder-black"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="block w-full pl-10 pr-12 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black placeholder-black"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-600 rounded-lg p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border-2 border-blue-600 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </div>
                )}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-4">
              <p className="text-blue-600 text-sm font-medium mb-2">Demo Credentials:</p>
              <p className="text-blue-600 text-xs">Email: admin@university.edu</p>
              <p className="text-blue-600 text-xs">Password: admin123</p>
            </div>
          </form>
        </div>

        {/* Right Column - Image + Motivational Text */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8 text-center">
          <img
            src="/public/ime.jpg"
            alt="Discipline leads to success"
            className="w-full max-w-xs rounded-lg shadow-md mb-6 object-cover"
          />
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Discipline is the bridge between goals and accomplishment.</h3>
          <p className="text-gray-600">
            At IME, we believe that structure, consistency, and commitment are the pillars of academic excellence.
          </p>
        </div>
      </div>
    </div>
  );
}