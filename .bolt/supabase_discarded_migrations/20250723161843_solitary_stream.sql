/*
  # Données d'exemple pour tester les nouvelles fonctionnalités

  Ce script ajoute des données de test pour :
  - Documents administratifs
  - Objectifs et évaluations
*/

-- Insérer des documents administratifs d'exemple
INSERT INTO payroll_documents (employee_id, document_name, document_type, file_path, file_size, mime_type, uploaded_by, is_confidential) VALUES
-- Documents pour Mike Johnson (employee_id doit correspondre à un employé existant)
((SELECT id FROM employees WHERE email = 'mike.johnson@company.com' LIMIT 1), 
 'Bulletin de paie - Janvier 2024', 
 'payslip', 
 '/documents/payslip_jan_2024.pdf', 
 245000, 
 'application/pdf', 
 (SELECT id FROM employees WHERE role = 'hr' LIMIT 1), 
 true),

((SELECT id FROM employees WHERE email = 'mike.johnson@company.com' LIMIT 1), 
 'Contrat de travail CDI', 
 'contract', 
 '/documents/contract_mike.pdf', 
 890000, 
 'application/pdf', 
 (SELECT id FROM employees WHERE role = 'hr' LIMIT 1), 
 true),

-- Documents pour Emily Davis
((SELECT id FROM employees WHERE email = 'emily.davis@company.com' LIMIT 1), 
 'Attestation de travail', 
 'certificate', 
 '/documents/work_certificate_emily.pdf', 
 156000, 
 'application/pdf', 
 (SELECT id FROM employees WHERE role = 'hr' LIMIT 1), 
 true),

((SELECT id FROM employees WHERE email = 'emily.davis@company.com' LIMIT 1), 
 'Bulletin de paie - Janvier 2024', 
 'payslip', 
 '/documents/payslip_emily_jan_2024.pdf', 
 234000, 
 'application/pdf', 
 (SELECT id FROM employees WHERE role = 'hr' LIMIT 1), 
 true);

-- Insérer des objectifs d'exemple
INSERT INTO objectives (employee_id, title, description, target_date, progress_percentage, status, created_by, is_employee_proposed, employee_notes) VALUES
-- Objectifs pour Mike Johnson
((SELECT id FROM employees WHERE email = 'mike.johnson@company.com' LIMIT 1),
 'Améliorer les performances du système',
 'Optimiser les requêtes de base de données pour réduire le temps de réponse de 30%',
 '2024-12-31',
 65,
 'active',
 (SELECT id FROM employees WHERE role = 'hr' LIMIT 1),
 false,
 'Travail en cours sur l''indexation des tables principales'),

((SELECT id FROM employees WHERE email = 'mike.johnson@company.com' LIMIT 1),
 'Formation en architecture cloud',
 'Obtenir une certification AWS Solutions Architect',
 '2024-06-30',
 30,
 'active',
 (SELECT id FROM employees WHERE email = 'mike.johnson@company.com' LIMIT 1),
 true,
 'Inscription faite, début des cours en ligne'),

-- Objectifs pour Emily Davis
((SELECT id FROM employees WHERE email = 'emily.davis@company.com' LIMIT 1),
 'Développer la stratégie marketing digital',
 'Créer et implémenter une stratégie marketing digital complète',
 '2024-09-30',
 45,
 'active',
 (SELECT id FROM employees WHERE role = 'hr' LIMIT 1),
 false,
 'Recherche de marché terminée, création du plan en cours'),

((SELECT id FROM employees WHERE email = 'emily.davis@company.com' LIMIT 1),
 'Certification Google Analytics',
 'Obtenir la certification Google Analytics 4',
 '2024-05-15',
 80,
 'active',
 (SELECT id FROM employees WHERE email = 'emily.davis@company.com' LIMIT 1),
 true,
 'Cours terminés, examen prévu la semaine prochaine');