import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Employee {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'hr' | 'employee';
  department: string;
  position: string;
  phone: string;
  startDate: string;
  birthDate: string;
  status: 'active' | 'inactive';
  address: string;
  salary?: number;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

interface TimeOffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
}

interface Document {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  url: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

interface DataState {
  employees: Employee[];
  timeOffRequests: TimeOffRequest[];
  documents: Document[];
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
}

interface DataContextType extends DataState {
  // Employee CRUD
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  importEmployees: (employees: Employee[]) => Promise<void>;
  
  // Time Off CRUD
  addTimeOffRequest: (request: Omit<TimeOffRequest, 'id'>) => Promise<void>;
  updateTimeOffRequest: (id: string, request: Partial<TimeOffRequest>) => Promise<void>;
  deleteTimeOffRequest: (id: string) => Promise<void>;
  approveTimeOffRequest: (id: string, approvedBy: string) => Promise<void>;
  rejectTimeOffRequest: (id: string, approvedBy: string) => Promise<void>;
  
  // Document CRUD
  addDocument: (document: Omit<Document, 'id'>) => Promise<void>;
  updateDocument: (id: string, document: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  uploadFile: (file: File, path: string) => Promise<string>;
  
  // Announcement CRUD
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => Promise<void>;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  
  // Refresh functions
  refreshData: () => Promise<void>;
}

type DataAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'SET_TIME_OFF_REQUESTS'; payload: TimeOffRequest[] }
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'SET_ANNOUNCEMENTS'; payload: Announcement[] }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: { id: string; data: Partial<Employee> } }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'ADD_TIME_OFF_REQUEST'; payload: TimeOffRequest }
  | { type: 'UPDATE_TIME_OFF_REQUEST'; payload: { id: string; data: Partial<TimeOffRequest> } }
  | { type: 'DELETE_TIME_OFF_REQUEST'; payload: string }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: { id: string; data: Partial<Document> } }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'ADD_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'UPDATE_ANNOUNCEMENT'; payload: { id: string; data: Partial<Announcement> } }
  | { type: 'DELETE_ANNOUNCEMENT'; payload: string };

const initialState: DataState = {
  employees: [],
  timeOffRequests: [],
  documents: [],
  announcements: [],
  loading: false,
  error: null
};

const dataReducer = (state: DataState, action: DataAction): DataState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'SET_TIME_OFF_REQUESTS':
      return { ...state, timeOffRequests: action.payload };
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
    case 'SET_ANNOUNCEMENTS':
      return { ...state, announcements: action.payload };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(emp => 
          emp.id === action.payload.id 
            ? { ...emp, ...action.payload.data }
            : emp
        )
      };
    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter(emp => emp.id !== action.payload)
      };
    case 'ADD_TIME_OFF_REQUEST':
      return { ...state, timeOffRequests: [...state.timeOffRequests, action.payload] };
    case 'UPDATE_TIME_OFF_REQUEST':
      return {
        ...state,
        timeOffRequests: state.timeOffRequests.map(req => 
          req.id === action.payload.id 
            ? { ...req, ...action.payload.data }
            : req
        )
      };
    case 'DELETE_TIME_OFF_REQUEST':
      return {
        ...state,
        timeOffRequests: state.timeOffRequests.filter(req => req.id !== action.payload)
      };
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] };
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(doc => 
          doc.id === action.payload.id 
            ? { ...doc, ...action.payload.data }
            : doc
        )
      };
    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload)
      };
    case 'ADD_ANNOUNCEMENT':
      return { ...state, announcements: [...state.announcements, action.payload] };
    case 'UPDATE_ANNOUNCEMENT':
      return {
        ...state,
        announcements: state.announcements.map(ann => 
          ann.id === action.payload.id 
            ? { ...ann, ...action.payload.data }
            : ann
        )
      };
    case 'DELETE_ANNOUNCEMENT':
      return {
        ...state,
        announcements: state.announcements.filter(ann => ann.id !== action.payload)
      };
    default:
      return state;
  }
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { user } = useAuth();

  // Charger toutes les données au démarrage
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  // Fonction pour rafraîchir toutes les données
  const refreshData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await Promise.all([
        fetchEmployees(),
        fetchTimeOffRequests(),
        fetchDocuments(),
        fetchAnnouncements()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des données' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // EMPLOYEES CRUD
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('first_name');

      if (error) throw error;

      const formattedEmployees = data?.map(emp => ({
        id: emp.id,
        employeeId: emp.employee_id,
        email: emp.email,
        firstName: emp.first_name,
        lastName: emp.last_name,
        role: emp.role,
        department: emp.department,
        position: emp.position,
        phone: emp.phone || '',
        startDate: emp.start_date,
        birthDate: emp.birth_date,
        status: emp.status,
        address: emp.address || '',
        salary: emp.salary,
        emergencyContact: emp.emergency_contact || { name: '', relationship: '', phone: '' }
      })) || [];

      dispatch({ type: 'SET_EMPLOYEES', payload: formattedEmployees });
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          employee_id: employeeData.employeeId,
          email: employeeData.email,
          first_name: employeeData.firstName,
          last_name: employeeData.lastName,
          role: employeeData.role,
          department: employeeData.department,
          position: employeeData.position,
          phone: employeeData.phone,
          start_date: employeeData.startDate,
          birth_date: employeeData.birthDate,
          status: employeeData.status,
          address: employeeData.address,
          salary: employeeData.salary,
          emergency_contact: employeeData.emergencyContact
        })
        .select()
        .single();

      if (error) throw error;

      const formattedEmployee = {
        id: data.id,
        employeeId: data.employee_id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        department: data.department,
        position: data.position,
        phone: data.phone || '',
        startDate: data.start_date,
        birthDate: data.birth_date,
        status: data.status,
        address: data.address || '',
        salary: data.salary,
        emergencyContact: data.emergency_contact || { name: '', relationship: '', phone: '' }
      };

      dispatch({ type: 'ADD_EMPLOYEE', payload: formattedEmployee });
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          employee_id: updates.employeeId,
          email: updates.email,
          first_name: updates.firstName,
          last_name: updates.lastName,
          role: updates.role,
          department: updates.department,
          position: updates.position,
          phone: updates.phone,
          start_date: updates.startDate,
          birth_date: updates.birthDate,
          status: updates.status,
          address: updates.address,
          salary: updates.salary,
          emergency_contact: updates.emergencyContact
        })
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_EMPLOYEE', payload: { id, data: updates } });
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  };

  const importEmployees = async (employees: Employee[]) => {
    try {
      const employeesToInsert = employees.map(emp => ({
        employee_id: emp.employeeId,
        email: emp.email,
        first_name: emp.firstName,
        last_name: emp.lastName,
        role: emp.role,
        department: emp.department,
        position: emp.position,
        phone: emp.phone,
        start_date: emp.startDate,
        birth_date: emp.birthDate,
        status: emp.status,
        address: emp.address,
        salary: emp.salary,
        emergency_contact: emp.emergencyContact
      }));

      const { error } = await supabase
        .from('employees')
        .insert(employeesToInsert);

      if (error) throw error;

      await fetchEmployees();
    } catch (error) {
      console.error('Error importing employees:', error);
      throw error;
    }
  };

  // TIME OFF REQUESTS CRUD
  const fetchTimeOffRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .select(`
          *,
          employee:employees!time_off_requests_employee_id_fkey(first_name, last_name),
          approver:employees!time_off_requests_approved_by_fkey(first_name, last_name)
        `)
        .order('request_date', { ascending: false });

      if (error) throw error;

      const formattedRequests = data?.map(req => ({
        id: req.id,
        employeeId: req.employee_id,
        employeeName: `${req.employee?.first_name} ${req.employee?.last_name}`,
        type: req.type,
        startDate: req.start_date,
        endDate: req.end_date,
        days: req.days,
        reason: req.reason || '',
        status: req.status,
        requestDate: req.request_date,
        approvedBy: req.approver ? `${req.approver.first_name} ${req.approver.last_name}` : undefined,
        approvedDate: req.approved_date
      })) || [];

      dispatch({ type: 'SET_TIME_OFF_REQUESTS', payload: formattedRequests });
    } catch (error) {
      console.error('Error fetching time off requests:', error);
    }
  };

  const addTimeOffRequest = async (requestData: Omit<TimeOffRequest, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .insert({
          employee_id: requestData.employeeId,
          type: requestData.type,
          start_date: requestData.startDate,
          end_date: requestData.endDate,
          days: requestData.days,
          reason: requestData.reason,
          status: requestData.status,
          request_date: requestData.requestDate
        })
        .select()
        .single();

      if (error) throw error;

      const formattedRequest = {
        id: data.id,
        employeeId: data.employee_id,
        employeeName: requestData.employeeName,
        type: data.type,
        startDate: data.start_date,
        endDate: data.end_date,
        days: data.days,
        reason: data.reason || '',
        status: data.status,
        requestDate: data.request_date,
        approvedBy: undefined,
        approvedDate: undefined
      };

      dispatch({ type: 'ADD_TIME_OFF_REQUEST', payload: formattedRequest });
    } catch (error) {
      console.error('Error adding time off request:', error);
      throw error;
    }
  };

  const updateTimeOffRequest = async (id: string, updates: Partial<TimeOffRequest>) => {
    try {
      const { error } = await supabase
        .from('time_off_requests')
        .update({
          type: updates.type,
          start_date: updates.startDate,
          end_date: updates.endDate,
          days: updates.days,
          reason: updates.reason,
          status: updates.status
        })
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_TIME_OFF_REQUEST', payload: { id, data: updates } });
    } catch (error) {
      console.error('Error updating time off request:', error);
      throw error;
    }
  };

  const deleteTimeOffRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('time_off_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_TIME_OFF_REQUEST', payload: id });
    } catch (error) {
      console.error('Error deleting time off request:', error);
      throw error;
    }
  };

  const approveTimeOffRequest = async (id: string, approvedBy: string) => {
    try {
      // Trouver l'ID de l'approbateur
      const { data: approver } = await supabase
        .from('employees')
        .select('id')
        .eq('first_name', approvedBy.split(' ')[0])
        .eq('last_name', approvedBy.split(' ')[1])
        .single();

      const { error } = await supabase
        .from('time_off_requests')
        .update({
          status: 'approved',
          approved_by: approver?.id,
          approved_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      dispatch({ 
        type: 'UPDATE_TIME_OFF_REQUEST', 
        payload: { 
          id, 
          data: { 
            status: 'approved', 
            approvedBy, 
            approvedDate: new Date().toISOString() 
          } 
        } 
      });
    } catch (error) {
      console.error('Error approving time off request:', error);
      throw error;
    }
  };

  const rejectTimeOffRequest = async (id: string, approvedBy: string) => {
    try {
      // Trouver l'ID de l'approbateur
      const { data: approver } = await supabase
        .from('employees')
        .select('id')
        .eq('first_name', approvedBy.split(' ')[0])
        .eq('last_name', approvedBy.split(' ')[1])
        .single();

      const { error } = await supabase
        .from('time_off_requests')
        .update({
          status: 'rejected',
          approved_by: approver?.id,
          approved_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      dispatch({ 
        type: 'UPDATE_TIME_OFF_REQUEST', 
        payload: { 
          id, 
          data: { 
            status: 'rejected', 
            approvedBy, 
            approvedDate: new Date().toISOString() 
          } 
        } 
      });
    } catch (error) {
      console.error('Error rejecting time off request:', error);
      throw error;
    }
  };

  // DOCUMENTS CRUD
  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          employee:employees!documents_employee_id_fkey(first_name, last_name),
          uploader:employees!documents_uploaded_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDocuments = data?.map(doc => ({
        id: doc.id,
        employeeId: doc.employee_id,
        employeeName: `${doc.employee?.first_name} ${doc.employee?.last_name}`,
        name: doc.name,
        type: doc.type,
        size: doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : '0 KB',
        uploadDate: doc.created_at,
        url: doc.file_path || '#'
      })) || [];

      dispatch({ type: 'SET_DOCUMENTS', payload: formattedDocuments });
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const addDocument = async (documentData: Omit<Document, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          employee_id: documentData.employeeId,
          name: documentData.name,
          type: documentData.type,
          file_path: documentData.url,
          file_size: parseInt(documentData.size.replace(/[^\d]/g, '')) * 1024,
          uploaded_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      const formattedDocument = {
        id: data.id,
        employeeId: data.employee_id,
        employeeName: documentData.employeeName,
        name: data.name,
        type: data.type,
        size: documentData.size,
        uploadDate: data.created_at,
        url: data.file_path || '#'
      };

      dispatch({ type: 'ADD_DOCUMENT', payload: formattedDocument });
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          name: updates.name,
          type: updates.type,
          file_path: updates.url
        })
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_DOCUMENT', payload: { id, data: updates } });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_DOCUMENT', payload: id });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  // ANNOUNCEMENTS CRUD
  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:employees!announcements_author_id_fkey(first_name, last_name)
        `)
        .eq('is_active', true)
        .order('published_at', { ascending: false });

      if (error) throw error;

      const formattedAnnouncements = data?.map(ann => ({
        id: ann.id,
        title: ann.title,
        content: ann.content,
        author: `${ann.author?.first_name} ${ann.author?.last_name}`,
        date: ann.published_at,
        priority: ann.priority
      })) || [];

      dispatch({ type: 'SET_ANNOUNCEMENTS', payload: formattedAnnouncements });
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const addAnnouncement = async (announcementData: Omit<Announcement, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: announcementData.title,
          content: announcementData.content,
          priority: announcementData.priority,
          author_id: user?.id,
          is_active: true,
          published_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const formattedAnnouncement = {
        id: data.id,
        title: data.title,
        content: data.content,
        author: announcementData.author,
        date: data.published_at,
        priority: data.priority
      };

      dispatch({ type: 'ADD_ANNOUNCEMENT', payload: formattedAnnouncement });
    } catch (error) {
      console.error('Error adding announcement:', error);
      throw error;
    }
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: updates.title,
          content: updates.content,
          priority: updates.priority
        })
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_ANNOUNCEMENT', payload: { id, data: updates } });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_ANNOUNCEMENT', payload: id });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  };

  const value: DataContextType = {
    ...state,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    importEmployees,
    addTimeOffRequest,
    updateTimeOffRequest,
    deleteTimeOffRequest,
    approveTimeOffRequest,
    rejectTimeOffRequest,
    addDocument,
    updateDocument,
    deleteDocument,
    uploadFile,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    refreshData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};