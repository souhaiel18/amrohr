import React, { useState } from 'react';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FileText, Upload, Download, Eye, Search, Shield, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface PayrollDocument {
  id: string;
  employee_id: string;
  document_name: string;
  document_type: 'payslip' | 'contract' | 'certificate' | 'administrative' | 'other';
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  upload_date: string;
  is_confidential: boolean;
  employee_name?: string;
  uploader_name?: string;
}

const PayrollDocuments: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<PayrollDocument[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formData, setFormData] = useState({
    employee_id: '',
    document_name: '',
    document_type: 'other',
    file: null as File | null,
    is_confidential: true
  });

  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';
  
  useEffect(() => {
    fetchDocuments();
    
    if (isAdminOrHR) {
      fetchEmployees();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('payroll_documents')
        .select(`
          *,
          employee:employees!payroll_documents_employee_id_fkey(first_name, last_name),
          uploader:employees!payroll_documents_uploaded_by_fkey(first_name, last_name)
        `);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      const formattedDocuments = data?.map(doc => ({
        ...doc,
        employee_name: `${doc.employee?.first_name} ${doc.employee?.last_name}`,
        uploader_name: `${doc.uploader?.first_name} ${doc.uploader?.last_name}`
      })) || [];

      setDocuments(formattedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
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

  // Filtrer les documents selon les permissions
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.employee_name && doc.employee_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === '' || doc.document_type === typeFilter;
    
    // Règles d'accès
    let hasAccess = false;
    if (isAdminOrHR) {
      hasAccess = true; // RH/Admin voient tout
    } else {
      hasAccess = doc.employee_id === user?.id; // Employé voit ses documents
    }
    
    return matchesSearch && matchesType && hasAccess;
  });

  const employeeOptions = [
    { value: '', label: 'Sélectionner un employé...' },
    ...employees.map(emp => ({
      value: emp.id,
      label: `${emp.first_name} ${emp.last_name} (${emp.email})`
    }))
  ];

  const documentTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'payslip', label: 'Bulletin de paie' },
    { value: 'contract', label: 'Contrat' },
    { value: 'certificate', label: 'Attestation' },
    { value: 'administrative', label: 'Administratif' },
    { value: 'other', label: 'Autre' }
  ];

  const uploadTypes = [
    { value: 'payslip', label: 'Bulletin de paie' },
    { value: 'contract', label: 'Contrat' },
    { value: 'certificate', label: 'Attestation' },
    { value: 'administrative', label: 'Administratif' },
    { value: 'other', label: 'Autre' }
  ];

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    uploadDocument();
  };

  const uploadDocument = async () => {
    try {
      if (!formData.file || !formData.employee_id || !formData.document_name) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const { data, error } = await supabase
        .from('payroll_documents')
        .insert({
          employee_id: formData.employee_id,
          document_name: formData.document_name,
          document_type: formData.document_type,
          file_size: formData.file.size,
          mime_type: formData.file.type,
          uploaded_by: user?.id,
          is_confidential: formData.is_confidential
        });

      if (error) {
        console.error('Error uploading document:', error);
        alert('Erreur lors de l\'upload du document');
        return;
      }

      // Rafraîchir la liste
      await fetchDocuments();
      
      // Fermer le modal et réinitialiser
      setIsUploadModalOpen(false);
      setFormData({
        employee_id: '',
        document_name: '',
        document_type: 'other',
        file: null,
        is_confidential: true
      });

      alert('Document uploadé avec succès !');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Erreur lors de l\'upload du document');
    }
  };

  const getTypeIcon = (type: string) => {
    return <FileText className="h-6 w-6 text-gray-400" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payslip': return 'bg-green-100 text-green-800';
      case 'contract': return 'bg-blue-100 text-blue-800';
      case 'certificate': return 'bg-purple-100 text-purple-800';
      case 'administrative': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents Administratifs</h1>
          <p className="text-gray-600">
            {isAdminOrHR 
              ? 'Gérer les documents administratifs de tous les employés'
              : 'Consulter vos documents administratifs'
            }
          </p>
        </div>
        {isAdminOrHR && (
          <Button onClick={() => setIsUploadModalOpen(true)} className="mt-4 sm:mt-0">
            <Upload className="h-4 w-4 mr-2" />
            Uploader Document
          </Button>
        )}
      </div>

      {/* Sécurité Notice */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Sécurité des documents</h4>
              <p className="text-sm text-blue-700 mt-1">
                {isAdminOrHR 
                  ? 'Vous avez accès à tous les documents. Respectez la confidentialité des données.'
                  : 'Vous ne voyez que vos propres documents administratifs pour des raisons de confidentialité.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={documentTypes}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Filter className="h-4 w-4 mr-1" />
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des documents...</p>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        {getTypeIcon(doc.document_type)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900">{doc.document_name}</h4>
                          {doc.is_confidential && (
                            <Shield className="h-4 w-4 text-red-500 ml-2" title="Document confidentiel" />
                          )}
                        </div>
                        <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(doc.document_type)}`}>
                            {documentTypes.find(t => t.value === doc.document_type)?.label}
                          </span>
                          <span>{formatFileSize(doc.file_size || 0)}</span>
                          <span>•</span>
                          <span>Uploadé le {format(parseISO(doc.upload_date), 'dd/MM/yyyy')}</span>
                          {isAdminOrHR && (
                            <>
                              <span>•</span>
                              <span>{doc.employee_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="secondary" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || typeFilter 
                  ? 'Essayez de modifier vos critères de recherche.' 
                  : isAdminOrHR 
                    ? 'Commencez par uploader un document.'
                    : 'Aucun document administratif disponible.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Modal */}
      {isAdminOrHR && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Uploader un Document Administratif"
          size="md"
        >
          <form onSubmit={handleUpload} className="space-y-4">
            <Select
              label="Employé"
              options={employeeOptions}
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              required
            />

            <Input
              label="Nom du document"
              value={formData.document_name}
              onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
              required
              placeholder="ex: Bulletin de paie - Janvier 2024"
            />
            
            <Select
              label="Type de document"
              options={uploadTypes}
              value={formData.document_type}
              onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                      <span>Sélectionner un fichier</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1">ou glisser-déposer</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG jusqu'à 10MB
                  </p>
                </div>
              </div>
              {formData.file && (
                <p className="mt-2 text-sm text-gray-600">
                  Sélectionné: {formData.file.name}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="confidential"
                type="checkbox"
                checked={formData.is_confidential}
                onChange={(e) => setFormData({ ...formData, is_confidential: e.target.checked })}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="confidential" className="ml-2 block text-sm text-gray-900">
                Document confidentiel
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                Uploader
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PayrollDocuments;