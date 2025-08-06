/*
  # Création de la table announcements

  1. Nouvelles Tables
    - `announcements`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `author_id` (uuid, foreign key vers employees)
      - `priority` (enum: low, medium, high)
      - `is_published` (boolean)
      - `publish_date` (timestamp)
      - `expire_date` (timestamp, optional)
      - `target_departments` (text array, optional)
      - `target_roles` (user_role array, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur la table `announcements`
    - Politiques pour l'accès basé sur les rôles
*/

-- Créer le type enum pour les priorités
DO $$ BEGIN
    CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Créer la table announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES employees(id),
  priority announcement_priority NOT NULL DEFAULT 'medium',
  is_published boolean NOT NULL DEFAULT true,
  publish_date timestamptz NOT NULL DEFAULT now(),
  expire_date timestamptz,
  target_departments text[],
  target_roles user_role[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contrainte pour s'assurer que expire_date est après publish_date
  CONSTRAINT valid_expire_date CHECK (expire_date IS NULL OR expire_date > publish_date)
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON announcements(publish_date);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_target_departments ON announcements USING GIN(target_departments);
CREATE INDEX IF NOT EXISTS idx_announcements_target_roles ON announcements USING GIN(target_roles);

-- Activer RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Authors can view own announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (
    author_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update own announcements"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING (
    author_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    author_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete own announcements"
  ON announcements
  FOR DELETE
  TO authenticated
  USING (
    author_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Politique pour que les employés voient les annonces publiées qui les concernent
CREATE POLICY "Employees can view published announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (
    is_published = true 
    AND (expire_date IS NULL OR expire_date > now())
    AND (
      -- Pas de ciblage spécifique (pour tous)
      (target_departments IS NULL AND target_roles IS NULL)
      OR
      -- Ciblage par département
      EXISTS (
        SELECT 1 FROM employees 
        WHERE auth_user_id = auth.uid() 
        AND (target_departments IS NULL OR department = ANY(target_departments))
      )
      OR
      -- Ciblage par rôle
      EXISTS (
        SELECT 1 FROM employees 
        WHERE auth_user_id = auth.uid() 
        AND (target_roles IS NULL OR role = ANY(target_roles))
      )
    )
  );

-- Politiques pour admins/RH
CREATE POLICY "Admins and HR can create announcements"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
    AND author_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and HR can view all announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admins can update all announcements"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all announcements"
  ON announcements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();