import { Check } from 'lucide-react';
import { Assessment, toHalves } from '@/rota';

export const Flag = ({ children }: { children: React.ReactNode }) => <span className="flag">{children}</span>;

// The Half Game Rule line at the top of Plan and Record.
export const HalfGameRule = ({ assessment, players }: { assessment: Assessment; players: number }) => (
  <div className="hgr">
    <span>
      Half Game Rule: <b>{players - assessment.watching}</b> of {players} on track for{' '}
      <span className="nowrap">
        {toHalves(assessment.minimum)} halves{assessment.minimumMinutes !== null && ` (${assessment.minimumMinutes} min)`}
      </span>
    </span>
    {assessment.watching > 0 ? (
      <Flag>{assessment.watching} to watch</Flag>
    ) : (
      <span className="ok"><Check size={16} strokeWidth={2.6} aria-label="All on track" /></span>
    )}
  </div>
);
