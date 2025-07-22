import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  FileText, 
  Clock,
  Edit,
  Save,
  X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Input from '../components/ui/Input';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { employees, timeOffRequests, documents } = useData();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const employee = employees.find(emp => emp.id === id);
  const employeeRequests = timeOffRequests.filter(req => req.employeeId === id);
  const employeeDocuments = documents.filter(doc => doc.employeeId === id);

  if (!employee) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Employee not found</h2>
      </div>
    );
  }

  const canEdit = user?.role === 'admin' || user?.role === 'hr' || user?.id === id;

  const handleEdit = () => {
    setEditData({ ...employee });
    setIsEditing(true);
  };

  const handleSave = () => {
    // In a real app, you would save to backend here
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
  };

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: User },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'timeoff', name: 'Time Off', icon: Calendar },
    { id: 'history', name: 'History', icon: Clock }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'hr': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center">
                <span className="text-2xl font-medium text-white">
                  {employee.firstName[0]}{employee.lastName[0]}
                </span>
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-lg text-gray-600">{employee.position}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                    {employee.role}
                  </span>
                  <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                </div>
              </div>
            </div>
            {canEdit && !isEditing && (
              <Button onClick={handleEdit} variant="secondary" className="mt-4 sm:mt-0">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            {isEditing && (
              <div className="flex space-x-2 mt-4 sm:mt-0">
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="secondary" size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <Input
                    label="Email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                  <Input
                    label="Phone"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                  <Input
                    label="Address"
                    value={editData.address || ''}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm">{employee.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm">{employee.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm">{employee.address}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <p className="text-sm text-gray-900 mt-1">{employee.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Position</label>
                  <p className="text-sm text-gray-900 mt-1">{employee.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {format(parseISO(employee.startDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Employee ID</label>
                  <p className="text-sm text-gray-900 mt-1">{employee.employeeId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {format(parseISO(employee.birthDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <Input
                    label="Name"
                    value={editData.emergencyContact?.name || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      emergencyContact: { ...editData.emergencyContact, name: e.target.value }
                    })}
                  />
                  <Input
                    label="Relationship"
                    value={editData.emergencyContact?.relationship || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      emergencyContact: { ...editData.emergencyContact, relationship: e.target.value }
                    })}
                  />
                  <Input
                    label="Phone"
                    value={editData.emergencyContact?.phone || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      emergencyContact: { ...editData.emergencyContact, phone: e.target.value }
                    })}
                  />
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900 mt-1">{employee.emergencyContact.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Relationship</label>
                    <p className="text-sm text-gray-900 mt-1">{employee.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900 mt-1">{employee.emergencyContact.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {employeeDocuments.length > 0 ? (
              <div className="space-y-4">
                {employeeDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.type} • {doc.size} • Uploaded {format(parseISO(doc.uploadDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No documents uploaded</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'timeoff' && (
        <Card>
          <CardHeader>
            <CardTitle>Time Off History</CardTitle>
          </CardHeader>
          <CardContent>
            {employeeRequests.length > 0 ? (
              <div className="space-y-4">
                {employeeRequests.map((request) => (
                  <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900 capitalize">{request.type} Leave</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        request.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{format(parseISO(request.startDate), 'MMM dd, yyyy')} - {format(parseISO(request.endDate), 'MMM dd, yyyy')}</p>
                      <p>{request.days} day{request.days !== 1 ? 's' : ''}</p>
                      {request.reason && <p className="mt-2">Reason: {request.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No time off requests</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Employment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{employee.position}</span>
                  <span className="text-sm text-gray-500">Current</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{employee.department}</p>
                  <p>Since {format(parseISO(employee.startDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;