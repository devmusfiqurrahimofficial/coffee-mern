import { NavLink } from "react-router";

const DashboardNavLink = ({ to, label, Icon, end = false, onClose, badge = 0 }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClose}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        isActive
          ? "bg-[var(--color-text)] text-white"
          : "text-neutral-600 hover:bg-black/5 hover:text-[var(--color-text)]"
      }`
    }
  >
    <Icon className="h-5 w-5" />
    <span className="flex-1">{label}</span>
    {badge > 0 && (
      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
        {badge > 99 ? "99+" : badge}
      </span>
    )}
  </NavLink>
);

export default DashboardNavLink;
