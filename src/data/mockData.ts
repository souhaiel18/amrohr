import { Employee, TimeOffRequest, Document, Announcement } from '../types';

export const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    email: 'admin@company.com',
    firstName: 'John',
    lastName: 'Smith',
    role: 'admin',
    department: 'IT',
    position: 'System Administrator',
    phone: '+1 (555) 123-4567',
    startDate: '2020-01-15',
    birthDate: '1985-03-20',
    status: 'active',
    address: '123 Main St, New York, NY 10001',
    salary: 85000,
    emergencyContact: {
      name: 'Jane Smith',
      relationship: 'Spouse',
      phone: '+1 (555) 987-6543'
    }
  },
  {
    id: '2',
    employeeId: 'EMP002',
    email: 'sarah.wilson@company.com',
    firstName: 'Sarah',
    lastName: 'Wilson',
    role: 'hr',
    department: 'Human Resources',
    position: 'HR Manager',
    phone: '+1 (555) 234-5678',
    startDate: '2021-03-01',
    birthDate: '1990-07-12',
    status: 'active',
    address: '456 Oak Ave, Brooklyn, NY 11201',
    salary: 75000,
    emergencyContact: {
      name: 'Michael Wilson',
      relationship: 'Husband',
      phone: '+1 (555) 876-5432'
    }
  },
  {
    id: '3',
    employeeId: 'EMP003',
    email: 'mike.johnson@company.com',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'employee',
    department: 'Engineering',
    position: 'Software Developer',
    phone: '+1 (555) 345-6789',
    startDate: '2022-06-15',
    birthDate: '1988-11-30',
    status: 'active',
    address: '789 Pine St, Queens, NY 11375',
    salary: 95000,
    emergencyContact: {
      name: 'Lisa Johnson',
      relationship: 'Sister',
      phone: '+1 (555) 765-4321'
    }
  },
  {
    id: '4',
    employeeId: 'EMP004',
    email: 'emily.davis@company.com',
    firstName: 'Emily',
    lastName: 'Davis',
    role: 'employee',
    department: 'Marketing',
    position: 'Marketing Specialist',
    phone: '+1 (555) 456-7890',
    startDate: '2023-01-10',
    birthDate: '1992-04-18',
    status: 'active',
    address: '321 Elm St, Manhattan, NY 10023',
    salary: 65000,
    emergencyContact: {
      name: 'Robert Davis',
      relationship: 'Father',
      phone: '+1 (555) 654-3210'
    }
  },
  {
    id: '5',
    employeeId: 'EMP005',
    email: 'david.brown@company.com',
    firstName: 'David',
    lastName: 'Brown',
    role: 'employee',
    department: 'Sales',
    position: 'Sales Representative',
    phone: '+1 (555) 567-8901',
    startDate: '2021-09-20',
    birthDate: '1986-12-05',
    status: 'active',
    address: '654 Cedar St, Bronx, NY 10451',
    salary: 70000,
    emergencyContact: {
      name: 'Maria Brown',
      relationship: 'Wife',
      phone: '+1 (555) 543-2109'
    }
  }
];

export const mockTimeOffRequests: TimeOffRequest[] = [
  {
    id: '1',
    employeeId: '3',
    employeeName: 'Mike Johnson',
    type: 'paid',
    startDate: '2024-02-15',
    endDate: '2024-02-19',
    days: 5,
    reason: 'Family vacation',
    status: 'approved',
    requestDate: '2024-01-20',
    approvedBy: 'Sarah Wilson',
    approvedDate: '2024-01-22'
  },
  {
    id: '2',
    employeeId: '4',
    employeeName: 'Emily Davis',
    type: 'sick',
    startDate: '2024-01-30',
    endDate: '2024-01-31',
    days: 2,
    reason: 'Medical appointment',
    status: 'pending',
    requestDate: '2024-01-28'
  },
  {
    id: '3',
    employeeId: '5',
    employeeName: 'David Brown',
    type: 'personal',
    startDate: '2024-03-10',
    endDate: '2024-03-12',
    days: 3,
    reason: 'Personal matters',
    status: 'pending',
    requestDate: '2024-01-25'
  }
];

export const mockDocuments: Document[] = [
  {
    id: '1',
    employeeId: '3',
    employeeName: 'Mike Johnson',
    name: 'Employment Contract',
    type: 'contract',
    size: '245 KB',
    uploadDate: '2022-06-15',
    url: '#'
  },
  {
    id: '2',
    employeeId: '4',
    employeeName: 'Emily Davis',
    name: 'Resume.pdf',
    type: 'cv',
    size: '1.2 MB',
    uploadDate: '2023-01-08',
    url: '#'
  },
  {
    id: '3',
    employeeId: '5',
    employeeName: 'David Brown',
    name: 'Sales Certification',
    type: 'certificate',
    size: '890 KB',
    uploadDate: '2021-10-12',
    url: '#'
  }
];

export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Company Holiday Party',
    content: 'Join us for our annual holiday celebration on December 20th at 6 PM in the main conference room.',
    author: 'HR Team',
    date: '2024-01-25',
    priority: 'medium'
  },
  {
    id: '2',
    title: 'New Health Insurance Policy',
    content: 'We are pleased to announce improvements to our health insurance coverage starting February 1st.',
    author: 'Sarah Wilson',
    date: '2024-01-20',
    priority: 'high'
  },
  {
    id: '3',
    title: 'Office Renovation Update',
    content: 'The second floor renovation is on schedule and will be completed by March 15th.',
    author: 'Facilities Team',
    date: '2024-01-18',
    priority: 'low'
  }
];