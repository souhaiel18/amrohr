-- Migration: Créer la table time_off_requests avec gestion des types existants

-- Créer le type enum pour les types de congés (seulement s'il n'existe pas)
DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('paid', 'sick', 'unpaid', 'personal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Créer le type enum pour le statut des demandes (seulement s'il n'existe pas)
DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Créer la fonction update_updated_at_column si elle n'existe pas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer la table time_off_requests
CREATE TABLE IF NOT EXISTS time_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  reason text,
  status request_status NOT NULL DEFAULT 'pending',
  request_date timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES employees(id),
  approved_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (days > 0)
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_time_off_requests_employee_id ON time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_start_date ON time_off_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_type ON time_off_requests(type);

-- Activer RLS
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Employees can view own requests" ON time_off_requests;
DROP POLICY IF EXISTS "Admins and HR can view all requests" ON time_off_requests;
DROP POLICY IF EXISTS "Employees can create own requests" ON time_off_requests;
DROP POLICY IF EXISTS "Employees can update own pending requests" ON time_off_requests;
DROP POLICY IF EXISTS "Admins and HR can update all requests" ON time_off_requests;
DROP POLICY IF EXISTS "Employees can delete own pending requests" ON time_off_requests;
DROP POLICY IF EXISTS "Admins can delete all requests" ON time_off_requests;

-- Politique pour que les employés puissent voir leurs propres demandes
CREATE POLICY "Employees can view own requests"
  ON time_off_requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique pour que les admins et RH puissent voir toutes les demandes
CREATE POLICY "Admins and HR can view all requests"
  ON time_off_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique pour que les employés puissent créer leurs propres demandes
CREATE POLICY "Employees can create own requests"
  ON time_off_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique pour que les employés puissent modifier leurs propres demandes (seulement si pending)
CREATE POLICY "Employees can update own pending requests"
  ON time_off_requests
  FOR UPDATE
  TO authenticated
  USING (
    employee_id = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    employee_id = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Politique pour que les admins et RH puissent modifier toutes les demandes
CREATE POLICY "Admins and HR can update all requests"
  ON time_off_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique pour que les employés puissent supprimer leurs propres demandes (seulement si pending)
CREATE POLICY "Employees can delete own pending requests"
  ON time_off_requests
  FOR DELETE
  TO authenticated
  USING (
    employee_id = (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Politique pour que les admins puissent supprimer toutes les demandes
CREATE POLICY "Admins can delete all requests"
  ON time_off_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS update_time_off_requests_updated_at ON time_off_requests;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_time_off_requests_updated_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer automatiquement les jours
CREATE OR REPLACE FUNCTION calculate_leave_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.days = (NEW.end_date - NEW.start_date) + 1;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS calculate_time_off_days ON time_off_requests;

-- Trigger pour calculer automatiquement les jours
CREATE TRIGGER calculate_time_off_days
  BEFORE INSERT OR UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_leave_days();