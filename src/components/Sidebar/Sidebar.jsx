import {
  BarChart3,
  FlaskConical,
  LayoutDashboard,
  MapPinned,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/optimize", label: "Optimize", icon: SlidersHorizontal },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scenario", label: "Scenario", icon: FlaskConical },
  { to: "/results", label: "Results", icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-800 bg-slate-950 text-slate-200 lg:flex lg:flex-col">
      <NavLink to="/" className="flex items-center gap-3 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white">
          W
        </span>
        <span>
          <span className="block text-sm font-semibold text-white">WarehouseIQ</span>
          <span className="block text-[11px] text-slate-400">Location optimization</span>
        </span>
      </NavLink>

      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-300">
          <MapPinned size={14} />
          Bengaluru network
        </div>
        <p className="text-xs leading-5 text-slate-400">
          Mock geospatial planning for 16 demand zones and 4 warehouse hubs.
        </p>
      </div>
    </aside>
  );
}
