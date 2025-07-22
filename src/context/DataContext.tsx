import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Employee, TimeOffRequest, Document, Announcement } from '../types';
import { mockEmployees, mockTimeOffRequests, mockDocuments, mockAnnouncements } from '../data/mockData';

interface DataState {
  employees: Employee[];
  timeOffRequests: TimeOffRequest[];
  documents: Document[];
  announcements: Announcement[];
}

interface DataContextType extends DataState {
  // Employee CRUD
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  importEmployees: (employees: Employee[]) => void;
  
  // Time Off CRUD
  addTimeOffRequest: (request: Omit<TimeOffRequest, 'id'>) => void;
  updateTimeOffRequest: (id: string, request: Partial<TimeOffRequest>) => void;
  deleteTimeOffRequest: (id: string) => void;
  approveTimeOffRequest: (id: string, approvedBy: string) => void;
  rejectTimeOffRequest: (id: string, approvedBy: string) => void;
  
  // Document CRUD
  addDocument: (document: Omit<Document, 'id'>) => void;
  updateDocument: (id: string, document: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  
  // Announcement CRUD
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
}

type DataAction = 
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: { id: string; data: Partial<Employee> } }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'IMPORT_EMPLOYEES'; payload: Employee[] }
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
  employees: mockEmployees,
  timeOffRequests: mockTimeOffRequests,
  documents: mockDocuments,
  announcements: mockAnnouncements
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const dataReducer = (state: DataState, action: DataAction): DataState => {
  switch (action.type) {
    case 'ADD_EMPLOYEE':
      return {
        ...state,
        employees: [...state.employees, action.payload]
      };
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
    case 'IMPORT_EMPLOYEES':
      return {
        ...state,
        employees: [...state.employees, ...action.payload]
      };
    case 'ADD_TIME_OFF_REQUEST':
      return {
        ...state,
        timeOffRequests: [...state.timeOffRequests, action.payload]
      };
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
      return {
        ...state,
        documents: [...state.documents, action.payload]
      };
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
      return {
        ...state,
        announcements: [...state.announcements, action.payload]
      };
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

  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const employee: Employee = {
      ...employeeData,
      id: generateId()
    };
    dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    dispatch({ type: 'UPDATE_EMPLOYEE', payload: { id, data } });
  };

  const deleteEmployee = (id: string) => {
    dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
  };

  const importEmployees = (employees: Employee[]) => {
    const employeesWithIds = employees.map(emp => ({
      ...emp,
      id: emp.id || generateId()
    }));
    dispatch({ type: 'IMPORT_EMPLOYEES', payload: employeesWithIds });
  };

  const addTimeOffRequest = (requestData: Omit<TimeOffRequest, 'id'>) => {
    const request: TimeOffRequest = {
      ...requestData,
      id: generateId()
    };
    dispatch({ type: 'ADD_TIME_OFF_REQUEST', payload: request });
  };

  const updateTimeOffRequest = (id: string, data: Partial<TimeOffRequest>) => {
    dispatch({ type: 'UPDATE_TIME_OFF_REQUEST', payload: { id, data } });
  };

  const deleteTimeOffRequest = (id: string) => {
    dispatch({ type: 'DELETE_TIME_OFF_REQUEST', payload: id });
  };

  const approveTimeOffRequest = (id: string, approvedBy: string) => {
    const data = {
      status: 'approved' as const,
      approvedBy,
      approvedDate: new Date().toISOString()
    };
    dispatch({ type: 'UPDATE_TIME_OFF_REQUEST', payload: { id, data } });
  };

  const rejectTimeOffRequest = (id: string, approvedBy: string) => {
    const data = {
      status: 'rejected' as const,
      approvedBy,
      approvedDate: new Date().toISOString()
    };
    dispatch({ type: 'UPDATE_TIME_OFF_REQUEST', payload: { id, data } });
  };

  const addDocument = (documentData: Omit<Document, 'id'>) => {
    const document: Document = {
      ...documentData,
      id: generateId()
    };
    dispatch({ type: 'ADD_DOCUMENT', payload: document });
  };

  const updateDocument = (id: string, data: Partial<Document>) => {
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { id, data } });
  };

  const deleteDocument = (id: string) => {
    dispatch({ type: 'DELETE_DOCUMENT', payload: id });
  };

  const addAnnouncement = (announcementData: Omit<Announcement, 'id'>) => {
    const announcement: Announcement = {
      ...announcementData,
      id: generateId()
    };
    dispatch({ type: 'ADD_ANNOUNCEMENT', payload: announcement });
  };

  const updateAnnouncement = (id: string, data: Partial<Announcement>) => {
    dispatch({ type: 'UPDATE_ANNOUNCEMENT', payload: { id, data } });
  };

  const deleteAnnouncement = (id: string) => {
    dispatch({ type: 'DELETE_ANNOUNCEMENT', payload: id });
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
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
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