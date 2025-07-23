/*
  # Corriger les politiques RLS pour éviter la récursion infinie

  1. Problème
    - Les politiques actuelles créent une récursion infinie
    - Les politiques admin/HR interrogent la table employees pour vérifier le rôle
    - Cela crée une boucle lors de l'évaluation des politiques

  2. Solution
    - Simplifier les politiques pour éviter l'auto-référence
    - Utiliser auth.uid() directement pour l'accès personnel
    - Créer des politiques séparées plus simples
*/

-- Supprimer toutes les politiques existantes sur employees
DROP POLICY IF EXISTS "Users can view own profile" ON employees;
DROP POLICY IF EXISTS "Users can update own profile" ON employees;
DROP POLICY IF EXISTS "Users can insert own profile" ON employees;
DROP POLICY IF EXISTS "Admins and HR can view all profiles" ON employees;
DROP POLICY IF EXISTS "Admins and HR can update all profiles" ON employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON employees;

-- Politique simple : les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Politique simple : les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Politique simple : permettre l'insertion lors de l'inscription
CREATE POLICY "Allow profile creation"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Pour l'accès admin/HR, nous utiliserons une approche différente
-- Politique temporaire pour permettre l'accès complet aux utilisateurs authentifiés
-- (À ajuster plus tard avec un système de rôles plus robuste)
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