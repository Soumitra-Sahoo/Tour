import { Link, useParams } from 'react-router-dom';
import { Member } from '../../types';

interface MemberListProps {
  members: Member[];
  isOwnerView: boolean;
}

export function MemberList({ members, isOwnerView }: MemberListProps) {
  const { shareToken } = useParams();

  return (
    <div className="flex flex-col gap-2">
      {members.map((m) => (
        <Link
          key={m.id}
          to={`/trip/${shareToken}/people/${m.id}`}
          className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-card active:bg-mist-100/40"
        >
          <div>
            <p className="font-semibold text-pine-900">
              {m.isOwner ? '👑 ' : ''}
              {m.name}
            </p>
            {m.isOwner ? <p className="text-xs text-ink-600">Owner</p> : null}
          </div>
          {isOwnerView && m.memberCode ? (
            <span className="rounded-lg bg-mist-100 px-2.5 py-1 font-mono text-sm font-semibold text-mist-600">
              {m.memberCode}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
