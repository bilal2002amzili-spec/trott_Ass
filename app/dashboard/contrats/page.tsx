'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Search, Download, Trash2, ChevronLeft, ChevronRight,
  Plus, FileCheck, BadgeCheck,
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
import { generatePoliceNumber, formatMoney, formatDate } from '@/lib/prime';
import { generateContratPDF, generateAttestationPDF } from '@/lib/pdf';
import { useAuth } from '@/lib/auth-context';
import type { Contrat, Devis, Client, Trottinette } from '@/lib/types';
import { toast } from 'sonner';

const PAGE_SIZE = 8;

export default function ContratsPage() {
  const { user } = useAuth();
  const [contrats, setContrats] = useState<(Contrat & { client_nom?: string; trottinette_nom?: string })[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [trottinettes, setTrottinettes] = useState<Trottinette[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadContrats = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('contrats').select('*, clients(nom, prenom), trottinettes(marque, modele)', { count: 'exact' });
    if (search) query = query.or(`numero_police.ilike.%${search}%`);
    if (statutFilter !== 'all') query = query.eq('statut', statutFilter);
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('created_at', { ascending: false });
    const { data, count, error } = await query;
    if (error) {
      const { data: d2, count: c2 } = await supabase.from('contrats').select('*, clients(nom, prenom), trottinettes(marque, modele)', { count: 'exact' })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('created_at', { ascending: false });
      setContrats((d2 || []).map((c: any) => ({ ...c, client_nom: c.clients ? `${c.clients.prenom} ${c.clients.nom}` : '—', trottinette_nom: c.trottinettes ? `${c.trottinettes.marque} ${c.trottinettes.modele}` : '—' })));
      setTotal(c2 || 0);
    } else {
      setContrats((data || []).map((c: any) => ({ ...c, client_nom: c.clients ? `${c.clients.prenom} ${c.clients.nom}` : '—', trottinette_nom: c.trottinettes ? `${c.trottinettes.marque} ${c.trottinettes.modele}` : '—' })));
      setTotal(count || 0);
    }
    setLoading(false);
  }, [search, statutFilter, page]);

  useEffect(() => {
    loadContrats();
    (async () => {
      const [d, c, t] = await Promise.all([
        supabase.from('devis').select('*').eq('statut', 'emis').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('nom'),
        supabase.from('trottinettes').select('*'),
      ]);
      setDevis(d.data || []);
      setClients((c.data as Client[]) || []);
      setTrottinettes(t.data || []);
    })();
  }, [loadContrats]);

  const handleCreateContrat = async () => {
    if (!selectedDevis) { toast.error('Veuillez sélectionner un devis'); return; }
    const devisData = devis.find((d) => d.id === selectedDevis);
    if (!devisData) return;

    const numeroPolice = generatePoliceNumber();
    const dateEffet = new Date();
    const dateExpiration = new Date();
    dateExpiration.setFullYear(dateExpiration.getFullYear() + 1);

    const { data, error } = await supabase.from('contrats').insert({
      numero_police: numeroPolice,
      client_id: devisData.client_id,
      trottinette_id: devisData.trottinette_id,
      devis_id: devisData.id,
      formule: devisData.formule,
      prime_ttc: devisData.prime_ttc,
      date_effet: dateEffet.toISOString().split('T')[0],
      date_expiration: dateExpiration.toISOString().split('T')[0],
      statut: 'actif',
    }).select().single();

    if (error) { toast.error('Erreur: ' + error.message); return; }

    // Update devis status
    await supabase.from('devis').update({ statut: 'accepte' }).eq('id', devisData.id);

    await logActivity('create', `Contrat créé: ${numeroPolice} (${devisData.formule})`, 'contrat', data.id, user?.nom);
    toast.success('Contrat créé avec succès');
    setCreateOpen(false);
    setSelectedDevis('');
    loadContrats();
  };

  const handleStatusChange = async (id: string, statut: string) => {
    const { error } = await supabase.from('contrats').update({ statut, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('update', `Contrat ${statut}`, 'contrat', id, user?.nom);
    toast.success(`Statut mis à jour: ${statut}`);
    loadContrats();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('contrats').delete().eq('id', deleteId);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('delete', 'Contrat supprimé', 'contrat', deleteId, user?.nom);
    toast.success('Contrat supprimé');
    setDeleteId(null);
    loadContrats();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Contrats</h1>
          <p className="text-muted-foreground mt-1">{total} contrat(s) actif(s)</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau contrat
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par numéro de police..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
          </div>
          <Select value={statutFilter} onValueChange={(v) => { setStatutFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="suspendu">Suspendu</SelectItem>
              <SelectItem value="resilie">Résilié</SelectItem>
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
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">N° Police</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">Client</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden lg:table-cell">Trottinette</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Formule</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">Prime TTC</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden lg:table-cell">Échéance</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Statut</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Chargement...</td></tr>
              ) : contrats.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  Aucun contrat trouvé
                </td></tr>
              ) : (
                contrats.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-medium">{c.numero_police}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm">{c.client_nom}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm">{c.trottinette_nom}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="font-semibold">{c.formule}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm font-semibold">{formatMoney(c.prime_ttc)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm">{formatDate(c.date_expiration)}</td>
                    <td className="px-4 py-3">
                      <Select value={c.statut} onValueChange={(v) => handleStatusChange(c.id, v)}>
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actif">Actif</SelectItem>
                          <SelectItem value="suspendu">Suspendu</SelectItem>
                          <SelectItem value="resilie">Résilié</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Contrat PDF"
                          onClick={() => {
                            const cl = clients.find(x => x.id === c.client_id);
                            const tr = trottinettes.find(x => x.id === c.trottinette_id);
                            generateContratPDF(c, cl || null, tr || null);
                          }}>
                          <FileCheck className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Attestation PDF"
                          onClick={() => {
                            const cl = clients.find(x => x.id === c.client_id);
                            const tr = trottinettes.find(x => x.id === c.trottinette_id);
                            generateAttestationPDF(c, cl || null, tr || null);
                          }}>
                          <BadgeCheck className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un contrat depuis un devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sélectionnez un devis accepté</Label>
              <Select value={selectedDevis} onValueChange={setSelectedDevis}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choisir un devis..." /></SelectTrigger>
                <SelectContent>
                  {devis.length === 0 ? (
                    <SelectItem value="_none" disabled>Aucun devis disponible</SelectItem>
                  ) : devis.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.numero} — {d.formule} — {formatMoney(d.prime_ttc)} ({d.periode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedDevis && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 text-sm space-y-1">
                <div>Le contrat sera créé automatiquement avec:</div>
                <div>• Numéro de police généré automatiquement</div>
                <div>• Date d'effet: aujourd'hui</div>
                <div>• Date d'expiration: dans 1 an</div>
                <div>• Statut: Actif</div>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateContrat}>Créer le contrat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Le contrat sera définitivement supprimé.</AlertDialogDescription>
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
