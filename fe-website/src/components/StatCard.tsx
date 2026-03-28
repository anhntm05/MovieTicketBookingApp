import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  meta?: string;
  tone?: 'pink' | 'cyan' | 'gold' | 'green';
  aside?: ReactNode;
}

export const StatCard = ({ label, value, meta, tone = 'pink', aside }: StatCardProps) => (
  <article className={`stat-card tone-${tone}`}>
    <div className="stat-copy">
      <p className="stat-label">{label}</p>
      <strong className="stat-value">{value}</strong>
      {meta ? <span className="stat-meta">{meta}</span> : null}
    </div>
    {aside ? <div className="stat-aside">{aside}</div> : null}
  </article>
);
