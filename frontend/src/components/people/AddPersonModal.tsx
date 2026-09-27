import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Field } from '../common/Field';
import { Button } from '../common/Button';

interface AddPersonModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<{ name: string; memberCode: string } | void>;
}

export function AddPersonModal({ open, onClose, onAdd }: AddPersonModalProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ name: string; memberCode: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await onAdd(name.trim());
      if (created) setResult(created);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setResult(null);
    setError(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Person">
      {result ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-ink-600">
            <span className="font-semibold text-pine-900">{result.name}</span> has been added.
          </p>
          <p className="text-sm text-ink-600">Their code is</p>
          <span className="rounded-xl bg-mist-100 px-4 py-2 font-mono text-2xl font-bold text-mist-600">
            {result.memberCode}
          </span>
          <p className="text-xs text-ink-400">Tell them this code so they can join the trip.</p>
          <Button fullWidth onClick={handleClose} className="mt-2">
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label="Name"
            placeholder="e.g. Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" fullWidth loading={submitting}>
            Add Person
          </Button>
        </form>
      )}
    </Modal>
  );
}
