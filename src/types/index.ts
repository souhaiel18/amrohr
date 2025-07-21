export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'hr' | 'employee';
  department: string;
  position: string;
  phone: string;
  avatar?: string;
  startDate: string;
  status: 'active' | 'inactive';
}

export interface Employee extends User {
  employeeId: string;
  salary?: number;
  manager?: string;
  birthDate: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'paid' | 'sick' | 'unpaid' | 'personal';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface Document {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  type: 'contract' | 'cv' | 'certificate' | 'other';
  size: string;
  uploadDate: string;
  url: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}