import React from 'react';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  prefix?: string;
}

export function Field({ label, error, prefix, className = '', ...rest }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-900">{label}</span>
      <div className="flex items-center rounded-xl border border-mist-200 bg-white focus-within:border-mist-500">
        {prefix ? <span className="pl-3.5 text-ink-600">{prefix}</span> : null}
        <input
          className={`w-full rounded-xl bg-transparent px-3.5 py-3 text-base text-pine-900 outline-none placeholder:text-ink-400 ${className}`}
          {...rest}
        />
      </div>
      {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
