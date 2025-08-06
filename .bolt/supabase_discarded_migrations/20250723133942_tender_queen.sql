/*
  # Migration complète pour créer toutes les tables HRM

  1. Types Enum
    - user_role (admin, hr, employee)
    - employee_status (active, inactive)
    - leave_type (13 types de congés)
    - leave_status (pending, approved, rejected)
    - document_type (contract, cv, certificate, other)
    - announcement_priority (low, medium, high)

  2. Tables
    - employees (profils employés)
    - time_off_requests (demandes de congés)
    - documents (métadonnées documents)
    - announcements (annonces entreprise)

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques d'accès appropriées
*/

-- =============================================
-- ÉTAPE 1: CRÉER LES TYPES ENUM
-- =============================================

-- Type pour les rôles utilisateur
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Type pour le statut des employés
DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Type pour les types de congés (selon les standards français)
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

-- Type pour le statut des demandes de congés
DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Type pour les types de documents
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('contract', 'cv', 'certificate', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Type pour la priorité des annonces
DO $$ BEGIN
    CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- ÉTAPE 2: CRÉER LES FONCTIONS UTILITAIRES
-- =============================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Fonction pour calculer automatiquement les jours de congés
CREATE OR REPLACE FUNCTION calculate_leave_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days = (NEW.end_date - NEW.start_date) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- ÉTAPE 3: CRÉER LA TABLE EMPLOYEES
-- =============================================

CREATE TABLE IF NOT EXISTS employees (
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

-- Index pour la table employees
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- =============================================
-- ÉTAPE 4: CRÉER LA TABLE TIME_OFF_REQUESTS
-- =============================================

CREATE TABLE IF NOT EXISTS time_off_requests (
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
    
    -- Contraintes de validation
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT positive_days CHECK (days > 0)
);

-- Index pour la table time_off_requests
CREATE INDEX IF NOT EXISTS idx_time_off_requests_employee_id ON time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_start_date ON time_off_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_type ON time_off_requests(type);

-- =============================================
-- ÉTAPE 5: CRÉER LA TABLE DOCUMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS documents (
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

-- Index pour la table documents
CREATE INDEX IF NOT EXISTS idx_documents_employee_id ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- =============================================
-- ÉTAPE 6: CRÉER LA TABLE ANNOUNCEMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS announcements (
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

-- Index pour la table announcements
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);

-- =============================================
-- ÉTAPE 7: ACTIVER ROW LEVEL SECURITY
-- =============================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ÉTAPE 8: CRÉER LES POLITIQUES RLS POUR EMPLOYEES
-- =============================================

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can view own profile" ON employees;
DROP POLICY IF EXISTS "Users can update own profile" ON employees;
DROP POLICY IF EXISTS "Allow profile creation" ON employees;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON employees;
DROP POLICY IF EXISTS "Authenticated users can update all profiles" ON employees;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON employees;

-- Politiques pour les employés (accès à leur propre profil)
CREATE POLICY "Users can view own profile"
    ON employees FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON employees FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Politique pour la création de profils (lors de l'inscription)
CREATE POLICY "Allow profile creation"
    ON employees FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid());

-- Politiques temporaires pour permettre l'accès (à affiner plus tard)
CREATE POLICY "Allow read access for authenticated users"
    ON employees FOR SELECT
    TO authenticated
    USING (true);

-- =============================================
-- ÉTAPE 9: CRÉER LES POLITIQUES RLS POUR TIME_OFF_REQUESTS
-- =============================================

-- Politiques pour les demandes de congés
CREATE POLICY "Users can view own requests"
    ON time_off_requests FOR SELECT
    TO authenticated
    USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create own requests"
    ON time_off_requests FOR INSERT
    TO authenticated
    WITH CHECK (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own pending requests"
    ON time_off_requests FOR UPDATE
    TO authenticated
    USING (
        employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
        AND status = 'pending'
    );

-- Politique temporaire pour permettre l'accès
CREATE POLICY "Allow read access for authenticated users"
    ON time_off_requests FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow update access for authenticated users"
    ON time_off_requests FOR UPDATE
    TO authenticated
    USING (true);

-- =============================================
-- ÉTAPE 10: CRÉER LES POLITIQUES RLS POUR DOCUMENTS
-- =============================================

CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    TO authenticated
    USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can upload documents"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- Politique temporaire pour permettre l'accès
CREATE POLICY "Allow read access for authenticated users"
    ON documents FOR SELECT
    TO authenticated
    USING (true);

-- =============================================
-- ÉTAPE 11: CRÉER LES POLITIQUES RLS POUR ANNOUNCEMENTS
-- =============================================

CREATE POLICY "Users can view active announcements"
    ON announcements FOR SELECT
    TO authenticated
    USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Politique temporaire pour permettre l'accès
CREATE POLICY "Allow read access for authenticated users"
    ON announcements FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert access for authenticated users"
    ON announcements FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update access for authenticated users"
    ON announcements FOR UPDATE
    TO authenticated
    USING (true);

-- =============================================
-- ÉTAPE 12: CRÉER LES TRIGGERS
-- =============================================

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_off_requests_updated_at ON time_off_requests;
CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour calculer automatiquement les jours de congés
DROP TRIGGER IF EXISTS calculate_time_off_days ON time_off_requests;
CREATE TRIGGER calculate_time_off_days
    BEFORE INSERT OR UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION calculate_leave_days();