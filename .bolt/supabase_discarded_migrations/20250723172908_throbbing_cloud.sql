-- Configuration du stockage Supabase pour les documents
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket pour les documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- 2. Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- 3. Politique pour permettre la lecture des documents
CREATE POLICY "Users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- 4. Politique pour permettre la suppression (admin/hr seulement)
CREATE POLICY "Admin and HR can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'hr')
  )
);

-- 5. Politique pour permettre la mise à jour
CREATE POLICY "Admin and HR can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'hr')
  )
);