import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  Shield,
  FolderOpen,
  Database,
  Target,
  FileCheck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Directory', href: '/directory', icon: Users },
    { name: 'Time Off', href: '/time-off', icon: Calendar },
    { name: 'Documents', href: '/documents', icon: FolderOpen },
    { name: 'Docs Administratifs', href: '/payroll-documents', icon: FileCheck },
    { name: 'Objectifs', href: '/objectives', icon: Target },
    { name: 'Job Roles', href: '/roles', icon: Shield },
    { name: 'Gestion Données', href: '/data-management', icon: Database },
    ...(user?.role === 'admin' || user?.role === 'hr' ? [
      { name: 'Admin Panel', href: '/admin', icon: Settings }
    ] : [])
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-emerald-600">AmroHR</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="mt-4 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2.5 mb-1 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-emerald-50 text-emerald-700 border-r-2 border-emerald-500'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <Bell className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName[0]}{user?.lastName[0]}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="secondary"
                  size="sm"
                  className="ml-3"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-3 sm:p-4 lg:p-5">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;