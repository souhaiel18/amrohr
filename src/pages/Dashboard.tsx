import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, Calendar, Clock, Gift, TrendingUp } from 'lucide-react';
import { format, isWithinInterval, addDays, parseISO } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { employees, timeOffRequests, announcements } = useData();
  
  const totalEmployees = employees.filter(emp => emp.status === 'active').length;
  const pendingRequests = timeOffRequests.filter(req => req.status === 'pending').length;
  
  // Calculate upcoming birthdays (next 30 days)
  const today = new Date();
  const next30Days = addDays(today, 30);
  const upcomingBirthdays = employees.filter(emp => {
    const birthDate = parseISO(emp.birthDate);
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
    
    return isWithinInterval(thisYearBirthday, { start: today, end: next30Days }) ||
           isWithinInterval(nextYearBirthday, { start: today, end: next30Days });
  });

  const stats = [
    {
      name: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Pending Requests',
      value: pendingRequests,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      name: 'Upcoming Birthdays',
      value: upcomingBirthdays.length,
      icon: Gift,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      name: 'Active Projects',
      value: 8,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue, {user?.firstName}!
        </h1>
        <p className="text-gray-600">Voici ce qui se passe dans votre entreprise aujourd'hui.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-xl sm:text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Time Off Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
              Demandes de congés récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeOffRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{request.employeeName}</p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(request.startDate), 'MMM dd')} - {format(parseISO(request.endDate), 'MMM dd')}
                    </p>
                  </div>
                  <div className="flex items-center">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Company Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>Annonces de l'entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {announcement.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{announcement.author}</span>
                        <span className="mx-2">•</span>
                        <span>{format(parseISO(announcement.date), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      announcement.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : announcement.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {announcement.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-pink-600" />
              Anniversaires à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcomingBirthdays.map((employee) => {
                const birthDate = parseISO(employee.birthDate);
                const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                const displayDate = thisYearBirthday < today 
                  ? new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())
                  : thisYearBirthday;
                  
                return (
                  <div key={employee.id} className="flex items-center p-3 bg-pink-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-pink-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(displayDate, 'MMM dd')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;