/** Eenvoudige iconen voor de links op een profiel. Kleur volgt de tekst (currentColor). */
export default function SocialIcoon({ soort, maat = 18 }: { soort: 'facebook' | 'instagram' | 'website'; maat?: number }) {
  const gemeen = { width: maat, height: maat, viewBox: '0 0 24 24', 'aria-hidden': true as const, focusable: 'false' as const };
  if (soort === 'facebook')
    return (
      <svg {...gemeen} fill="currentColor">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
      </svg>
    );
  if (soort === 'instagram')
    return (
      <svg {...gemeen} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
        <circle cx="12" cy="12" r="4.3" />
        <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  return (
    <svg {...gemeen} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19M12 2.5c2.6 2.8 4 6 4 9.5s-1.4 6.7-4 9.5c-2.6-2.8-4-6-4-9.5s1.4-6.7 4-9.5Z" />
    </svg>
  );
}
