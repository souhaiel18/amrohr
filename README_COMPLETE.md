# Système de Gestion des Ressources Humaines (HRM)

Un système complet de gestion des ressources humaines construit avec React, TypeScript, TailwindCSS et Supabase.

## 🚀 Fonctionnalités

### Authentification et Sécurité
- ✅ Authentification complète avec Supabase Auth
- ✅ Inscription et connexion sécurisées
- ✅ Réinitialisation de mot de passe
- ✅ Gestion des sessions et tokens
- ✅ Contrôle d'accès basé sur les rôles (RBAC)
- ✅ Row Level Security (RLS) sur toutes les tables

### Gestion des Employés
- ✅ Profils employés complets avec informations personnelles
- ✅ Annuaire des employés avec recherche et filtres
- ✅ Gestion des rôles (Admin, RH, Employé)
- ✅ CRUD complet (Créer, Lire, Modifier, Supprimer)
- ✅ Import/Export CSV
- ✅ Historique et documents par employé

### Gestion des Congés
- ✅ Demandes de congés multiples types (Payés, Maladie, Sans solde, Personnel, etc.)
- ✅ Workflow d'approbation pour les managers/RH
- ✅ Calendrier des congés et historique
- ✅ Calcul automatique des jours
- ✅ Notifications et suivi des statuts

### Gestion des Documents
- ✅ Upload et stockage sécurisé des documents (Supabase Storage)
- ✅ Catégorisation (Contrat, CV, Certificat, Autre)
- ✅ Contrôle d'accès par document
- ✅ Prévisualisation et téléchargement
- ✅ Documents administratifs séparés (bulletins de paie, etc.)
- ✅ Gestion des documents confidentiels
- ✅ **Dossier salarié structuré** avec catégories avancées
- ✅ **Prévisualisation PDF/Images** intégrée dans l'interface
- ✅ **Tags personnalisés** pour la recherche et l'organisation
- ✅ **Gestion des versions** de documents
- ✅ **Métadonnées JSON** pour informations supplémentaires

### Objectifs et Évaluations
- ✅ Création et suivi d'objectifs individuels
- ✅ Objectifs auto-proposés par les employés
- ✅ Suivi de progression avec pourcentages
- ✅ Évaluations des managers
- ✅ Notes et commentaires
- ✅ Historique des performances

### 📊 Tableau de Bord RH et Analytics
- ✅ **Dashboard RH complet** avec indicateurs clés de performance
- ✅ **Statistiques en temps réel** : employés actifs, congés, ancienneté
- ✅ **Graphiques interactifs** (Chart.js) : barres, secteurs, courbes
- ✅ **Calculs automatiques** : taux de turnover, jours d'absence moyens
- ✅ **Filtres avancés** par département, rôle, statut
- ✅ **Évolution temporelle** des congés sur 6 mois
- ✅ **Métriques RH** : ancienneté moyenne, répartition par service
- ✅ **Actualisation en temps réel** des données

### Administration
- ✅ Panel d'administration complet
- ✅ Gestion CRUD pour toutes les entités
- ✅ Import/Export CSV
- ✅ Statistiques et tableaux de bord
- ✅ Gestion des annonces d'entreprise
- ✅ Gestion des rôles et permissions
- ✅ Interface de gestion des données

## 🛠️ Technologies Utilisées

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Icons**: Lucide React
- **Date Management**: date-fns
- **Charts**: Chart.js avec react-chartjs-2
- **Build Tool**: Vite
- **Styling**: TailwindCSS avec design system personnalisé

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte Supabase

## 🔧 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd hrm-system
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**

Créez un projet sur [Supabase](https://supabase.com) et récupérez :
- URL du projet
- Clé publique (anon key)

4. **Variables d'environnement**

Créez un fichier `.env` à la racine :
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

5. **Configuration de la base de données**

Exécutez les migrations SQL dans l'ordre suivant dans l'éditeur SQL de Supabase :

```sql
-- 1. Créer les types énumérés
-- Copiez le contenu des migrations pour les types

-- 2. Créer la table employees
-- Copiez le contenu de la migration employees

-- 3. Créer la table time_off_requests  
-- Copiez le contenu de la migration time_off_requests

-- 4. Créer la table documents
-- Copiez le contenu de la migration documents

-- 5. Créer la table announcements
-- Copiez le contenu de la migration announcements

-- 6. Créer la table payroll_documents
-- Copiez le contenu de la migration payroll_documents

-- 7. Créer la table objectives
-- Copiez le contenu de la migration objectives

-- 8. Créer la table employee_documents (nouveau)
-- Copiez le contenu de la migration employee_documents avec catégories avancées
```

6. **Configuration du Storage**

Exécutez ce script SQL pour configurer le stockage de fichiers :

```sql
-- Créer le bucket pour les documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true);

-- Politique pour l'upload (utilisateurs authentifiés)
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Politique pour la lecture (utilisateurs authentifiés)
CREATE POLICY "Authenticated users can view documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documents');

-- Politique pour la suppression (propriétaire ou admin/hr)
CREATE POLICY "Users can delete own documents" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

7. **Lancer l'application**
```bash
npm run dev
```

## 👥 Comptes de Test

Après avoir configuré la base de données, créez des comptes de test dans Supabase Auth :

### Rôles disponibles :
- **Admin** : Accès complet au système
- **RH** : Gestion des employés et approbation des congés  
- **Employé** : Accès limité à son profil et demandes

### Comptes suggérés :
```
Admin: admin@test.com / admin123
RH: hr@test.com / hr123
Employé: employee@test.com / employee123
```

## 📱 Utilisation

### Pour les Employés
1. **Connexion** avec email/mot de passe
2. **Dashboard** : Vue d'ensemble personnalisée
3. **Profil** : Consulter et modifier ses informations
4. **Congés** : Soumettre des demandes de congés
5. **Documents** : Uploader et consulter ses documents
6. **Mon Dossier RH** : Accéder à ses documents administratifs structurés
6. **Objectifs** : Suivre ses objectifs et proposer de nouveaux
7. **Annuaire** : Consulter les collègues

### Pour les RH/Admins
1. **Dashboard** : Vue d'ensemble des métriques RH
2. **Tableau de Bord RH** : Analytics avancées avec graphiques interactifs
2. **Gestion des employés** : CRUD complet
3. **Approbation des congés** : Approuver/rejeter les demandes
4. **Gestion des documents** : Accès à tous les documents
6. **Upload de documents RH** : Gérer les dossiers salariés
5. **Objectifs** : Créer et évaluer les objectifs
6. **Administration** : Configuration du système
7. **Gestion des données** : Interface CRUD avancée
8. **Rôles et permissions** : Gestion des accès

## 📊 Fonctionnalités Analytics Avancées

### Tableau de Bord RH (`/hr-dashboard`)
**Accessible aux rôles Admin et RH uniquement**

#### 📈 Indicateurs Clés de Performance (KPI)
- **Employés actifs/inactifs** avec répartition par statut
- **Congés en attente** nécessitant une approbation
- **Ancienneté moyenne** calculée automatiquement
- **Taux de turnover** (employés inactifs / total)
- **Jours d'absence** totaux et moyens par employé
- **Répartition par département** et par rôle

#### 📊 Graphiques Interactifs
- **Graphique en barres** : Nombre d'employés par département
- **Graphique en secteurs** : Répartition des rôles dans l'entreprise
- **Graphique en courbes** : Évolution des demandes de congés sur 6 mois
- **Actualisation en temps réel** avec bouton de rafraîchissement

#### 🎯 Métriques Calculées Automatiquement
```sql
-- Exemples de calculs automatiques
- Ancienneté moyenne = AVG(CURRENT_DATE - start_date)
- Taux de turnover = (Employés inactifs / Total employés) * 100
- Jours d'absence moyens = SUM(days) / COUNT(DISTINCT employee_id)
```

## 📂 Système de Dossier Salarié Avancé

### Mon Dossier RH (`/employee-documents`)
**Interface sécurisée pour la gestion des documents administratifs**

#### 🗂️ Catégories de Documents Structurées
1. **Contrat de travail** - Documents contractuels
2. **Bulletins de paie** - Fiches de paie mensuelles
3. **Certificats médicaux** - Arrêts maladie, certificats
4. **Attestations** - Attestations diverses (travail, salaire, etc.)
5. **Documents administratifs** - Formulaires, déclarations
6. **Formation & Évaluations** - Certificats de formation, évaluations
7. **Autres** - Documents divers

#### 🔍 Fonctionnalités Avancées
- **Tags personnalisés** pour une recherche fine
- **Prévisualisation intégrée** PDF et images
- **Métadonnées JSON** pour informations supplémentaires
- **Gestion des versions** de documents
- **Marquage confidentiel** pour documents sensibles
- **Recherche full-text** dans les noms et descriptions

#### 🔒 Sécurité Renforcée
```sql
-- Règles de sécurité RLS
- Employés : Accès lecture seule à leurs documents
- RH/Admin : Accès complet (lecture/écriture) tous documents
- Documents confidentiels : Marquage spécial avec icône
```

#### 🎨 Interface Utilisateur Moderne
- **Upload drag & drop** avec validation de fichiers
- **Prévisualisation modale** plein écran
- **Téléchargement sécurisé** via Supabase Storage
- **Filtres par catégorie** et recherche instantanée
- **Design responsive** adaptatif mobile/desktop

## 🔒 Sécurité

- **Row Level Security (RLS)** activé sur toutes les tables
- **Politiques de sécurité** granulaires par rôle
- **Authentification JWT** avec Supabase Auth
- **Validation côté client et serveur**
- **Contrôle d'accès basé sur les rôles**
- **Stockage sécurisé des fichiers**
- **Chiffrement des données sensibles**
- **Séparation des documents** par employé avec RLS strict
- **Audit trail** pour les actions sur les documents

## 📊 Base de Données

### Tables principales :
- **employees** : Informations des employés
- **time_off_requests** : Demandes de congés
- **documents** : Documents généraux
- **payroll_documents** : Documents administratifs
- **employee_documents** : Dossiers salariés structurés (nouveau)
- **announcements** : Annonces d'entreprise
- **objectives** : Objectifs et évaluations

### Fonctionnalités avancées :
- **Triggers** pour les calculs automatiques
- **Fonctions** pour la logique métier
- **Index** pour les performances
- **Contraintes** pour l'intégrité des données
- **Vues matérialisées** pour les analytics
- **Fonctions SQL** pour les statistiques RH

## 🚀 Déploiement

### Netlify (Recommandé)
```bash
npm run build
# Déployez le dossier dist/ sur Netlify
```

### Vercel
```bash
npm run build
# Déployez avec Vercel CLI ou interface web
```

### Variables d'environnement en production
N'oubliez pas de configurer les variables d'environnement sur votre plateforme de déploiement.

## 🎨 Design System

- **Couleurs** : Palette cohérente avec thème emerald
- **Typography** : Système de tailles et poids cohérent
- **Spacing** : Système 8px pour l'alignement
- **Components** : Composants UI réutilisables
- **Responsive** : Design adaptatif mobile-first
- **Animations** : Micro-interactions et transitions
- **Charts** : Graphiques interactifs avec Chart.js
- **Modals** : Prévisualisation documents en plein écran

## 🧪 Tests et Qualité

- **TypeScript** : Typage strict pour la robustesse
- **ESLint** : Linting du code
- **Validation** : Validation des formulaires
- **Error Handling** : Gestion d'erreurs complète
- **Loading States** : États de chargement
- **Accessibility** : Bonnes pratiques d'accessibilité

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation Supabase
- Vérifiez les logs de la console pour le debugging

## 🔄 Roadmap

### Fonctionnalités à venir :
- [ ] Notifications en temps réel avec Supabase Realtime
- [ ] Intégration calendrier (Google Calendar, Outlook)
- [x] **Rapports avancés et analytics** ✅ (Tableau de bord RH implémenté)
- [ ] API mobile React Native
- [ ] Intégration paie externe
- [ ] Gestion des performances avancée
- [ ] Chat interne
- [ ] Workflow personnalisables
- [ ] Multi-tenant (plusieurs entreprises)
- [ ] Intégration IA pour l'analyse RH
- [ ] Export PDF des rapports analytics
- [ ] Notifications push pour documents importants
- [ ] Signature électronique de documents
- [ ] OCR pour extraction automatique de données

### Améliorations techniques :
- [ ] Tests unitaires et d'intégration
- [ ] Storybook pour les composants
- [ ] PWA (Progressive Web App)
- [ ] Optimisation des performances
- [ ] Monitoring et analytics
- [ ] Backup automatique
- [ ] Migration de données
- [ ] Cache Redis pour les analytics
- [ ] Compression d'images automatique
- [ ] CDN pour les documents statiques

## 📈 Métriques

- **Tables** : 7 tables principales (+ employee_documents)
- **Composants** : 25+ composants réutilisables
- **Pages** : 12+ pages fonctionnelles
- **Fonctionnalités** : 60+ fonctionnalités implémentées
- **Sécurité** : RLS sur 100% des tables
- **Performance** : Optimisé pour le web moderne
- **Analytics** : 8+ indicateurs KPI automatisés
- **Documents** : 7 catégories structurées avec prévisualisation
- **Graphiques** : 3 types de visualisations interactives