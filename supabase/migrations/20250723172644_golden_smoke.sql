/*
  # Créer le bucket de stockage pour les documents

  1. Bucket
    - Créer le bucket 'documents' pour stocker les fichiers
    - Configurer les politiques d'accès

  2. Politiques RLS
    - Permettre l'upload aux utilisateurs authentifiés
    - Permettre la lecture selon les permissions
*/

-- Créer le bucket documents s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Politique pour permettre la lecture des documents
CREATE POLICY "Users can view documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Politique pour permettre la suppression aux propriétaires
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);