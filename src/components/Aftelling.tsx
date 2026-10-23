import { aftelling, datumNL } from '@/lib/nest';

export default function Aftelling({ geboortedatum, weken }: { geboortedatum: string; weken: number }) {
  const a = aftelling(geboortedatum, weken);
  return (
    <>
      <div className="countdown">
        {a.wekenTeGaan > 0 && <div className="big">{a.wekenTeGaan}</div>}
        <div className="txt">
          {a.wekenTeGaan > 0
            ? `${a.wekenTeGaan === 1 ? 'week' : 'weken'} tot ze mogen verhuizen`
            : 'Ze mogen verhuizen'}
        </div>
      </div>
      <div className="track" aria-hidden="true">
        <span style={{ width: `${a.voortgang}%` }} />
      </div>
      <div className="trackmeta">
        <span>Geboren {datumNL(a.geboren)}</span>
        <span>Verhuizen vanaf {datumNL(a.verhuis)}</span>
      </div>
    </>
  );
}
