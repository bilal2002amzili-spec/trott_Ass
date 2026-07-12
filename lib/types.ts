export type Garantie = {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  prime_base: number;
  categorie: string;
  active: boolean;
  created_at: string;
};

export type Client = {
  id: string;
  nom: string;
  prenom: string;
  cin: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  ville: string | null;
  date_naissance: string | null;
  photo_url: string | null;
  type_client: string;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type Trottinette = {
  id: string;
  client_id: string | null;
  marque: string;
  modele: string;
  numero_serie: string | null;
  puissance_w: number | null;
  couleur: string | null;
  date_achat: string | null;
  valeur: number | null;
  vitesse_max: number | null;
  photo_url: string | null;
  valide: boolean;
  created_at: string;
  updated_at: string;
};

export type Devis = {
  id: string;
  numero: string;
  client_id: string | null;
  trottinette_id: string | null;
  formule: string;
  prime_base: number;
  taxe: number;
  prime_ttc: number;
  periode: string;
  statut: string;
  date_creation: string;
  date_expiration: string | null;
  created_at: string;
};

export type DevisGarantie = {
  id: string;
  devis_id: string;
  garantie_id: string;
  prime: number;
};

export type Contrat = {
  id: string;
  numero_police: string;
  client_id: string | null;
  trottinette_id: string | null;
  devis_id: string | null;
  formule: string;
  prime_ttc: number;
  date_effet: string;
  date_expiration: string | null;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type Paiement = {
  id: string;
  numero_facture: string;
  contrat_id: string | null;
  client_id: string | null;
  montant: number;
  methode: string;
  statut: string;
  date_paiement: string;
  reference: string | null;
  created_at: string;
};

export type Sinistre = {
  id: string;
  numero: string;
  contrat_id: string | null;
  client_id: string | null;
  trottinette_id: string | null;
  type_sinistre: string;
  description: string | null;
  date_sinistre: string;
  date_declaration: string;
  montant_estime: number;
  statut: string;
  documents_url: string[] | null;
  created_at: string;
  updated_at: string;
};

export type Activite = {
  id: string;
  type: string;
  description: string;
  utilisateur: string | null;
  entite_type: string | null;
  entite_id: string | null;
  created_at: string;
};

export type Formule = 'RC' | 'ZEN' | 'MAX';
export type Periode = 'annuelle' | 'semestrielle';
export type MethodePaiement = 'especes' | 'carte' | 'virement';
export type StatutSinistre = 'declare' | 'en_cours' | 'valide' | 'refuse' | 'indemnise';
export type StatutContrat = 'actif' | 'suspendu' | 'resilie';
export type Role = 'admin' | 'agent';

export type User = {
  id: string;
  nom: string;
  email: string;
  role: Role;
};
