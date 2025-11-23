export interface User {
  id: string;
  personalDetails: {
    name: string;
    aadharId: string;
    mobile: string;
    email: string;
    address?: string;
  };
  createdAt: string;
}

export interface Admin {
  id: string;
  name: string;
  username: string;
  role: string;
  department: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Complaint {
  _id: string;
  complaintId: string;
  category: string;
  subCategory: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  priority?: 'low' | 'medium' | 'high';
  location?: {
    address: string;
    landmark?: string;
    pincode: string;
  };
  imageProof?: string;
  userId: User;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalComplaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ComplaintFormData {
  category: string;
  subCategory: string;
  description: string;
  address: string;
  landmark?: string;
  pincode: string;
  imageProof?: FileList;
}