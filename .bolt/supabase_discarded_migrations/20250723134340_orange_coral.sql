-- Migration simplifiée pour créer les tables de base
-- Si les tables n'apparaissent pas, utilisez cette version simplifiée

-- Nettoyer d'abord (optionnel, décommentez si nécessaire)
-- DROP TABLE IF EXISTS announcements CASCADE;
-- DROP TABLE IF EXISTS documents CASCADE;
-- DROP TABLE IF EXISTS time_off_requests CASCADE;
-- DROP TABLE IF EXISTS employees CASCADE;

-- Créer les types enum de base
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_status') THEN
        CREATE TYPE employee_status AS ENUM ('active', 'inactive');
    END IF;
END $$;

-- Table employees (version simplifiée)
CREATE TABLE employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE,
    employee_id text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    department text NOT NULL,
    position text NOT NULL,
    phone text,
    start_date date NOT NULL DEFAULT CURRENT_DATE,
    status employee_status NOT NULL DEFAULT 'active',
    created_at timestamptz DEFAULT now()
);

-- Insérer un utilisateur de test
INSERT INTO employees (
    employee_id, 
    email, 
    first_name, 
    last_name, 
    role, 
    department, 
    position, 
    phone
) VALUES (
    'EMP001',
    'admin@test.com',
    'Admin',
    'Test',
    'admin',
    'IT',
    'Administrator',
    '+33123456789'
) ON CONFLICT (email) DO NOTHING;

-- Activer RLS avec politique simple
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Politique temporaire très permissive pour tester
CREATE POLICY "allow_all_for_testing" ON employees
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Vérifier que la table est créée
SELECT 'Table employees créée avec succès' as status, count(*) as nb_records 
FROM employees;