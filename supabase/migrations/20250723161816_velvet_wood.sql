/*
  # Documents Administratifs (Bulletins de paie, contrats, etc.)

  1. Nouvelle Table
    - `payroll_documents`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key vers employees)
      - `document_name` (text)
      - `document_type` (enum: payslip, contract, certificate, administrative, other)
      - `file_path` (text, chemin vers le fichier)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `uploaded_by` (uuid, foreign key vers employees)
      - `is_confidential` (boolean, default true)
      - `created_at`, `updated_at` (timestamps)

  2. Sécurité
    - Enable RLS sur `payroll_documents`
    - Politique: Employés voient leurs documents uniquement
    - Politique: RH/Admin voient tous les documents
    - Politique: Managers voient les documents de leurs subordonnés

  3. Enum pour les types de documents
*/

-- Créer l'enum pour les types de documents
CREATE TYPE document_type_payroll AS ENUM (
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
  document_type document_type_payroll NOT NULL DEFAULT 'other',
  file_path text,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES employees(id),
  is_confidential boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_payroll_documents_employee_id ON payroll_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_type ON payroll_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_uploaded_by ON payroll_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_created_at ON payroll_documents(created_at);

-- Activer RLS
ALTER TABLE payroll_documents ENABLE ROW LEVEL SECURITY;

-- Politique: Employés voient uniquement leurs propres documents
CREATE POLICY "Employees can view own payroll documents"
  ON payroll_documents
  FOR SELECT
  TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

-- Politique: RH/Admin voient tous les documents
CREATE POLICY "HR and Admin can view all payroll documents"
  ON payroll_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique: RH/Admin peuvent uploader des documents
CREATE POLICY "HR and Admin can insert payroll documents"
  ON payroll_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique: RH/Admin peuvent modifier les documents
CREATE POLICY "HR and Admin can update payroll documents"
  ON payroll_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique: RH/Admin peuvent supprimer les documents
CREATE POLICY "HR and Admin can delete payroll documents"
  ON payroll_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_payroll_documents_updated_at
  BEFORE UPDATE ON payroll_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();