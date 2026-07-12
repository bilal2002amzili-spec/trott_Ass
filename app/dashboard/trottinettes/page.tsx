'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Bike, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, XCircle,
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
import { formatDate, formatMoney } from '@/lib/prime';
import { useAuth } from '@/lib/auth-context';
import type { Trottinette, Client } from '@/lib/types';
import { toast } from 'sonner';

const PAGE_SIZE = 8;
const MAX_SPEED = 25;

export default function TrottinettesPage() {
  const { user } = useAuth();
  const [trottinettes, setTrottinettes] = useState<(Trottinette & { client_nom?: string })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Trottinette | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_id: '', marque: '', modele: '', numero_serie: '', puissance_w: '',
    couleur: '', date_achat: '', valeur: '', vitesse_max: '',
  });
  const [speedWarning, setSpeedWarning] = useState(false);

  const loadTrottinettes = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('trottinettes').select('*, clients!inner(nom, prenom)', { count: 'exact' });
    if (search) {
      query = query.or(`marque.ilike.%${search}%,modele.ilike.%${search}%,numero_serie.ilike.%${search}%`);
    }
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('created_at', { ascending: false });
    const { data, count, error } = await query;
    if (error) {
      // Try without inner join
      const { data: data2, count: count2 } = await supabase.from('trottinettes').select('*, clients(nom, prenom)', { count: 'exact' })
        .or(search ? `marque.ilike.%${search}%,modele.ilike.%${search}%,numero_serie.ilike.%${search}%` : 'id.neq.null')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('created_at', { ascending: false });
      setTrottinettes((data2 || []).map((t: any) => ({ ...t, client_nom: t.clients ? `${t.clients.prenom} ${t.clients.nom}` : '—' })));
      setTotal(count2 || 0);
    } else {
      setTrottinettes((data || []).map((t: any) => ({ ...t, client_nom: t.clients ? `${t.clients.prenom} ${t.clients.nom}` : '—' })));
      setTotal(count || 0);
    }
    setLoading(false);
  }, [search, page]);

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('nom');
    setClients(data || []);
  };

  useEffect(() => { loadTrottinettes(); loadClients(); }, [loadTrottinettes]);

  const openCreate = () => {
    setEditing(null);
    setForm({ client_id: '', marque: '', modele: '', numero_serie: '', puissance_w: '', couleur: '', date_achat: '', valeur: '', vitesse_max: '' });
    setSpeedWarning(false);
    setDialogOpen(true);
  };

  const openEdit = (t: Trottinette) => {
    setEditing(t);
    setForm({
      client_id: t.client_id || '', marque: t.marque, modele: t.modele, numero_serie: t.numero_serie || '',
      puissance_w: t.puissance_w?.toString() || '', couleur: t.couleur || '', date_achat: t.date_achat || '',
      valeur: t.valeur?.toString() || '', vitesse_max: t.vitesse_max?.toString() || '',
    });
    setSpeedWarning((t.vitesse_max || 0) > MAX_SPEED);
    setDialogOpen(true);
  };

  const handleSpeedChange = (value: string) => {
    const speed = parseFloat(value);
    setSpeedWarning(speed > MAX_SPEED);
    setForm({ ...form, vitesse_max: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vitesse = parseFloat(form.vitesse_max) || 0;
    if (vitesse > MAX_SPEED) {
      toast.error(`Refusé: la vitesse (${vitesse} km/h) dépasse 25 km/h. Cette trottinette n'est pas éligible.`);
      return;
    }
    const payload = {
      client_id: form.client_id || null,
      marque: form.marque, modele: form.modele, numero_serie: form.numero_serie,
      puissance_w: form.puissance_w ? parseInt(form.puissance_w) : null,
      couleur: form.couleur, date_achat: form.date_achat || null,
      valeur: form.valeur ? parseFloat(form.valeur) : null,
      vitesse_max: vitesse || null,
      valide: vitesse <= MAX_SPEED,
    };
    if (editing) {
      const { error } = await supabase.from('trottinettes').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erreur: ' + error.message); return; }
      await logActivity('update', `Trottinette modifiée: ${form.marque} ${form.modele}`, 'trottinette', editing.id, user?.nom);
      toast.success('Trottinette modifiée');
    } else {
      const { data, error } = await supabase.from('trottinettes').insert(payload).select().single();
      if (error) { toast.error('Erreur: ' + error.message); return; }
      await logActivity('create', `Nouvelle trottinette: ${form.marque} ${form.modele}`, 'trottinette', data?.id, user?.nom);
      toast.success('Trottinette enregistrée');
    }
    setDialogOpen(false);
    loadTrottinettes();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('trottinettes').delete().eq('id', deleteId);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('delete', 'Trottinette supprimée', 'trottinette', deleteId, user?.nom);
    toast.success('Trottinette supprimée');
    setDeleteId(null);
    loadTrottinettes();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Trottinettes</h1>
          <p className="text-muted-foreground mt-1">{total} trottinette(s) enregistrée(s)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle trottinette
        </Button>
      </div>

      {/* Speed validation notice */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Règle de validation: la vitesse maximale doit être inférieure ou égale à 25 km/h. Au-delà, le devis est automatiquement refusé.
          </p>
        </div>
      </Card>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par marque, modèle, numéro de série..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Grid of trottinettes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Chargement...</div>
        ) : trottinettes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Bike className="h-12 w-12 mx-auto mb-2 opacity-30" />
            Aucune trottinette trouvée
          </div>
        ) : (
          <AnimatePresence>
            {trottinettes.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5 hover:shadow-premium-lg transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                      <Bike className="h-6 w-6 text-white" />
                    </div>
                    {t.valide ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Validée
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" /> Non éligible
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-lg">{t.marque} {t.modele}</h3>
                  <p className="text-sm text-muted-foreground mb-3">Client: {t.client_nom}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">N° Série</span>
                      <span className="font-medium">{t.numero_serie || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Puissance</span>
                      <span className="font-medium">{t.puissance_w ? `${t.puissance_w} W` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vitesse max</span>
                      <span className={`font-medium ${t.vitesse_max && t.vitesse_max > MAX_SPEED ? 'text-destructive' : ''}`}>
                        {t.vitesse_max ? `${t.vitesse_max} km/h` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valeur</span>
                      <span className="font-medium">{formatMoney(t.valeur)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date achat</span>
                      <span className="font-medium">{formatDate(t.date_achat)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Modifier
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la trottinette' : 'Nouvelle trottinette'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="client_id">Client propriétaire</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marque">Marque *</Label>
                <Input id="marque" value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} required placeholder="Xiaomi" />
              </div>
              <div>
                <Label htmlFor="modele">Modèle *</Label>
                <Input id="modele" value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} required placeholder="Mi Electric Scooter 3" />
              </div>
              <div>
                <Label htmlFor="numero_serie">Numéro de série</Label>
                <Input id="numero_serie" value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="puissance_w">Puissance (W)</Label>
                <Input id="puissance_w" type="number" value={form.puissance_w} onChange={(e) => setForm({ ...form, puissance_w: e.target.value })} placeholder="350" />
              </div>
              <div>
                <Label htmlFor="couleur">Couleur</Label>
                <Input id="couleur" value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} placeholder="Noir" />
              </div>
              <div>
                <Label htmlFor="date_achat">Date d'achat</Label>
                <Input id="date_achat" type="date" value={form.date_achat} onChange={(e) => setForm({ ...form, date_achat: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="valeur">Valeur (DH)</Label>
                <Input id="valeur" type="number" step="0.01" value={form.valeur} onChange={(e) => setForm({ ...form, valeur: e.target.value })} placeholder="450.00" />
              </div>
              <div>
                <Label htmlFor="vitesse_max">Vitesse max (km/h) *</Label>
                <Input
                  id="vitesse_max"
                  type="number"
                  step="0.1"
                  value={form.vitesse_max}
                  onChange={(e) => handleSpeedChange(e.target.value)}
                  required
                  placeholder="25"
                  className={speedWarning ? 'border-destructive' : ''}
                />
                {speedWarning && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Vitesse supérieure à 25 km/h — non éligible à l'assurance
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editing ? 'Modifier' : 'Enregistrer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. La trottinette sera définitivement supprimée.</AlertDialogDescription>
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
