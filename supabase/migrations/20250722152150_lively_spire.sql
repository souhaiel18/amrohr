/*
  # Création de la table documents

  1. Nouvelles Tables
    - `documents`
      - `id` (uuid, clé primaire)
      - `employee_id` (uuid, référence vers employees)
      - `name` (text)
      - `type` (enum: contract, cv, certificate, other)
      - `file_path` (text, chemin vers le fichier dans le storage)
      - `file_size` (bigint, taille en bytes)
      - `mime_type` (text)
      - `upload_date` (timestamptz)
      - `uploaded_by` (uuid, référence vers employees)
      - `is_public` (boolean, si le document est visible par tous)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur la table `documents`
    - Politique pour que les employés puissent voir leurs propres documents
    - Politique pour que les admins/RH puissent voir tous les documents
    - Politique pour que les employés puissent uploader leurs propres documents
*/

-- Créer le type enum pour les types de documents
CREATE TYPE document_type AS ENUM ('contract', 'cv', 'certificate', 'other');

-- Créer la table documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  type document_type NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  upload_date timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid NOT NULL REFERENCES employees(id),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_employee_id ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Activer RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Politique pour que les employés puissent voir leurs propres documents
CREATE POLICY "Employees can view own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    employee_id = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique pour que les employés puissent voir les documents publics
CREATE POLICY "Everyone can view public documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Politique pour que les admins et RH puissent voir tous les documents
CREATE POLICY "Admins and HR can view all documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique pour que les employés puissent uploader leurs propres documents
CREATE POLICY "Employees can upload own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
    AND uploaded_by = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique pour que les admins et RH puissent uploader des documents pour tous
CREATE POLICY "Admins and HR can upload documents for all"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique pour que les employés puissent modifier leurs propres documents
CREATE POLICY "Employees can update own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (
    employee_id = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique pour que les admins et RH puissent modifier tous les documents
CREATE POLICY "Admins and HR can update all documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique pour que les employés puissent supprimer leurs propres documents
CREATE POLICY "Employees can delete own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (
    employee_id = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique pour que les admins puissent supprimer tous les documents
CREATE POLICY "Admins can delete all documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();