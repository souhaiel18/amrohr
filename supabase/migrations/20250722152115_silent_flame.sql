/*
  # Création de la table employees pour l'authentification

  1. Nouvelles Tables
    - `employees`
      - `id` (uuid, clé primaire)
      - `auth_user_id` (uuid, référence vers auth.users)
      - `employee_id` (text, identifiant unique employé)
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `role` (enum: admin, hr, employee)
      - `department` (text)
      - `position` (text)
      - `phone` (text)
      - `avatar` (text, URL optionnel)
      - `start_date` (date)
      - `birth_date` (date, optionnel)
      - `address` (text, optionnel)
      - `status` (enum: active, inactive)
      - `salary` (numeric, optionnel)
      - `manager_id` (uuid, référence vers employees)
      - `emergency_contact` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur la table `employees`
    - Politique pour que les utilisateurs puissent voir leur propre profil
    - Politique pour que les admins/RH puissent voir tous les profils
    - Politique pour que les utilisateurs puissent modifier leur propre profil
    - Politique pour que les admins/RH puissent modifier tous les profils

  3. Index et contraintes
    - Index sur auth_user_id pour les performances
    - Index sur email pour les recherches
    - Contrainte unique sur employee_id
*/

-- Créer le type enum pour les rôles
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');

-- Créer le type enum pour le statut
CREATE TYPE employee_status AS ENUM ('active', 'inactive');

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
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Activer RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs puissent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Politique pour que les admins et RH puissent voir tous les profils
CREATE POLICY "Admins and HR can view all profiles"
  ON employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique pour que les utilisateurs puissent modifier leur propre profil
CREATE POLICY "Users can update own profile"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Politique pour que les admins et RH puissent modifier tous les profils
CREATE POLICY "Admins and HR can update all profiles"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

-- Politique pour que les admins puissent insérer de nouveaux employés
CREATE POLICY "Admins can insert employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Politique pour l'auto-insertion lors de l'inscription
CREATE POLICY "Users can insert own profile"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer un utilisateur admin par défaut (optionnel)
-- Note: Vous devrez d'abord créer l'utilisateur dans Supabase Auth
-- puis récupérer son UUID pour l'insérer ici