/*
  # Ajouter le profil employé pour l'utilisateur de test

  1. Création du profil employé
    - Lie l'utilisateur Supabase à un profil employé
    - Définit les informations de base (nom, département, etc.)
    - Assigne le rôle 'employee'

  2. Sécurité
    - Le profil sera accessible via les politiques RLS existantes
*/

-- Insérer le profil employé pour l'utilisateur de test
-- Remplacez 'USER_ID_HERE' par l'ID réel de votre utilisateur Supabase
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
  '6a38e70b-b977-47a5-bd50-3aafb0b306fb', -- ID de votre utilisateur Supabase
  'EMP001',
  'employee@test.com',
  'John',
  'Doe',
  'employee',
  'IT',
  'Développeur',
  '+33 1 23 45 67 89',
  CURRENT_DATE,
  '1990-01-15',
  '123 Rue de la Paix, Paris',
  'active',
  '{"name": "Jane Doe", "relationship": "Épouse", "phone": "+33 1 98 76 54 32"}'::jsonb
) ON CONFLICT (auth_user_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  status = EXCLUDED.status,
  emergency_contact = EXCLUDED.emergency_contact;

-- Vérifier que le profil a été créé
SELECT 
  'Profil employé créé avec succès!' as message,
  employee_id,
  email,
  first_name,
  last_name,
  role,
  department
FROM employees 
WHERE auth_user_id = '6a38e70b-b977-47a5-bd50-3aafb0b306fb';