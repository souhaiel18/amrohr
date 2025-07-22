# Système de Gestion des Ressources Humaines (HRM)

Un système complet de gestion des ressources humaines construit avec React, TypeScript, TailwindCSS et Supabase.

## 🚀 Fonctionnalités

### Authentification et Sécurité
- ✅ Authentification complète avec Supabase Auth
- ✅ Inscription et connexion sécurisées
- ✅ Réinitialisation de mot de passe
- ✅ Gestion des sessions et tokens
- ✅ Contrôle d'accès basé sur les rôles (RBAC)

### Gestion des Employés
- ✅ Profils employés complets avec informations personnelles
- ✅ Annuaire des employés avec recherche et filtres
- ✅ Gestion des rôles (Admin, RH, Employé)
- ✅ Historique et documents par employé

### Gestion des Congés
- ✅ Demandes de congés (Payés, Maladie, Sans solde, Personnel)
- ✅ Workflow d'approbation pour les managers/RH
- ✅ Calendrier des congés et historique
- ✅ Calcul automatique des jours

### Gestion des Documents
- ✅ Upload et stockage sécurisé des documents
- ✅ Catégorisation (Contrat, CV, Certificat, Autre)
- ✅ Contrôle d'accès par document
- ✅ Prévisualisation et téléchargement

### Administration
- ✅ Panel d'administration complet
- ✅ Gestion CRUD pour toutes les entités
- ✅ Import/Export CSV
- ✅ Statistiques et tableaux de bord
- ✅ Gestion des annonces d'entreprise

## 🛠️ Technologies Utilisées

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Icons**: Lucide React
- **Date Management**: date-fns
- **Build Tool**: Vite

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
-- 1. Créer la table employees
-- Copiez le contenu de supabase/migrations/create_employees_table.sql

-- 2. Créer la table time_off_requests  
-- Copiez le contenu de supabase/migrations/create_time_off_requests_table.sql

-- 3. Créer la table documents
-- Copiez le contenu de supabase/migrations/create_documents_table.sql

-- 4. Créer la table announcements
-- Copiez le contenu de supabase/migrations/create_announcements_table.sql
```

6. **Configuration du Storage (optionnel)**

Pour l'upload de documents, créez un bucket `documents` dans Supabase Storage avec les politiques appropriées.

7. **Lancer l'application**
```bash
npm run dev
```

## 👥 Comptes de Test

Après avoir configuré la base de données, vous pouvez créer des comptes de test ou utiliser la fonctionnalité d'inscription.

### Rôles disponibles :
- **Admin** : Accès complet au système
- **RH** : Gestion des employés et approbation des congés  
- **Employé** : Accès limité à son profil et demandes

## 📱 Utilisation

### Pour les Employés
1. **Connexion** avec email/mot de passe
2. **Profil** : Consulter et modifier ses informations
3. **Congés** : Soumettre des demandes de congés
4. **Documents** : Uploader et consulter ses documents
5. **Annuaire** : Consulter les collègues

### Pour les RH/Admins
1. **Dashboard** : Vue d'ensemble des métriques RH
2. **Gestion des employés** : CRUD complet
3. **Approbation des congés** : Approuver/rejeter les demandes
4. **Gestion des documents** : Accès à tous les documents
5. **Administration** : Configuration du système

## 🔒 Sécurité

- **Row Level Security (RLS)** activé sur toutes les tables
- **Politiques de sécurité** granulaires par rôle
- **Authentification JWT** avec Supabase Auth
- **Validation côté client et serveur**
- **Contrôle d'accès basé sur les rôles**

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

- [ ] Notifications en temps réel
- [ ] Intégration calendrier (Google Calendar, Outlook)
- [ ] Rapports avancés et analytics
- [ ] API mobile
- [ ] Intégration paie
- [ ] Gestion des performances
- [ ] Chat interne
- [ ] Workflow personnalisables