/**
 * Instant feedback zodra iemand op een nestje tikt (vanaf het overzicht of een kaart).
 * Next.js toont dit meteen, terwijl de echte pagina (page.tsx) op de achtergrond data ophaalt.
 * Zonder dit bestand blijft het scherm na een tik gewoon leeg staan, en tikken mensen
 * (begrijpelijk) nog een paar keer omdat het lijkt alsof er niets gebeurt.
 */
export default function LaadtNestje() {
  return (
    <main className="wrap">
      <div className="skelet-foto" aria-hidden="true" />
      <div className="skelet-regel" style={{ width: '55%', height: 14, marginTop: 18 }} />
      <div className="skelet-regel" style={{ width: '80%', height: 24, marginTop: 10 }} />
      <div className="skelet-regel" style={{ width: '45%', height: 14, marginTop: 10 }} />
      <div className="skelet-regel" style={{ width: '100%', height: 90, marginTop: 24, borderRadius: 16 }} />
    </main>
  );
}
