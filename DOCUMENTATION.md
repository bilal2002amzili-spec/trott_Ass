# 📋 Documentation — TrottAssur

**Plateforme de gestion d'assurance pour trottinettes électriques**
_Marché marocain — Interface en français_

---

## 1. Présentation du Projet

**TrottAssur** est une application web de gestion d'assurance dédiée aux trottinettes électriques. Elle couvre tout le cycle de vie de l'assurance : de l'enregistrement des clients à la gestion des sinistres, en passant par les devis, contrats et paiements.

### Technologies utilisées

| Technologie | Rôle |
|---|---|
| **Next.js** (App Router) | Framework full-stack React |
| **React + TypeScript** | Frontend |
| **Tailwind CSS** | Styling |
| **Supabase** (PostgreSQL) | Base de données, authentification |
| **Vercel** | Déploiement |

---

## 2. Structure du Projet

```
project/
├── app/
│   ├── layout.tsx              # Layout racine
│   ├── page.tsx                # Page d'accueil (landing + tarifs)
│   ├── login/
│   │   └── page.tsx            # Page de connexion
│   └── dashboard/
│       ├── page.tsx            # Tableau de bord (vue d'ensemble)
│       ├── admin/
│       │   └── page.tsx        # Panel admin (stats + activités)
│       ├── clients/
│       │   └── page.tsx        # Gestion des clients
│       ├── trottinettes/
│       │   └── page.tsx        # Gestion des trottinettes
│       ├── devis/
│       │   └── page.tsx        # Gestion des devis
│       ├── contrats/
│       │   └── page.tsx        # Gestion des contrats
│       ├── paiements/
│       │   └── page.tsx        # Gestion des paiements
│       ├── sinistres/
│       │   └── page.tsx        # Gestion des sinistres
│       └── garanties/
│           └── page.tsx        # Catalogue des garanties
├── lib/
│   └── supabase.ts             # Client Supabase
├── supabase/
│   └── migrations/
│       └── 20260712155018_create_trotassur_schema.sql
├── package.json
├── next.config.js
├── tsconfig.json
└── tailwind.config.js
```

---

## 3. Pages et Routes

| Route | Description |
|---|---|
| `/` | Page d'accueil avec présentation et tarifs (RC, ZEN, MAX) |
| `/login` | Page de connexion |
| `/dashboard` | Tableau de bord principal (statistiques, navigation) |
| `/dashboard/admin` | Panel administrateur (journal d'activités, paramètres) |
| `/dashboard/clients` | CRUD clients (particuliers / entreprises) |
| `/dashboard/trottinettes` | CRUD trottinettes |
| `/dashboard/devis` | Création et gestion des devis |
| `/dashboard/contrats` | Gestion des contrats |
| `/dashboard/paiements` | Enregistrement des paiements |
| `/dashboard/sinistres` | Déclaration et suivi des sinistres |
| `/dashboard/garanties` | Catalogue des garanties |

---

## 4. Base de Données

### Schéma (9 tables)

```
clients ──┬──< trottinettes
          ├──< devis >──< devis_garanties >── garanties
          ├──< contrats
          ├──< paiements
          └──< sinistres

contrats ──┬──< paiements
           └──< sinistres
```

### Table `clients`
Gestion des clients (particuliers ou entreprises).

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique |
| `nom` | text | Nom |
| `prenom` | text | Prénom |
| `cin` | text | Carte d'identité nationale (Maroc) |
| `telephone` | text | Téléphone |
| `email` | text | Email |
| `adresse` | text | Adresse |
| `ville` | text | Ville (Casablanca, Agadir, etc.) |
| `date_naissance` | date | Date de naissance |
| `photo_url` | text | URL photo |
| `type_client` | text | `'particulier'` ou `'entreprise'` |
| `statut` | text | `'actif'` par défaut |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Date de modification |

### Table `trottinettes`
Enregistrement des trottinettes électriques.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique |
| `client_id` | uuid | → `clients.id` |
| `marque` | text | Marque (Xiaomi, etc.) |
| `modele` | text | Modèle |
| `numero_serie` | text | Numéro de série |
| `puissance_w` | integer | Puissance en Watts (350W) |
| `couleur` | text | Couleur |
| `date_achat` | date | Date d'achat |
| `valeur` | numeric | Valeur en DH |
| `vitesse_max` | numeric | Vitesse max (km/h) |
| `photo_url` | text | URL photo |
| `valide` | boolean | Validité (true par défaut) |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Date de modification |

### Table `garanties`
Catalogue des garanties d'assurance.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique |
| `code` | text (unique) | Code garantie (RC, PC, VOL, INC, DOM, ASS) |
| `nom` | text | Nom de la garantie |
| `description` | text | Description |
| `prime_base` | numeric | Prime de base en DH |
| `categorie` | text | `'base'` ou `'option'` |
| `active` | boolean | Garantie active |
| `created_at` | timestamptz | Date de création |

**Données de référence :**

| Code | Nom | Prime base | Catégorie |
|---|---|---|---|
| RC | Responsabilité Civile | 250 DH | base |
| PC | Protection Conducteur | 150 DH | base |
| VOL | Vol | 350 DH | option |
| INC | Incendie | 300 DH | option |
| DOM | Dommages tous accidents | 500 DH | option |
| ASS | Assistance 24/7 | 100 DH | option |

### Table `devis`
Devis générés pour les clients.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique |
| `numero` | text (unique) | Numéro (`DEV-2026-XXXXXX`) |
| `client_id` | uuid | → `clients.id` |
| `trottinette_id` | uuid | → `trottinettes.id` |
| `formule` | text | `'RC'`, `'ZEN'` ou `'MAX'` |
| `prime_base` | numeric | Prime de base |
| `taxe` | numeric | Taxe (15%) |
| `prime_ttc` | numeric | Prime TTC |
| `periode` | text | `'annuelle'` |
| `statut` | text | `'brouillon'` ou `'accepte'` |
| `date_creation` | timestamptz | Date de création |
| `date_expiration` | date | Expiration (30 jours) |
| `created_at` | timestamptz | Date de création |

### Table `devis_garanties`
Table de liaison (many-to-many) entre devis et garanties.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique |
| `devis_id` | uuid | → `devis.id` |
| `garantie_id` | uuid | → `garanties.id` |
| `prime` | numeric | Prime calculée par garantie |

### Table `contrats`
Contrats d'assurance créés à partir des devis acceptés.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique |
| `numero_police` | text (unique) | Numéro de police (`POL-2026-XXXXXX`) |
| `client_id` | uuid | → `clients.id` |
| `trottinette_id` | uuid | → `trottinettes.id` |
| `devis_id` | uuid | → `devis.id` |
| `formule` | text | `'RC'`, `'ZEN'` ou `'MAX'` |
| `prime_ttc` | numeric | Prime TTC |
| `date_effet` | date | Date d'effet |
| `date_expiration` | date | Expiration (1 an) |
| `statut` | text | `'actif'` |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Date de modification |

### Table `paiements`
Paiements enregistrés pour les contrats.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique |
| `numero_facture` | text (unique) | Numéro de facture (`FAC-2026-XXXXXX`) |
| `contrat_id` | uuid | → `contrats.id` |
| `client_id` | uuid | → `clients.id` |
| `montant` | numeric | Montant en DH |
| `methode` | text | `'especes'` ou `'carte'` |
| `statut` | text | `'paye'` |
| `reference` | text | Référence de paiement |
| `date_paiement` | timestamptz | Date de paiement |
| `created_at` | timestamptz | Date de création |

### Table `sinistres`
Sinistres déclarés par les clients.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique |
| `numero` | text (unique) | Numéro (`SIN-2026-XXXXXX`) |
| `contrat_id` | uuid | → `contrats.id` |
| `client_id` | uuid | → `clients.id` |
| `trottinette_id` | uuid | → `trottinettes.id` |
| `type_sinistre` | text | `'accident'` ou `'vol'` |
| `description` | text | Description du sinistre |
| `date_sinistre` | date | Date du sinistre |
| `date_declaration` | timestamptz | Date de déclaration |
| `montant_estime` | numeric | Montant estimé en DH |
| `statut` | text | `'declare'` |
| `documents_url` | text[] | Tableau d'URLs de documents |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Date de modification |

### Table `activites`
Journal d'activités (audit trail).

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique |
| `type` | text | Type d'action (`'create'`, etc.) |
| `description` | text | Description de l'action |
| `utilisateur` | text | Utilisateur (`'Agent Assurance'`) |
| `entite_type` | text | Type d'entité (`'client'`, `'devis'`, etc.) |
| `entite_id` | uuid | ID de l'entité |
| `created_at` | timestamptz | Date de l'action |

---

## 5. Formules d'Assurance (Tarifs)

### Tarifs affichés sur la page d'accueil

| Formule | Prix | Description |
|---|---|---|
| **RC** | 250 DH/an | Responsabilité Civile — couverture de base |
| **ZEN** | 800 DH/an | RC + Protection Conducteur + Assistance 24/7 |
| **MAX** | 1 500 DH/an | Toutes garanties ZEN + Vol & Incendie + Dommages tous accidents |

### Calcul de la prime

```
prime_base = somme des primes des garanties sélectionnées
taxe       = prime_base × 15%
prime_ttc  = prime_base + taxe
```

---

## 6. Workflow Métier

```
1. Création client (particulier/entreprise)
       ↓
2. Enregistrement trottinette (marque, modèle, puissance, valeur)
       ↓
3. Génération devis (sélection garanties → calcul prime)
       ↓
4. Acceptation devis → Création contrat (numéro de police)
       ↓
5. Enregistrement paiement (carte / espèces)
       ↓
6. Déclaration sinistre (vol / accident) → Suivi
```

Chaque action est enregistrée dans la table `activites` (journal d'audit).

---

## 7. Sécurité — RLS (Row Level Security)

RLS est activé sur toutes les tables. Les politiques actuelles permettent l'accès `anon` + `authenticated` pour toutes les opérations CRUD.

> ⚠️ **Note** : Les politiques RLS sont actuellement permissives. Pour un déploiement en production, il faudrait restreindre les politiques avec `auth.uid()` pour exiger l'authentification.

---

## 8. Index de Base de Données

| Table | Index | Type |
|---|---|---|
| `clients` | `clients_pkey` | Primary key |
| `clients` | `idx_clients_email` | Email |
| `clients` | `idx_clients_ville` | Ville |
| `trottinettes` | `trottinettes_pkey` | Primary key |
| `trottinettes` | `idx_trottinettes_client` | Client FK |
| `devis` | `devis_pkey` | Primary key |
| `devis` | `devis_numero_key` | Unique numéro |
| `devis` | `idx_devis_client` | Client FK |
| `devis` | `idx_devis_statut` | Statut |
| `contrats` | `contrats_pkey` | Primary key |
| `contrats` | `contrats_numero_police_key` | Unique police |
| `contrats` | `idx_contrats_client` | Client FK |
| `contrats` | `idx_contrats_statut` | Statut |
| `paiements` | `paiements_pkey` | Primary key |
| `paiements` | `paiements_numero_facture_key` | Unique facture |
| `paiements` | `idx_paiements_contrat` | Contrat FK |
| `sinistres` | `sinistres_pkey` | Primary key |
| `sinistres` | `sinistres_numero_key` | Unique numéro |
| `sinistres` | `idx_sinistres_contrat` | Contrat FK |
| `sinistres` | `idx_sinistres_statut` | Statut |
| `activites` | `activites_pkey` | Primary key |
| `activites` | `idx_activites_created` | Created DESC |

---

## 9. Clés Étrangères (13)

| Table | Colonne | Référence |
|---|---|---|
| `trottinettes` | `client_id` | `clients.id` |
| `devis` | `client_id` | `clients.id` |
| `devis` | `trottinette_id` | `trottinettes.id` |
| `devis_garanties` | `devis_id` | `devis.id` |
| `devis_garanties` | `garantie_id` | `garanties.id` |
| `contrats` | `client_id` | `clients.id` |
| `contrats` | `trottinette_id` | `trottinettes.id` |
| `contrats` | `devis_id` | `devis.id` |
| `paiements` | `contrat_id` | `contrats.id` |
| `paiements` | `client_id` | `clients.id` |
| `sinistres` | `contrat_id` | `contrats.id` |
| `sinistres` | `client_id` | `clients.id` |
| `sinistres` | `trottinette_id` | `trottinettes.id` |

---

## 10. Build et Déploiement

### Build
```bash
npm run build
```

### Routes générées (14 pages statiques)

| Route | Taille | First Load JS |
|---|---|---|
| `/` | 12.6 kB | 148 kB |
| `/login` | 7.66 kB | 143 kB |
| `/dashboard` | 112 kB | 280 kB |
| `/dashboard/admin` | 11.1 kB | 147 kB |
| `/dashboard/clients` | 7.13 kB | 217 kB |
| `/dashboard/contrats` | 3.88 kB | 217 kB |
| `/dashboard/devis` | 7.77 kB | 221 kB |
| `/dashboard/garanties` | 4.4 kB | 214 kB |
| `/dashboard/paiements` | 4.36 kB | 217 kB |
| `/dashboard/sinistres` | 4.42 kB | 218 kB |
| `/dashboard/trottinettes` | 6.35 kB | 216 kB |

---

## 11. Points d'Amélioration

- **Authentification** : Activer Supabase Auth (email/password) et restreindre les politiques RLS avec `auth.uid()`
- **Génération PDF** : Ajouter export PDF pour devis et contrats
- **Notifications** : Alertes email pour expiration de devis/contrats
- **Statistiques avancées** : Graphiques de revenus, taux de sinistralité
- **API Edge Functions** : Pour calcul de primes côté serveur
