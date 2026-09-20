import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useOptimization } from "../../context/OptimizationContext.jsx";

const titles = {
  "/upload": "Dataset Upload",
  "/optimize": "Optimization Settings",
  "/dashboard": "Analytics Dashboard",
  "/scenario": "Scenario Simulator",
  "/results": "Optimization Results",
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { config, fileName } = useOptimization();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Workspace
            </p>
            <h1 className="text-sm font-semibold text-slate-900 sm:text-base">
              {titles[pathname] || "WarehouseIQ"}
            </h1>
          </div>
        </div>

        <div className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
          <Search size={16} />
          <span>Search neighborhoods, warehouses, scenarios</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 sm:block">
            {fileName} · {config.warehouseCount} hubs
          </div>
          <button
            type="button"
            className="relative rounded-lg border border-slate-200 p-2 text-slate-600"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            IQ
          </div>
        </div>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          {[
            ["/upload", "Upload"],
            ["/optimize", "Optimize"],
            ["/dashboard", "Dashboard"],
            ["/scenario", "Scenario"],
            ["/results", "Results"],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm ${
                pathname === to ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
