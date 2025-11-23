import { apiClient } from '../lib/api';
import { ApiResponse, Complaint, ComplaintFormData, DashboardStats } from '../types';

export class ComplaintService {
  static async getCategories(): Promise<ApiResponse<{ categories: Record<string, string[]> }>> {
    return apiClient.get('/api/complaints/categories');
  }

  static async fileComplaint(formData: FormData): Promise<ApiResponse<{ complaint: Complaint }>> {
    return apiClient.post('/api/complaints/file-complaint', formData, true);
  }

  static async getMyComplaints(): Promise<ApiResponse<{ complaints: Complaint[] }>> {
    return apiClient.get('/api/complaints/my-complaints');
  }

  static async trackComplaint(complaintId: string): Promise<ApiResponse<{ complaint: Complaint }>> {
    return apiClient.get(`/api/complaints/track/${complaintId}`);
  }

  static async getDashboardStats(): Promise<ApiResponse<{ stats: DashboardStats }>> {
    return apiClient.get('/api/admin/dashboard/stats');
  }

  static async getAllComplaints(params?: URLSearchParams): Promise<ApiResponse<{ complaints: Complaint[] }>> {
    const queryString = params ? `?${params.toString()}` : '';
    return apiClient.get(`/api/admin/complaints${queryString}`);
  }

  static async getComplaintDetails(complaintId: string): Promise<ApiResponse<{ complaint: Complaint }>> {
    return apiClient.get(`/api/admin/complaints/${complaintId}`);
  }

  static async updateComplaintStatus(
    complaintId: string, 
    status: string, 
    remarks?: string
  ): Promise<ApiResponse<any>> {
    return apiClient.patch(`/api/admin/complaints/${complaintId}/status`, { status, remarks });
  }
}