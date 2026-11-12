/** Teksten per ras voor de vaste raspagina's (/kittens/maine-coon). Pas teksten hier aan. */

export type Vraag = { v: string; a: string };
export type RasTekst = { kop: string; over: string[]; prijsKop: string; prijs: string; vragenKop: string; vragen: Vraag[] };

/** Komen op elke raspagina, onder de tekst over het ras. */
export const ALGEMENE_VRAGEN: Vraag[] = [
  {
    v: 'Waarom zie ik op Nestje alleen raskittens met een stamboom?',
    a: 'Zonder stamboom kun je niet nagaan of een kitten echt van dat ras is. Je weet dan ook niet of de ouders getest zijn op erfelijke ziektes. Daarom tonen we een rasnaam alleen bij kittens met een volledige stamboom.',
  },
  {
    v: 'Hoe oud is een kitten als hij verhuist?',
    a: 'De wet zegt minstens 7 weken. Maar een kitten leert nog veel van zijn moeder en broertjes en zusjes. Daarom is 12 tot 13 weken veel beter. Op Nestje zie je bij elk nestje hoeveel weken het nog duurt.',
  },
  {
    v: 'Wat krijg ik mee met een raskitten?',
    a: 'Een goede fokker geeft een stamboom, een dierenpaspoort, een chip en de eerste entingen mee. Vaak ook een koopcontract en wat voer, zodat je kitten rustig kan wennen.',
  },
  {
    v: 'Mag ik eerst komen kijken?',
    a: 'Ja, en dat raden we altijd aan. Bekijk de kittens en hun moeder bij de fokker thuis. Mag dat niet? Zoek dan liever verder.',
  },
  {
    v: 'Hoe neem ik contact op met een fokker?',
    a: 'Op de pagina van het nestje staat bij elk vrij kitten een knop. Daarmee stuur je de fokker direct een WhatsApp-bericht.',
  },
];

const HUISKAT: RasTekst = {
  kop: 'Over de huiskat',
  over: [
    'Een huiskat heeft geen stamboom en is niet van één ras. Juist daardoor is elke huiskat anders: in kleur, vacht en karakter. Huiskatten zijn vaak sterk en gezond, en net zo lief als een raskat.',
    'Een kitten van een huiskat is meestal ook goedkoper. Let wel op dezelfde dingen als bij een raskitten: een gezonde moeder, een chip, de eerste enting en een verhuisleeftijd van minstens 12 weken.',
    'De Europese korthaar lijkt veel op een gewone huiskat, maar is wel een erkend ras. Met een stamboom weet je welke ouders hij heeft. Zonder stamboom is het gewoon een lieve huiskat.',
  ],
  prijsKop: 'Wat kost een kitten van een huiskat?',
  prijs: 'Vaak tussen de €100 en €300. Daar zitten meestal de chip en de eerste enting bij.',
  vragenKop: 'Vragen over de huiskat',
  vragen: [
    { v: 'Is een huiskat gezonder dan een raskat?', a: 'Vaak wel, omdat er minder erfelijke ziektes zijn. Maar ook een huiskat heeft goede zorg nodig.' },
    { v: 'Kan ik zien hoe groot mijn kitten wordt?', a: 'Kijk naar de moeder, en als het kan ook naar de vader. Dat geeft een goed idee.' },
  ],
};

/** Sleutel = rasnaam in kleine letters, zoals in de rassenlijst. */
export const RASTEKSTEN: Record<string, RasTekst> = {
  'brits korthaar': {
    kop: 'Over de Brits korthaar',
    over: [
      'De Brits korthaar is een rustige, stevige kat met een rond gezicht en dikke, zachte vacht. De bekendste kleur is blauwgrijs, maar er zijn veel kleuren. Hij is lief en geduldig. Veel Brits korthaars worden niet zo graag opgetild en zitten liever gezellig naast je dan op schoot, maar dat verschilt per kat.',
      'De vacht is kort en makkelijk te verzorgen. Eén keer per week borstelen is genoeg, in de rui wat vaker. Een Brits korthaar houdt van eten en wordt makkelijk te zwaar. Let dus op de hoeveelheid voer en speel elke dag met hem.',
      'Dit ras past goed bij gezinnen en bij mensen die werken. Hij kan prima een paar uur alleen zijn en is graag binnen.',
    ],
    prijsKop: 'Wat kost een Brits korthaar kitten?',
    prijs: 'Een Brits korthaar kitten met stamboom kost meestal tussen de €900 en €1.500. Zie je er een voor de helft? Vraag dan door naar de stamboom en de testen van de ouders.',
    vragenKop: 'Vragen over de Brits korthaar',
    vragen: [
      { v: 'Op welke ziektes worden de ouders getest?', a: 'Vraag naar een DNA-test op PKD (een nierziekte) en een hartecho op HCM (een hartziekte).' },
      { v: 'Hoe oud wordt een Brits korthaar?', a: 'Meestal 12 tot 17 jaar.' },
      { v: 'Wat is het verschil met een Brits langhaar?', a: 'Alleen de vacht. Het karakter is hetzelfde.' },
    ],
  },
  'brits langhaar': {
    kop: 'Over de Brits langhaar',
    over: [
      'De Brits langhaar is de langharige versie van de Brits korthaar. Hij heeft hetzelfde ronde gezicht en hetzelfde rustige, vriendelijke karakter. Het verschil zit alleen in de vacht: die is halflang en voelt heel zacht.',
      'Die vacht vraagt wel meer verzorging. Borstel hem twee tot drie keer per week, dan krijg je geen klitten. Net als de korthaar eet hij graag, dus let op zijn gewicht.',
      'Dit ras past bij mensen die een rustige, aanhankelijke kat zoeken en het leuk vinden om hem te borstelen.',
    ],
    prijsKop: 'Wat kost een Brits langhaar kitten?',
    prijs: 'Een Brits langhaar kitten met stamboom kost meestal tussen de €1.000 en €1.600.',
    vragenKop: 'Vragen over de Brits langhaar',
    vragen: [
      { v: 'Op welke ziektes worden de ouders getest?', a: 'Net als bij de korthaar: PKD (DNA-test) en HCM (hartecho).' },
      { v: 'Verhaart een Brits langhaar veel?', a: 'Ja, vooral in het voorjaar en het najaar. Regelmatig borstelen helpt.' },
    ],
  },
  'maine coon': {
    kop: 'Over de Maine Coon',
    over: [
      'De Maine Coon is een van de grootste kattenrassen. Een kater weegt vaak 7 tot 9 kilo, een poes iets minder. Ondanks zijn formaat is hij vriendelijk, speels en sociaal. Hij wordt ook wel de ‘zachte reus’ genoemd.',
      'Hij heeft een halflange vacht, een grote pluimstaart en plukjes haar op de oren. Borstel hem één tot twee keer per week. Een Maine Coon groeit langzaam en is pas na drie tot vier jaar helemaal volgroeid.',
      'Dit ras past bij gezinnen en bij mensen die een actieve, betrokken kat willen. Geef hem genoeg ruimte en een stevige krabpaal.',
    ],
    prijsKop: 'Wat kost een Maine Coon kitten?',
    prijs: 'Een Maine Coon kitten met stamboom kost meestal tussen de €1.000 en €1.800.',
    vragenKop: 'Vragen over de Maine Coon',
    vragen: [
      { v: 'Op welke ziektes worden de ouders getest?', a: 'Vraag naar HCM (DNA-test en hartecho), SMA en PK-def. Vraag ook naar de heupen (HD).' },
      { v: 'Hoe oud wordt een Maine Coon?', a: 'Meestal 12 tot 15 jaar.' },
      { v: 'Heeft een Maine Coon veel ruimte nodig?', a: 'Hij kan prima binnen wonen, maar hij houdt van klimmen en spelen. Een grote krabpaal is een must.' },
    ],
  },
  ragdoll: {
    kop: 'Over de Ragdoll',
    over: [
      'De Ragdoll is een grote, rustige kat met blauwe ogen. Zijn naam betekent ‘lappenpop’: veel Ragdolls worden helemaal slap als je ze optilt. Hij is heel aanhankelijk en loopt vaak achter zijn mensen aan door het huis.',
      'De vacht is halflang en zijdezacht. Omdat er weinig ondervacht is, klit hij minder snel dan je zou denken. Eén tot twee keer per week borstelen is genoeg.',
      'Dit ras past bij mensen die een lieve, rustige huiskat zoeken. Een Ragdoll is meestal goed met kinderen en andere katten. Hij is niet zo geschikt om alleen buiten te lopen, omdat hij weinig angstig is.',
    ],
    prijsKop: 'Wat kost een Ragdoll kitten?',
    prijs: 'Een Ragdoll kitten met stamboom kost meestal tussen de €1.000 en €1.700.',
    vragenKop: 'Vragen over de Ragdoll',
    vragen: [
      { v: 'Op welke ziektes worden de ouders getest?', a: 'Vraag naar HCM (een DNA-test die speciaal bij de Ragdoll hoort, plus een hartecho) en PKD.' },
      { v: 'Wanneer krijgt een Ragdoll zijn kleur?', a: 'Kittens worden bijna wit geboren. De kleur komt langzaam, en is pas na twee tot drie jaar helemaal klaar.' },
    ],
  },
  'noorse boskat': {
    kop: 'Over de Noorse boskat',
    over: [
      'De Noorse boskat komt uit Scandinavië en is gemaakt voor de kou. Hij heeft een dikke, waterafstotende vacht, een volle kraag en een grote pluimstaart. Hij is stoer, slim en vriendelijk, maar wel wat zelfstandiger dan een Ragdoll.',
      'Hij is een echte klimmer. Een hoge krabpaal of een veilige tuin vindt hij heerlijk. Borstel hem één keer per week. In het voorjaar verliest hij veel van zijn wintervacht, dan vaker borstelen.',
      'Dit ras past bij mensen die een actieve, avontuurlijke kat zoeken die ook gezellig in de buurt blijft.',
    ],
    prijsKop: 'Wat kost een Noorse boskat kitten?',
    prijs: 'Een Noorse boskat kitten met stamboom kost meestal tussen de €900 en €1.500.',
    vragenKop: 'Vragen over de Noorse boskat',
    vragen: [
      { v: 'Op welke ziektes worden de ouders getest?', a: 'Vraag naar GSD IV (een stofwisselingsziekte), PK-def (een bloedziekte), HCM (hartecho) en de heupen (HD).' },
      { v: 'Wat is het verschil met een Siberische kat?', a: 'Ze lijken op elkaar. De Noorse boskat heeft een driehoekiger kop en een rechter neusprofiel.' },
    ],
  },
  'siberische kat': {
    kop: 'Over de Siberische kat',
    over: [
      'De Siberische kat komt uit Rusland en heeft een dikke, halflange vacht voor strenge winters. Hij is sterk, speels en heel sociaal. Veel Siberische katten zijn dol op spelen, ook als ze al volwassen zijn.',
      'De vacht is dik maar klit niet snel. Borstel hem één tot twee keer per week, in de rui vaker. Een Siberische kat is pas na een paar jaar helemaal volgroeid.',
      'Dit ras past bij gezinnen en bij mensen die een vrolijke, actieve kat willen.',
    ],
    prijsKop: 'Wat kost een Siberische kat kitten?',
    prijs: 'Een Siberische kitten met stamboom kost meestal tussen de €1.000 en €1.600.',
    vragenKop: 'Vragen over de Siberische kat',
    vragen: [
      { v: 'Op welke ziektes worden de ouders getest?', a: 'Vraag naar een hartecho op HCM.' },
      { v: 'Is een Siberische kat goed voor mensen met een allergie?', a: 'Je leest dat soms, maar zeker is dat niet. Ga bij een allergie altijd eerst een paar keer op bezoek bij de fokker, voordat je een kitten koopt.' },
    ],
  },
  bengaal: {
    kop: 'Over de Bengaal',
    over: [
      'De Bengaal heeft een vacht met vlekken of rozetten, net een kleine luipaard. Hij is slim, nieuwsgierig en heel actief. Veel Bengalen houden van water en leren graag trucjes.',
      'De vacht is kort, glanzend en makkelijk te verzorgen. Maar dit ras heeft veel beweging en uitdaging nodig. Verveelt een Bengaal zich, dan gaat hij zelf iets te doen zoeken.',
      'Dit ras past bij mensen die veel tijd hebben om te spelen, en die een kat willen die echt deel van het gezin is. Voor iemand die een rustige schootkat zoekt, is een Bengaal minder geschikt.',
    ],
    prijsKop: 'Wat kost een Bengaal kitten?',
    prijs: 'Een Bengaal kitten met stamboom kost meestal tussen de €1.000 en €1.800.',
    vragenKop: 'Vragen over de Bengaal',
    vragen: [
      { v: 'Op welke ziektes worden de ouders getest?', a: 'Vraag naar PK-def (een bloedziekte), PRA-b (een oogziekte die blindheid geeft) en een hartecho op HCM.' },
      { v: 'Kan een Bengaal alleen thuis zijn?', a: 'Een paar uur wel, maar hij heeft daarna echt aandacht en speeltijd nodig.' },
    ],
  },
  perzisch: {
    kop: 'Over de Perzische kat',
    over: [
      'De Perzische kat (of Pers) is een rustige, zachtaardige kat met een lange, dikke vacht. Hij houdt van een vaste plek in huis en van rust. Drukte en harde geluiden vindt hij minder fijn.',
      'De vacht vraagt veel verzorging: borstel hem elke dag, anders gaat hij klitten. Maak ook regelmatig de ogen schoon.',
      'Dit ras past bij mensen die een kalme binnenkat zoeken en tijd hebben voor de dagelijkse verzorging.',
    ],
    prijsKop: 'Wat kost een Perzische kitten?',
    prijs: 'Een Perzische kitten met stamboom kost meestal tussen de €900 en €1.500.',
    vragenKop: 'Vragen over de Perzische kat',
    vragen: [
      { v: 'Op welke ziektes worden de ouders getest?', a: 'Vraag naar een DNA-test op PKD (een nierziekte die bij dit ras vaak voorkomt) en een hartecho op HCM.' },
      { v: 'Waar let ik op bij de neus?', a: 'In Nederland mag je niet fokken met katten met een te korte snuit. Kies een kitten met een duidelijke neus, zodat hij goed kan ademen.' },
    ],
  },
  savannah: {
    kop: 'Over de Savannah',
    over: [
      'De Savannah is een kruising tussen een huiskat en een serval, een wilde Afrikaanse kat. Hij is lang, slank en heeft grote oren en een gevlekte vacht. Hij is slim, heel actief en springt hoog.',
      'Bij een Savannah zie je altijd een F met een cijfer, zoals F5 of F6. Dat zegt hoeveel generaties er tussen de kitten en de serval zitten. Hoe hoger het cijfer, hoe meer de kat op een gewone huiskat lijkt. Latere generaties zijn het meest geschikt als huisdier.',
      'Dit ras past bij ervaren kattenmensen met veel tijd en ruimte. Een Savannah wil uitdaging, spel en aandacht.',
    ],
    prijsKop: 'Wat kost een Savannah kitten?',
    prijs: 'De prijs hangt sterk af van de generatie. Een Savannah kitten van een latere generatie met stamboom kost vaak €1.500 of meer.',
    vragenKop: 'Vragen over de Savannah',
    vragen: [
      { v: 'Welke generatie is het kitten?', a: 'Vraag altijd naar het F-nummer en zie het terug op de stamboom.' },
      { v: 'Mag ik zomaar een Savannah houden?', a: 'Zoek dit voor je koopt goed uit. De regels voor kruisingen met wilde katten kunnen veranderen.' },
    ],
  },
  huiskat: HUISKAT,
  'europese korthaar': HUISKAT,
};

export function rasTekstVoor(ras: string) {
  return RASTEKSTEN[ras.trim().toLowerCase()] ?? null;
}
