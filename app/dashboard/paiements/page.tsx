'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Plus, Search, Download, Trash2, ChevronLeft, ChevronRight,
  Banknote, Wallet, Building, Receipt,
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
import { generateFactureNumber, formatMoney, formatDate } from '@/lib/prime';
import { generateRecuPDF, generateFacturePDF } from '@/lib/pdf';
import { useAuth } from '@/lib/auth-context';
import type { Paiement, Contrat, Client } from '@/lib/types';
import { toast } from 'sonner';

const PAGE_SIZE = 8;

const methodeIcons: Record<string, any> = {
  especes: Banknote,
  carte: CreditCard,
  virement: Building,
};

export default function PaiementsPage() {
  const { user } = useAuth();
  const [paiements, setPaiements] = useState<(Paiement & { client_nom?: string; contrat_numero?: string })[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodeFilter, setMethodeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalCA, setTotalCA] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ contrat_id: '', methode: 'especes', montant: '', reference: '' });

  const loadPaiements = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('paiements').select('*, clients(nom, prenom), contrats(numero_police)', { count: 'exact' });
    if (search) query = query.or(`numero_facture.ilike.%${search}%`);
    if (methodeFilter !== 'all') query = query.eq('methode', methodeFilter);
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('date_paiement', { ascending: false });
    const { data, count, error } = await query;
    if (error) {
      const { data: d2, count: c2 } = await supabase.from('paiements').select('*, clients(nom, prenom), contrats(numero_police)', { count: 'exact' })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('date_paiement', { ascending: false });
      setPaiements((d2 || []).map((p: any) => ({ ...p, client_nom: p.clients ? `${p.clients.prenom} ${p.clients.nom}` : '—', contrat_numero: p.contrats?.numero_police || '—' })));
      setTotal(c2 || 0);
    } else {
      setPaiements((data || []).map((p: any) => ({ ...p, client_nom: p.clients ? `${p.clients.prenom} ${p.clients.nom}` : '—', contrat_numero: p.contrats?.numero_police || '—' })));
      setTotal(count || 0);
    }

    const { data: allPaiements } = await supabase.from('paiements').select('montant');
    setTotalCA(allPaiements?.reduce((s, p) => s + (p.montant || 0), 0) || 0);
    setLoading(false);
  }, [search, methodeFilter, page]);

  useEffect(() => {
    loadPaiements();
    (async () => {
      const [c, cl] = await Promise.all([
        supabase.from('contrats').select('*').eq('statut', 'actif').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('nom'),
      ]);
      setContrats(c.data || []);
      setClients((cl.data as Client[]) || []);
    })();
  }, [loadPaiements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contrat = contrats.find((c) => c.id === form.contrat_id);
    const numeroFacture = generateFactureNumber();
    const { data, error } = await supabase.from('paiements').insert({
      numero_facture: numeroFacture,
      contrat_id: form.contrat_id || null,
      client_id: contrat?.client_id || null,
      montant: parseFloat(form.montant) || 0,
      methode: form.methode,
      statut: 'paye',
      reference: form.reference || numeroFacture,
    }).select().single();
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('create', `Paiement enregistré: ${numeroFacture} (${formatMoney(parseFloat(form.montant))})`, 'paiement', data.id, user?.nom);
    toast.success('Paiement enregistré');
    setDialogOpen(false);
    setForm({ contrat_id: '', methode: 'especes', montant: '', reference: '' });
    loadPaiements();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('paiements').delete().eq('id', deleteId);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('delete', 'Paiement supprimé', 'paiement', deleteId, user?.nom);
    toast.success('Paiement supprimé');
    setDeleteId(null);
    loadPaiements();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Paiements</h1>
          <p className="text-muted-foreground mt-1">{total} paiement(s) — CA total: {formatMoney(totalCA)}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau paiement
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Espèces', methode: 'especes', icon: Banknote, color: 'from-green-500 to-green-600' },
          { label: 'Carte', methode: 'carte', icon: CreditCard, color: 'from-blue-500 to-blue-600' },
          { label: 'Virement', methode: 'virement', icon: Building, color: 'from-cyan-500 to-cyan-600' },
        ].map((s, i) => {
          const methodTotal = paiements.filter(p => p.methode === s.methode).reduce((sum, p) => sum + (p.montant || 0), 0);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-4">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                  <s.icon className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div className="text-lg font-extrabold">{formatMoney(methodTotal)}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par numéro de facture..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
          </div>
          <Select value={methodeFilter} onValueChange={(v) => { setMethodeFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Méthode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les méthodes</SelectItem>
              <SelectItem value="especes">Espèces</SelectItem>
              <SelectItem value="carte">Carte</SelectItem>
              <SelectItem value="virement">Virement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">N° Facture</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">Client</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden lg:table-cell">N° Police</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Montant</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Méthode</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">Date</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Chargement...</td></tr>
              ) : paiements.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  Aucun paiement trouvé
                </td></tr>
              ) : (
                paiements.map((p, i) => {
                  const MethodeIcon = methodeIcons[p.methode] || Wallet;
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm font-medium">{p.numero_facture}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm">{p.client_nom}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm font-mono">{p.contrat_numero}</td>
                      <td className="px-4 py-3 font-semibold text-sm">{formatMoney(p.montant)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          <MethodeIcon className="h-3 w-3 mr-1" />
                          {p.methode}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm">{formatDate(p.date_paiement)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Reçu PDF"
                            onClick={() => {
                              const cl = clients.find(x => x.id === p.client_id);
                              const ct = contrats.find(x => x.id === p.contrat_id);
                              generateRecuPDF(p, cl || null, ct || null);
                            }}>
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Facture PDF"
                            onClick={() => {
                              const cl = clients.find(x => x.id === p.client_id);
                              const ct = contrats.find(x => x.id === p.contrat_id);
                              generateFacturePDF(p, cl || null, ct || null);
                            }}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Contrat concerné</Label>
              <Select value={form.contrat_id} onValueChange={(v) => setForm({ ...form, contrat_id: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Sélectionner un contrat..." /></SelectTrigger>
                <SelectContent>
                  {contrats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.numero_police} — {c.formule} — {formatMoney(c.prime_ttc)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="montant">Montant (DH) *</Label>
                <Input id="montant" type="number" step="0.01" value={form.montant}
                  onChange={(e) => setForm({ ...form, montant: e.target.value })} required placeholder="450.00" />
              </div>
              <div>
                <Label htmlFor="methode">Méthode</Label>
                <Select value={form.methode} onValueChange={(v) => setForm({ ...form, methode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="carte">Carte</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="reference">Référence</Label>
              <Input id="reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Référence de transaction (optionnel)" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
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
