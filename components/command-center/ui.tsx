import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'dark' | 'teal';

export function Button({
  children,
  onClick,
  type = 'button',
  disabled,
  variant = 'secondary',
  className = ''
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`cc-button cc-button-${variant} ${className}`}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`cc-badge cc-badge-${tone}`}>{children}</span>;
}

export function Card({
  title,
  eyebrow,
  action,
  children,
  className = ''
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`cc-card ${className}`}>
      {(title || action) ? (
        <div className="cc-card-header">
          <div>
            {eyebrow ? <p className="cc-eyebrow">{eyebrow}</p> : null}
            {title ? <h3>{title}</h3> : null}
          </div>
          {action ? <div className="cc-card-action">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Metric({ label, value, detail, tone = 'blue' }: { label: string; value: ReactNode; detail: string; tone?: Tone }) {
  return (
    <div className={`cc-metric cc-metric-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="cc-empty">
      <div className="cc-empty-icon"><AlertCircle size={19} /></div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div className="cc-empty-action">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ title, body }: { title: string; body: string }) {
  return (
    <div className="cc-empty cc-loading-panel">
      <div className="cc-empty-icon"><Loader2 size={19} className="cc-spin" /></div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

export function Notice({ title, body, tone = 'blue' }: { title: string; body: string; tone?: Tone }) {
  const Icon = tone === 'green' ? CheckCircle2 : AlertCircle;
  return (
    <div className={`cc-notice cc-notice-${tone}`}>
      <Icon size={18} />
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </div>
  );
}

export function Progress({ value, tone = 'blue' }: { value: number; tone?: Tone }) {
  const width = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="cc-progress" aria-label={`${width}%`}>
      <span className={`cc-progress-fill cc-progress-${tone}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export function formatDate(value?: string) {
  if (!value) return 'Not available';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  } catch {
    return value;
  }
}

export function number(value: number) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}
