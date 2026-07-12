'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  FileText,
  AlertTriangle,
  TrendingUp,
  Coins,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDateTime } from '@/lib/prime';
import type { Client, Contrat, Devis, Sinistre, Paiement, Activite } from '@/lib/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const monthlyData = [
  { mois: 'Jan', clients: 120, contrats: 85, sinistres: 12 },
  { mois: 'Fév', clients: 145, contrats: 102, sinistres: 8 },
  { mois: 'Mar', clients: 168, contrats: 125, sinistres: 15 },
  { mois: 'Avr', clients: 190, contrats: 148, sinistres: 10 },
  { mois: 'Mai', clients: 215, contrats: 170, sinistres: 18 },
  { mois: 'Juin', clients: 245, contrats: 195, sinistres: 14 },
  { mois: 'Juil', clients: 280, contrats: 220, sinistres: 22 },
];

const formuleData = [
  { name: 'RC', value: 45, color: 'hsl(221 83% 53%)' },
  { name: 'ZEN', value: 35, color: 'hsl(199 89% 48%)' },
  { name: 'MAX', value: 20, color: 'hsl(0 84% 60%)' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    clients: 0,
    contrats: 0,
    devis: 0,
    sinistres: 0,
    ca: 0,
    primeMoyenne: 0,
  });
  const [activities, setActivities] = useState<Activite[]>([]);
  const [recentContrats, setRecentContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [clients, contrats, devis, sinistres, paiements, acts, recentC] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('contrats').select('*', { count: 'exact', head: true }),
        supabase.from('devis').select('*', { count: 'exact', head: true }),
        supabase.from('sinistres').select('*', { count: 'exact', head: true }),
        supabase.from('paiements').select('montant'),
        supabase.from('activites').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('contrats').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const ca = paiements.data?.reduce((sum, p) => sum + (p.montant || 0), 0) || 0;
      const contratsCount = contrats.count || 0;
      const primeMoyenne = contratsCount > 0 ? ca / contratsCount : 0;

      setStats({
        clients: clients.count || 0,
        contrats: contratsCount,
        devis: devis.count || 0,
        sinistres: sinistres.count || 0,
        ca,
        primeMoyenne,
      });
      setActivities(acts.data || []);
      setRecentContrats(recentC.data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const kpis = [
    { label: 'Clients', value: stats.clients, icon: Users, change: '+12%', up: true, color: 'from-blue-500 to-blue-600' },
    { label: 'Contrats', value: stats.contrats, icon: Shield, change: '+8%', up: true, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Devis', value: stats.devis, icon: FileText, change: '+15%', up: true, color: 'from-blue-400 to-blue-500' },
    { label: 'Sinistres', value: stats.sinistres, icon: AlertTriangle, change: '-5%', up: false, color: 'from-red-500 to-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de votre activité d'assurance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-5 hover:shadow-premium-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className="h-5 w-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${kpi.up ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-3xl font-extrabold">{loading ? '—' : kpi.value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">{kpi.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue + Prime moyenne */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Chiffre d'affaires</div>
                <div className="text-2xl font-extrabold">{loading ? '—' : formatMoney(stats.ca)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
              <TrendingUp className="h-3 w-3" />
              +18% vs mois dernier
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Prime moyenne</div>
                <div className="text-2xl font-extrabold">{loading ? '—' : formatMoney(stats.primeMoyenne)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
              <ArrowUpRight className="h-3 w-3" />
              +3.2% vs mois dernier
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Evolution chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Évolution mensuelle</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorContrats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mois" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="clients" stroke="hsl(221 83% 53%)" strokeWidth={2} fill="url(#colorClients)" name="Clients" />
                <Area type="monotone" dataKey="contrats" stroke="hsl(199 89% 48%)" strokeWidth={2} fill="url(#colorContrats)" name="Contrats" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Pie chart - Formules */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Répartition des formules</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={formuleData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {formuleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {formuleData.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: f.color }} />
                  <span className="text-sm text-muted-foreground">{f.name} ({f.value}%)</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Sinistres bar chart + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Sinistres par mois</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mois" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="sinistres" fill="hsl(0 84% 60%)" radius={[8, 8, 0, 0]} name="Sinistres" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Dernières activités</h3>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">Aucune activité récente</div>
              ) : (
                activities.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.05 }}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{a.description}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
