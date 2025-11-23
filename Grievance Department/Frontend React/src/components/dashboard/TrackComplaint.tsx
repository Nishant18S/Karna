import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { ComplaintService } from '../../services/complaints';
import { Complaint } from '../../types';
import { format } from 'date-fns';

export function TrackComplaint() {
  const [complaintId, setComplaintId] = useState('');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleTrack = async () => {
    if (!complaintId.trim()) {
      setError('Please enter a complaint ID');
      return;
    }

    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const response = await ComplaintService.trackComplaint(complaintId.trim());
      if (response.success) {
        setComplaint(response.data.complaint);
      } else {
        setError(response.message || 'Complaint not found');
      }
    } catch (error) {
      console.error('Error tracking complaint:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCategory = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Search className="w-8 h-8" />
            Track Complaint
          </h2>
          <p className="text-purple-100 mt-2">Enter your complaint ID to track its status</p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-8">
            <div className="flex-1">
              <input
                type="text"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
                placeholder="Enter Complaint ID (e.g., COMP000001)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
              />
            </div>
            <button
              onClick={handleTrack}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-center gap-3">
              <span className="text-red-500 font-bold">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {complaint && (
            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-purple-600 font-mono">
                      {complaint.complaintId}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      Filed on {format(new Date(complaint.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>

                <div className="grid gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Category
                    </label>
                    <div className="text-gray-900">
                      {formatCategory(complaint.category)} - {complaint.subCategory}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Description
                    </label>
                    <div className="text-gray-900 leading-relaxed">
                      {complaint.description}
                    </div>
                  </div>

                  {complaint.location && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Location
                      </label>
                      <div className="text-gray-900 space-y-1">
                        <div>{complaint.location.address}</div>
                        {complaint.location.landmark && (
                          <div className="text-gray-600">Landmark: {complaint.location.landmark}</div>
                        )}
                        <div className="text-gray-600">Pincode: {complaint.location.pincode}</div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Status
                      </label>
                      <div className="text-gray-900 capitalize">
                        {complaint.status.replace('-', ' ')}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Last Updated
                      </label>
                      <div className="text-gray-900">
                        {format(new Date(complaint.updatedAt), 'MMMM d, yyyy • HH:mm')}
                      </div>
                    </div>
                  </div>

                  {complaint.imageProof && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Supporting Image
                      </label>
                      <img
                        src={complaint.imageProof}
                        alt="Complaint Evidence"
                        className="max-w-sm rounded-lg border border-gray-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!complaint && !error && !loading && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Enter a complaint ID above to track its status</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}