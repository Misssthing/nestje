// De inhoud van "De eerste dagen met je kitten". Dezelfde tekst staat in de PDF
// (public/eerste-dagen-met-je-kitten.pdf). Pas je hier iets aan, vraag dan ook een nieuwe PDF.

export type Blok =
  | { soort: 'p'; inhoud: string }
  | { soort: 'ul'; inhoud: string[] }
  | { soort: 'link'; tekst: string; label: string; href: string };
export type Sectie = { kop: string; blokken: Blok[] };

export const EERSTE_DAGEN_TITEL = "De eerste dagen met je kitten";
export const EERSTE_DAGEN_INTRO = "Een nieuw huis is spannend voor een kitten. Alles ruikt anders, de geluiden zijn onbekend en de moeder en nestgenootjes zijn er niet meer. Met rust, een vaste plek en een beetje geduld voelt je kitten zich meestal binnen een paar dagen tot twee weken thuis. Zo pak je het aan.";
export const EERSTE_DAGEN_PDF = '/eerste-dagen-met-je-kitten.pdf';

export const EERSTE_DAGEN: Sectie[] = [
  {
    "kop": "Voordat je kitten komt",
    "blokken": [
      {
        "soort": "p",
        "inhoud": "Richt één rustige kamer in als wenkamer, bijvoorbeeld een slaapkamer of werkkamer. Daar begint je kitten. Een groot huis in één keer is te veel."
      },
      {
        "soort": "ul",
        "inhoud": [
          "Zet in die kamer eten, vers water, een kattenbak, een krabpaal en een schuilplek, zoals een doos met een deken erin.",
          "Zet de kattenbak een eindje van het eten en water af. Katten eten niet graag naast hun toilet.",
          "Maak het huis veilig: kabels uit het zicht, touwtjes en elastiekjes opgeruimd, deur van wasmachine en droger dicht.",
          "Haal giftige planten weg. Lelies zijn voor katten levensgevaarlijk, ook het stuifmeel en het vaaswater.",
          "Ramen op kiepstand en balkons zijn gevaarlijk. Gebruik een kattennet of houd ze dicht."
        ]
      },
      {
        "soort": "link",
        "tekst": "Twijfel je wat je nog nodig hebt? Bekijk de lijst met alles wat je in huis wilt hebben voordat je kitten komt:",
        "label": "Wat heb je nodig voor een kitten?",
        "href": "https://www.kattenverzorging.com/wat-heb-je-nodig-voor-een-kitten/"
      }
    ]
  },
  {
    "kop": "Het ophalen",
    "blokken": [
      {
        "soort": "ul",
        "inhoud": [
          "Neem een stevige reismand mee. Een kitten los in de auto of in je armen is niet veilig.",
          "Vraag de verkoper om een doekje of dekentje dat naar het nest ruikt. Die vertrouwde geur helpt de eerste nachten.",
          "Vraag welk voer en welke kattenbakkorrel je kitten gewend is.",
          "Neem de papieren mee: het paspoort of entingsboekje, de gegevens van de chip en, als het kitten een stamboom heeft, wanneer je die krijgt."
        ]
      }
    ]
  },
  {
    "kop": "Dag 1: aankomen",
    "blokken": [
      {
        "soort": "ul",
        "inhoud": [
          "Zet de reismand in de wenkamer, open het deurtje en laat je kitten zelf naar buiten komen. Trek het er niet uit.",
          "Ga rustig op de grond zitten en laat je kitten naar jou toe komen. Niet optillen of achterna lopen.",
          "Wijs de kattenbak aan door je kitten er even in te zetten, bijvoorbeeld na het eten.",
          "Houd het stil: geen visite, geen harde muziek. Vrienden en familie komen later wel kijken."
        ]
      },
      {
        "soort": "p",
        "inhoud": "Verstoppen, weinig eten en de eerste nacht miauwen is normaal. Geef je kitten de tijd."
      }
    ]
  },
  {
    "kop": "Dag 2 tot en met 4: vertrouwen opbouwen",
    "blokken": [
      {
        "soort": "ul",
        "inhoud": [
          "Breng veel tijd door in de wenkamer, ook gewoon lezend of op je telefoon. Zo went je kitten aan je aanwezigheid.",
          "Speel een paar keer per dag kort, bijvoorbeeld met een hengel. Spelen bouwt vertrouwen en geeft energie een plek.",
          "Gebruik nooit je handen of voeten als speelgoed. Wat bij een kitten schattig is, doet bij een volwassen kat pijn.",
          "Laat kinderen op de grond zitten en het kitten zelf laten komen. Optillen alleen met hulp, en nooit bij de nekvel."
        ]
      }
    ]
  },
  {
    "kop": "Daarna: het huis verkennen",
    "blokken": [
      {
        "soort": "p",
        "inhoud": "Loopt je kitten ontspannen rond, eet het goed en gebruikt het de kattenbak? Dan mag de deur open. Laat de wenkamer met de kattenbak bestaan als veilige basis, en geef pas later de rest van het huis vrij als je kitten dat makkelijk vindt."
      }
    ]
  },
  {
    "kop": "Andere katten of een hond",
    "blokken": [
      {
        "soort": "p",
        "inhoud": "Neem hier de tijd voor. Een goede kennismaking duurt vaak één tot twee weken."
      },
      {
        "soort": "ul",
        "inhoud": [
          "Houd ze eerst gescheiden. Wissel geuren uit met een doekje of door de dekentjes om te ruilen.",
          "Laat ze elkaar daarna zien door een kier, een traphekje of een glazen deur, terwijl ze iets lekkers krijgen.",
          "Laat ze pas samen in één ruimte onder toezicht en kort, en bouw dat langzaam op.",
          "Blazen en grommen hoort er in het begin bij. Ga een stap terug als het niet beter wordt."
        ]
      }
    ]
  },
  {
    "kop": "Eten en drinken",
    "blokken": [
      {
        "soort": "ul",
        "inhoud": [
          "Geef de eerste weken hetzelfde voer als bij de verkoper. Een nieuw huis is al genoeg verandering.",
          "Wil je overstappen, mix het nieuwe voer dan stap voor stap door het oude, verspreid over zeven tot tien dagen.",
          "Een kitten eet vaak kleine porties, meerdere keren per dag. Houd de hoeveelheid op de verpakking aan of vraag het de verkoper.",
          "Zorg altijd voor vers water. Geef geen koemelk: daar krijgen veel katten diarree van."
        ]
      }
    ]
  },
  {
    "kop": "De kattenbak",
    "blokken": [
      {
        "soort": "ul",
        "inhoud": [
          "Gebruik dezelfde korrel als je kitten gewend is.",
          "Schep de bak elke dag uit. Een vieze bak is de meest voorkomende reden dat een kat ernaast plast.",
          "Heb je meer katten, houd dan één bak per kat aan, plus één extra."
        ]
      }
    ]
  },
  {
    "kop": "Dierenarts en chip",
    "blokken": [
      {
        "soort": "ul",
        "inhoud": [
          "Maak in de eerste weken een kennismakingsafspraak bij de dierenarts. Neem het paspoort of entingsboekje mee.",
          "Kijk in het boekje wanneer de volgende enting en ontworming nodig zijn, en zet dat in je agenda.",
          "Zet de registratie van de chip op jouw naam bij de databank waar de chip is geregistreerd. Vraag de verkoper welke dat is.",
          "Bespreek met de dierenarts wanneer castratie of sterilisatie verstandig is."
        ]
      }
    ]
  },
  {
    "kop": "Wanneer bel je de dierenarts?",
    "blokken": [
      {
        "soort": "p",
        "inhoud": "Kittens kunnen snel achteruitgaan. Bel dezelfde dag als je kitten:"
      },
      {
        "soort": "ul",
        "inhoud": [
          "langer dan een dag niet eet, of helemaal niet drinkt;",
          "meerdere keren overgeeft, of diarree heeft die langer dan een dag duurt of bloed bevat;",
          "slap en lusteloos is, of niet meer wil spelen;",
          "niet plast, of moeite heeft met plassen;",
          "moeilijk ademt."
        ]
      },
      {
        "soort": "p",
        "inhoud": "Twijfel je? Bel gewoon. Daar is je dierenarts voor."
      }
    ]
  },
  {
    "kop": "Naar buiten?",
    "blokken": [
      {
        "soort": "p",
        "inhoud": "Houd je kitten binnen tot het minstens zes maanden oud is. Wil je dat je kat daarna naar buiten gaat, dan moet het ook:"
      },
      {
        "soort": "ul",
        "inhoud": [
          "alle entingen hebben gehad;",
          "gecastreerd of gesteriliseerd zijn, want een kat kan al vanaf ongeveer vier maanden vruchtbaar zijn;",
          "gechipt zijn, met de registratie op jouw naam;",
          "zich echt thuis voelen, zodat het de weg terug weet."
        ]
      },
      {
        "soort": "p",
        "inhoud": "Laat je kat de eerste keren kort en onder toezicht naar buiten, bijvoorbeeld vlak voor het eten. Overleg met je dierenarts over het juiste moment."
      }
    ]
  }
];
