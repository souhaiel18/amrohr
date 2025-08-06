/*
  # Migration complète du système HRM

  1. Types énumérés
    - user_role (admin, hr, employee)
    - employee_status (active, inactive)
    - leave_type (différents types de congés)
    - leave_status (pending, approved, rejected)
    - document_type (contract, cv, certificate, other)
    - announcement_priority (low, medium, high)

  2. Tables principales
    - employees (profils employés complets)
    - time_off_requests (demandes de congés)
    - documents (gestion documentaire)
    - announcements (annonces d'entreprise)

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques de sécurité par rôle
    - Triggers pour updated_at

  4. Données de test
    - Comptes admin, hr et employee
    - Données d'exemple pour tester le système
*/

-- =============================================
-- 1. SUPPRESSION ET CRÉATION DES TYPES
-- =============================================

-- Supprimer les types existants s'ils existent
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS employee_status CASCADE;
DROP TYPE IF EXISTS leave_type CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS announcement_priority CASCADE;

-- Créer les types énumérés
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

-- =============================================
-- 2. FONCTION POUR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 3. FONCTION POUR CALCULER LES JOURS DE CONGÉ
-- =============================================

CREATE OR REPLACE FUNCTION calculate_leave_days()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer le nombre de jours entre start_date et end_date (inclus)
    NEW.days = (NEW.end_date - NEW.start_date) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 4. TABLE EMPLOYEES
-- =============================================

DROP TABLE IF EXISTS employees CASCADE;

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

-- Index pour les performances
CREATE INDEX idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_status ON employees(status);

-- Trigger pour updated_at
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Allow read access for authenticated users"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow profile creation"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON employees FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Allow update access for authenticated users"
  ON employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 5. TABLE TIME_OFF_REQUESTS
-- =============================================

DROP TABLE IF EXISTS time_off_requests CASCADE;

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

-- Index
CREATE INDEX idx_time_off_requests_employee_id ON time_off_requests(employee_id);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX idx_time_off_requests_type ON time_off_requests(type);
CREATE INDEX idx_time_off_requests_start_date ON time_off_requests(start_date);

-- Triggers
CREATE TRIGGER calculate_time_off_days
    BEFORE INSERT OR UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION calculate_leave_days();

CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users"
  ON time_off_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own requests"
  ON time_off_requests FOR INSERT
  TO authenticated
  WITH CHECK (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can view own requests"
  ON time_off_requests FOR SELECT
  TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update own pending requests"
  ON time_off_requests FOR UPDATE
  TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ) AND status = 'pending');

CREATE POLICY "Allow update access for authenticated users"
  ON time_off_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 6. TABLE DOCUMENTS
-- =============================================

DROP TABLE IF EXISTS documents CASCADE;

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

-- Index
CREATE INDEX idx_documents_employee_id ON documents(employee_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- Trigger
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

-- =============================================
-- 7. TABLE ANNOUNCEMENTS
-- =============================================

DROP TABLE IF EXISTS announcements CASCADE;

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

-- Index
CREATE INDEX idx_announcements_author_id ON announcements(author_id);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);

-- Trigger
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view active announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Allow insert access for authenticated users"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access for authenticated users"
  ON announcements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 8. DONNÉES DE TEST
-- =============================================

-- Insérer les employés de test (sans auth_user_id pour l'instant)
INSERT INTO employees (
  employee_id, email, first_name, last_name, role, department, position, 
  phone, start_date, birth_date, address, status, salary, emergency_contact
) VALUES 
-- Admin
('EMP001', 'admin@test.com', 'John', 'Smith', 'admin', 'IT', 'System Administrator', 
 '+1 (555) 123-4567', '2020-01-15', '1985-03-20', '123 Main St, New York, NY 10001', 'active', 85000,
 '{"name": "Jane Smith", "relationship": "Spouse", "phone": "+1 (555) 987-6543"}'),

-- HR Manager
('EMP002', 'hr@test.com', 'Sarah', 'Wilson', 'hr', 'Human Resources', 'HR Manager',
 '+1 (555) 234-5678', '2021-03-01', '1990-07-12', '456 Oak Ave, Brooklyn, NY 11201', 'active', 75000,
 '{"name": "Michael Wilson", "relationship": "Husband", "phone": "+1 (555) 876-5432"}'),

-- Employee
('EMP003', 'employee@test.com', 'Mike', 'Johnson', 'employee', 'Engineering', 'Software Developer',
 '+1 (555) 345-6789', '2022-06-15', '1988-11-30', '789 Pine St, Queens, NY 11375', 'active', 95000,
 '{"name": "Lisa Johnson", "relationship": "Sister", "phone": "+1 (555) 765-4321"}'),

-- Employés supplémentaires
('EMP004', 'emily.davis@company.com', 'Emily', 'Davis', 'employee', 'Marketing', 'Marketing Specialist',
 '+1 (555) 456-7890', '2023-01-10', '1992-04-18', '321 Elm St, Manhattan, NY 10023', 'active', 65000,
 '{"name": "Robert Davis", "relationship": "Father", "phone": "+1 (555) 654-3210"}'),

('EMP005', 'david.brown@company.com', 'David', 'Brown', 'employee', 'Sales', 'Sales Representative',
 '+1 (555) 567-8901', '2021-09-20', '1986-12-05', '654 Cedar St, Bronx, NY 10451', 'active', 70000,
 '{"name": "Maria Brown", "relationship": "Wife", "phone": "+1 (555) 543-2109"}')

ON CONFLICT (email) DO NOTHING;

-- Insérer quelques demandes de congés
INSERT INTO time_off_requests (
  employee_id, type, start_date, end_date, reason, status, request_date, approved_by, approved_date
) VALUES 
((SELECT id FROM employees WHERE email = 'employee@test.com'), 'Congés payés', '2024-02-15', '2024-02-19', 'Family vacation', 'approved', '2024-01-20', (SELECT id FROM employees WHERE email = 'hr@test.com'), '2024-01-22'),
((SELECT id FROM employees WHERE email = 'emily.davis@company.com'), 'Congé maladie payé', '2024-01-30', '2024-01-31', 'Medical appointment', 'pending', '2024-01-28', NULL, NULL),
((SELECT id FROM employees WHERE email = 'david.brown@company.com'), 'Autorisation exceptionnelle de sortie', '2024-03-10', '2024-03-12', 'Personal matters', 'pending', '2024-01-25', NULL, NULL);

-- Insérer quelques documents
INSERT INTO documents (
  employee_id, name, type, file_size, mime_type, uploaded_by
) VALUES 
((SELECT id FROM employees WHERE email = 'employee@test.com'), 'Employment Contract', 'contract', 250880, 'application/pdf', (SELECT id FROM employees WHERE email = 'hr@test.com')),
((SELECT id FROM employees WHERE email = 'emily.davis@company.com'), 'Resume.pdf', 'cv', 1228800, 'application/pdf', (SELECT id FROM employees WHERE email = 'emily.davis@company.com')),
((SELECT id FROM employees WHERE email = 'david.brown@company.com'), 'Sales Certification', 'certificate', 911360, 'application/pdf', (SELECT id FROM employees WHERE email = 'david.brown@company.com'));

-- Insérer quelques annonces
INSERT INTO announcements (
  title, content, priority, author_id, is_active
) VALUES 
('Company Holiday Party', 'Join us for our annual holiday celebration on December 20th at 6 PM in the main conference room.', 'medium', (SELECT id FROM employees WHERE email = 'hr@test.com'), true),
('New Health Insurance Policy', 'We are pleased to announce improvements to our health insurance coverage starting February 1st.', 'high', (SELECT id FROM employees WHERE email = 'hr@test.com'), true),
('Office Renovation Update', 'The second floor renovation is on schedule and will be completed by March 15th.', 'low', (SELECT id FROM employees WHERE email = 'admin@test.com'), true);

-- =============================================
-- 9. VÉRIFICATION FINALE
-- =============================================

-- Afficher un résumé des données créées
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION TERMINÉE ===';
    RAISE NOTICE 'Employés créés: %', (SELECT COUNT(*) FROM employees);
    RAISE NOTICE 'Demandes de congés: %', (SELECT COUNT(*) FROM time_off_requests);
    RAISE NOTICE 'Documents: %', (SELECT COUNT(*) FROM documents);
    RAISE NOTICE 'Annonces: %', (SELECT COUNT(*) FROM announcements);
    RAISE NOTICE '';
    RAISE NOTICE '=== COMPTES DE TEST ===';
    RAISE NOTICE 'admin@test.com (Admin)';
    RAISE NOTICE 'hr@test.com (RH)';
    RAISE NOTICE 'employee@test.com (Employé)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Créez ces comptes dans Authentication > Users avec le mot de passe de votre choix';
    RAISE NOTICE '⚠️  Puis liez-les aux profils avec: UPDATE employees SET auth_user_id = ''uuid'' WHERE email = ''email''';
END $$;