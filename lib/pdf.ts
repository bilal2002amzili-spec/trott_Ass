import type { Client, Devis, Contrat, Paiement, Sinistre, Trottinette, Garantie } from './types';
import { formatMoney, formatDate, calculatePrime, FORMULE_CONFIG } from './prime';

function openPrintWindow(html: string) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Veuillez autoriser les pop-ups pour générer le PDF.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

const pdfStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
    .logo span { color: #dc2626; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .doc-title { font-size: 20px; font-weight: 700; color: #1e293b; text-align: right; }
    .doc-ref { font-size: 12px; color: #64748b; text-align: right; margin-top: 4px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { font-size: 13px; }
    .info-label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }
    .info-value { font-weight: 600; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .total-row { background: #f8fafc; font-weight: 700; }
    .total-row td { border-bottom: 2px solid #2563eb; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .badge-blue { background: #dbeafe; color: #2563eb; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .signature { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature-block { text-align: center; }
    .signature-line { width: 200px; border-top: 1px solid #94a3b8; margin-top: 60px; padding-top: 8px; font-size: 12px; color: #64748b; }
    .note { background: #f8fafc; border-left: 3px solid #2563eb; padding: 12px 16px; margin-top: 20px; font-size: 12px; color: #475569; border-radius: 4px; }
  </style>
`;

function pdfHeader(docTitle: string, docRef: string) {
  return `
    <div class="header">
      <div>
        <div class="logo">Trot<span>Assur</span></div>
        <div class="subtitle">Assurance Trottinettes Électriques</div>
        <div class="subtitle">12 Avenue Mohammed V, Casablanca, Maroc</div>
        <div class="subtitle">Tél: +212 5 22 00 00 00 | contact@trotassur.ma</div>
      </div>
      <div>
        <div class="doc-title">${docTitle}</div>
        <div class="doc-ref">Réf: ${docRef}</div>
        <div class="doc-ref">Date: ${formatDate(new Date())}</div>
      </div>
    </div>
  `;
}

function pdfFooter() {
  return `
    <div class="footer">
      <div>TrotAssur SARL — RC 123456 — IF 789012 — Patente 345678</div>
      <div>Page 1/1</div>
    </div>
  `;
}

export function generateDevisPDF(
  devis: Devis,
  client: Client | null,
  trottinette: Trottinette | null,
  garanties: Garantie[]
) {
  const calc = calculatePrime(devis.formule as any, garanties, devis.periode as any);
  const formuleConfig = (FORMULE_CONFIG as any)[devis.formule];

  const html = `
    <html><head><title>Devis ${devis.numero}</title>${pdfStyles}</head><body>
    ${pdfHeader('DEVIS', devis.numero)}
    <div class="section">
      <div class="section-title">Client</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Nom complet</div><div class="info-value">${client?.prenom || ''} ${client?.nom || ''}</div></div>
        <div class="info-item"><div class="info-label">CIN</div><div class="info-value">${client?.cin || '—'}</div></div>
        <div class="info-item"><div class="info-label">Téléphone</div><div class="info-value">${client?.telephone || '—'}</div></div>
        <div class="info-item"><div class="info-label">Email</div><div class="info-value">${client?.email || '—'}</div></div>
        <div class="info-item"><div class="info-label">Adresse</div><div class="info-value">${client?.adresse || '—'}, ${client?.ville || ''}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Trottinette</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Marque / Modèle</div><div class="info-value">${trottinette?.marque || '—'} ${trottinette?.modele || ''}</div></div>
        <div class="info-item"><div class="info-label">N° Série</div><div class="info-value">${trottinette?.numero_serie || '—'}</div></div>
        <div class="info-item"><div class="info-label">Puissance</div><div class="info-value">${trottinette?.puissance_w || '—'} W</div></div>
        <div class="info-item"><div class="info-label">Vitesse max</div><div class="info-value">${trottinette?.vitesse_max || '—'} km/h</div></div>
        <div class="info-item"><div class="info-label">Valeur</div><div class="info-value">${formatMoney(trottinette?.valeur || 0)}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Formule: ${formuleConfig.label}</div>
      <table>
        <thead><tr><th>Garantie</th><th>Description</th><th style="text-align:right">Prime</th></tr></thead>
        <tbody>
          ${calc.details.map((d) => `<tr><td>${d.nom}</td><td style="color:#64748b">${garanties.find((g) => g.nom === d.nom)?.description || ''}</td><td style="text-align:right">${formatMoney(d.prime)}</td></tr>`).join('')}
        </tbody>
      </table>
      <table style="margin-top:16px">
        <tbody>
          <tr><td style="text-align:right;font-weight:600">Prime base (${devis.periode})</td><td style="text-align:right;width:150px">${formatMoney(calc.primeBase)}</td></tr>
          <tr><td style="text-align:right;font-weight:600">Taxe (15%)</td><td style="text-align:right">${formatMoney(calc.taxe)}</td></tr>
          <tr class="total-row"><td style="text-align:right">Total TTC</td><td style="text-align:right">${formatMoney(calc.primeTtc)}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="note">Ce devis est valable 30 jours à compter de sa date d'émission. L'acceptation du devis entraîne la création automatique d'un contrat d'assurance.</div>
    <div class="signature">
      <div class="signature-block"><div class="signature-line">Signature de l'assuré</div></div>
      <div class="signature-block"><div class="signature-line">Cachet TrotAssur</div></div>
    </div>
    ${pdfFooter()}
    </body></html>
  `;
  openPrintWindow(html);
}

export function generateContratPDF(
  contrat: Contrat,
  client: Client | null,
  trottinette: Trottinette | null
) {
  const html = `
    <html><head><title>Contrat ${contrat.numero_police}</title>${pdfStyles}</head><body>
    ${pdfHeader('CONTRAT D\'ASSURANCE', contrat.numero_police)}
    <div class="section">
      <div class="section-title">Souscripteur</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Nom complet</div><div class="info-value">${client?.prenom || ''} ${client?.nom || ''}</div></div>
        <div class="info-item"><div class="info-label">CIN</div><div class="info-value">${client?.cin || '—'}</div></div>
        <div class="info-item"><div class="info-label">Téléphone</div><div class="info-value">${client?.telephone || '—'}</div></div>
        <div class="info-item"><div class="info-label">Email</div><div class="info-value">${client?.email || '—'}</div></div>
        <div class="info-item"><div class="info-label">Adresse</div><div class="info-value">${client?.adresse || '—'}, ${client?.ville || ''}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Trottinette assurée</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Marque / Modèle</div><div class="info-value">${trottinette?.marque || '—'} ${trottinette?.modele || ''}</div></div>
        <div class="info-item"><div class="info-label">N° Série</div><div class="info-value">${trottinette?.numero_serie || '—'}</div></div>
        <div class="info-item"><div class="info-label">Puissance</div><div class="info-value">${trottinette?.puissance_w || '—'} W</div></div>
        <div class="info-item"><div class="info-label">Vitesse max</div><div class="info-value">${trottinette?.vitesse_max || '—'} km/h</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Conditions du contrat</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Formule</div><div class="info-value">${contrat.formule}</div></div>
        <div class="info-item"><div class="info-label">Prime TTC</div><div class="info-value">${formatMoney(contrat.prime_ttc)}</div></div>
        <div class="info-item"><div class="info-label">Date d'effet</div><div class="info-value">${formatDate(contrat.date_effet)}</div></div>
        <div class="info-item"><div class="info-label">Date d'expiration</div><div class="info-value">${formatDate(contrat.date_expiration)}</div></div>
        <div class="info-item"><div class="info-label">Statut</div><div class="info-value"><span class="badge ${contrat.statut === 'actif' ? 'badge-green' : 'badge-red'}">${contrat.statut.toUpperCase()}</span></div></div>
      </div>
    </div>
    <div class="note">Le présent contrat est conclu pour une durée d'un an renouvelable. Il couvre l'usage de la trottinette électrique déclarée dans le respect du Code de la Route. La vitesse maximale de l'engin ne doit pas excéder 25 km/h pour être éligible à l'assurance.</div>
    <div class="signature">
      <div class="signature-block"><div class="signature-line">Signature de l'assuré</div></div>
      <div class="signature-block"><div class="signature-line">Cachet TrotAssur</div></div>
    </div>
    ${pdfFooter()}
    </body></html>
  `;
  openPrintWindow(html);
}

export function generateAttestationPDF(
  contrat: Contrat,
  client: Client | null,
  trottinette: Trottinette | null
) {
  const html = `
    <html><head><title>Attestation ${contrat.numero_police}</title>${pdfStyles}</head><body>
    ${pdfHeader('ATTESTATION D\'ASSURANCE', contrat.numero_police)}
    <div style="text-align:center; margin: 30px 0;">
      <div style="font-size:24px; font-weight:800; color:#2563eb; margin-bottom:8px;">ATTESTATION D'ASSURANCE</div>
      <div style="font-size:14px; color:#64748b;">Trottinette Électrique — Responsabilité Civile</div>
    </div>
    <div class="section">
      <div class="section-title">Compagnie d'assurance</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Nom</div><div class="info-value">TrotAssur SARL</div></div>
        <div class="info-item"><div class="info-label">Adresse</div><div class="info-value">12 Avenue Mohammed V, Casablanca</div></div>
        <div class="info-item"><div class="info-label">N° Police</div><div class="info-value">${contrat.numero_police}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Assuré</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Nom complet</div><div class="info-value">${client?.prenom || ''} ${client?.nom || ''}</div></div>
        <div class="info-item"><div class="info-label">CIN</div><div class="info-value">${client?.cin || '—'}</div></div>
        <div class="info-item"><div class="info-label">Adresse</div><div class="info-value">${client?.adresse || '—'}, ${client?.ville || ''}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Véhicule assuré</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Type</div><div class="info-value">Trottinette Électrique</div></div>
        <div class="info-item"><div class="info-label">Marque / Modèle</div><div class="info-value">${trottinette?.marque || '—'} ${trottinette?.modele || ''}</div></div>
        <div class="info-item"><div class="info-label">N° Série</div><div class="info-value">${trottinette?.numero_serie || '—'}</div></div>
        <div class="info-item"><div class="info-label">Puissance</div><div class="info-value">${trottinette?.puissance_w || '—'} W</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Période de garantie</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Date d'effet</div><div class="info-value">${formatDate(contrat.date_effet)}</div></div>
        <div class="info-item"><div class="info-label">Date d'expiration</div><div class="info-value">${formatDate(contrat.date_expiration)}</div></div>
      </div>
    </div>
    <div class="note">Cette attestation est délivrée pour faire foi auprès des autorités compétentes. Elle doit être présentée en cas de contrôle. La validité de l'assurance est subordonnée au paiement de la prime.</div>
    <div class="signature">
      <div class="signature-block"><div class="signature-line">Le Directeur Général</div></div>
    </div>
    ${pdfFooter()}
    </body></html>
  `;
  openPrintWindow(html);
}

export function generateRecuPDF(paiement: Paiement, client: Client | null, contrat: Contrat | null) {
  const html = `
    <html><head><title>Reçu ${paiement.numero_facture}</title>${pdfStyles}</head><body>
    ${pdfHeader('REÇU DE PAIEMENT', paiement.numero_facture)}
    <div class="section">
      <div class="section-title">Reçu de</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Client</div><div class="info-value">${client?.prenom || ''} ${client?.nom || ''}</div></div>
        <div class="info-item"><div class="info-label">Référence contrat</div><div class="info-value">${contrat?.numero_police || '—'}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Détails du paiement</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Date</div><div class="info-value">${formatDate(paiement.date_paiement)}</div></div>
        <div class="info-item"><div class="info-label">Méthode</div><div class="info-value">${paiement.methode.toUpperCase()}</div></div>
        <div class="info-item"><div class="info-label">Référence</div><div class="info-value">${paiement.reference || paiement.numero_facture}</div></div>
        <div class="info-item"><div class="info-label">Montant</div><div class="info-value" style="font-size:18px;color:#2563eb">${formatMoney(paiement.montant)}</div></div>
      </div>
    </div>
    <div class="note">Reçu délivré pour servir et valoir ce que de droit. Le paiement a été enregistré dans notre système de gestion.</div>
    <div class="signature">
      <div class="signature-block"><div class="signature-line">Cachet TrotAssur</div></div>
    </div>
    ${pdfFooter()}
    </body></html>
  `;
  openPrintWindow(html);
}

export function generateFacturePDF(paiement: Paiement, client: Client | null, contrat: Contrat | null) {
  const ht = paiement.montant / 1.15;
  const tva = paiement.montant - ht;
  const html = `
    <html><head><title>Facture ${paiement.numero_facture}</title>${pdfStyles}</head><body>
    ${pdfHeader('FACTURE', paiement.numero_facture)}
    <div class="section">
      <div class="section-title">Facturé à</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Client</div><div class="info-value">${client?.prenom || ''} ${client?.nom || ''}</div></div>
        <div class="info-item"><div class="info-label">CIN</div><div class="info-value">${client?.cin || '—'}</div></div>
        <div class="info-item"><div class="info-label">Adresse</div><div class="info-value">${client?.adresse || '—'}, ${client?.ville || ''}</div></div>
        <div class="info-item"><div class="info-label">N° Police</div><div class="info-value">${contrat?.numero_police || '—'}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Détail</div>
      <table>
        <thead><tr><th>Description</th><th style="text-align:right">Montant HT</th><th style="text-align:right">TVA (15%)</th><th style="text-align:right">TTC</th></tr></thead>
        <tbody>
          <tr><td>Prime d'assurance — ${contrat?.formule || ''} (${contrat ? formatDate(contrat.date_effet) : ''})</td><td style="text-align:right">${formatMoney(ht)}</td><td style="text-align:right">${formatMoney(tva)}</td><td style="text-align:right">${formatMoney(paiement.montant)}</td></tr>
        </tbody>
      </table>
      <table style="margin-top:16px">
        <tbody>
          <tr><td style="text-align:right;font-weight:600">Total HT</td><td style="text-align:right;width:150px">${formatMoney(ht)}</td></tr>
          <tr><td style="text-align:right;font-weight:600">TVA (15%)</td><td style="text-align:right">${formatMoney(tva)}</td></tr>
          <tr class="total-row"><td style="text-align:right">Total TTC</td><td style="text-align:right">${formatMoney(paiement.montant)}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="note">Règlement: ${paiement.methode.toUpperCase()} — Référence: ${paiement.reference || paiement.numero_facture}</div>
    ${pdfFooter()}
    </body></html>
  `;
  openPrintWindow(html);
}

export function generateSinistrePDF(sinistre: Sinistre, client: Client | null, trottinette: Trottinette | null) {
  const html = `
    <html><head><title>Sinistre ${sinistre.numero}</title>${pdfStyles}</head><body>
    ${pdfHeader('DÉCLARATION DE SINISTRE', sinistre.numero)}
    <div class="section">
      <div class="section-title">Déclarant</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Nom complet</div><div class="info-value">${client?.prenom || ''} ${client?.nom || ''}</div></div>
        <div class="info-item"><div class="info-label">Téléphone</div><div class="info-value">${client?.telephone || '—'}</div></div>
        <div class="info-item"><div class="info-label">Email</div><div class="info-value">${client?.email || '—'}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Trottinette concernée</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Marque / Modèle</div><div class="info-value">${trottinette?.marque || '—'} ${trottinette?.modele || ''}</div></div>
        <div class="info-item"><div class="info-label">N° Série</div><div class="info-value">${trottinette?.numero_serie || '—'}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Détails du sinistre</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Type</div><div class="info-value">${sinistre.type_sinistre}</div></div>
        <div class="info-item"><div class="info-label">Date du sinistre</div><div class="info-value">${formatDate(sinistre.date_sinistre)}</div></div>
        <div class="info-item"><div class="info-label">Date de déclaration</div><div class="info-value">${formatDate(sinistre.date_declaration)}</div></div>
        <div class="info-item"><div class="info-label">Montant estimé</div><div class="info-value">${formatMoney(sinistre.montant_estime)}</div></div>
        <div class="info-item"><div class="info-label">Statut</div><div class="info-value"><span class="badge badge-blue">${sinistre.statut.toUpperCase()}</span></div></div>
      </div>
      <div style="margin-top:16px">
        <div class="info-label">Description</div>
        <div style="margin-top:8px; padding:12px; background:#f8fafc; border-radius:6px; font-size:13px;">${sinistre.description || 'Aucune description fournie.'}</div>
      </div>
    </div>
    <div class="signature">
      <div class="signature-block"><div class="signature-line">Signature de l'assuré</div></div>
      <div class="signature-block"><div class="signature-line">Cachet TrotAssur</div></div>
    </div>
    ${pdfFooter()}
    </body></html>
  `;
  openPrintWindow(html);
}
