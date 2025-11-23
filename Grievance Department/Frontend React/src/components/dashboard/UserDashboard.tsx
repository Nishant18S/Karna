import React, { useState, useEffect } from 'react';
import { FileText, List, Search, Clock, Cog, CheckCircle, FileX, Bell, Calendar, Activity } from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { ComplaintForm } from '../forms/ComplaintForm';
import { MyComplaints } from './MyComplaints';
import { TrackComplaint } from './TrackComplaint';
import { useAuth } from '../../contexts/AuthContext';
import { ComplaintService } from '../../services/complaints';
import { DashboardStats } from '../../types';
import { format } from 'date-fns';

type TabType = 'dashboard' | 'fileComplaint' | 'myComplaints' | 'trackComplaint';

export function UserDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadStats = async () => {
    try {
      const response = await ComplaintService.getMyComplaints();
      if (response.success) {
        const complaints = response.data.complaints;
        setStats({
          totalComplaints: complaints.length,
          pendingComplaints: complaints.filter(c => c.status === 'pending').length,
          inProgressComplaints: complaints.filter(c => c.status === 'in-progress').length,
          resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleComplaintSuccess = (complaintId: string) => {
    loadStats();
    // Show success message or redirect
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Activity },
    { id: 'fileComplaint' as TabType, label: 'File Complaint', icon: FileText },
    { id: 'myComplaints' as TabType, label: 'My Complaints', icon: List },
    { id: 'trackComplaint' as TabType, label: 'Track Complaint', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Government Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-blue-900 font-bold text-xl">🏛️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Citizen Grievance Portal</h1>
                  <p className="text-blue-100 text-sm">Government Services Portal</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Bell className="w-6 h-6 text-blue-200 hover:text-white cursor-pointer transition-colors" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  3
                </span>
              </div>
              
              <div className="text-right">
                <div className="font-semibold">{user?.personalDetails.name}</div>
                <div className="text-blue-200 text-sm">Citizen ID: {user?.personalDetails.aadharId}</div>
              </div>
              
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Logout
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-4 border-t border-blue-500 border-opacity-30">
            <div className="text-lg">Welcome to the Citizen Grievance Portal, {user?.personalDetails.name}</div>
            <div className="flex items-center space-x-2 text-blue-100">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{format(currentTime, 'EEEE, MMMM d, yyyy • HH:mm')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors duration-200 ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
              <p className="text-gray-600">Monitor your complaint status and system activity</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Complaints"
                value={stats.totalComplaints}
                icon={FileText}
                color="blue"
                change={{ value: "+12% from last month", type: "positive" }}
              />
              <StatCard
                title="Pending"
                value={stats.pendingComplaints}
                icon={Clock}
                color="yellow"
                change={{ value: "-5% from last week", type: "negative" }}
              />
              <StatCard
                title="In Progress"
                value={stats.inProgressComplaints}
                icon={Cog}
                color="cyan"
                change={{ value: "+8% from last week", type: "positive" }}
              />
              <StatCard
                title="Resolved"
                value={stats.resolvedComplaints}
                icon={CheckCircle}
                color="green"
                change={{ value: "+15% from last month", type: "positive" }}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  ⚡
                </span>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setActiveTab('fileComplaint')}
                  className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <FileText className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-gray-900 mb-2">File New Complaint</h4>
                  <p className="text-gray-600 text-sm">Submit a new grievance or issue</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('myComplaints')}
                  className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <List className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-gray-900 mb-2">View My Complaints</h4>
                  <p className="text-gray-600 text-sm">Check status of your submissions</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('trackComplaint')}
                  className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <Search className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-gray-900 mb-2">Track Complaint</h4>
                  <p className="text-gray-600 text-sm">Search for specific complaint details</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
              </div>
            </div>
          </div>
        )}

        {/* File Complaint Tab */}
        {activeTab === 'fileComplaint' && (
          <ComplaintForm onSuccess={handleComplaintSuccess} />
        )}

        {/* My Complaints Tab */}
        {activeTab === 'myComplaints' && (
          <MyComplaints onStatsUpdate={loadStats} />
        )}

        {/* Track Complaint Tab */}
        {activeTab === 'trackComplaint' && (
          <TrackComplaint />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">Citizen Grievance Portal - Government Services</p>
            <div className="flex justify-center space-x-6 mt-4 text-sm">
              <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
              <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
              <a href="#" className="text-blue-600 hover:text-blue-700">Help & Support</a>
              <a href="#" className="text-blue-600 hover:text-blue-700">Contact Us</a>
            </div>
            <p className="text-gray-500 text-sm mt-2">© 2023 Government Services. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}