-- Complete Supabase Setup Script for HRM System
-- Run this entire script in your Supabase SQL Editor

-- =============================================
-- 1. CREATE CUSTOM TYPES
-- =============================================

-- Drop existing types if they exist (optional, for clean setup)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS employee_status CASCADE;
DROP TYPE IF EXISTS leave_type CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS employee_document_category CASCADE;
DROP TYPE IF EXISTS announcement_priority CASCADE;

-- Create enum types
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
CREATE TYPE employee_document_category AS ENUM (
  'contract',
  'payslip', 
  'medical_certificate',
  'work_certificate',
  'administrative',
  'training',
  'evaluation',
  'other'
);
CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high');

-- =============================================
-- 2. CREATE UTILITY FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate leave days
CREATE OR REPLACE FUNCTION calculate_leave_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days = (NEW.end_date - NEW.start_date) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update employee documents updated_at
CREATE OR REPLACE FUNCTION update_employee_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 3. CREATE EMPLOYEES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role user_role DEFAULT 'employee' NOT NULL,
  department text NOT NULL,
  position text NOT NULL,
  phone text,
  avatar text,
  start_date date DEFAULT CURRENT_DATE NOT NULL,
  birth_date date,
  address text,
  status employee_status DEFAULT 'active' NOT NULL,
  salary numeric(10,2),
  manager_id uuid REFERENCES employees(id),
  emergency_contact jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for employees
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Create trigger for employees updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies for employees
DROP POLICY IF EXISTS "Allow profile creation" ON employees;
CREATE POLICY "Allow profile creation" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON employees;
CREATE POLICY "Allow read access for authenticated users" ON employees
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow update access for authenticated users" ON employees;
CREATE POLICY "Allow update access for authenticated users" ON employees
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON employees;
CREATE POLICY "Users can update own profile" ON employees
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- =============================================
-- 4. CREATE TIME OFF REQUESTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS time_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer DEFAULT 1 NOT NULL,
  reason text,
  status leave_status DEFAULT 'pending' NOT NULL,
  request_date timestamptz DEFAULT now() NOT NULL,
  approved_by uuid REFERENCES employees(id),
  approved_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (days > 0)
);

-- Create indexes for time_off_requests
CREATE INDEX IF NOT EXISTS idx_time_off_requests_employee_id ON time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_type ON time_off_requests(type);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_start_date ON time_off_requests(start_date);

-- Create triggers for time_off_requests
DROP TRIGGER IF EXISTS update_time_off_requests_updated_at ON time_off_requests;
CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS calculate_time_off_days ON time_off_requests;
CREATE TRIGGER calculate_time_off_days
    BEFORE INSERT OR UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION calculate_leave_days();

-- Enable RLS for time_off_requests
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for time_off_requests
DROP POLICY IF EXISTS "Users can create own requests" ON time_off_requests;
CREATE POLICY "Users can create own requests" ON time_off_requests
  FOR INSERT TO authenticated
  WITH CHECK (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can view own requests" ON time_off_requests;
CREATE POLICY "Users can view own requests" ON time_off_requests
  FOR SELECT TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update own pending requests" ON time_off_requests;
CREATE POLICY "Users can update own pending requests" ON time_off_requests
  FOR UPDATE TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()) 
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON time_off_requests;
CREATE POLICY "Allow read access for authenticated users" ON time_off_requests
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow update access for authenticated users" ON time_off_requests;
CREATE POLICY "Allow update access for authenticated users" ON time_off_requests
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 5. CREATE DOCUMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  type document_type DEFAULT 'other' NOT NULL,
  file_path text,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_employee_id ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Create trigger for documents
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
DROP POLICY IF EXISTS "Users can upload documents" ON documents;
CREATE POLICY "Users can upload documents" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can view own documents" ON documents;
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON documents;
CREATE POLICY "Allow read access for authenticated users" ON documents
  FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- 6. CREATE ANNOUNCEMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority announcement_priority DEFAULT 'medium' NOT NULL,
  author_id uuid NOT NULL REFERENCES employees(id),
  target_departments text[],
  target_roles user_role[],
  is_active boolean DEFAULT true NOT NULL,
  published_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);

-- Create trigger for announcements
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements
DROP POLICY IF EXISTS "Users can view active announcements" ON announcements;
CREATE POLICY "Users can view active announcements" ON announcements
  FOR SELECT TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON announcements;
CREATE POLICY "Allow read access for authenticated users" ON announcements
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow insert access for authenticated users" ON announcements;
CREATE POLICY "Allow insert access for authenticated users" ON announcements
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access for authenticated users" ON announcements;
CREATE POLICY "Allow update access for authenticated users" ON announcements
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 7. CREATE PAYROLL DOCUMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS payroll_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type = ANY (ARRAY['payslip'::text, 'contract'::text, 'certificate'::text, 'administrative'::text, 'other'::text])),
  file_path text,
  file_size bigint,
  mime_type text,
  uploaded_by uuid NOT NULL REFERENCES employees(id),
  upload_date timestamptz DEFAULT now(),
  is_confidential boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for payroll_documents
CREATE INDEX IF NOT EXISTS idx_payroll_documents_employee_id ON payroll_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_type ON payroll_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_uploaded_by ON payroll_documents(uploaded_by);

-- Enable RLS for payroll_documents
ALTER TABLE payroll_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for payroll_documents
DROP POLICY IF EXISTS "Employees can view own payroll documents" ON payroll_documents;
CREATE POLICY "Employees can view own payroll documents" ON payroll_documents
  FOR SELECT TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "HR and Admin can view all payroll documents" ON payroll_documents;
CREATE POLICY "HR and Admin can view all payroll documents" ON payroll_documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'hr'::user_role])
  ));

DROP POLICY IF EXISTS "HR and Admin can insert payroll documents" ON payroll_documents;
CREATE POLICY "HR and Admin can insert payroll documents" ON payroll_documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'hr'::user_role])
  ));

DROP POLICY IF EXISTS "HR and Admin can update payroll documents" ON payroll_documents;
CREATE POLICY "HR and Admin can update payroll documents" ON payroll_documents
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'hr'::user_role])
  ));

-- =============================================
-- 8. CREATE OBJECTIVES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_date date,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status text DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'cancelled'::text])),
  created_by uuid NOT NULL REFERENCES employees(id),
  is_employee_proposed boolean DEFAULT false,
  manager_evaluation text,
  employee_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for objectives
CREATE INDEX IF NOT EXISTS idx_objectives_employee_id ON objectives(employee_id);
CREATE INDEX IF NOT EXISTS idx_objectives_status ON objectives(status);
CREATE INDEX IF NOT EXISTS idx_objectives_created_by ON objectives(created_by);

-- Enable RLS for objectives
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

-- Create policies for objectives
DROP POLICY IF EXISTS "Employees can view own objectives" ON objectives;
CREATE POLICY "Employees can view own objectives" ON objectives
  FOR SELECT TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Employees can create own objectives" ON objectives;
CREATE POLICY "Employees can create own objectives" ON objectives
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()) 
    AND is_employee_proposed = true
  );

DROP POLICY IF EXISTS "Employees can update own objectives progress" ON objectives;
CREATE POLICY "Employees can update own objectives progress" ON objectives
  FOR UPDATE TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "HR and Admin can view all objectives" ON objectives;
CREATE POLICY "HR and Admin can view all objectives" ON objectives
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'hr'::user_role])
  ));

DROP POLICY IF EXISTS "HR and Admin can create objectives for all" ON objectives;
CREATE POLICY "HR and Admin can create objectives for all" ON objectives
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'hr'::user_role])
  ));

DROP POLICY IF EXISTS "HR and Admin can update all objectives" ON objectives;
CREATE POLICY "HR and Admin can update all objectives" ON objectives
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'hr'::user_role])
  ));

-- =============================================
-- 9. CREATE EMPLOYEE DOCUMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  category employee_document_category DEFAULT 'other' NOT NULL,
  file_path text,
  file_size bigint,
  mime_type text,
  tags text[] DEFAULT '{}',
  description text,
  is_confidential boolean DEFAULT true,
  uploaded_by uuid REFERENCES employees(id),
  upload_date timestamptz DEFAULT now(),
  version integer DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for employee_documents
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_category ON employee_documents(category);
CREATE INDEX IF NOT EXISTS idx_employee_documents_uploaded_by ON employee_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_employee_documents_upload_date ON employee_documents(upload_date);
CREATE INDEX IF NOT EXISTS idx_employee_documents_tags ON employee_documents USING gin(tags);

-- Create trigger for employee_documents
DROP TRIGGER IF EXISTS update_employee_documents_updated_at ON employee_documents;
CREATE TRIGGER update_employee_documents_updated_at
    BEFORE UPDATE ON employee_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_documents_updated_at();

-- Enable RLS for employee_documents
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_documents
DROP POLICY IF EXISTS "Employees can view own documents" ON employee_documents;
CREATE POLICY "Employees can view own documents" ON employee_documents
  FOR SELECT TO authenticated
  USING (employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "HR and Admin can view all documents" ON employee_documents;
CREATE POLICY "HR and Admin can view all documents" ON employee_documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'hr'::user_role])
  ));

DROP POLICY IF EXISTS "HR and Admin can insert documents" ON employee_documents;
CREATE POLICY "HR and Admin can insert documents" ON employee_documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'hr'::user_role])
  ));

DROP POLICY IF EXISTS "HR and Admin can update documents" ON employee_documents;
CREATE POLICY "HR and Admin can update documents" ON employee_documents
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'hr'::user_role])
  ));

DROP POLICY IF EXISTS "HR and Admin can delete documents" ON employee_documents;
CREATE POLICY "HR and Admin can delete documents" ON employee_documents
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY (ARRAY['admin'::user_role, 'hr'::user_role])
  ));

-- =============================================
-- 10. CREATE VIEWS
-- =============================================

-- Create view for employee documents with details
CREATE OR REPLACE VIEW employee_documents_with_details AS
SELECT 
  ed.*,
  e.first_name || ' ' || e.last_name AS employee_name,
  e.department,
  e.position,
  u.first_name || ' ' || u.last_name AS uploader_name
FROM employee_documents ed
JOIN employees e ON ed.employee_id = e.id
LEFT JOIN employees u ON ed.uploaded_by = u.id;

-- =============================================
-- 11. STORAGE SETUP
-- =============================================

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
CREATE POLICY "Authenticated users can view documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- 12. SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert sample employees (you can modify or remove this section)
-- Note: You'll need to create corresponding auth.users first in the Supabase Auth dashboard

-- Example:
-- INSERT INTO employees (employee_id, email, first_name, last_name, role, department, position, phone, start_date, birth_date, address, status) VALUES
-- ('EMP001', 'admin@company.com', 'John', 'Smith', 'admin', 'IT', 'System Administrator', '+1-555-0101', '2020-01-15', '1985-03-20', '123 Main St, City', 'active'),
-- ('EMP002', 'hr@company.com', 'Sarah', 'Wilson', 'hr', 'Human Resources', 'HR Manager', '+1-555-0102', '2021-03-01', '1990-07-12', '456 Oak Ave, City', 'active'),
-- ('EMP003', 'employee@company.com', 'Mike', 'Johnson', 'employee', 'Engineering', 'Software Developer', '+1-555-0103', '2022-06-15', '1988-11-30', '789 Pine St, City', 'active');

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'HRM System database setup completed successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create user accounts in Supabase Auth dashboard';
    RAISE NOTICE '2. Set up your environment variables in .env file';
    RAISE NOTICE '3. Start your application with npm run dev';
END $$;