import React, { useState, type ReactNode } from 'react';

const MONO = "'JetBrains Mono', 'Courier New', monospace";

export interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  suffix?: ReactNode;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}

export const Field: React.FC<FieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  suffix,
  autoComplete,
  required = false,
  disabled = false,
}) => {
  const [focused, setFocused] = useState(false);
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        style={{ fontFamily: MONO }}
        className="text-[10px] tracking-[0.16em] uppercase font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div
        className={`flex items-center border rounded-lg transition-all duration-150 bg-card ${
          error
            ? 'border-destructive/60'
            : focused
              ? 'border-foreground/30 shadow-[0_0_0_3px_rgba(12,12,24,0.06)] dark:shadow-[0_0_0_3px_rgba(240,240,246,0.06)]'
              : 'border-border'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/40 text-sm px-4 py-3 outline-none disabled:cursor-not-allowed"
        />
        {suffix && <div className="pr-3 flex items-center">{suffix}</div>}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[11.5px] text-destructive leading-snug"
        >
          {error}
        </p>
      )}
    </div>
  );
};
