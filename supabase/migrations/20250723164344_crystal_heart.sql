@@ .. @@
 -- Script pour créer des utilisateurs de test
 -- Remplacez les UUIDs par ceux de vos vrais utilisateurs Supabase

 -- ADMIN USER
 INSERT INTO employees (
   auth_user_id,
-  employee_id,
+  employee_id,
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
   'VOTRE_UUID_ADMIN_ICI',  -- Remplacez par l'UUID de votre admin
-  'EMP001',
+  'EMP999',  -- ID différent pour éviter les conflits
   'admin@test.com',
   'Admin',
   'Test',
   'admin',
   'IT',
   'System Administrator',
   '+33123456789',
   '2024-01-01',
   '1990-01-01',
   '123 Test Street',
   'active'
 );

 -- HR USER  
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
   'VOTRE_UUID_HR_ICI',  -- Remplacez par l'UUID de votre HR
-  'EMP002',
+  'EMP998',  -- ID différent pour éviter les conflits
   'hr@test.com',
   'Sarah',
   'Wilson',
   'hr',
   'Human Resources',
   'HR Manager',
   '+33234567890',
   '2024-01-01',
   '1990-05-15',
   '456 Oak Avenue',
   'active'
 );