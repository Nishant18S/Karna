import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, Image, Calendar, MapPin, FileText, Tag } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { Modal } from '../ui/Modal';
import { ComplaintService } from '../../services/complaints';
import { Complaint } from '../../types';
import { format } from 'date-fns';

interface MyComplaintsProps {
  onStatsUpdate: () => void;
}

export function MyComplaints({ onStatsUpdate }: MyComplaintsProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await ComplaintService.getMyComplaints();
      if (response.success) {
        setComplaints(response.data.complaints);
        onStatsUpdate();
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCategory = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const viewImage = (complaintId: string) => {
    // In a real app, you'd fetch the image URL from the API
    setImageUrl(`/api/complaints/image/${complaintId}`);
    setImageModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <FileText className="w-8 h-8" />
                My Complaints
              </h2>
              <p className="text-blue-100 mt-2">View and track all your submitted complaints</p>
            </div>
            <button
              onClick={loadComplaints}
              disabled={loading}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading complaints...</p>
              </div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Complaints Found</h3>
              <p className="text-gray-600">You haven't filed any complaints yet. Click "File Complaint" to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {complaints.map((complaint) => (
                <div
                  key={complaint._id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200 bg-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-blue-600 font-mono">
                        {complaint.complaintId}
                      </h3>
                      <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        Filed on {format(new Date(complaint.createdAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <StatusBadge status={complaint.status} />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {formatCategory(complaint.category)} - {complaint.subCategory}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
                  </div>

                  {complaint.location && (
                    <div className="mb-4 text-sm text-gray-600 flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div>{complaint.location.address}</div>
                        {complaint.location.landmark && (
                          <div className="text-gray-500">Landmark: {complaint.location.landmark}</div>
                        )}
                        <div className="text-gray-500">Pincode: {complaint.location.pincode}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedComplaint(complaint)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    
                    {complaint.imageProof && (
                      <button
                        onClick={() => viewImage(complaint.complaintId)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                      >
                        <Image className="w-4 h-4" />
                        View Image
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title="Complaint Details"
          size="lg"
        >
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Complaint ID
                </label>
                <div className="font-mono font-bold text-lg text-blue-600">
                  {selectedComplaint.complaintId}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Status
                </label>
                <StatusBadge status={selectedComplaint.status} />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Category
              </label>
              <div className="text-gray-900">
                {formatCategory(selectedComplaint.category)} - {selectedComplaint.subCategory}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Description
              </label>
              <div className="text-gray-900 leading-relaxed">
                {selectedComplaint.description}
              </div>
            </div>

            {selectedComplaint.location && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Location
                </label>
                <div className="text-gray-900 space-y-1">
                  <div>{selectedComplaint.location.address}</div>
                  {selectedComplaint.location.landmark && (
                    <div className="text-gray-600">Landmark: {selectedComplaint.location.landmark}</div>
                  )}
                  <div className="text-gray-600">Pincode: {selectedComplaint.location.pincode}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Filed Date
                </label>
                <div className="text-gray-900">
                  {format(new Date(selectedComplaint.createdAt), 'MMMM d, yyyy • HH:mm')}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Last Updated
                </label>
                <div className="text-gray-900">
                  {format(new Date(selectedComplaint.updatedAt), 'MMMM d, yyyy • HH:mm')}
                </div>
              </div>
            </div>

            {selectedComplaint.imageProof && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Image Proof
                </label>
                <img
                  src={selectedComplaint.imageProof}
                  alt="Complaint Evidence"
                  className="max-w-full rounded-lg border border-gray-200 shadow-sm"
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Image Modal */}
      <Modal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        title="Complaint Image"
        size="lg"
      >
        <div className="p-6">
          <img
            src={imageUrl}
            alt="Complaint Evidence"
            className="max-w-full mx-auto rounded-lg shadow-sm"
          />
        </div>
      </Modal>
    </div>
  );
}