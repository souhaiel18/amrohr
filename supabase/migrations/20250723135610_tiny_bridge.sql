-- Script SQL manuel pour créer les profils employés
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. D'abord, vérifier les utilisateurs existants dans auth.users
SELECT id, email, created_at FROM auth.users WHERE email LIKE '%test.com';

-- 2. Créer les profils employés pour les utilisateurs de test
-- Remplacez les UUID par les vrais IDs de vos utilisateurs auth

-- Pour employee@test.com (remplacez l'UUID par le vrai)
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
  status
) VALUES (
  '6a38e70b-b977-47a5-bd50-3aafb0b306fb', -- Remplacez par le vrai UUID
  'EMP001',
  'employee@test.com',
  'Jean',
  'Dupont',
  'employee',
  'IT',
  'Développeur',
  '+33 1 23 45 67 89',
  '2023-01-15',
  '1990-05-20',
  '123 Rue de la Paix, Paris',
  'active'
) ON CONFLICT (auth_user_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  position = EXCLUDED.position;

-- Pour admin@test.com (si vous l'avez créé)
-- Décommentez et remplacez l'UUID
/*
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
  status
) VALUES (
  'REMPLACEZ_PAR_UUID_ADMIN', -- UUID de admin@test.com
  'EMP002',
  'admin@test.com',
  'Marie',
  'Martin',
  'admin',
  'Administration',
  'Administrateur Système',
  '+33 1 23 45 67 90',
  '2020-01-15',
  '1985-03-15',
  '456 Avenue des Champs, Paris',
  'active'
) ON CONFLICT (auth_user_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  position = EXCLUDED.position;
*/

-- Pour hr@test.com (si vous l'avez créé)
-- Décommentez et remplacez l'UUID
/*
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
  status
) VALUES (
  'REMPLACEZ_PAR_UUID_HR', -- UUID de hr@test.com
  'EMP003',
  'hr@test.com',
  'Pierre',
  'Durand',
  'hr',
  'Ressources Humaines',
  'Manager RH',
  '+33 1 23 45 67 91',
  '2021-06-01',
  '1988-11-10',
  '789 Boulevard Saint-Germain, Paris',
  'active'
) ON CONFLICT (auth_user_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  position = EXCLUDED.position;
*/

-- 3. Vérifier que les profils ont été créés
SELECT 
  e.employee_id,
  e.email,
  e.first_name,
  e.last_name,
  e.role,
  e.department,
  e.position,
  e.status,
  au.email as auth_email
FROM employees e
JOIN auth.users au ON e.auth_user_id = au.id
WHERE e.email LIKE '%test.com';

-- 4. Si vous voulez supprimer un profil (optionnel)
-- DELETE FROM employees WHERE email = 'employee@test.com';