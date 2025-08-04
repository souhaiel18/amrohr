import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import ImportModal from '../components/ImportModal';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  Plus, 
  Upload, 
  Edit, 
  Trash, 
  Search,
  Users,
  Calendar,
  FileText,
  Megaphone
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const DataManagement: React.FC = () => {
  const { user } = useAuth();
  const {
    employees,
    timeOffRequests,
    documents,
    announcements,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    importEmployees,
    addTimeOffRequest,
    updateTimeOffRequest,
    deleteTimeOffRequest,
    addDocument,
    updateDocument,
    deleteDocument,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  } = useData();

  const [activeTab, setActiveTab] = useState('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

  if (!isAdminOrHR) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions pour gérer les données.</p>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'employees', name: 'Employés', icon: Users, count: employees.length },
    { id: 'timeoff', name: 'Congés', icon: Calendar, count: timeOffRequests.length },
    { id: 'documents', name: 'Documents', icon: FileText, count: documents.length },
    { id: 'announcements', name: 'Annonces', icon: Megaphone, count: announcements.length }
  ];

  const getFilteredData = () => {
    let data: any[] = [];
    switch (activeTab) {
      case 'employees':
        data = employees;
        break;
      case 'timeoff':
        data = timeOffRequests;
        break;
      case 'documents':
        data = documents;
        break;
      case 'announcements':
        data = announcements;
        break;
    }
    
    if (searchTerm) {
      data = data.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    return data;
  };

  const handleAdd = () => {
    setFormData(getEmptyFormData());
    setIsAddModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      switch (activeTab) {
        case 'employees':
          deleteEmployee(id);
          break;
        case 'timeoff':
          deleteTimeOffRequest(id);
          break;
        case 'documents':
          deleteDocument(id);
          break;
        case 'announcements':
          deleteAnnouncement(id);
          break;
      }
    }
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    switch (activeTab) {
      case 'employees':
        addEmployee(formData);
        break;
      case 'timeoff':
        addTimeOffRequest({
          ...formData,
          requestDate: new Date().toISOString(),
          status: 'pending'
        });
        break;
      case 'documents':
        addDocument({
          ...formData,
          uploadDate: new Date().toISOString()
        });
        break;
      case 'announcements':
        addAnnouncement({
          ...formData,
          date: new Date().toISOString()
        });
        break;
    }
    setIsAddModalOpen(false);
    setFormData({});
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    switch (activeTab) {
      case 'employees':
        updateEmployee(editingItem.id, formData);
        break;
      case 'timeoff':
        updateTimeOffRequest(editingItem.id, formData);
        break;
      case 'documents':
        updateDocument(editingItem.id, formData);
        break;
      case 'announcements':
        updateAnnouncement(editingItem.id, formData);
        break;
    }
    setIsEditModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleImport = (data: any[]) => {
    switch (activeTab) {
      case 'employees':
        importEmployees(data);
        break;
      // Add other import handlers as needed
    }
    setIsImportModalOpen(false);
  };

  const getEmptyFormData = () => {
    switch (activeTab) {
      case 'employees':
        return {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          department: '',
          position: '',
          role: 'employee',
          startDate: '',
          birthDate: '',
          status: 'active',
          address: '',
          employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
          emergencyContact: {
            name: '',
            relationship: '',
            phone: ''
          }
        };
      case 'timeoff':
        return {
          employeeId: '',
          employeeName: '',
          type: 'paid',
          startDate: '',
          endDate: '',
          days: 0,
          reason: ''
        };
      case 'documents':
        return {
          employeeId: '',
          employeeName: '',
          name: '',
          type: 'other',
          size: '',
          url: ''
        };
      case 'announcements':
        return {
          title: '',
          content: '',
          author: user?.firstName + ' ' + user?.lastName || '',
          priority: 'medium'
        };
      default:
        return {};
    }
  };

  const getTemplateData = () => {
    switch (activeTab) {
      case 'employees':
        return [employees[0]].filter(Boolean);
      case 'timeoff':
        return [timeOffRequests[0]].filter(Boolean);
      case 'documents':
        return [documents[0]].filter(Boolean);
      case 'announcements':
        return [announcements[0]].filter(Boolean);
      default:
        return [];
    }
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'employees':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Nom"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Téléphone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                label="ID Employé"
                value={formData.employeeId || ''}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Département"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
              <Input
                label="Poste"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Rôle"
                options={[
                  { value: 'employee', label: 'Employé' },
                  { value: 'hr', label: 'RH' },
                  { value: 'admin', label: 'Admin' }
                ]}
                value={formData.role || 'employee'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              />
              <Select
                label="Statut"
                options={[
                  { value: 'active', label: 'Actif' },
                  { value: 'inactive', label: 'Inactif' }
                ]}
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date de début"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <Input
                label="Date de naissance"
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />
            </div>
            <Input
              label="Adresse"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>
        );
      case 'announcements':
        return (
          <div className="space-y-4">
            <Input
              label="Titre"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Auteur"
                value={formData.author || ''}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
              <Select
                label="Priorité"
                options={[
                  { value: 'low', label: 'Basse' },
                  { value: 'medium', label: 'Moyenne' },
                  { value: 'high', label: 'Haute' }
                ]}
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
              />
            </div>
          </div>
        );
      default:
        return <div>Formulaire non disponible pour cette entité</div>;
    }
  };

  const renderTable = () => {
    const data = getFilteredData();
    
    if (data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune donnée trouvée</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(data[0]).slice(0, 6).map((key) => (
                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {key}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {Object.entries(item).slice(0, 6).map(([key, value]) => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof value === 'string' && value.includes('T') && value.includes('Z') 
                      ? format(parseISO(value), 'dd/MM/yyyy')
                      : typeof value === 'object' 
                      ? JSON.stringify(value)
                      : String(value)
                    }
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-emerald-600 hover:text-emerald-900"
                  >
                    <Edit className="h-4 w-4 inline mr-1" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash className="h-4 w-4 inline mr-1" />
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Données</h1>
        <p className="text-gray-600">Gérer toutes les données du système avec fonctions CRUD complètes</p>
      </div>

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
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
              {activeTab === 'employees' && (
                <Button onClick={() => setIsImportModalOpen(true)} variant="secondary">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {tabs.find(t => t.id === activeTab)?.name} ({getFilteredData().length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderTable()}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Ajouter ${tabs.find(t => t.id === activeTab)?.name.slice(0, -1)}`}
        size="lg"
      >
        <form onSubmit={handleSubmitAdd}>
          {renderFormFields()}
          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Modifier ${tabs.find(t => t.id === activeTab)?.name.slice(0, -1)}`}
        size="lg"
      >
        <form onSubmit={handleSubmitEdit}>
          {renderFormFields()}
          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              Sauvegarder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        title={`Importer ${tabs.find(t => t.id === activeTab)?.name}`}
        templateData={getTemplateData()}
        entityName={activeTab}
      />
    </div>
  );
};

export default DataManagement;