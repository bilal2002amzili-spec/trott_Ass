import type { Formule, Periode, Garantie } from './types';

export const FORMULE_CONFIG: Record<
  Formule,
  { label: string; description: string; garanties: string[]; multiplier: number }
> = {
  RC: {
    label: 'Responsabilité Civile',
    description: 'La formule essentielle pour rouler en toute légalité',
    garanties: ['RC'],
    multiplier: 1.0,
  },
  ZEN: {
    label: 'ZEN',
    description: 'L\'équilibre parfait entre protection et prix',
    garanties: ['RC', 'PC', 'ASS'],
    multiplier: 1.15,
  },
  MAX: {
    label: 'MAX',
    description: 'La protection maximale pour votre trottinette',
    garanties: ['RC', 'PC', 'VOL', 'INC', 'ASS', 'DOM'],
    multiplier: 1.3,
  },
};

export const TAXE_RATE = 0.15;

export function calculatePrime(
  formule: Formule,
  garanties: Garantie[],
  periode: Periode = 'annuelle'
): { primeBase: number; taxe: number; primeTtc: number; details: { nom: string; prime: number }[] } {
  const config = FORMULE_CONFIG[formule];
  const applicableGaranties = garanties.filter((g) => config.garanties.includes(g.code));

  const details = applicableGaranties.map((g) => ({
    nom: g.nom,
    prime: g.prime_base * config.multiplier,
  }));

  const primeBase = details.reduce((sum, d) => sum + d.prime, 0);
  const taxe = primeBase * TAXE_RATE;
  let primeTtc = primeBase + taxe;

  if (periode === 'semestrielle') {
    return {
      primeBase: primeBase / 2,
      taxe: taxe / 2,
      primeTtc: primeTtc / 2,
      details: details.map((d) => ({ ...d, prime: d.prime / 2 })),
    };
  }

  return { primeBase, taxe, primeTtc, details };
}

export function generateNumero(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${random}`;
}

export function generatePoliceNumber(): string {
  return generateNumero('POL');
}

export function generateDevisNumber(): string {
  return generateNumero('DEV');
}

export function generateFactureNumber(): string {
  return generateNumero('FAC');
}

export function generateSinistreNumber(): string {
  return generateNumero('SIN');
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return '0,00 DH';
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: 'decimal',
  }).format(amount) + ' DH';
}
