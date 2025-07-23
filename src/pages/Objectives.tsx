import React, { useState } from 'react';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Target, Plus, Edit, Eye, TrendingUp, Calendar, User, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Objective {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  target_date?: string;
  progress_percentage: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_by: string;
  is_employee_proposed: boolean;
  manager_evaluation?: string;
  employee_notes?: string;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  creator_name?: string;
}

const Objectives: React.FC = () => {
  const { user } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<any>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    title: '',
    description: '',
    target_date: '',
    is_employee_proposed: false
  });
  const [progressData, setProgressData] = useState({
    progress_percentage: 0,
    employee_notes: ''
  });

  const isManager = user?.role === 'admin' || user?.role === 'hr'; // Simplifié pour la démo
  
  useEffect(() => {
    fetchObjectives();
    if (isManager) {
      fetchEmployees();
    }
  }, [user]);

  const fetchObjectives = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('objectives')
        .select(`
          *,
          employee:employees!objectives_employee_id_fkey(first_name, last_name),
          creator:employees!objectives_created_by_fkey(first_name, last_name)
        `);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching objectives:', error);
        return;
      }

      const formattedObjectives = data?.map(obj => ({
        ...obj,
        employee_name: `${obj.employee?.first_name} ${obj.employee?.last_name}`,
        creator_name: `${obj.creator?.first_name} ${obj.creator?.last_name}`
      })) || [];

      setObjectives(formattedObjectives);
    } catch (error) {
      console.error('Error fetching objectives:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
        .eq('status', 'active')
        .order('first_name');

      if (error) {
        console.error('Error fetching employees:', error);
        return;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Filtrer les objectifs selon les permissions
  const filteredObjectives = objectives.filter(obj => {
    if (isManager) {
      return true; // Manager voit tous les objectifs (ou ceux de ses subordonnés)
    } else {
      return obj.employee_id === user?.id; // Employé voit ses objectifs
    }
  });

  const employeeOptions = [
    { value: '', label: 'Sélectionner un employé...' },
    ...employees.map(emp => ({
      value: emp.id,
      label: `${emp.first_name} ${emp.last_name} (${emp.email})`
    }))
  ];

  const statusOptions = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'active', label: 'Actif' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' }
  ];

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('objectives')
        .insert({
          employee_id: formData.employee_id,
          title: formData.title,
          description: formData.description,
          target_date: formData.target_date,
          created_by: user?.id,
          is_employee_proposed: formData.is_employee_proposed,
          status: 'active'
        });

      if (error) {
        console.error('Error creating objective:', error);
        alert('Erreur lors de la création de l\'objectif');
        return;
      }

      // Rafraîchir la liste
      await fetchObjectives();
      
      // Fermer le modal et réinitialiser
      setIsAddModalOpen(false);
      setFormData({
        employee_id: '',
        title: '',
        description: '',
        target_date: '',
        is_employee_proposed: false
      });

      alert('Objectif créé avec succès !');
    } catch (error) {
      console.error('Error creating objective:', error);
      alert('Erreur lors de la création de l\'objectif');
    }
  };

  const handleEditObjective = (objective: any) => {
    setEditingObjective(objective);
    setFormData({
      employee_id: objective.employee_id,
      title: objective.title,
      description: objective.description,
      target_date: objective.target_date,
      is_employee_proposed: objective.is_employee_proposed
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProgress = (objective: any) => {
    setEditingObjective(objective);
    setProgressData({
      progress_percentage: objective.progress_percentage,
      employee_notes: objective.employee_notes || ''
    });
  };

  const updateProgress = async () => {
    try {
      const { error } = await supabase
        .from('objectives')
        .update({
          progress_percentage: progressData.progress_percentage,
          employee_notes: progressData.employee_notes
        })
        .eq('id', editingObjective.id);

      if (error) {
        console.error('Error updating progress:', error);
        alert('Erreur lors de la mise à jour');
        return;
      }

      // Rafraîchir la liste
      await fetchObjectives();
      setEditingObjective(null);
      alert('Progression mise à jour !');
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Erreur lors de la mise à jour');
    }
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
                setFormData({ ...formData, is_employee_proposed: true, employee_id: user?.id || '' });
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
                  {filteredObjectives.filter(obj => obj.is_employee_proposed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objectives List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des objectifs...</p>
          </div>
        ) : (
        <>
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
                    {objective.is_employee_proposed && (
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
                      Échéance: {objective.target_date ? format(parseISO(objective.target_date), 'dd/MM/yyyy') : 'Non définie'}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="h-4 w-4 mr-2" />
                      Créé par: {objective.creator_name}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progression</span>
                      <span className="text-sm text-gray-500">{objective.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(objective.progress_percentage)}`}
                        style={{ width: `${objective.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Employee Notes */}
                  {objective.employee_notes && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Notes de l'employé:</h4>
                      <p className="text-sm text-blue-800">{objective.employee_notes}</p>
                    </div>
                  )}

                  {/* Manager Evaluation */}
                  {objective.manager_evaluation && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 mb-1">Évaluation du manager:</h4>
                      <p className="text-sm text-green-800">{objective.manager_evaluation}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {!isManager && objective.employee_id === user?.id && (
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
        </>
        )}

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
              options={employeeOptions}
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
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
            value={formData.target_date}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
            required
          />

          {!isManager && (
            <div className="flex items-center">
              <input
                id="employee-proposed"
                type="checkbox"
                checked={formData.is_employee_proposed}
                onChange={(e) => setFormData({ ...formData, is_employee_proposed: e.target.checked })}
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
              value={progressData.progress_percentage}
              onChange={(e) => setProgressData({ ...progressData, progress_percentage: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-medium">{progressData.progress_percentage}%</span>
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
              value={progressData.employee_notes}
              onChange={(e) => setProgressData({ ...progressData, employee_notes: e.target.value })}
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
              onClick={updateProgress}
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