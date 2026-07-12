'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FileText, Search, Trash2, Download, Check, ChevronRight,
  ChevronLeft, User, Bike, Shield, Calculator, Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { calculatePrime, generateDevisNumber, formatMoney, formatDate, FORMULE_CONFIG } from '@/lib/prime';
import { generateDevisPDF } from '@/lib/pdf';
import { useAuth } from '@/lib/auth-context';
import type { Devis, Client, Trottinette, Garantie, Formule, Periode } from '@/lib/types';
import { toast } from 'sonner';

const STEPS = [
  { num: 1, label: 'Client', icon: User },
  { num: 2, label: 'Trottinette', icon: Bike },
  { num: 3, label: 'Garanties', icon: Shield },
  { num: 4, label: 'Calcul', icon: Calculator },
  { num: 5, label: 'Résumé', icon: Check },
  { num: 6, label: 'PDF', icon: Download },
];

const PAGE_SIZE = 8;

export default function DevisPage() {
  const { user } = useAuth();
  const [devis, setDevis] = useState<(Devis & { client_nom?: string; trottinette_nom?: string })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [trottinettes, setTrottinettes] = useState<Trottinette[]>([]);
  const [garanties, setGaranties] = useState<Garantie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Wizard state
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTrottinette, setSelectedTrottinette] = useState('');
  const [formule, setFormule] = useState<Formule>('RC');
  const [periode, setPeriode] = useState<Periode>('annuelle');
  const [createdDevis, setCreatedDevis] = useState<Devis | null>(null);

  const loadDevis = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('devis').select('*, clients(nom, prenom), trottinettes(marque, modele)', { count: 'exact' });
    if (search) {
      query = query.or(`numero.ilike.%${search}%,formule.ilike.%${search}%`);
    }
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('created_at', { ascending: false });
    const { data, count, error } = await query;
    if (error) {
      const { data: d2, count: c2 } = await supabase.from('devis').select('*, clients(nom, prenom), trottinettes(marque, modele)', { count: 'exact' })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('created_at', { ascending: false });
      setDevis((d2 || []).map((d: any) => ({ ...d, client_nom: d.clients ? `${d.clients.prenom} ${d.clients.nom}` : '—', trottinette_nom: d.trottinettes ? `${d.trottinettes.marque} ${d.trottinettes.modele}` : '—' })));
      setTotal(c2 || 0);
    } else {
      setDevis((data || []).map((d: any) => ({ ...d, client_nom: d.clients ? `${d.clients.prenom} ${d.clients.nom}` : '—', trottinette_nom: d.trottinettes ? `${d.trottinettes.marque} ${d.trottinettes.modele}` : '—' })));
      setTotal(count || 0);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    loadDevis();
    (async () => {
      const [c, t, g] = await Promise.all([
        supabase.from('clients').select('*').order('nom'),
        supabase.from('trottinettes').select('*').order('created_at', { ascending: false }),
        supabase.from('garanties').select('*').eq('active', true).order('prime_base'),
      ]);
      setClients((c.data as Client[]) || []);
      setTrottinettes(t.data || []);
      setGaranties(g.data || []);
    })();
  }, [loadDevis]);

  const openWizard = () => {
    setStep(1);
    setSelectedClient('');
    setSelectedTrottinette('');
    setFormule('RC');
    setPeriode('annuelle');
    setCreatedDevis(null);
    setWizardOpen(true);
  };

  const clientTrottinettes = trottinettes.filter((t) => t.client_id === selectedClient);
  const selectedTrott = trottinettes.find((t) => t.id === selectedTrottinette);
  const selectedClientObj = clients.find((c) => c.id === selectedClient);
  const calc = calculatePrime(formule, garanties, periode);

  const handleNext = () => {
    if (step === 1 && !selectedClient) { toast.error('Veuillez sélectionner un client'); return; }
    if (step === 2 && !selectedTrottinette) { toast.error('Veuillez sélectionner une trottinette'); return; }
    if (step === 2 && selectedTrott && selectedTrott.vitesse_max && selectedTrott.vitesse_max > 25) {
      toast.error('Trottinette non éligible (vitesse > 25 km/h)');
      return;
    }
    setStep(step + 1);
  };

  const handleCreateDevis = async () => {
    const numero = generateDevisNumber();
    const { data, error } = await supabase.from('devis').insert({
      numero,
      client_id: selectedClient,
      trottinette_id: selectedTrottinette,
      formule,
      prime_base: calc.primeBase,
      taxe: calc.taxe,
      prime_ttc: calc.primeTtc,
      periode,
      statut: 'emis',
      date_expiration: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    }).select().single();
    if (error) { toast.error('Erreur: ' + error.message); return; }

    // Insert devis_garanties
    const applicableGaranties = garanties.filter((g) => FORMULE_CONFIG[formule].garanties.includes(g.code));
    if (applicableGaranties.length > 0) {
      await supabase.from('devis_garanties').insert(
        applicableGaranties.map((g) => ({
          devis_id: data.id,
          garantie_id: g.id,
          prime: g.prime_base * FORMULE_CONFIG[formule].multiplier,
        }))
      );
    }

    await logActivity('create', `Devis créé: ${numero} (${formule})`, 'devis', data.id, user?.nom);
    setCreatedDevis(data);
    setStep(6);
    toast.success('Devis créé avec succès');
    loadDevis();
  };

  const handleDownloadPDF = () => {
    if (!createdDevis) return;
    generateDevisPDF(createdDevis, selectedClientObj || null, selectedTrott || null, garanties);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('devis').delete().eq('id', deleteId);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('delete', 'Devis supprimé', 'devis', deleteId, user?.nom);
    toast.success('Devis supprimé');
    setDeleteId(null);
    loadDevis();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Devis</h1>
          <p className="text-muted-foreground mt-1">{total} devis émis</p>
        </div>
        <Button onClick={openWizard}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau devis
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, formule..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Numéro</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">Client</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden lg:table-cell">Trottinette</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Formule</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">Prime TTC</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Statut</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Chargement...</td></tr>
              ) : devis.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  Aucun devis trouvé
                </td></tr>
              ) : (
                devis.map((d, i) => (
                  <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-medium">{d.numero}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm">{d.client_nom}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm">{d.trottinette_nom}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="font-semibold">{d.formule}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm font-semibold">{formatMoney(d.prime_ttc)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={d.statut === 'emis' ? 'default' : d.statut === 'accepte' ? 'secondary' : 'outline'}>
                        {d.statut}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => {
                            const c = clients.find(cl => cl.id === d.client_id);
                            const t = trottinettes.find(tr => tr.id === d.trottinette_id);
                            generateDevisPDF(d, c || null, t || null, garanties);
                          }}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(d.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">Page {page + 1} sur {totalPages}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Création de devis — Assistant</DialogTitle>
          </DialogHeader>

          {/* Steps indicator */}
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex flex-col items-center gap-1.5 ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step > s.num ? 'bg-primary text-primary-foreground' : step === s.num ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-muted'
                  }`}>
                    {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Client */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="text-lg font-bold">Sélectionnez le client</h3>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger><SelectValue placeholder="Rechercher un client..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom} — {c.email || 'N/A'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClientObj && (
                  <Card className="p-4 bg-blue-50 dark:bg-blue-950/30">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Nom:</span> {selectedClientObj.prenom} {selectedClientObj.nom}</div>
                      <div><span className="text-muted-foreground">CIN:</span> {selectedClientObj.cin || '—'}</div>
                      <div><span className="text-muted-foreground">Téléphone:</span> {selectedClientObj.telephone || '—'}</div>
                      <div><span className="text-muted-foreground">Ville:</span> {selectedClientObj.ville || '—'}</div>
                    </div>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Step 2: Trottinette */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="text-lg font-bold">Sélectionnez la trottinette</h3>
                {clientTrottinettes.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    <Bike className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    Ce client n'a pas de trottinette enregistrée. Ajoutez d'abord une trottinette.
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {clientTrottinettes.map((t) => (
                      <button key={t.id} onClick={() => setSelectedTrottinette(t.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedTrottinette === t.id ? 'border-primary bg-blue-50 dark:bg-blue-950/30' : 'border-border hover:border-primary/50'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <Bike className="h-5 w-5 text-primary" />
                          <span className="font-semibold">{t.marque} {t.modele}</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <div>N° Série: {t.numero_serie || '—'}</div>
                          <div>Puissance: {t.puissance_w ? `${t.puissance_w} W` : '—'}</div>
                          <div className={t.vitesse_max && t.vitesse_max > 25 ? 'text-destructive font-semibold' : ''}>
                            Vitesse: {t.vitesse_max ? `${t.vitesse_max} km/h` : '—'}
                          </div>
                          <div>Valeur: {formatMoney(t.valeur)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Garanties / Formule */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="text-lg font-bold">Choisissez votre formule</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {(['RC', 'ZEN', 'MAX'] as Formule[]).map((f) => {
                    const config = FORMULE_CONFIG[f];
                    const applicable = garanties.filter((g) => config.garanties.includes(g.code));
                    return (
                      <button key={f} onClick={() => setFormule(f)}
                        className={`p-5 rounded-xl border-2 text-left transition-all ${formule === f ? 'border-primary shadow-glow' : 'border-border hover:border-primary/50'}`}>
                        <div className="text-2xl font-extrabold mb-1">{f}</div>
                        <div className="text-xs text-muted-foreground mb-3">{config.description}</div>
                        <div className="space-y-1">
                          {applicable.map((g) => (
                            <div key={g.code} className="flex items-center gap-1.5 text-xs">
                              <Check className="h-3 w-3 text-green-500" />
                              {g.nom}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div>
                  <Label className="mb-2 block">Période de paiement</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setPeriode('annuelle')}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${periode === 'annuelle' ? 'border-primary bg-blue-50 dark:bg-blue-950/30' : 'border-border'}`}>
                      Annuelle
                    </button>
                    <button onClick={() => setPeriode('semestrielle')}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${periode === 'semestrielle' ? 'border-primary bg-blue-50 dark:bg-blue-950/30' : 'border-border'}`}>
                      Semestrielle
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Calcul */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="text-lg font-bold">Calcul de la prime</h3>
                <Card className="p-5">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-sm font-semibold pb-2">Garantie</th>
                        <th className="text-right text-sm font-semibold pb-2">Prime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calc.details.map((d, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2.5 text-sm">{d.nom}</td>
                          <td className="py-2.5 text-sm text-right font-medium">{formatMoney(d.prime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 space-y-2 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prime de base ({periode})</span>
                      <span className="font-medium">{formatMoney(calc.primeBase)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxe (15%)</span>
                      <span className="font-medium">{formatMoney(calc.taxe)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-border">
                      <span>Total TTC</span>
                      <span className="text-primary">{formatMoney(calc.primeTtc)}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 5: Résumé */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="text-lg font-bold">Résumé du devis</h3>
                <Card className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Client:</span> {selectedClientObj?.prenom} {selectedClientObj?.nom}</div>
                    <div><span className="text-muted-foreground">Trottinette:</span> {selectedTrott?.marque} {selectedTrott?.modele}</div>
                    <div><span className="text-muted-foreground">Formule:</span> <Badge variant="outline" className="font-semibold">{formule}</Badge></div>
                    <div><span className="text-muted-foreground">Période:</span> {periode}</div>
                    <div><span className="text-muted-foreground">N° Série:</span> {selectedTrott?.numero_serie || '—'}</div>
                    <div><span className="text-muted-foreground">Vitesse max:</span> {selectedTrott?.vitesse_max} km/h</div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Prime de base</span>
                      <span>{formatMoney(calc.primeBase)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Taxe (15%)</span>
                      <span>{formatMoney(calc.taxe)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-extrabold pt-2">
                      <span>Total TTC</span>
                      <span className="text-primary">{formatMoney(calc.primeTtc)}</span>
                    </div>
                  </div>
                </Card>
                <Button onClick={handleCreateDevis} className="w-full" size="lg">
                  <Check className="h-4 w-4 mr-2" />
                  Valider et créer le devis
                </Button>
              </motion.div>
            )}

            {/* Step 6: PDF */}
            {step === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-600" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold">Devis créé avec succès !</h3>
                  <p className="text-muted-foreground mt-1">Numéro: <span className="font-mono font-semibold">{createdDevis?.numero}</span></p>
                </div>
                <Button onClick={handleDownloadPDF} size="lg" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le PDF
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step < 6 && (
            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
              </Button>
              {step < 5 ? (
                <Button onClick={handleNext}>
                  Suivant <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : null}
            </div>
          )}
          {step === 6 && (
            <DialogFooter>
              <Button onClick={() => setWizardOpen(false)}>Terminer</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Le devis sera définitivement supprimé.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
