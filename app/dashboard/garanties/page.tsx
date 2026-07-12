'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { formatMoney, FORMULE_CONFIG } from '@/lib/prime';
import { useAuth } from '@/lib/auth-context';
import type { Garantie, Formule } from '@/lib/types';
import { toast } from 'sonner';

export default function GarantiesPage() {
  const { user } = useAuth();
  const [garanties, setGaranties] = useState<Garantie[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Garantie | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', nom: '', description: '', prime_base: '', categorie: 'base', active: true });

  const loadGaranties = async () => {
    setLoading(true);
    const { data } = await supabase.from('garanties').select('*').order('prime_base');
    setGaranties(data || []);
    setLoading(false);
  };

  useEffect(() => { loadGaranties(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', nom: '', description: '', prime_base: '', categorie: 'base', active: true });
    setDialogOpen(true);
  };

  const openEdit = (g: Garantie) => {
    setEditing(g);
    setForm({ code: g.code, nom: g.nom, description: g.description || '', prime_base: g.prime_base.toString(), categorie: g.categorie, active: g.active });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: form.code.toUpperCase(),
      nom: form.nom,
      description: form.description || null,
      prime_base: parseFloat(form.prime_base) || 0,
      categorie: form.categorie,
      active: form.active,
    };
    if (editing) {
      const { error } = await supabase.from('garanties').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erreur: ' + error.message); return; }
      await logActivity('update', `Garantie modifiée: ${form.nom}`, 'garantie', editing.id, user?.nom);
      toast.success('Garantie modifiée');
    } else {
      const { error } = await supabase.from('garanties').insert(payload);
      if (error) { toast.error('Erreur: ' + error.message); return; }
      await logActivity('create', `Nouvelle garantie: ${form.nom}`, 'garantie', null, user?.nom);
      toast.success('Garantie créée');
    }
    setDialogOpen(false);
    loadGaranties();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('garanties').delete().eq('id', deleteId);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    await logActivity('delete', 'Garantie supprimée', 'garantie', deleteId, user?.nom);
    toast.success('Garantie supprimée');
    setDeleteId(null);
    loadGaranties();
  };

  const getCategorieColor = (cat: string) => {
    switch (cat) {
      case 'base': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'option': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Garanties</h1>
          <p className="text-muted-foreground mt-1">Catalogue des garanties d'assurance</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle garantie
        </Button>
      </div>

      {/* Formules overview */}
      <div className="grid sm:grid-cols-3 gap-4">
        {(['RC', 'ZEN', 'MAX'] as Formule[]).map((f, i) => {
          const config = FORMULE_CONFIG[f];
          const applicable = garanties.filter((g) => config.garanties.includes(g.code));
          const total = applicable.reduce((sum, g) => sum + g.prime_base * config.multiplier, 0);
          return (
            <motion.div key={f} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`p-6 ${f === 'ZEN' ? 'border-primary shadow-glow' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-extrabold">{f}</h3>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Prime annuelle</div>
                    <div className="text-lg font-bold text-primary">{formatMoney(total)}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{config.description}</p>
                <div className="space-y-2">
                  {applicable.map((g) => (
                    <div key={g.code} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      {g.nom}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Garanties table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Code</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Nom</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3 hidden md:table-cell">Description</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Catégorie</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Prime base</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Active</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Chargement...</td></tr>
              ) : garanties.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  Aucune garantie trouvée
                </td></tr>
              ) : (
                garanties.map((g, i) => (
                  <motion.tr key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3"><Badge variant="outline" className="font-mono">{g.code}</Badge></td>
                    <td className="px-4 py-3 font-medium text-sm">{g.nom}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">{g.description || '—'}</td>
                    <td className="px-4 py-3"><Badge className={getCategorieColor(g.categorie)}>{g.categorie}</Badge></td>
                    <td className="px-4 py-3 font-semibold text-sm">{formatMoney(g.prime_base)}</td>
                    <td className="px-4 py-3">
                      <Switch checked={g.active} disabled />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(g)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(g.id)}>
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
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la garantie' : 'Nouvelle garantie'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="RC" disabled={!!editing} />
              </div>
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required placeholder="Responsabilité Civile" />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prime_base">Prime de base (DH) *</Label>
                <Input id="prime_base" type="number" step="0.01" value={form.prime_base} onChange={(e) => setForm({ ...form, prime_base: e.target.value })} required placeholder="350.00" />
              </div>
              <div>
                <Label htmlFor="categorie">Catégorie</Label>
                <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="option">Option</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} id="active" />
              <Label htmlFor="active">Garantie active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editing ? 'Modifier' : 'Créer'}</Button>
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
