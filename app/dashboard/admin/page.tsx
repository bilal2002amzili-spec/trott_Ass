'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, Shield, Moon, Sun, Bell, Lock, Mail, Save,
  Users, Eye, EyeOff, KeyRound,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export default function AdminPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ nom: user?.nom || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current: '', nouveau: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    emailNotif: true,
    pushNotif: true,
    sinistreAlert: true,
    paiementNotif: false,
  });

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Apparence', icon: Settings },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profil mis à jour avec succès');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.nouveau !== passwords.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwords.nouveau.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    toast.success('Mot de passe modifié avec succès');
    setPasswords({ current: '', nouveau: '', confirm: '' });
  };

  const mockUsers = [
    { nom: 'Administrateur', email: 'admin@trotassur.ma', role: 'admin', actif: true },
    { nom: 'Agent Assurance', email: 'agent@trotassur.ma', role: 'agent', actif: true },
    { nom: 'Agent Commercial', email: 'commercial@trotassur.ma', role: 'agent', actif: true },
    { nom: 'Agent Sinistres', email: 'sinistres@trotassur.ma', role: 'agent', actif: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Administration</h1>
        <p className="text-muted-foreground mt-1">Gérez votre profil et les paramètres du système</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <Card className="p-3 lg:col-span-1 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Tab content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">Profil</h2>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {user?.nom.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-lg font-bold">{user?.nom}</div>
                    <div className="text-sm text-muted-foreground capitalize">{user?.role}</div>
                    <Button variant="outline" size="sm" className="mt-2">Changer la photo</Button>
                  </div>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="nom">Nom complet</Label>
                    <Input id="nom" value={profile.nom} onChange={(e) => setProfile({ ...profile, nom: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="pl-10" />
                    </div>
                  </div>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">Sécurité</h2>
                <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="current">Mot de passe actuel</Label>
                    <div className="relative mt-1.5">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="current" type={showPassword ? 'text' : 'password'} value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="pl-10 pr-10" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="nouveau">Nouveau mot de passe</Label>
                    <Input id="nouveau" type={showPassword ? 'text' : 'password'} value={passwords.nouveau}
                      onChange={(e) => setPasswords({ ...passwords, nouveau: e.target.value })} className="mt-1.5" required />
                  </div>
                  <div>
                    <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                    <Input id="confirm" type={showPassword ? 'text' : 'password'} value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="mt-1.5" required />
                  </div>
                  <Button type="submit">
                    <Lock className="h-4 w-4 mr-2" />
                    Modifier le mot de passe
                  </Button>
                </form>
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="font-semibold mb-3">Sessions actives</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-sm font-medium">Session actuelle</div>
                          <div className="text-xs text-muted-foreground">Navigateur — Casablanca, Maroc</div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Utilisateurs</h2>
                  <Button size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-3">
                  {mockUsers.map((u, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`text-sm font-semibold ${u.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                            {u.nom.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{u.nom}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{u.role}</Badge>
                        <Switch defaultChecked={u.actif} />
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Shield className="h-4 w-4" />
                    Les administrateurs ont accès à toutes les fonctionnalités. Les agents peuvent gérer clients, devis, contrats et sinistres.
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">Notifications</h2>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotif', label: 'Notifications par email', desc: 'Recevoir les notifications par email' },
                    { key: 'pushNotif', label: 'Notifications push', desc: 'Notifications push sur le navigateur' },
                    { key: 'sinistreAlert', label: 'Alertes sinistres', desc: 'Être notifié lors d\'une nouvelle déclaration de sinistre' },
                    { key: 'paiementNotif', label: 'Notifications paiements', desc: 'Être notifié lors d\'un nouveau paiement' },
                  ].map((n) => (
                    <div key={n.key} className="flex items-center justify-between p-4 rounded-xl border border-border">
                      <div>
                        <div className="font-medium text-sm">{n.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>
                      </div>
                      <Switch
                        checked={notifSettings[n.key as keyof typeof notifSettings]}
                        onCheckedChange={(v) => {
                          setNotifSettings({ ...notifSettings, [n.key]: v });
                          toast.success('Paramètres mis à jour');
                        }}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">Apparence</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border">
                    <div className="font-medium text-sm mb-3">Thème</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setTheme('light')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-primary bg-blue-50 dark:bg-blue-950/30' : 'border-border'}`}>
                        <Sun className="h-6 w-6" />
                        <span className="text-sm font-medium">Clair</span>
                      </button>
                      <button onClick={() => setTheme('dark')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-primary bg-blue-50 dark:bg-blue-950/30' : 'border-border'}`}>
                        <Moon className="h-6 w-6" />
                        <span className="text-sm font-medium">Sombre</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border">
                    <div className="font-medium text-sm mb-2">Langue</div>
                    <Badge variant="outline">Français</Badge>
                  </div>
                  <div className="p-4 rounded-xl border border-border">
                    <div className="font-medium text-sm mb-2">Format de devise</div>
                    <Badge variant="outline">MAD (DH)</Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
