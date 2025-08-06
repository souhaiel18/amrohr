/*
  # Création du système d'objectifs et évaluations

  1. Nouvelles Tables
    - `objectives`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key vers employees)
      - `title` (text)
      - `description` (text)
      - `target_date` (date)
      - `progress_percentage` (integer, 0-100)
      - `status` (enum: draft, active, completed, cancelled)
      - `created_by` (uuid, foreign key vers employees - manager)
      - `is_employee_proposed` (boolean)
      - `manager_evaluation` (text)
      - `employee_notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur `objectives`
    - Politique pour que les employés voient leurs objectifs
    - Politique pour que les managers voient les objectifs de leurs subordonnés
    - Politique pour que les RH/Admin voient tous les objectifs
*/

-- Créer le type enum pour le statut des objectifs
CREATE TYPE objective_status AS ENUM (
  'draft',
  'active', 
  'completed',
  'cancelled'
);

-- Créer la table des objectifs
CREATE TABLE IF NOT EXISTS objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_date date,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status objective_status DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES employees(id),
  is_employee_proposed boolean DEFAULT false,
  manager_evaluation text,
  employee_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_objectives_employee_id ON objectives(employee_id);
CREATE INDEX IF NOT EXISTS idx_objectives_created_by ON objectives(created_by);
CREATE INDEX IF NOT EXISTS idx_objectives_status ON objectives(status);
CREATE INDEX IF NOT EXISTS idx_objectives_target_date ON objectives(target_date);

-- Activer RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

-- Politique : Les employés voient leurs propres objectifs
CREATE POLICY "Employees can view own objectives"
  ON objectives
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique : Les employés peuvent mettre à jour le pourcentage et leurs notes
CREATE POLICY "Employees can update progress and notes"
  ON objectives
  FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique : Les employés peuvent proposer leurs objectifs
CREATE POLICY "Employees can propose objectives"
  ON objectives
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
    AND is_employee_proposed = true
  );

-- Politique : Les managers voient les objectifs de leurs subordonnés
CREATE POLICY "Managers can view subordinates objectives"
  ON objectives
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

-- Politique : Les managers peuvent gérer les objectifs de leurs subordonnés
CREATE POLICY "Managers can manage subordinates objectives"
  ON objectives
  FOR ALL
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees 
      WHERE manager_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
      )
    )
    OR created_by IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique : Les RH et Admin voient tous les objectifs
CREATE POLICY "HR and Admin can view all objectives"
  ON objectives
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_objectives_updated_at
  BEFORE UPDATE ON objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();