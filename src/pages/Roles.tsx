import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { mockEmployees } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Settings, Eye } from 'lucide-react';

const Roles: React.FC = () => {
  const { user } = useAuth();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const roles = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access including user management and system configuration',
      permissions: ['View all employees', 'Edit all profiles', 'Manage time off requests', 'System administration', 'User management'],
      color: 'bg-purple-100 text-purple-800',
      icon: Settings,
      count: mockEmployees.filter(emp => emp.role === 'admin').length
    },
    {
      id: 'hr',
      name: 'Human Resources',
      description: 'Access to employee data, time off management, and HR operations',
      permissions: ['View all employees', 'Edit employee profiles', 'Manage time off requests', 'Document management', 'Generate reports'],
      color: 'bg-blue-100 text-blue-800',
      icon: Users,
      count: mockEmployees.filter(emp => emp.role === 'hr').length
    },
    {
      id: 'employee',
      name: 'Employee',
      description: 'Standard employee access to personal information and basic features',
      permissions: ['View own profile', 'Edit own profile', 'Submit time off requests', 'View documents', 'View directory'],
      color: 'bg-gray-100 text-gray-800',
      icon: Eye,
      count: mockEmployees.filter(emp => emp.role === 'employee').length
    }
  ];

  const roleOptions = [
    { value: '', label: 'Select a role...' },
    { value: 'admin', label: 'Administrator' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'employee', label: 'Employee' }
  ];

  const employeeOptions = [
    { value: '', label: 'Select an employee...' },
    ...mockEmployees.map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName} (${emp.email})`
    }))
  ];

  const handleAssignRole = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would update the backend here
    console.log('Assigning role:', selectedRole, 'to employee:', selectedEmployee);
    setIsAssignModalOpen(false);
    setSelectedEmployee('');
    setSelectedRole('');
  };

  const canManageRoles = user?.role === 'admin';

  if (!canManageRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only administrators can manage user roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Roles Management</h1>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        <Button onClick={() => setIsAssignModalOpen(true)} className="mt-4 sm:mt-0">
          <Shield className="h-4 w-4 mr-2" />
          Assign Role
        </Button>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 mr-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>{role.name}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.color}`}>
                        {role.count} users
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions:</h4>
                  <ul className="space-y-1">
                    {role.permissions.map((permission, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Role Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Role Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockEmployees.map((employee) => {
                  const role = roles.find(r => r.id === employee.role);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.department}</div>
                        <div className="text-sm text-gray-500">{employee.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role?.color}`}>
                          {role?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(employee.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee.id);
                            setSelectedRole(employee.role);
                            setIsAssignModalOpen(true);
                          }}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          Change Role
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Role Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedEmployee('');
          setSelectedRole('');
        }}
        title="Assign Role"
        size="md"
      >
        <form onSubmit={handleAssignRole} className="space-y-4">
          <Select
            label="Employee"
            options={employeeOptions}
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            required
          />
          
          <Select
            label="Role"
            options={roleOptions}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            required
          />

          {selectedRole && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {roles.find(r => r.id === selectedRole)?.name} Permissions:
              </h4>
              <ul className="space-y-1">
                {roles.find(r => r.id === selectedRole)?.permissions.map((permission, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2" />
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedEmployee('');
                setSelectedRole('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Assign Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Roles;