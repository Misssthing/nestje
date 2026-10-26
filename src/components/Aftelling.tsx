import { aftelling, datumNL } from '@/lib/nest';

export default function Aftelling({
  geboortedatum,
  weken,
  geschat = false,
}: {
  geboortedatum: string;
  weken: number;
  geschat?: boolean;
}) {
  const a = aftelling(geboortedatum, weken);

  if (a.verwacht) {
    return (
      <>
        <div className="countdown">
          <div className="big">{a.dagenTotGeboorte}</div>
          <div className="txt">{a.dagenTotGeboorte === 1 ? 'dag' : 'dagen'} tot de kittens komen</div>
        </div>
        <div className="track" aria-hidden="true">
          <span style={{ width: '0%' }} />
        </div>
        <div className="trackmeta">
          <span>Verwacht rond {datumNL(a.geboren)}</span>
          <span>Verhuizen vanaf {datumNL(a.verhuis)}</span>
        </div>
      </>
    );
  }

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
        <span>{geschat ? `Geboren rond ${datumNL(a.geboren)}` : `Geboren ${datumNL(a.geboren)}`}</span>
        <span>Verhuizen vanaf {datumNL(a.verhuis)}</span>
      </div>
    </>
  );
}
