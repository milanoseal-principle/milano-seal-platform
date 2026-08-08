import type { MatterAnalysisPatch } from "./matterAnalysis";
import { interpretIntakeText, isPositive, isSuppressed } from "./intakeInterpretation";

const COUNTRY_HINTS: Array<[RegExp, string]> = [
  [/\b(italy|italia|italie|italien)\b/i, "Italy"],
  [/\b(spain|españa|espana|espagne|spagna)\b/i, "Spain"],
  [/\b(portugal|portogallo)\b/i, "Portugal"],
  [/\b(france|francia|frankreich)\b/i, "France"],
  [/\b(germany|deutschland|alemania|germania|allemagne)\b/i, "Germany"],
  [/\b(greece|grecia|griechenland)\b/i, "Greece"],
  [
    /\b(united\s*kingdom|uk|england|great\s*britain|britain)\b/i,
    "United Kingdom",
  ],
  [/\b(ireland|irlanda)\b/i, "Ireland"],
  [/\b(netherlands|holland|paesi\s*bassi|países\s*bajos)\b/i, "Netherlands"],
  [/\b(switzerland|suisse|schweiz|svizzera|suiza)\b/i, "Switzerland"],
  [/\b(austria|österreich|oesterreich|autriche)\b/i, "Austria"],
  [/\b(belgium|bélgica|belgique|belgien)\b/i, "Belgium"],
  [/\b(luxembourg|luxemburg|lussemburgo)\b/i, "Luxembourg"],
  [/\b(poland|polska|polonia)\b/i, "Poland"],
  [/\b(sweden|sverige|suecia)\b/i, "Sweden"],
  [/\b(norway|norge|noruega)\b/i, "Norway"],
  [/\b(denmark|danmark|dinamarca)\b/i, "Denmark"],
  [/\b(finland|suomi|finlandia)\b/i, "Finland"],
  [/\b(canada|canadá)\b/i, "Canada"],
  [/\b(mexico|méxico|messico)\b/i, "Mexico"],
  [/\b(brazil|brasil|brasile)\b/i, "Brazil"],
  [/\b(argentina)\b/i, "Argentina"],
  [/\b(colombia)\b/i, "Colombia"],
  [/\b(chile)\b/i, "Chile"],
  [/\b(peru|perù|perú)\b/i, "Peru"],
  [/\b(uruguay)\b/i, "Uruguay"],
  [/\b(ecuador)\b/i, "Ecuador"],
  [/\b(japan|japón|japon|giappone)\b/i, "Japan"],
  [/\b(china|cina|chine)\b/i, "China"],
  [/\b(hong\s*kong)\b/i, "Hong Kong"],
  [/\b(singapore|singapur)\b/i, "Singapore"],
  [/\b(south\s*korea|korea|corea)\b/i, "South Korea"],
  [/\b(india)\b/i, "India"],
  [
    /\b(uae|united\s*arab\s*emirates|dubai|abu\s*dhabi|emirati)\b/i,
    "United Arab Emirates",
  ],
  [/\b(saudi\s*arabia|arabia\s*saudita)\b/i, "Saudi Arabia"],
  [/\b(qatar)\b/i, "Qatar"],
  [/\b(israel|israele)\b/i, "Israel"],
  [/\b(turkey|türkiye|turchia)\b/i, "Turkey"],
  [/\b(australia)\b/i, "Australia"],
  [/\b(new\s*zealand|nuova\s*zelanda)\b/i, "New Zealand"],
  [/\b(south\s*africa|sudafrica)\b/i, "South Africa"],
  [/\b(romania|rumania)\b/i, "Romania"],
  [/\b(czech)\b/i, "Czech Republic"],
  [/\b(hungary|magyar|hungría)\b/i, "Hungary"],
];

const DOC_HINTS: Array<[RegExp, string]> = [
  [
    /\b(power\s*of\s*attorney|attorney-?in-?fact|\bpoa\b|poder\s*notarial|procura(?:ção)?|procuration|vollmacht)\b/i,
    "Power of Attorney",
  ],
  [
    /\b(affidavit|dichiarazione\s*giurata|déclaration\s*sous\s*serment|declaración\s*jurada)\b/i,
    "Affidavit",
  ],
  [
    /\b(marriage\s*certificate|certificato\s*di\s*matrimonio|acta\s*de\s*matrimonio)\b/i,
    "Marriage Certificate",
  ],
  [
    /\b(birth\s*certificate|certificato\s*di\s*nascita|acta\s*de\s*nacimiento|certidão\s*de\s*nascimento|geburtsurkunde)\b/i,
    "Birth Certificate",
  ],
  [
    /\b(death\s*certificate|certificato\s*di\s*morte|acta\s*de\s*defunci[oó]n)\b/i,
    "Death Certificate",
  ],
  [/\b(divorce|divorcio|divorzio)\b/i, "Divorce Decree"],
  [
    /\b(diploma|transcript|titolo\s*di\s*studio|t[ií]tulo|expediente|university|college|università)\b/i,
    "Academic Transcript / Diploma",
  ],
  [
    /\b(fbi|background\s*check|criminal\s*record|antecedentes|casellario\s*giudiziale|certificato\s*penale)\b/i,
    "FBI Background Check",
  ],
  [
    /\b(deed|grantor|grantee|título\s*de\s*propiedad|escritura)\b/i,
    "Deed / Title Document",
  ],
  [
    /\b(articles?\s*of\s*incorporation|costituzione\s*società|estatutos)\b/i,
    "Articles of Incorporation",
  ],
  [/\b(corporate\s*resolution|delibera)\b/i, "Corporate Resolution"],
  [/\b(contract|contratto|contrato|vertrag)\b/i, "Contract / Agreement"],
  [/\b(will|testament|testamento)\b/i, "Will / Testament"],
  [/\b(trust)\b/i, "Trust Document"],
  [/\b(passport|passaporto|pasaporte)\b/i, "Passport / Identification Copy"],
  [/\b(visa)\b/i, "Visa Support Document"],
];

const URGENT_RE =
  /\b(urgent|urgente|urgentemente|asap|immediately|today|tomorrow|same\s*day|rush|sofort|de\s*urgencia|venerd[ìi]|monday|tuesday|wednesday|thursday|friday)\b/i;

const EXPEDITED_RE =
  /\b(expedit|priority|this\s*week|hurry|prossima\s*settimana|próxima\s*semana)\b/i;

const SIGNER_RE =
  /(\d+)\s*(?:signer|signator|firmatari|firmant|firmante|firmen|signatario)/i;

const DOC_COUNT_RE = /(\d+)\s*(?:document|doc|documenti|documentos)\b/i;

export function quickTagParse(text: string): MatterAnalysisPatch {
  const out: MatterAnalysisPatch = {};
  const t = text || "";
  if (!t.trim()) return out;

  for (const [re, label] of COUNTRY_HINTS) {
    if (re.test(t)) {
      out.country = label;
      break;
    }
  }

  for (const [re, label] of DOC_HINTS) {
    if (re.test(t)) {
      out.documentType = label;
      break;
    }
  }

  // Generalized, negation-aware interpretation (single interpretation truth).
  // Explicit negatives / already-completed suppress the service; a bare mention
  // no longer forces a positive requirement.
  const interp = interpretIntakeText(t);

  if (isPositive(interp.concepts.apostille)) out.apostilleRequired = true;
  else if (isSuppressed(interp.concepts.apostille)) out.apostilleRequired = false;

  if (isPositive(interp.concepts.translation)) out.translationNeeded = true;
  else if (isSuppressed(interp.concepts.translation)) out.translationNeeded = false;

  // RON review is warranted by an affirmative notarization/RON request; an
  // explicit "no notarization" / "already notarized" suppresses it.
  const notar = interp.concepts.notarization;
  const ron = interp.concepts.ron;
  out.ronReviewRequired = isPositive(ron) || isPositive(notar);

  if (URGENT_RE.test(t)) out.urgency = "urgent";
  else if (EXPEDITED_RE.test(t)) out.urgency = "expedited";
  else out.urgency = "standard";

  const sm = t.match(SIGNER_RE);
  if (sm) out.signerCount = Math.max(1, parseInt(sm[1], 10));

  const dm = t.match(DOC_COUNT_RE);
  if (dm) out.documentCount = Math.max(1, parseInt(dm[1], 10));

  return out;
}
