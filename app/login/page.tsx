'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Role } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email || (role === 'admin' ? 'admin@trotassur.ma' : 'agent@trotassur.ma'), role);
      toast.success(`Bienvenue, ${role === 'admin' ? 'Administrateur' : 'Agent'} !`);
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-500 p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white">
            <Shield className="h-8 w-8" />
            <span className="text-2xl font-extrabold">TrotAssur</span>
          </div>
        </div>
        <div className="relative z-10 text-white">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold leading-tight mb-4"
          >
            La plateforme d'assurance<br />trottinette nouvelle génération
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-blue-100 text-lg max-w-md"
          >
            Gérez vos clients, devis, contrats et sinistres en toute simplicité. Un outil moderne pour une assurance moderne.
          </motion.p>
          <div className="mt-8 space-y-3">
            {['Tableau de bord en temps réel', 'Devis automatisés en 2 minutes', 'Génération PDF professionnelle'].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 text-blue-100"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-white" />
                </div>
                {f}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-blue-200 text-sm">
          © 2024 TrotAssur SARL — Tous droits réservés
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size={48} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Connexion</h2>
          <p className="text-muted-foreground mb-8">Accédez à votre espace de gestion</p>

          <Card className="p-8 shadow-premium-lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role selector */}
              <div>
                <Label className="mb-2 block">Rôle</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === 'admin'
                        ? 'border-primary bg-blue-50 dark:bg-blue-950/50'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Shield className={`h-5 w-5 ${role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-semibold">Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('agent')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === 'agent'
                        ? 'border-primary bg-blue-50 dark:bg-blue-950/50'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <User className={`h-5 w-5 ${role === 'agent' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-semibold">Agent</span>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'admin' ? 'admin@trotassur.ma' : 'agent@trotassur.ma'}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  Se souvenir de moi
                </label>
                <button type="button" className="text-sm text-primary hover:underline">
                  Mot de passe oublié ?
                </button>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Card>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <button onClick={() => router.push('/')} className="text-primary hover:underline font-medium">
              Retour à l'accueil
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
