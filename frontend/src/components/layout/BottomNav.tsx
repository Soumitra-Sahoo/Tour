import { NavLink, useParams } from 'react-router-dom';

const items = [
  { to: '', label: 'Home', icon: '🏠', end: true },
  { to: 'expenses', label: 'Expenses', icon: '🧾' },
  { to: 'advance', label: 'Advance', icon: '💰' },
  { to: 'settle', label: 'Settle', icon: '🤝' },
  { to: 'people', label: 'People', icon: '👥' },
];

export function BottomNav() {
  const { shareToken } = useParams();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-mist-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md justify-between px-2 py-1.5">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={`/trip/${shareToken}/${item.to}`}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-pine-700' : 'text-ink-400'
              }`
            }
          >
            <span className="text-xl leading-none" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
