/*
  # Système d'Objectifs et Évaluations

  1. Nouvelle Table
    - `objectives`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key vers employees)
      - `title` (text, titre de l'objectif)
      - `description` (text, description détaillée)
      - `target_date` (date, échéance)
      - `progress_percentage` (integer, 0-100)
      - `status` (enum: draft, active, completed, cancelled)
      - `created_by` (uuid, qui a créé l'objectif)
      - `is_employee_proposed` (boolean, proposé par l'employé)
      - `manager_evaluation` (text, évaluation du manager)
      - `employee_notes` (text, notes de l'employé)
      - `created_at`, `updated_at` (timestamps)

  2. Sécurité
    - Enable RLS sur `objectives`
    - Politique: Employés voient leurs objectifs uniquement
    - Politique: Managers voient les objectifs de leurs subordonnés
    - Politique: RH/Admin voient tous les objectifs

  3. Contraintes et validations
*/

-- Créer l'enum pour le statut des objectifs
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

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_objectives_employee_id ON objectives(employee_id);
CREATE INDEX IF NOT EXISTS idx_objectives_status ON objectives(status);
CREATE INDEX IF NOT EXISTS idx_objectives_created_by ON objectives(created_by);
CREATE INDEX IF NOT EXISTS idx_objectives_target_date ON objectives(target_date);
CREATE INDEX IF NOT EXISTS idx_objectives_is_employee_proposed ON objectives(is_employee_proposed);

-- Activer RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

-- Politique: Employés voient uniquement leurs propres objectifs
CREATE POLICY "Employees can view own objectives"
  ON objectives
  FOR SELECT
  TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

-- Politique: RH/Admin voient tous les objectifs
CREATE POLICY "HR and Admin can view all objectives"
  ON objectives
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique: Employés peuvent proposer leurs propres objectifs
CREATE POLICY "Employees can propose own objectives"
  ON objectives
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
    AND is_employee_proposed = true
  );

-- Politique: RH/Admin peuvent créer des objectifs pour tous
CREATE POLICY "HR and Admin can create objectives for all"
  ON objectives
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique: Employés peuvent mettre à jour leurs propres objectifs (progression et notes uniquement)
CREATE POLICY "Employees can update own objectives progress"
  ON objectives
  FOR UPDATE
  TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

-- Politique: RH/Admin peuvent modifier tous les objectifs
CREATE POLICY "HR and Admin can update all objectives"
  ON objectives
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique: RH/Admin peuvent supprimer les objectifs
CREATE POLICY "HR and Admin can delete objectives"
  ON objectives
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
CREATE TRIGGER update_objectives_updated_at
  BEFORE UPDATE ON objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();