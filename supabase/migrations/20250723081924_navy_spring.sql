/*
  # Création de la table employees

  1. Nouvelles Tables
    - `employees`
      - `id` (uuid, primary key)
      - `auth_user_id` (uuid, foreign key vers auth.users)
      - `employee_id` (text, unique)
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `role` (enum: admin, hr, employee)
      - `department` (text)
      - `position` (text)
      - `phone` (text)
      - `avatar` (text, optional)
      - `start_date` (date)
      - `birth_date` (date, optional)
      - `address` (text, optional)
      - `status` (enum: active, inactive)
      - `salary` (numeric, optional)
      - `manager_id` (uuid, optional)
      - `emergency_contact` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur la table `employees`
    - Politiques pour permettre l'accès basé sur l'authentification
*/

-- Créer les types enum
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');
CREATE TYPE employee_status AS ENUM ('active', 'inactive');

-- Créer la fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer la table employees
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

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Activer RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simplifiées pour éviter la récursion
CREATE POLICY "Users can view own profile"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Allow profile creation"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Politiques pour les admins et RH (temporaires, simples)
CREATE POLICY "Authenticated users can view all profiles"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update all profiles"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert profiles"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();