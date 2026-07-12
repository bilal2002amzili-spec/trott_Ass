'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { formatDate } from '@/lib/prime';
import { useAuth } from '@/lib/auth-context';
import type { Client } from '@/lib/types';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PAGE_SIZE = 8;

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>}>
      <ClientsContent />
    </Suspense>
  );
}

function ClientsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [villeFilter, setVilleFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nom: '', prenom: '', cin: '', telephone: '', email: '', adresse: '', ville: '',
    date_naissance: '', type_client: 'particulier', statut: 'actif',
  });

  const loadClients = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('clients').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,email.ilike.%${search}%,cin.ilike.%${search}%`);
    }
    if (villeFilter !== 'all') query = query.eq('ville', villeFilter);
    if (statutFilter !== 'all') query = query.eq('statut', statutFilter);

    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (error) toast.error('Erreur: ' + error.message);
    setClients(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [search, villeFilter, statutFilter, page]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const openCreate = () => {
    setEditingClient(null);
    setForm({ nom: '', prenom: '', cin: '', telephone: '', email: '', adresse: '', ville: '', date_naissance: '', type_client: 'particulier', statut: 'actif' });
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      nom: client.nom, prenom: client.prenom, cin: client.cin || '', telephone: client.telephone || '',
      email: client.email || '', adresse: client.adresse || '', ville: client.ville || '',
      date_naissance: client.date_naissance || '', type_client: client.type_client, statut: client.statut,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      const { error } = await supabase.from('clients').update({
        ...form,
        date_naissance: form.date_naissance || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editingClient.id);
      if (error) { toast.error('Erreur: ' + error.message); return; }
      await logActivity('update', `Client modifié: ${form.prenom} ${form.nom}`, 'client', editingClient.id, user?.nom);
      toast.success('Client modifié avec succès');
    } else {
      const { data, error } = await supabase.from('clients').insert({
        ...form,
        date_naissance: form.date_naissance || null,
      }).select().single();
      if (error) { toast.error('Erreur: ' + error.message); return; }
      await logActivity('create', `Nouveau client: ${form.prenom} ${form.nom}`, 'client', data?.id, user?.nom);
      toast.success('Client créé avec succès');
    }
    setDialogOpen(false);
    loadClients();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('clients').delete().eq('id', deleteId);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('delete', 'Client supprimé', 'client', deleteId, user?.nom);
    toast.success('Client supprimé');
    setDeleteId(null);
    loadClients();
  };

  const exportCSV = () => {
    const headers = ['Nom', 'Prénom', 'CIN', 'Téléphone', 'Email', 'Ville', 'Statut', 'Date création'];
    const rows = clients.map(c => [c.nom, c.prenom, c.cin, c.telephone, c.email, c.ville, c.statut, formatDate(c.created_at)]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">{total} client(s) enregistré(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, prénom, email, CIN..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-10"
            />
          </div>
          <Select value={villeFilter} onValueChange={(v) => { setVilleFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Ville" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les villes</SelectItem>
              <SelectItem value="Casablanca">Casablanca</SelectItem>
              <SelectItem value="Rabat">Rabat</SelectItem>
              <SelectItem value="Marrakech">Marrakech</SelectItem>
              <SelectItem value="Tanger">Tanger</SelectItem>
              <SelectItem value="Fès">Fès</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statutFilter} onValueChange={(v) => { setStatutFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="inactif">Inactif</SelectItem>
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
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">CIN</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden lg:table-cell">Contact</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">Ville</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Statut</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Chargement...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  Aucun client trouvé
                </td></tr>
              ) : (
                <AnimatePresence>
                  {clients.map((client, i) => (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {client.prenom.charAt(0)}{client.nom.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{client.prenom} {client.nom}</div>
                            <div className="text-xs text-muted-foreground">{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm">{client.cin || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm">{client.telephone || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm">{client.ville || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={client.statut === 'actif' ? 'default' : 'secondary'} className="text-xs">
                          {client.statut}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(client.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Page {page + 1} sur {totalPages}
            </div>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="cin">CIN</Label>
                <Input id="cin" value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input id="telephone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="ville">Ville</Label>
                <Input id="ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="date_naissance">Date de naissance</Label>
                <Input id="date_naissance" type="date" value={form.date_naissance} onChange={(e) => setForm({ ...form, date_naissance: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="type_client">Type</Label>
                <Select value={form.type_client} onValueChange={(v) => setForm({ ...form, type_client: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particulier">Particulier</SelectItem>
                    <SelectItem value="entreprise">Entreprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea id="adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editingClient ? 'Modifier' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le client sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
