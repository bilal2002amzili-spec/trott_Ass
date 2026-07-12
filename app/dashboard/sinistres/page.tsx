'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Plus, Search, Download, Trash2, ChevronLeft, ChevronRight,
  Clock, CheckCircle2, XCircle, FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { generateSinistreNumber, formatMoney, formatDate } from '@/lib/prime';
import { generateSinistrePDF } from '@/lib/pdf';
import { useAuth } from '@/lib/auth-context';
import type { Sinistre, Contrat, Client, Trottinette } from '@/lib/types';
import { toast } from 'sonner';

const PAGE_SIZE = 8;

const statutConfig: Record<string, { label: string; color: string; icon: any }> = {
  declare: { label: 'Déclaré', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', icon: Clock },
  valide: { label: 'Validé', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', icon: CheckCircle2 },
  refuse: { label: 'Refusé', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', icon: XCircle },
  indemnise: { label: 'Indemnisé', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', icon: CheckCircle2 },
};

export default function SinistresPage() {
  const { user } = useAuth();
  const [sinistres, setSinistres] = useState<(Sinistre & { client_nom?: string; contrat_numero?: string })[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [trottinettes, setTrottinettes] = useState<Trottinette[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    contrat_id: '', type_sinistre: 'accident', description: '', date_sinistre: '', montant_estime: '',
  });

  const loadSinistres = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('sinistres').select('*, clients(nom, prenom), contrats(numero_police)', { count: 'exact' });
    if (search) query = query.or(`numero.ilike.%${search}%,type_sinistre.ilike.%${search}%`);
    if (statutFilter !== 'all') query = query.eq('statut', statutFilter);
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('date_declaration', { ascending: false });
    const { data, count, error } = await query;
    if (error) {
      const { data: d2, count: c2 } = await supabase.from('sinistres').select('*, clients(nom, prenom), contrats(numero_police)', { count: 'exact' })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('date_declaration', { ascending: false });
      setSinistres((d2 || []).map((s: any) => ({ ...s, client_nom: s.clients ? `${s.clients.prenom} ${s.clients.nom}` : '—', contrat_numero: s.contrats?.numero_police || '—' })));
      setTotal(c2 || 0);
    } else {
      setSinistres((data || []).map((s: any) => ({ ...s, client_nom: s.clients ? `${s.clients.prenom} ${s.clients.nom}` : '—', contrat_numero: s.contrats?.numero_police || '—' })));
      setTotal(count || 0);
    }
    setLoading(false);
  }, [search, statutFilter, page]);

  useEffect(() => {
    loadSinistres();
    (async () => {
      const [c, cl, t] = await Promise.all([
        supabase.from('contrats').select('*').eq('statut', 'actif').order('created_at', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('trottinettes').select('*'),
      ]);
      setContrats(c.data || []);
      setClients((cl.data as Client[]) || []);
      setTrottinettes(t.data || []);
    })();
  }, [loadSinistres]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numero = generateSinistreNumber();
    const contrat = contrats.find((c) => c.id === form.contrat_id);
    const { data, error } = await supabase.from('sinistres').insert({
      numero,
      contrat_id: form.contrat_id || null,
      client_id: contrat?.client_id || null,
      trottinette_id: contrat?.trottinette_id || null,
      type_sinistre: form.type_sinistre,
      description: form.description || null,
      date_sinistre: form.date_sinistre || new Date().toISOString().split('T')[0],
      montant_estime: parseFloat(form.montant_estime) || 0,
      statut: 'declare',
    }).select().single();
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('create', `Sinistre déclaré: ${numero} (${form.type_sinistre})`, 'sinistre', data.id, user?.nom);
    toast.success('Sinistre déclaré avec succès');
    setDialogOpen(false);
    setForm({ contrat_id: '', type_sinistre: 'accident', description: '', date_sinistre: '', montant_estime: '' });
    loadSinistres();
  };

  const handleStatusChange = async (id: string, statut: string) => {
    const { error } = await supabase.from('sinistres').update({ statut, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('update', `Sinistre ${statut}`, 'sinistre', id, user?.nom);
    toast.success(`Statut mis à jour: ${statut}`);
    loadSinistres();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('sinistres').delete().eq('id', deleteId);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('delete', 'Sinistre supprimé', 'sinistre', deleteId, user?.nom);
    toast.success('Sinistre supprimé');
    setDeleteId(null);
    loadSinistres();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Sinistres</h1>
          <p className="text-muted-foreground mt-1">{total} sinistre(s) déclaré(s)</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Déclarer un sinistre
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par numéro, type..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
          </div>
          <Select value={statutFilter} onValueChange={(v) => { setStatutFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="declare">Déclaré</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="valide">Validé</SelectItem>
              <SelectItem value="refuse">Refusé</SelectItem>
              <SelectItem value="indemnise">Indemnisé</SelectItem>
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
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Numéro</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">Client</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">Date sinistre</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden lg:table-cell">Montant estimé</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Statut</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Chargement...</td></tr>
              ) : sinistres.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  Aucun sinistre trouvé
                </td></tr>
              ) : (
                sinistres.map((s, i) => {
                  const cfg = statutConfig[s.statut] || statutConfig.declare;
                  return (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm font-medium">{s.numero}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm">{s.client_nom}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{s.type_sinistre}</Badge></td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm">{formatDate(s.date_sinistre)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm font-semibold">{formatMoney(s.montant_estime)}</td>
                      <td className="px-4 py-3">
                        <Select value={s.statut} onValueChange={(v) => handleStatusChange(s.id, v)}>
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="declare">Déclaré</SelectItem>
                            <SelectItem value="en_cours">En cours</SelectItem>
                            <SelectItem value="valide">Validé</SelectItem>
                            <SelectItem value="refuse">Refusé</SelectItem>
                            <SelectItem value="indemnise">Indemnisé</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="PDF"
                            onClick={() => {
                              const cl = clients.find(x => x.id === s.client_id);
                              const tr = trottinettes.find(x => x.id === s.trottinette_id);
                              generateSinistrePDF(s, cl || null, tr || null);
                            }}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}>
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
            <DialogTitle>Déclarer un sinistre</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Contrat concerné</Label>
              <Select value={form.contrat_id} onValueChange={(v) => setForm({ ...form, contrat_id: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Sélectionner un contrat..." /></SelectTrigger>
                <SelectContent>
                  {contrats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.numero_police} — {c.formule}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type_sinistre">Type de sinistre</Label>
                <Select value={form.type_sinistre} onValueChange={(v) => setForm({ ...form, type_sinistre: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="vol">Vol</SelectItem>
                    <SelectItem value="incendie">Incendie</SelectItem>
                    <SelectItem value="dommage">Dommage matériel</SelectItem>
                    <SelectItem value="corporel">Corporel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_sinistre">Date du sinistre</Label>
                <Input id="date_sinistre" type="date" value={form.date_sinistre}
                  onChange={(e) => setForm({ ...form, date_sinistre: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label htmlFor="montant_estime">Montant estimé (DH)</Label>
              <Input id="montant_estime" type="number" step="0.01" value={form.montant_estime}
                onChange={(e) => setForm({ ...form, montant_estime: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Décrivez les circonstances du sinistre..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit">Déclarer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Le sinistre sera définitivement supprimé.</AlertDialogDescription>
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
