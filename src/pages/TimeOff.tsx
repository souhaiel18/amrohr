import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { mockTimeOffRequests } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Plus } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

const TimeOff: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'paid',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const userRequests = mockTimeOffRequests.filter(req => req.employeeId === user?.id);

  const leaveTypes = [
    { value: 'paid', label: 'Paid Time Off' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' },
    { value: 'personal', label: 'Personal Leave' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would submit to backend here
    console.log('Submitting time off request:', formData);
    setIsModalOpen(false);
    setFormData({ type: 'paid', startDate: '', endDate: '', reason: '' });
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    return differenceInDays(parseISO(end), parseISO(start)) + 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'unpaid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Off</h1>
          <p className="text-gray-600">Manage your time off requests</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Request Time Off
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available PTO</p>
                <p className="text-2xl font-semibold text-gray-900">15 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-green-100">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Used This Year</p>
                <p className="text-2xl font-semibold text-gray-900">5 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {userRequests.filter(req => req.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Off Requests */}
      <Card>
        <CardHeader>
          <CardTitle>My Time Off Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {userRequests.length > 0 ? (
            <div className="space-y-4">
              {userRequests.map((request) => (
                <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(request.type)}`}>
                          {request.type} leave
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-900 font-medium mb-1">
                        {format(parseISO(request.startDate), 'MMM dd, yyyy')} - {format(parseISO(request.endDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {request.days} day{request.days !== 1 ? 's' : ''} • Requested {format(parseISO(request.requestDate), 'MMM dd, yyyy')}
                      </div>
                      {request.reason && (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>Reason:</strong> {request.reason}
                        </div>
                      )}
                      {request.approvedBy && (
                        <div className="text-sm text-gray-600 mt-1">
                          Approved by {request.approvedBy} on {format(parseISO(request.approvedDate!), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">No time off requests yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Time Off Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Time Off"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Leave Type"
            options={leaveTypes}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          {formData.startDate && formData.endDate && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Total days: <span className="font-medium">{calculateDays(formData.startDate, formData.endDate)}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Brief description of your time off request..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimeOff;