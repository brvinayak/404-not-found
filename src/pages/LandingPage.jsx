import { motion } from "framer-motion";
import {
  ArrowRight,
  Leaf,
  MapPinned,
  TrendingDown,
  Warehouse,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer/Footer.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";

const features = [
  {
    icon: Warehouse,
    title: "Warehouse Optimization",
    body: "Place hubs where demand density, capacity, and last-mile distance actually meet.",
  },
  {
    icon: MapPinned,
    title: "Demand Intelligence",
    body: "Visualize neighborhood order volume across Bengaluru with assignment-aware maps.",
  },
  {
    icon: TrendingDown,
    title: "Cost Reduction",
    body: "Compare baseline vs optimized weighted cost and surface savings opportunities.",
  },
  {
    icon: Leaf,
    title: "Sustainability Tracking",
    body: "Estimate carbon impact from shorter routes and more balanced warehouse loads.",
  },
];

const steps = [
  { n: "01", title: "Upload Coordinates Data", body: "Upload house or demand coordinates with Latitude and Longitude." },
  { n: "02", title: "Configure Optimization", body: "DBSCAN density clustering & continuous gradient descent placement." },
  { n: "03", title: "Analyze Recommendations", body: "Inspect map matching warehouse.py, KPIs, and facility capacity." },
  { n: "04", title: "Export & Report", body: "Download CSV results, export PDF reports, and analyze allocations." },
];


export default function LandingPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">W</span>
            WarehouseIQ
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link to="/upload">Upload</Link>
            <Link to="/optimize">Optimize</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link
              to="/optimize"
              className="rounded-full bg-white px-4 py-2 font-medium text-slate-950"
            >
              Start Optimization
            </Link>
          </nav>
        </header>

        <section className="relative overflow-hidden px-6 pb-20 pt-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),_transparent_50%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-300"
            >
              WarehouseIQ
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl"
            >
              AI-Powered Warehouse Location Optimization Platform
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg"
            >
              Reduce delivery costs, optimize warehouse placement, and improve logistics
              efficiency through intelligent geospatial planning.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              <Link
                to="/optimize"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                Start Optimization <ArrowRight size={16} />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                View Dashboard
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="bg-slate-900 px-6 py-16">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <f.icon className="text-indigo-300" size={20} />
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{f.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-semibold">How it works</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {steps.map((s) => (
                <article key={s.n} className="rounded-2xl border border-white/10 p-5">
                  <p className="text-xs font-semibold text-indigo-300">{s.n}</p>
                  <h3 className="mt-2 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="mx-auto grid max-w-6xl gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 sm:grid-cols-3">
            {[
              ["30%", "Cost Reduction"],
              ["20%", "Faster Deliveries"],
              ["15%", "Carbon Savings"],
            ].map(([n, l]) => (
              <div key={l} className="text-center">
                <p className="text-4xl font-semibold text-white">{n}</p>
                <p className="mt-2 text-sm text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-slate-950 text-slate-400">
          <Footer />
        </div>
      </div>
    </PageTransition>
  );
}
