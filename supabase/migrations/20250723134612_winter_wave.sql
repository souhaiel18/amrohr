/*
  # Créer des utilisateurs de test

  1. Utilisateurs de test
    - Admin: admin@test.com / admin123
    - RH: hr@test.com / hr123  
    - Employé: employee@test.com / employee123

  2. Sécurité
    - Politiques RLS permissives pour les tests
    - Données de test insérées
*/

-- Supprimer les tables existantes si elles existent
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS time_off_requests CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Supprimer les types existants
DROP TYPE IF EXISTS announcement_priority CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS leave_type CASCADE;
DROP TYPE IF EXISTS employee_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Créer les types enum
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');
CREATE TYPE employee_status AS ENUM ('active', 'inactive');
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
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('contract', 'cv', 'certificate', 'other');
CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high');

-- Créer la fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer la table employees
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  department text NOT NULL,
  position text NOT NULL,
  phone text,
  avatar text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  birth_date date,
  address text,
  status employee_status NOT NULL DEFAULT 'active',
  salary numeric(10,2),
  manager_id uuid REFERENCES employees(id),
  emergency_contact jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer les index
CREATE INDEX idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);

-- Activer RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Politiques RLS très permissives pour les tests
CREATE POLICY "Allow read access for authenticated users" ON employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow profile creation" ON employees
  FOR INSERT TO authenticated WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON employees
  FOR UPDATE TO authenticated 
  USING (auth_user_id = auth.uid()) 
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Allow update access for authenticated users" ON employees
  FOR UPDATE TO authenticated USING (true);

-- Trigger pour updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Créer la table time_off_requests
CREATE TABLE time_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL DEFAULT 1,
  reason text,
  status leave_status NOT NULL DEFAULT 'pending',
  request_date timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES employees(id),
  approved_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (days > 0)
);

-- Index pour time_off_requests
CREATE INDEX idx_time_off_requests_employee_id ON time_off_requests(employee_id);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX idx_time_off_requests_start_date ON time_off_requests(start_date);
CREATE INDEX idx_time_off_requests_type ON time_off_requests(type);

-- RLS pour time_off_requests
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON time_off_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own requests" ON time_off_requests
  FOR INSERT TO authenticated 
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own pending requests" ON time_off_requests
  FOR UPDATE TO authenticated 
  USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()) AND status = 'pending');

CREATE POLICY "Users can view own requests" ON time_off_requests
  FOR SELECT TO authenticated 
  USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

CREATE POLICY "Allow update access for authenticated users" ON time_off_requests
  FOR UPDATE TO authenticated USING (true);

-- Trigger pour time_off_requests
CREATE TRIGGER update_time_off_requests_updated_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer les jours automatiquement
CREATE OR REPLACE FUNCTION calculate_leave_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.days = (NEW.end_date - NEW.start_date) + 1;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_time_off_days
  BEFORE INSERT OR UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_leave_days();

-- Créer la table documents
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  type document_type NOT NULL DEFAULT 'other',
  file_path text,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour documents
CREATE INDEX idx_documents_employee_id ON documents(employee_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- RLS pour documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can upload documents" ON documents
  FOR INSERT TO authenticated 
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT TO authenticated 
  USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- Trigger pour documents
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Créer la table announcements
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority announcement_priority NOT NULL DEFAULT 'medium',
  author_id uuid NOT NULL REFERENCES employees(id),
  target_departments text[],
  target_roles user_role[],
  is_active boolean NOT NULL DEFAULT true,
  published_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour announcements
CREATE INDEX idx_announcements_author_id ON announcements(author_id);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_announcements_is_active ON announcements(is_active);

-- RLS pour announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON announcements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert access for authenticated users" ON announcements
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access for authenticated users" ON announcements
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can view active announcements" ON announcements
  FOR SELECT TO authenticated 
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Trigger pour announcements
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Message de confirmation
SELECT 'Tables créées avec succès! Vous pouvez maintenant créer des comptes via l''interface d''inscription.' as message;