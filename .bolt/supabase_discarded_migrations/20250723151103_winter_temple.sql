/*
  # Création du système de documents administratifs

  1. Nouvelles Tables
    - `payroll_documents`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key vers employees)
      - `document_name` (text)
      - `document_type` (enum: payslip, contract, certificate, other)
      - `file_path` (text)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `uploaded_by` (uuid, foreign key vers employees)
      - `upload_date` (timestamp)
      - `is_confidential` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur `payroll_documents`
    - Politique pour que les employés voient uniquement leurs documents
    - Politique pour que les RH/Admin voient tous les documents
    - Politique pour que les managers voient les documents de leurs subordonnés
*/

-- Créer le type enum pour les documents administratifs
CREATE TYPE payroll_document_type AS ENUM (
  'payslip',
  'contract', 
  'certificate',
  'administrative',
  'other'
);

-- Créer la table des documents administratifs
CREATE TABLE IF NOT EXISTS payroll_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type payroll_document_type NOT NULL DEFAULT 'other',
  file_path text,
  file_size bigint,
  mime_type text,
  uploaded_by uuid NOT NULL REFERENCES employees(id),
  upload_date timestamptz DEFAULT now(),
  is_confidential boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_payroll_documents_employee_id ON payroll_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_type ON payroll_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_uploaded_by ON payroll_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_upload_date ON payroll_documents(upload_date);

-- Activer RLS
ALTER TABLE payroll_documents ENABLE ROW LEVEL SECURITY;

-- Politique : Les employés voient uniquement leurs propres documents
CREATE POLICY "Employees can view own payroll documents"
  ON payroll_documents
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique : Les RH et Admin voient tous les documents
CREATE POLICY "HR and Admin can view all payroll documents"
  ON payroll_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Politique : Les managers voient les documents de leurs subordonnés
CREATE POLICY "Managers can view subordinates payroll documents"
  ON payroll_documents
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees 
      WHERE manager_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Politique : Seuls RH/Admin/Managers peuvent uploader des documents
CREATE POLICY "HR Admin Managers can upload payroll documents"
  ON payroll_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND (
        role IN ('hr', 'admin') 
        OR id IN (
          SELECT manager_id FROM employees WHERE id = employee_id
        )
      )
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_payroll_documents_updated_at
  BEFORE UPDATE ON payroll_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();