import React from "react";
import { Link } from "react-router-dom";
import {
  Droplets,
  Activity,
  Shield,
  Brain,
  Gauge,
  ArrowRight,
  BarChart3,
  Map,
  ChevronRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Activity,
    title: "Monitoring Temps Réel",
    desc: "Suivi continu des niveaux d'eau de La Liane avec capteurs connectés et visualisation en direct.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Brain,
    title: "Prédiction IA",
    desc: "Modèle Random Forest prédisant les niveaux d'eau à 5 heures pour anticiper les crues.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Gauge,
    title: "Pilotage des Vannes",
    desc: "Contrôle intelligent et automatisé de l'ouverture des vannes basé sur les prédictions.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Shield,
    title: "Système d'Alerte",
    desc: "Alertes graduées (vigilance, alerte) avec seuils configurables et recommandations en temps réel.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: BarChart3,
    title: "Simulation & Scénarios",
    desc: "Simulez des scénarios de crue et testez les réponses du système avant qu'elles ne surviennent.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Map,
    title: "Cartographie",
    desc: "Visualisation géographique des stations de mesure et des zones à risque d'inondation.",
    color: "bg-cyan-50 text-cyan-600",
  },
];

const STATS = [
  { value: "5h", label: "Horizon de prédiction" },
  { value: "30s", label: "Intervalle de mise à jour" },
  { value: "RF", label: "Random Forest" },
  { value: "24/7", label: "Surveillance continue" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-aiafs-hero text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-cyan-500 rounded-full blur-[120px]" />
        </div>

        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold">AIAFS</span>
          </div>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-base font-medium transition-colors"
          >
            Accéder au Dashboard
          </Link>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-base text-blue-200 mb-6 backdrop-blur-sm border border-white/10">
            <Droplets className="w-4 h-4" />
            Système de protection anti-inondation intelligent
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            <span className="text-white">Artificial Intelligence</span>
            <br />
            <span className="text-blue-400">Anti-Flood System</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-10 leading-relaxed">
            Surveillez, prédisez et contrôlez les niveaux d'eau de La Liane en temps réel
            grâce à l'intelligence artificielle. Protégez les populations et les infrastructures.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-base font-semibold transition-colors shadow-lg shadow-blue-600/30"
            >
              Ouvrir le Tableau de Bord
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/simulation"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-base font-medium transition-colors backdrop-blur-sm"
            >
              Explorer les Simulations
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-base text-slate-300 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Un système complet de protection
          </h2>
          <p className="text-gray-700 max-w-xl mx-auto text-lg">
            AIAFS combine monitoring en temps réel, intelligence artificielle et contrôle automatisé 
            pour une gestion proactive du risque d'inondation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-gray-200 transition-all group"
            >
              <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-base text-gray-700 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Prêt à surveiller La Liane ?
          </h2>
          <p className="text-gray-700 mb-8 text-lg">
            Accédez au tableau de bord pour consulter les données en temps réel et les prévisions IA.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/20"
          >
            Commencer
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-base text-gray-600">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-600">AIAFS</span>
            <span>– Artificial Intelligence Anti-Flood System</span>
          </div>
          <p>La Liane, Nouvelle-Aquitaine • Données temps réel</p>
        </div>
      </footer>
    </div>
  );
}
