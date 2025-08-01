@@ .. @@
 -- Enable RLS on employees
 ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
 
--- Create RLS policies for employees
-CREATE POLICY "Allow profile creation" ON employees
-  FOR INSERT TO authenticated
-  WITH CHECK (auth_user_id = auth.uid());
-
-CREATE POLICY "Allow read access for authenticated users" ON employees
-  FOR SELECT TO authenticated
-  USING (true);
-
-CREATE POLICY "Allow update access for authenticated users" ON employees
-  FOR UPDATE TO authenticated
-  USING (true)
-  WITH CHECK (true);
-
-CREATE POLICY "Users can update own profile" ON employees
-  FOR UPDATE TO authenticated
-  USING (auth_user_id = auth.uid())
-  WITH CHECK (auth_user_id = auth.uid());
-
 -- =============================================
 -- TIME OFF REQUESTS TABLE
 -- =============================================
@@ .. @@
 -- Enable RLS on time_off_requests
 ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
 
--- Create RLS policies for time_off_requests
-CREATE POLICY "Users can create own requests" ON time_off_requests
-  FOR INSERT TO authenticated
-  WITH CHECK (employee_id IN (
-    SELECT id FROM employees WHERE auth_user_id = auth.uid()
-  ));
-
-CREATE POLICY "Users can view own requests" ON time_off_requests
-  FOR SELECT TO authenticated
-  USING (employee_id IN (
-    SELECT id FROM employees WHERE auth_user_id = auth.uid()
-  ));
-
-CREATE POLICY "Users can update own pending requests" ON time_off_requests
-  FOR UPDATE TO authenticated
-  USING (
-    employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()) 
-    AND status = 'pending'
-  );
-
-CREATE POLICY "Allow read access for authenticated users" ON time_off_requests
-  FOR SELECT TO authenticated
-  USING (true);
-
-CREATE POLICY "Allow update access for authenticated users" ON time_off_requests
-  FOR UPDATE TO authenticated
-  USING (true)
-  WITH CHECK (true);
-
 -- =============================================
 -- DOCUMENTS TABLE
 -- =============================================
@@ .. @@
 -- Enable RLS on documents
 ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
 
--- Create RLS policies for documents
-CREATE POLICY "Users can upload documents" ON documents
-  FOR INSERT TO authenticated
-  WITH CHECK (employee_id IN (
-    SELECT id FROM employees WHERE auth_user_id = auth.uid()
-  ));
-
-CREATE POLICY "Users can view own documents" ON documents
-  FOR SELECT TO authenticated
-  USING (employee_id IN (
-    SELECT id FROM employees WHERE auth_user_id = auth.uid()
-  ));
-
-CREATE POLICY "Allow read access for authenticated users" ON documents
-  FOR SELECT TO authenticated
-  USING (true);
-
 -- =============================================
 -- ANNOUNCEMENTS TABLE
 -- =============================================
@@ .. @@
 -- Enable RLS on announcements
 ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
 
--- Create RLS policies for announcements
-CREATE POLICY "Users can view active announcements" ON announcements
-  FOR SELECT TO authenticated
-  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
-
-CREATE POLICY "Allow read access for authenticated users" ON announcements
-  FOR SELECT TO authenticated
-  USING (true);
-
-CREATE POLICY "Allow insert access for authenticated users" ON announcements
-  FOR INSERT TO authenticated
-  WITH CHECK (true);
-
-CREATE POLICY "Allow update access for authenticated users" ON announcements
-  FOR UPDATE TO authenticated
-  USING (true)
-  WITH CHECK (true);
-
 -- =============================================
 -- PAYROLL DOCUMENTS TABLE
 -- =============================================
@@ .. @@
 -- Enable RLS on payroll_documents
 ALTER TABLE payroll_documents ENABLE ROW LEVEL SECURITY;
 
--- Create RLS policies for payroll_documents
-CREATE POLICY "Employees can view own payroll documents" ON payroll_documents
-  FOR SELECT TO authenticated
-  USING (employee_id IN (
-    SELECT id FROM employees WHERE auth_user_id = auth.uid()
-  ));
-
-CREATE POLICY "HR and Admin can view all payroll documents" ON payroll_documents
-  FOR SELECT TO authenticated
-  USING (EXISTS (
-    SELECT 1 FROM employees 
-    WHERE auth_user_id = auth.uid() 
-    AND role IN ('admin', 'hr')
-  ));
-
-CREATE POLICY "HR and Admin can insert payroll documents" ON payroll_documents
-  FOR INSERT TO authenticated
-  WITH CHECK (EXISTS (
-    SELECT 1 FROM employees 
-    WHERE auth_user_id = auth.uid() 
-    AND role IN ('admin', 'hr')
-  ));
-
-CREATE POLICY "HR and Admin can update payroll documents" ON payroll_documents
-  FOR UPDATE TO authenticated
-  USING (EXISTS (
-    SELECT 1 FROM employees 
-    WHERE auth_user_id = auth.uid() 
-    AND role IN ('admin', 'hr')
-  ));
-
 -- =============================================
 -- EMPLOYEE DOCUMENTS TABLE
 -- =============================================
@@ .. @@
 -- Enable RLS on employee_documents
 ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
 
--- Create RLS policies for employee_documents
-CREATE POLICY "Employees can view own documents" ON employee_documents
-  FOR SELECT TO authenticated
-  USING (employee_id IN (
-    SELECT id FROM employees WHERE auth_user_id = auth.uid()
-  ));
-
-CREATE POLICY "HR and Admin can view all documents" ON employee_documents
-  FOR SELECT TO authenticated
-  USING (EXISTS (
-    SELECT 1 FROM employees 
-    WHERE auth_user_id = auth.uid() 
-    AND role IN ('admin', 'hr')
-  ));
-
-CREATE POLICY "HR and Admin can insert documents" ON employee_documents
-  FOR INSERT TO authenticated
-  WITH CHECK (EXISTS (
-    SELECT 1 FROM employees 
-    WHERE auth_user_id = auth.uid() 
-    AND role IN ('admin', 'hr')
-  ));
-
-CREATE POLICY "HR and Admin can update documents" ON employee_documents
-  FOR UPDATE TO authenticated
-  USING (EXISTS (
-    SELECT 1 FROM employees 
-    WHERE auth_user_id = auth.uid() 
-    AND role IN ('admin', 'hr')
-  ));
-
-CREATE POLICY "HR and Admin can delete documents" ON employee_documents
-  FOR DELETE TO authenticated
-  USING (EXISTS (
-    SELECT 1 FROM employees 
-    WHERE auth_user_id = auth.uid() 
-    AND role IN ('admin', 'hr')
-  ));
-
 -- =============================================
 -- OBJECTIVES TABLE
 -- =============================================
@@ .. @@
 -- Enable RLS on objectives
 ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
 
--- Create RLS policies for objectives
-CREATE POLICY "Employees can view own objectives" ON objectives
-  FOR SELECT TO authenticated
-  USING (employee_id IN (
-    SELECT id FROM employees WHERE auth_user_id = auth.uid()
-  ));
-
-CREATE POLICY "Employees can create own objectives" ON objectives
-  FOR INSERT TO authenticated
-  WITH CHECK (
-    employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
-    AND is_employee_proposed = true
-  );
-
-CREATE POLICY "Employees can update own objectives progress" ON objectives
-  FOR UPDATE TO authenticated
-  USING (employee_id IN (
-    SELECT id FROM employees WHERE auth_user_id = auth.uid()
-  ));
-
-CREATE POLICY "HR and Admin can view all objectives" ON objectives
-  FOR SELECT TO authenticated
-  USING (EXISTS (
-    SELECT 1 FROM employees 
-    WHERE auth_user_id = auth.uid() 
-    AND role IN ('admin', 'hr')
-  ));
-
-CREATE POLICY "HR and Admin can create objectives for all" ON objectives
-  FOR INSERT TO authenticated
-  WITH CHECK (EXISTS (
-    SELECT 1 FROM employees 
-    WHERE auth_user_id = auth.uid() 
-    AND role IN ('admin', 'hr')
-  ));
-
-CREATE POLICY "HR and Admin can update all objectives" ON objectives
-  FOR UPDATE TO authenticated
-  USING (EXISTS (
-    SELECT 1 FROM employees 
-    WHERE auth_user_id = auth.uid() 
-    AND role IN ('admin', 'hr')
-  ));
-
 -- =============================================
 -- UTILITY FUNCTIONS
 -- =============================================
@@ .. @@
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;
+
+-- =============================================
+-- ROW LEVEL SECURITY POLICIES
+-- =============================================
+
+-- Employees table policies
+CREATE POLICY "Allow profile creation" ON employees
+  FOR INSERT TO authenticated
+  WITH CHECK (auth_user_id = auth.uid());
+
+CREATE POLICY "Allow read access for authenticated users" ON employees
+  FOR SELECT TO authenticated
+  USING (true);
+
+CREATE POLICY "Allow update access for authenticated users" ON employees
+  FOR UPDATE TO authenticated
+  USING (true)
+  WITH CHECK (true);
+
+CREATE POLICY "Users can update own profile" ON employees
+  FOR UPDATE TO authenticated
+  USING (auth_user_id = auth.uid())
+  WITH CHECK (auth_user_id = auth.uid());
+
+-- Time off requests policies
+CREATE POLICY "Users can create own requests" ON time_off_requests
+  FOR INSERT TO authenticated
+  WITH CHECK (employee_id IN (
+    SELECT id FROM employees WHERE auth_user_id = auth.uid()
+  ));
+
+CREATE POLICY "Users can view own requests" ON time_off_requests
+  FOR SELECT TO authenticated
+  USING (employee_id IN (
+    SELECT id FROM employees WHERE auth_user_id = auth.uid()
+  ));
+
+CREATE POLICY "Users can update own pending requests" ON time_off_requests
+  FOR UPDATE TO authenticated
+  USING (
+    employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()) 
+    AND status = 'pending'
+  );
+
+CREATE POLICY "Allow read access for authenticated users" ON time_off_requests
+  FOR SELECT TO authenticated
+  USING (true);
+
+CREATE POLICY "Allow update access for authenticated users" ON time_off_requests
+  FOR UPDATE TO authenticated
+  USING (true)
+  WITH CHECK (true);
+
+-- Documents policies
+CREATE POLICY "Users can upload documents" ON documents
+  FOR INSERT TO authenticated
+  WITH CHECK (employee_id IN (
+    SELECT id FROM employees WHERE auth_user_id = auth.uid()
+  ));
+
+CREATE POLICY "Users can view own documents" ON documents
+  FOR SELECT TO authenticated
+  USING (employee_id IN (
+    SELECT id FROM employees WHERE auth_user_id = auth.uid()
+  ));
+
+CREATE POLICY "Allow read access for authenticated users" ON documents
+  FOR SELECT TO authenticated
+  USING (true);
+
+-- Announcements policies
+CREATE POLICY "Users can view active announcements" ON announcements
+  FOR SELECT TO authenticated
+  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
+
+CREATE POLICY "Allow read access for authenticated users" ON announcements
+  FOR SELECT TO authenticated
+  USING (true);
+
+CREATE POLICY "Allow insert access for authenticated users" ON announcements
+  FOR INSERT TO authenticated
+  WITH CHECK (true);
+
+CREATE POLICY "Allow update access for authenticated users" ON announcements
+  FOR UPDATE TO authenticated
+  USING (true)
+  WITH CHECK (true);
+
+-- Payroll documents policies
+CREATE POLICY "Employees can view own payroll documents" ON payroll_documents
+  FOR SELECT TO authenticated
+  USING (employee_id IN (
+    SELECT id FROM employees WHERE auth_user_id = auth.uid()
+  ));
+
+CREATE POLICY "HR and Admin can view all payroll documents" ON payroll_documents
+  FOR SELECT TO authenticated
+  USING (EXISTS (
+    SELECT 1 FROM employees 
+    WHERE auth_user_id = auth.uid() 
+    AND role IN ('admin', 'hr')
+  ));
+
+CREATE POLICY "HR and Admin can insert payroll documents" ON payroll_documents
+  FOR INSERT TO authenticated
+  WITH CHECK (EXISTS (
+    SELECT 1 FROM employees 
+    WHERE auth_user_id = auth.uid() 
+    AND role IN ('admin', 'hr')
+  ));
+
+CREATE POLICY "HR and Admin can update payroll documents" ON payroll_documents
+  FOR UPDATE TO authenticated
+  USING (EXISTS (
+    SELECT 1 FROM employees 
+    WHERE auth_user_id = auth.uid() 
+    AND role IN ('admin', 'hr')
+  ));
+
+-- Employee documents policies
+CREATE POLICY "Employees can view own documents" ON employee_documents
+  FOR SELECT TO authenticated
+  USING (employee_id IN (
+    SELECT id FROM employees WHERE auth_user_id = auth.uid()
+  ));
+
+CREATE POLICY "HR and Admin can view all documents" ON employee_documents
+  FOR SELECT TO authenticated
+  USING (EXISTS (
+    SELECT 1 FROM employees 
+    WHERE auth_user_id = auth.uid() 
+    AND role IN ('admin', 'hr')
+  ));
+
+CREATE POLICY "HR and Admin can insert documents" ON employee_documents
+  FOR INSERT TO authenticated
+  WITH CHECK (EXISTS (
+    SELECT 1 FROM employees 
+    WHERE auth_user_id = auth.uid() 
+    AND role IN ('admin', 'hr')
+  ));
+
+CREATE POLICY "HR and Admin can update documents" ON employee_documents
+  FOR UPDATE TO authenticated
+  USING (EXISTS (
+    SELECT 1 FROM employees 
+    WHERE auth_user_id = auth.uid() 
+    AND role IN ('admin', 'hr')
+  ));
+
+CREATE POLICY "HR and Admin can delete documents" ON employee_documents
+  FOR DELETE TO authenticated
+  USING (EXISTS (
+    SELECT 1 FROM employees 
+    WHERE auth_user_id = auth.uid() 
+    AND role IN ('admin', 'hr')
+  ));
+
+-- Objectives policies
+CREATE POLICY "Employees can view own objectives" ON objectives
+  FOR SELECT TO authenticated
+  USING (employee_id IN (
+    SELECT id FROM employees WHERE auth_user_id = auth.uid()
+  ));
+
+CREATE POLICY "Employees can create own objectives" ON objectives
+  FOR INSERT TO authenticated
+  WITH CHECK (
+    employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
+    AND is_employee_proposed = true
+  );
+
+CREATE POLICY "Employees can update own objectives progress" ON objectives
+  FOR UPDATE TO authenticated
+  USING (employee_id IN (
+    SELECT id FROM employees WHERE auth_user_id = auth.uid()
+  ));
+
+CREATE POLICY "HR and Admin can view all objectives" ON objectives
+  FOR SELECT TO authenticated
+  USING (EXISTS (
+    SELECT 1 FROM employees 
+    WHERE auth_user_id = auth.uid() 
+    AND role IN ('admin', 'hr')
+  ));
+
+CREATE POLICY "HR and Admin can create objectives for all" ON objectives
+  FOR INSERT TO authenticated
+  WITH CHECK (EXISTS (
+    SELECT 1 FROM employees 
+    WHERE auth_user_id = auth.uid() 
+    AND role IN ('admin', 'hr')
+  ));
+
+CREATE POLICY "HR and Admin can update all objectives" ON objectives
+  FOR UPDATE TO authenticated
+  USING (EXISTS (
+    SELECT 1 FROM employees 
+    WHERE auth_user_id = auth.uid() 
+    AND role IN ('admin', 'hr')
+  ));