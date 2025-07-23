import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { Target, Plus, Edit, Eye, TrendingUp, Calendar, User, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Mock data pour la démo
const mockObjectives = [
  {
    id: '1',
    employeeId: '3',
    employeeName: 'Mike Johnson',
    title: 'Améliorer les performances du système',
    description: 'Optimiser les requêtes de base de données pour réduire le temps de réponse de 30%',
    targetDate: '2024-12-31',
    progressPercentage: 65,
    status: 'active' as const,
    createdBy: '2',
    createdByName: 'Sarah Wilson',
    isEmployeeProposed: false,
    managerEvaluation: '',
    employeeNotes: 'Travail en cours sur l\'indexation des tables principales',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    employeeId: '3',
    employeeName: 'Mike Johnson',
    title: 'Formation en architecture cloud',
    description: 'Obtenir une certification AWS Solutions Architect',
    targetDate: '2024-06-30',
    progressPercentage: 30,
    status: 'active' as const,
    createdBy: '3',
    createdByName: 'Mike Johnson',
    isEmployeeProposed: true,
    managerEvaluation: '',
    employeeNotes: 'Inscription faite, début des cours en ligne',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T16:45:00Z'
  }
];

const Objectives: React.FC = () => {
  const { user } = useAuth();
  const [objectives] = useState(mockObjectives);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<any>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    title: '',
    description: '',
    targetDate: '',
    isEmployeeProposed: false
  });
  const [progressData, setProgressData] = useState({
    progressPercentage: 0,
    employeeNotes: ''
  });

  const isManager = user?.role === 'admin' || user?.role === 'hr'; // Simplifié pour la démo
  
  // Filtrer les objectifs selon les permissions
  const filteredObjectives = objectives.filter(obj => {
    if (isManager) {
      return true; // Manager voit tous les objectifs (ou ceux de ses subordonnés)
    } else {
      return obj.employeeId === user?.id; // Employé voit ses objectifs
    }
  });

  const statusOptions = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'active', label: 'Actif' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' }
  ];

  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Add objective:', formData);
    setIsAddModalOpen(false);
    setFormData({
      employeeId: '',
      title: '',
      description: '',
      targetDate: '',
      isEmployeeProposed: false
    });
  };

  const handleEditObjective = (objective: any) => {
    setEditingObjective(objective);
    setFormData({
      employeeId: objective.employeeId,
      title: objective.title,
      description: objective.description,
      targetDate: objective.targetDate,
      isEmployeeProposed: objective.isEmployeeProposed
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProgress = (objective: any) => {
    setEditingObjective(objective);
    setProgressData({
      progressPercentage: objective.progressPercentage,
      employeeNotes: objective.employeeNotes || ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Objectifs & Évaluations</h1>
          <p className="text-gray-600">
            {isManager 
              ? 'Gérer les objectifs de vos équipes'
              : 'Suivre vos objectifs annuels et votre progression'
            }
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          {!isManager && (
            <Button 
              onClick={() => {
                setFormData({ ...formData, isEmployeeProposed: true, employeeId: user?.id || '' });
                setIsAddModalOpen(true);
              }}
              variant="secondary"
            >
              <Target className="h-4 w-4 mr-2" />
              Proposer Objectif
            </Button>
          )}
          {isManager && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Objectif
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Objectifs</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredObjectives.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Terminés</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredObjectives.filter(obj => obj.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En cours</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredObjectives.filter(obj => obj.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-purple-100">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Auto-proposés</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredObjectives.filter(obj => obj.isEmployeeProposed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objectives List */}
      <div className="space-y-4">
        {filteredObjectives.map((objective) => (
          <Card key={objective.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{objective.title}</h3>
                    <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(objective.status)}`}>
                      {statusOptions.find(s => s.value === objective.status)?.label}
                    </span>
                    {objective.isEmployeeProposed && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Auto-proposé
                      </span>
                    )}
                  </div>
                  
                  {objective.description && (
                    <p className="text-sm text-gray-600 mb-3">{objective.description}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Échéance: {format(parseISO(objective.targetDate), 'dd/MM/yyyy')}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="h-4 w-4 mr-2" />
                      Créé par: {objective.createdByName}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progression</span>
                      <span className="text-sm text-gray-500">{objective.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(objective.progressPercentage)}`}
                        style={{ width: `${objective.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Employee Notes */}
                  {objective.employeeNotes && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Notes de l'employé:</h4>
                      <p className="text-sm text-blue-800">{objective.employeeNotes}</p>
                    </div>
                  )}

                  {/* Manager Evaluation */}
                  {objective.managerEvaluation && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 mb-1">Évaluation du manager:</h4>
                      <p className="text-sm text-green-800">{objective.managerEvaluation}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {!isManager && objective.employeeId === user?.id && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleUpdateProgress(objective)}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Mettre à jour
                    </Button>
                  )}
                  
                  {isManager && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleEditObjective(objective)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Évaluer
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredObjectives.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun objectif</h3>
              <p className="text-gray-500 mb-4">
                {isManager 
                  ? 'Commencez par créer des objectifs pour vos équipes.'
                  : 'Aucun objectif n\'a été défini pour le moment.'
                }
              </p>
              {isManager && (
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier objectif
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Objective Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingObjective(null);
        }}
        title={isEditModalOpen ? 'Modifier l\'objectif' : 'Ajouter un objectif'}
        size="lg"
      >
        <form onSubmit={handleAddObjective} className="space-y-4">
          {isManager && (
            <Select
              label="Employé"
              options={[
                { value: '', label: 'Sélectionner un employé...' },
                { value: '3', label: 'Mike Johnson' },
                { value: '4', label: 'Emily Davis' },
                { value: '5', label: 'David Brown' }
              ]}
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
            />
          )}

          <Input
            label="Titre de l'objectif"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="ex: Améliorer les performances du système"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez l'objectif en détail..."
            />
          </div>

          <Input
            label="Date d'échéance"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            required
          />

          {!isManager && (
            <div className="flex items-center">
              <input
                id="employee-proposed"
                type="checkbox"
                checked={formData.isEmployeeProposed}
                onChange={(e) => setFormData({ ...formData, isEmployeeProposed: e.target.checked })}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="employee-proposed" className="ml-2 block text-sm text-gray-900">
                Objectif auto-proposé
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingObjective(null);
              }}
            >
              Annuler
            </Button>
            <Button type="submit">
              {isEditModalOpen ? 'Modifier' : 'Créer'} l'objectif
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Progress Modal */}
      <Modal
        isOpen={!!editingObjective && !isEditModalOpen}
        onClose={() => setEditingObjective(null)}
        title="Mettre à jour la progression"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progression (%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progressData.progressPercentage}
              onChange={(e) => setProgressData({ ...progressData, progressPercentage: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-medium">{progressData.progressPercentage}%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes sur l'avancement
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              value={progressData.employeeNotes}
              onChange={(e) => setProgressData({ ...progressData, employeeNotes: e.target.value })}
              placeholder="Décrivez votre progression, les difficultés rencontrées..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingObjective(null)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                console.log('Update progress:', progressData);
                setEditingObjective(null);
              }}
            >
              Sauvegarder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Objectives;