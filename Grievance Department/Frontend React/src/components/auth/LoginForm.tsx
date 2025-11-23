import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LogIn, Shield, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const schema = yup.object({
  identifier: yup.string().required('Username or Aadhar ID is required'),
  password: yup.string().required('Password is required'),
});

interface LoginFormData {
  identifier: string;
  password: string;
}

export function LoginForm() {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [loginType, setLoginType] = useState<'citizen' | 'admin'>('citizen');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Mock login - in real app, you'd call your authentication API
      if (loginType === 'citizen') {
        // Mock successful citizen login
        const mockUser = {
          id: '1',
          personalDetails: {
            name: 'John Doe',
            aadharId: '123456789012',
            mobile: '+91-9876543210',
            email: 'john.doe@email.com',
            address: '123 Main St, City, State',
          },
          createdAt: new Date().toISOString(),
        };
        login(mockUser, false);
      } else {
        // Mock successful admin login
        const mockAdmin = {
          id: '1',
          name: 'Admin User',
          username: 'admin',
          role: 'system-admin',
          department: 'IT Department',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        login(mockAdmin, true);
      }
    } catch (error) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Government Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-yellow-400 text-2xl font-bold">🏛️</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Government Portal</h1>
          <p className="text-gray-600">Citizen Grievance Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Login Type Selector */}
          <div className="flex">
            <button
              type="button"
              onClick={() => setLoginType('citizen')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
                loginType === 'citizen'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-5 h-5" />
              Citizen Login
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
                loginType === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Shield className="w-5 h-5" />
              Admin Login
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {loginType === 'citizen' ? 'Aadhar ID / Mobile' : 'Username'}
              </label>
              <input
                {...register('identifier')}
                type="text"
                placeholder={loginType === 'citizen' ? 'Enter Aadhar ID or mobile number' : 'Enter username'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
              {errors.identifier && (
                <p className="text-red-500 text-sm mt-2">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-2">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            {loginType === 'citizen' && (
              <div className="text-center">
                <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Don't have an account? Register here
                </a>
              </div>
            )}
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-white bg-opacity-80 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-gray-800 mb-2">Demo Credentials:</h4>
          <div className="grid grid-cols-1 gap-2 text-gray-600">
            <div><strong>Citizen:</strong> Any Aadhar ID / any password</div>
            <div><strong>Admin:</strong> admin / any password</div>
          </div>
        </div>

        <footer className="text-center mt-8 text-gray-600 text-sm">
          <p>© 2023 Government Services. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
            <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
          </div>
        </footer>
      </div>
    </div>
  );
}