import { useSession } from '../../context/SessionContext';
import { Link } from 'react-router-dom';

export function Header() {
  const { trip, member, switchPerson } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-mist-100 bg-paper-50/95 px-4 pb-3 pt-4 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <div>
          <p className="font-display text-lg font-semibold leading-tight text-pine-900">
            Welcome Darjeeling 🏔️
          </p>
          <p className="text-xs text-ink-600">{trip?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {trip?.status === 'locked' ? (
            <span className="rounded-full bg-sunrise-100 px-2.5 py-1 text-xs font-semibold text-sunrise-600">
              🔒 Locked
            </span>
          ) : null}
          {member?.isOwner && trip ? (
            <Link
              to={`/trip/${trip.shareToken}/admin`}
              aria-label="Open owner admin panel"
              className="rounded-full border border-mist-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-pine-700 shadow-sm active:bg-mist-100"
            >
              🛠️
            </Link>
          ) : null}
          {member ? (
            <button
              onClick={switchPerson}
              className="rounded-full border border-mist-200 px-3 py-1.5 text-xs font-medium text-pine-700 active:bg-mist-100"
            >
              {member.name} ⇄
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
