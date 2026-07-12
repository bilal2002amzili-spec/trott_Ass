'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Zap,
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Bike,
  Users,
  TrendingUp,
  Award,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/logo';
import { HeroScooter } from '@/components/hero-scooter';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const guarantees = [
  { icon: Shield, title: 'Responsabilité Civile', desc: 'Couverture des dommages causés à autrui', color: 'text-blue-600' },
  { icon: Users, title: 'Protection Conducteur', desc: 'Couverture corporelle en cas d\'accident', color: 'text-cyan-600' },
  { icon: Zap, title: 'Vol & Incendie', desc: 'Indemnisation en cas de vol ou d\'incendie', color: 'text-red-600' },
  { icon: Clock, title: 'Assistance 24/7', desc: 'Assistance routière et dépannage à tout moment', color: 'text-blue-600' },
  { icon: FileText, title: 'Dommages Tous Accidents', desc: 'Dommages matériels à votre trottinette', color: 'text-cyan-600' },
  { icon: Award, title: 'Formules sur mesure', desc: 'RC, ZEN ou MAX — choisissez votre niveau', color: 'text-blue-600' },
];

const steps = [
  { num: '01', title: 'Créez votre devis', desc: 'Renseignez vos informations et celles de votre trottinette en quelques minutes.' },
  { num: '02', title: 'Choisissez vos garanties', desc: 'Sélectionnez la formule qui vous convient: RC, ZEN ou MAX.' },
  { num: '03', title: 'Souscrivez en ligne', desc: 'Réglez votre prime et recevez votre contrat et votre attestation immédiatement.' },
  { num: '04', title: 'Roulez en toute sérénité', desc: 'Vous êtes couvert. Déclarez un sinistre en quelques clics si besoin.' },
];

const faqs = [
  { q: 'Quelle est la vitesse maximale autorisée ?', a: 'Pour être assurable, votre trottinette électrique ne doit pas dépasser 25 km/h. Au-delà, le devis sera automatiquement refusé par notre système.' },
  { q: 'Quelles sont les formules proposées ?', a: 'Nous proposons 3 formules: RC (Responsabilité Civile seule), ZEN (RC + Protection Conducteur + Assistance) et MAX (toutes garanties incluant Vol, Incendie et Dommages).' },
  { q: 'Comment se passe le paiement ?', a: 'Le paiement peut s\'effectuer en espèces, par carte bancaire ou par virement. La prime peut être réglée annuellement ou semestriellement.' },
  { q: 'Comment déclarer un sinistre ?', a: 'Rendez-vous dans votre espace, module Sinistres, cliquez sur "Déclarer un sinistre", remplissez le formulaire et joignez vos documents. Notre équipe traitera votre demande sous 48h.' },
  { q: 'Puis-je télécharger mes documents ?', a: 'Oui, tous vos documents (devis, contrat, attestation, reçus et factures) sont téléchargeables au format PDF à tout moment depuis votre espace.' },
];

const stats = [
  { value: '15K+', label: 'Clients assurés' },
  { value: '98%', label: 'Taux de satisfaction' },
  { value: '48h', label: 'Temps de traitement' },
  { value: '24/7', label: 'Assistance routière' },
];

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({ nom: '', email: '', message: '' });

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message envoyé ! Nous vous répondrons sous 24h.');
    setContactForm({ nom: '', email: '', message: '' });
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo('features')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Avantages</button>
              <button onClick={() => scrollTo('guarantees')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Garanties</button>
              <button onClick={() => scrollTo('how')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</button>
              <button onClick={() => scrollTo('faq')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
              <button onClick={() => scrollTo('contact')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</button>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => router.push('/login')} variant="ghost" className="hidden sm:flex">Connexion</Button>
              <Button onClick={() => router.push('/login')} className="hidden sm:flex">Espace Pro</Button>
              <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="md:hidden pb-4 flex flex-col gap-3"
            >
              <button onClick={() => scrollTo('features')} className="text-sm font-medium text-muted-foreground hover:text-foreground text-left">Avantages</button>
              <button onClick={() => scrollTo('guarantees')} className="text-sm font-medium text-muted-foreground hover:text-foreground text-left">Garanties</button>
              <button onClick={() => scrollTo('how')} className="text-sm font-medium text-muted-foreground hover:text-foreground text-left">Comment ça marche</button>
              <button onClick={() => scrollTo('faq')} className="text-sm font-medium text-muted-foreground hover:text-foreground text-left">FAQ</button>
              <button onClick={() => scrollTo('contact')} className="text-sm font-medium text-muted-foreground hover:text-foreground text-left">Contact</button>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => router.push('/login')} variant="outline" className="flex-1">Connexion</Button>
                <Button onClick={() => router.push('/login')} className="flex-1">Espace Pro</Button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Assurance trottinette nouvelle génération</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
                Roulez l'esprit
                <br />
                <span className="text-gradient-blue">tranquille</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
                La première assurance dédiée aux trottinettes électriques. Souscrivez en ligne, gérez vos contrats et déclarez vos sinistres en quelques clics.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => router.push('/login')} className="text-base h-14 px-8 shadow-glow">
                  Accéder à l'espace pro
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollTo('how')} className="text-base h-14 px-8">
                  Comment ça marche
                </Button>
              </div>
              <div className="mt-12 grid grid-cols-4 gap-4">
                {stats.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <div className="text-2xl sm:text-3xl font-extrabold text-gradient-blue">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <HeroScooter className="aspect-square max-w-lg mx-auto" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features / Advantages */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold tracking-tight">Pourquoi choisir TrotAssur ?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Une plateforme pensée pour les agents d'assurance et leurs clients, avec des outils modernes et performants.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Devis en 2 minutes', desc: 'Un assistant intelligent guide vos clients à travers chaque étape, du profil à la souscription.' },
              { icon: FileText, title: 'Documents PDF automatiques', desc: 'Devis, contrats, attestations, factures et reçus générés automatiquement au format professionnel.' },
              { icon: TrendingUp, title: 'Tableau de bord en temps réel', desc: 'Suivez votre chiffre d\'affaires, vos contrats actifs et le statut de chaque sinistre en un coup d\'œil.' },
              { icon: Shield, title: 'Validation automatique', desc: 'Le système vérifie la conformité de chaque trottinette (vitesse ≤ 25 km/h) avant d\'émettre un devis.' },
              { icon: Users, title: 'Gestion clients complète', desc: 'Base de données clients avec recherche, filtres et historique complet des contrats et sinistres.' },
              { icon: Award, title: 'Multi-formules & périodes', desc: 'RC, ZEN ou MAX — annuel ou semestriel — la flexibilité pour chaque profil de client.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-1 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section id="guarantees" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-blue-50/30 dark:to-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold tracking-tight">Nos garanties</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Une couverture complète adaptée à chaque besoin et à chaque budget.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {guarantees.map((g, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="p-6 h-full hover:shadow-premium-lg transition-all hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0`}>
                      <g.icon className={`h-5 w-5 ${g.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{g.title}</h3>
                      <p className="text-sm text-muted-foreground">{g.desc}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Formule comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'RC', price: '250 DH', period: '/an', features: ['Responsabilité Civile', 'Couverture de base', 'Rouler en toute légalité'], highlight: false },
                { name: 'ZEN', price: '800 DH', period: '/an', features: ['Responsabilité Civile', 'Protection Conducteur', 'Assistance 24/7', 'Équilibre parfait'], highlight: true },
                { name: 'MAX', price: '1 500 DH', period: '/an', features: ['Toutes garanties ZEN', 'Vol & Incendie', 'Dommages tous accidents', 'Protection maximale'], highlight: false },
              ].map((plan, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`p-8 h-full relative ${plan.highlight ? 'border-primary shadow-glow scale-105' : ''}`}>
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        POPULAIRE
                      </div>
                    )}
                    <h3 className="text-2xl font-extrabold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6"
                      variant={plan.highlight ? 'default' : 'outline'}
                      onClick={() => router.push('/login')}
                    >
                      Souscrire
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold tracking-tight">Comment ça marche ?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Un parcours simple et guidé, de la création du devis à la souscription.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-5xl font-extrabold text-gradient-blue mb-4">{s.num}</div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-2 -right-4 h-6 w-6 text-muted-foreground/30" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-blue-50/30 dark:to-slate-900/50">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold tracking-tight">Questions fréquentes</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tout ce que vous devez savoir sur l'assurance trottinette électrique.
            </p>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-5 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold">{f.q}</span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">Contactez-nous</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Une question ? Notre équipe vous répond sous 24 heures.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Téléphone</div>
                    <div className="font-semibold">+212 5 22 00 00 00</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-semibold">contact@trotassur.ma</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Adresse</div>
                    <div className="font-semibold">12 Avenue Mohammed V, Casablanca, Maroc</div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 shadow-premium-lg">
                <form onSubmit={handleContact} className="space-y-4">
                  <div>
                    <Label htmlFor="nom">Nom complet</Label>
                    <Input
                      id="nom"
                      value={contactForm.nom}
                      onChange={(e) => setContactForm({ ...contactForm, nom: e.target.value })}
                      placeholder="Jean Dupont"
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="jean.dupont@email.com"
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Votre message..."
                      required
                      className="mt-1.5"
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    Envoyer le message
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Logo />
              <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                La première assurance dédiée aux trottinettes électriques au Maroc.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollTo('guarantees')} className="hover:text-foreground">Garanties</button></li>
                <li><button onClick={() => scrollTo('how')} className="hover:text-foreground">Comment ça marche</button></li>
                <li><button onClick={() => scrollTo('features')} className="hover:text-foreground">Avantages</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Entreprise</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollTo('contact')} className="hover:text-foreground">Contact</button></li>
                <li><button onClick={() => scrollTo('faq')} className="hover:text-foreground">FAQ</button></li>
                <li><button onClick={() => router.push('/login')} className="hover:text-foreground">Espace Pro</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Conditions générales</li>
                <li>Politique de confidentialité</li>
                <li>Mentions légales</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2024 TrotAssur SARL. Tous droits réservés.</p>
            <p className="text-sm text-muted-foreground">RC 123456 — IF 789012 — Patente 345678</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
