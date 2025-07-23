import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { FileText, Upload, Download, Eye, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const Documents: React.FC = () => {
  const { user } = useAuth();
  const { documents, addDocument } = useData();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'other',
    file: null as File | null
  });

  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === '' || doc.type === typeFilter;
    const hasAccess = isAdminOrHR || doc.employeeId === user?.id;
    return matchesSearch && matchesType && hasAccess;
  });

  const documentTypes = [
    { value: '', label: 'All Types' },
    { value: 'contract', label: 'Contract' },
    { value: 'cv', label: 'CV/Resume' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' }
  ];

  const uploadTypes = [
    { value: 'contract', label: 'Contract' },
    { value: 'cv', label: 'CV/Resume' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' }
  ];

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    uploadDocumentWithFile();
  };

  const uploadDocumentWithFile = async () => {
    try {
      if (!formData.file || !user) return;

      // Upload du fichier vers Supabase Storage
      const fileName = `${Date.now()}_${formData.file.name}`;
      const filePath = `documents/${user.id}/${fileName}`;
      
      const fileUrl = await uploadFile(formData.file, filePath);
      
      // Ajouter le document à la base de données
      await addDocument({
        ...formData,
        employeeId: user.id,
        employeeName: `${user.firstName} ${user.lastName}`,
        size: `${Math.round(formData.file.size / 1024)} KB`,
        uploadDate: new Date().toISOString(),
        url: fileUrl
      });

      setIsUploadModalOpen(false);
      setFormData({ name: '', type: 'other', file: null });
      alert('Document uploadé avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload du document');
    }
  };

  const handleViewDocument = (doc: any) => {
    if (doc.url && doc.url !== '#') {
      // Ouvrir dans un nouvel onglet
      window.open(doc.url, '_blank');
    } else {
      // Simuler la visualisation pour les documents mockés
      alert(`Visualisation du document: ${doc.name}\n\nDans une vraie application, ceci ouvrirait le document dans un viewer PDF ou téléchargerait le fichier.`);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      if (doc.url && doc.url !== '#' && !doc.url.includes('mock')) {
        // Document réel - télécharger depuis Supabase
        await downloadFile(doc.url, doc.name);
      } else {
        // Document mocké
        alert(`Téléchargement non disponible: ${doc.name}\n\n` +
              `Ce document fait partie des données de démonstration.\n` +
              `Pour télécharger de vrais documents, uploadez d'abord un fichier.`);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du document');
    }
  };

  const getTypeIcon = (type: string) => {
    return <FileText className="h-6 w-6 text-gray-400" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800';
      case 'cv': return 'bg-green-100 text-green-800';
      case 'certificate': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage employee documents and files</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="mt-4 sm:mt-0">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search documents..."
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
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
      </div>

      {/* Documents List */}
      <Card>
        <CardContent className="p-0">
          {filteredDocuments.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        {getTypeIcon(doc.type)}
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{doc.name}</h4>
                        <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(doc.type)}`}>
                            {doc.type}
                          </span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>Uploaded {format(parseISO(doc.uploadDate), 'MMM dd, yyyy')}</span>
                          {isAdminOrHR && (
                            <>
                              <span>•</span>
                              <span>{doc.employeeName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || typeFilter ? 'Try adjusting your search criteria.' : 'Get started by uploading a document.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document"
        size="md"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Input
            label="Document Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Employment Contract"
          />
          
          <Select
            label="Document Type"
            options={uploadTypes}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG up to 10MB
                </p>
              </div>
            </div>
            {formData.file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {formData.file.name}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Documents;