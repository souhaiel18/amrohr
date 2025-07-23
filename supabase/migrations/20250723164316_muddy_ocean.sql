-- Script pour créer un utilisateur de test complet
-- 1. D'abord, créez un utilisateur dans Supabase Auth Dashboard
-- 2. Puis exécutez ce script en remplaçant l'UUID

-- Remplacez 'VOTRE-UUID-ICI' par l'UUID de votre utilisateur Supabase
INSERT INTO employees (
  auth_user_id,
  employee_id,
  email,
  first_name,
  last_name,
  role,
  department,
  position,
  phone,
  start_date,
  birth_date,
  address,
  status,
  emergency_contact
) VALUES (
  'VOTRE-UUID-ICI',  -- Remplacez par votre UUID depuis Supabase Auth
  'EMP001',
  'admin@test.com',  -- Même email que dans Supabase Auth
  'Admin',
  'Test',
  'admin',
  'Administration',
  'System Administrator',
  '+33123456789',
  '2024-01-01',
  '1990-01-01',
  '123 Admin Street, Paris',
  'active',
  '{"name": "Contact Urgence", "relationship": "Famille", "phone": "+33987654321"}'::jsonb
);

-- Créer aussi un employé normal pour tester
INSERT INTO employees (
  auth_user_id,
  employee_id,
  email,
  first_name,
  last_name,
  role,
  department,
  position,
  phone,
  start_date,
  birth_date,
  address,
  status,
  emergency_contact
) VALUES (
  'AUTRE-UUID-ICI',  -- UUID d'un autre utilisateur
  'EMP002',
  'employee@test.com',
  'John',
  'Doe',
  'employee',
  'IT',
  'Developer',
  '+33123456790',
  '2024-01-15',
  '1985-05-15',
  '456 Employee Street, Lyon',
  'active',
  '{"name": "Jane Doe", "relationship": "Épouse", "phone": "+33987654322"}'::jsonb
);