/*
# TrotAssur - Insurance Management Schema

## Overview
Complete schema for an electric scooter insurance management system.
Single-tenant app with simulated auth (Admin/Agent roles handled client-side).
All tables allow anon+authenticated CRUD since this is a management dashboard.

## Tables
1. `garanties` - Catalog of insurance guarantees (RC, Vol, Incendie, etc.)
2. `clients` - Customer records with personal info
3. `trottinettes` - Insured scooters with validation (speed <= 25 km/h)
4. `devis` - Quotes with prime calculations
5. `devis_garanties` - Many-to-many between devis and garanties
6. `contrats` - Contracts linked to devis
7. `paiements` - Payment records linked to contrats
8. `sinistres` - Claims with status tracking
9. `activites` - Activity log for dashboard feed

## Security
- RLS enabled on all tables
- anon+authenticated CRUD (single-tenant management app)
*/

-- Garanties catalog
CREATE TABLE IF NOT EXISTS garanties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  nom text NOT NULL,
  description text,
  prime_base numeric(10,2) NOT NULL DEFAULT 0,
  categorie text NOT NULL DEFAULT 'base',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  cin text,
  telephone text,
  email text,
  adresse text,
  ville text,
  date_naissance date,
  photo_url text,
  type_client text NOT NULL DEFAULT 'particulier',
  statut text NOT NULL DEFAULT 'actif',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trottinettes
CREATE TABLE IF NOT EXISTS trottinettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  marque text NOT NULL,
  modele text NOT NULL,
  numero_serie text,
  puissance_w int,
  couleur text,
  date_achat date,
  valeur numeric(10,2),
  vitesse_max numeric(5,1),
  photo_url text,
  valide boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Devis
CREATE TABLE IF NOT EXISTS devis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  trottinette_id uuid REFERENCES trottinettes(id) ON DELETE SET NULL,
  formule text NOT NULL DEFAULT 'RC',
  prime_base numeric(10,2) NOT NULL DEFAULT 0,
  taxe numeric(10,2) NOT NULL DEFAULT 0,
  prime_ttc numeric(10,2) NOT NULL DEFAULT 0,
  periode text NOT NULL DEFAULT 'annuelle',
  statut text NOT NULL DEFAULT 'brouillon',
  date_creation timestamptz DEFAULT now(),
  date_expiration date,
  created_at timestamptz DEFAULT now()
);

-- Devis-Garanties junction
CREATE TABLE IF NOT EXISTS devis_garanties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id uuid REFERENCES devis(id) ON DELETE CASCADE,
  garantie_id uuid REFERENCES garanties(id) ON DELETE CASCADE,
  prime numeric(10,2) NOT NULL DEFAULT 0
);

-- Contrats
CREATE TABLE IF NOT EXISTS contrats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_police text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  trottinette_id uuid REFERENCES trottinettes(id) ON DELETE SET NULL,
  devis_id uuid REFERENCES devis(id) ON DELETE SET NULL,
  formule text NOT NULL DEFAULT 'RC',
  prime_ttc numeric(10,2) NOT NULL DEFAULT 0,
  date_effet date NOT NULL DEFAULT CURRENT_DATE,
  date_expiration date,
  statut text NOT NULL DEFAULT 'actif',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Paiements
CREATE TABLE IF NOT EXISTS paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_facture text UNIQUE NOT NULL,
  contrat_id uuid REFERENCES contrats(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  montant numeric(10,2) NOT NULL DEFAULT 0,
  methode text NOT NULL DEFAULT 'especes',
  statut text NOT NULL DEFAULT 'paye',
  date_paiement timestamptz DEFAULT now(),
  reference text,
  created_at timestamptz DEFAULT now()
);

-- Sinistres
CREATE TABLE IF NOT EXISTS sinistres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  contrat_id uuid REFERENCES contrats(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  trottinette_id uuid REFERENCES trottinettes(id) ON DELETE SET NULL,
  type_sinistre text NOT NULL DEFAULT 'accident',
  description text,
  date_sinistre date NOT NULL DEFAULT CURRENT_DATE,
  date_declaration timestamptz DEFAULT now(),
  montant_estime numeric(10,2) DEFAULT 0,
  statut text NOT NULL DEFAULT 'declare',
  documents_url text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activites (dashboard feed)
CREATE TABLE IF NOT EXISTS activites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  description text NOT NULL,
  utilisateur text,
  entite_type text,
  entite_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_ville ON clients(ville);
CREATE INDEX IF NOT EXISTS idx_trottinettes_client ON trottinettes(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_contrats_client ON contrats(client_id);
CREATE INDEX IF NOT EXISTS idx_contrats_statut ON contrats(statut);
CREATE INDEX IF NOT EXISTS idx_paiements_contrat ON paiements(contrat_id);
CREATE INDEX IF NOT EXISTS idx_sinistres_contrat ON sinistres(contrat_id);
CREATE INDEX IF NOT EXISTS idx_sinistres_statut ON sinistres(statut);
CREATE INDEX IF NOT EXISTS idx_activites_created ON activites(created_at DESC);

-- RLS: Enable on all tables
ALTER TABLE garanties ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trottinettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis_garanties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinistres ENABLE ROW LEVEL SECURITY;
ALTER TABLE activites ENABLE ROW LEVEL SECURITY;

-- Policies: anon+authenticated CRUD on all tables (single-tenant management app)

-- Garanties
DROP POLICY IF EXISTS "anon_crud_garanties" ON garanties;
CREATE POLICY "anon_crud_garanties" ON garanties FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Clients
DROP POLICY IF EXISTS "anon_select_clients" ON clients;
CREATE POLICY "anon_select_clients" ON clients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
CREATE POLICY "anon_insert_clients" ON clients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_clients" ON clients;
CREATE POLICY "anon_update_clients" ON clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clients" ON clients;
CREATE POLICY "anon_delete_clients" ON clients FOR DELETE TO anon, authenticated USING (true);

-- Trottinettes
DROP POLICY IF EXISTS "anon_select_trottinettes" ON trottinettes;
CREATE POLICY "anon_select_trottinettes" ON trottinettes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_trottinettes" ON trottinettes;
CREATE POLICY "anon_insert_trottinettes" ON trottinettes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_trottinettes" ON trottinettes;
CREATE POLICY "anon_update_trottinettes" ON trottinettes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_trottinettes" ON trottinettes;
CREATE POLICY "anon_delete_trottinettes" ON trottinettes FOR DELETE TO anon, authenticated USING (true);

-- Devis
DROP POLICY IF EXISTS "anon_select_devis" ON devis;
CREATE POLICY "anon_select_devis" ON devis FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_devis" ON devis;
CREATE POLICY "anon_insert_devis" ON devis FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_devis" ON devis;
CREATE POLICY "anon_update_devis" ON devis FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_devis" ON devis;
CREATE POLICY "anon_delete_devis" ON devis FOR DELETE TO anon, authenticated USING (true);

-- Devis-Garanties
DROP POLICY IF EXISTS "anon_crud_devis_garanties" ON devis_garanties;
CREATE POLICY "anon_crud_devis_garanties" ON devis_garanties FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Contrats
DROP POLICY IF EXISTS "anon_select_contrats" ON contrats;
CREATE POLICY "anon_select_contrats" ON contrats FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_contrats" ON contrats;
CREATE POLICY "anon_insert_contrats" ON contrats FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_contrats" ON contrats;
CREATE POLICY "anon_update_contrats" ON contrats FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_contrats" ON contrats;
CREATE POLICY "anon_delete_contrats" ON contrats FOR DELETE TO anon, authenticated USING (true);

-- Paiements
DROP POLICY IF EXISTS "anon_select_paiements" ON paiements;
CREATE POLICY "anon_select_paiements" ON paiements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_paiements" ON paiements;
CREATE POLICY "anon_insert_paiements" ON paiements FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_paiements" ON paiements;
CREATE POLICY "anon_update_paiements" ON paiements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_paiements" ON paiements;
CREATE POLICY "anon_delete_paiements" ON paiements FOR DELETE TO anon, authenticated USING (true);

-- Sinistres
DROP POLICY IF EXISTS "anon_select_sinistres" ON sinistres;
CREATE POLICY "anon_select_sinistres" ON sinistres FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sinistres" ON sinistres;
CREATE POLICY "anon_insert_sinistres" ON sinistres FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sinistres" ON sinistres;
CREATE POLICY "anon_update_sinistres" ON sinistres FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sinistres" ON sinistres;
CREATE POLICY "anon_delete_sinistres" ON sinistres FOR DELETE TO anon, authenticated USING (true);

-- Activites
DROP POLICY IF EXISTS "anon_crud_activites" ON activites;
CREATE POLICY "anon_crud_activites" ON activites FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);