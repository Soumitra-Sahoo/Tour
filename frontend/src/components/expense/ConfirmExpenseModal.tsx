import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Member } from '../../types';
import { ExpenseFormValue } from './ExpenseForm';
import { toPaise, previewEqualSplit } from '../../utils/splitPreview';
import { formatINR } from '../../utils/money';

interface ConfirmExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  value: ExpenseFormValue | null;
  membersById: Record<string, Member>;
  ownerId: string | null;
  submitting?: boolean;
}

export function ConfirmExpenseModal({
  open,
  onClose,
  onConfirm,
  value,
  membersById,
  ownerId,
  submitting,
}: ConfirmExpenseModalProps) {
  if (!value) return null;
  const amountPaise = toPaise(value.amount) || 0;

  const participantShares =
    value.splitType === 'equal'
      ? previewEqualSplit(amountPaise, value.participantIds, ownerId)
      : value.participantIds.map((id) => ({
          memberId: id,
          amountPaise: toPaise(value.customShares.find((s) => s.memberId === id)?.amount || '0') || 0,
        }));

  return (
    <Modal open={open} onClose={onClose} title="Confirm Expense">
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-display text-lg font-semibold text-pine-900">{value.note || value.category}</p>
          <p className="font-display text-2xl font-semibold text-pine-900">{formatINR(amountPaise)}</p>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-ink-600">Paid by</p>
          <div className="flex flex-col gap-1">
            {value.payers.map((p) => (
              <div key={p.memberId} className="flex justify-between text-sm">
                <span className="text-pine-900">{membersById[p.memberId]?.name}</span>
                <span className="text-pine-900">
                  {formatINR(
                    value.payers.length === 1 ? amountPaise : toPaise(p.amount || '0') || 0,
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-ink-600">Participants</p>
          <div className="flex flex-col gap-1">
            {participantShares.map((s) => (
              <div key={s.memberId} className="flex justify-between text-sm">
                <span className="text-pine-900">{membersById[s.memberId]?.name}</span>
                <span className="text-pine-900">{formatINR(s.amountPaise)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-ink-600">Category</span>
          <span className="text-pine-900">{value.category}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="ghost" fullWidth onClick={onClose} type="button">
          Cancel
        </Button>
        <Button fullWidth onClick={onConfirm} loading={submitting} type="button">
          Add Expense
        </Button>
      </div>
    </Modal>
  );
}
