/*
  # Création de la table time_off_requests

  1. Nouvelles Tables
    - `time_off_requests`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key vers employees)
      - `type` (enum: types de congés)
      - `start_date` (date)
      - `end_date` (date)
      - `days` (integer)
      - `reason` (text, optional)
      - `status` (enum: pending, approved, rejected)
      - `request_date` (timestamp)
      - `approved_by` (uuid, optional)
      - `approved_date` (timestamp, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur la table `time_off_requests`
    - Politiques pour l'accès basé sur les rôles
*/

-- Créer les types enum pour les congés
DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM (
        'Congés payés',
        'Congé maladie payé', 
        'Congé sans solde',
        'Solde de récupération',
        'Autorisation exceptionnelle de sortie',
        'Autorisation professionnelle',
        'Télétravail',
        'Décès d''un proche',
        'Mariage du travailleur',
        'Décès du père, de la mère ou d''un enfant',
        'Congé Paternité',
        'Circoncision d''un enfant',
        'Décès du conjoint'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Créer la table time_off_requests
CREATE TABLE IF NOT EXISTS time_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  reason text,
  status leave_status NOT NULL DEFAULT 'pending',
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

-- Politiques RLS simplifiées
CREATE POLICY "Users can view own requests"
  ON time_off_requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own requests"
  ON time_off_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own pending requests"
  ON time_off_requests
  FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Politiques pour admins/RH (temporaires)
CREATE POLICY "Authenticated users can view all requests"
  ON time_off_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update all requests"
  ON time_off_requests
  FOR UPDATE
  TO authenticated
  USING (true);

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

-- Trigger pour calculer automatiquement les jours
CREATE TRIGGER calculate_time_off_days
  BEFORE INSERT OR UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_leave_days();