export interface Document {
  id: string
  label: string
  icon: string
}

export interface UseCase {
  id: string
  label: string
}

export const DOCUMENTS: Document[] = [
  { id:'power-of-attorney',         label:'Power of Attorney',         icon:'⚖️' },
  { id:'affidavit',                 label:'Affidavit',                 icon:'📋' },
  { id:'birth-certificate',         label:'Birth Certificate',          icon:'📄' },
  { id:'marriage-certificate',      label:'Marriage Certificate',       icon:'💍' },
  { id:'death-certificate',         label:'Death Certificate',          icon:'🕊️' },
  { id:'divorce-decree',            label:'Divorce Decree',             icon:'📑' },
  { id:'corporate-documents',       label:'Corporate Documents',        icon:'🏢' },
  { id:'articles-of-incorporation', label:'Articles of Incorporation',  icon:'📃' },
  { id:'background-check',          label:'Background Check',           icon:'🔍' },
  { id:'diploma',                   label:'Diploma / Degree',           icon:'🎓' },
  { id:'transcript',                label:'Academic Transcript',        icon:'📝' },
  { id:'adoption-documents',        label:'Adoption Documents',         icon:'👪' },
]

export const USE_CASES: UseCase[] = [
  { id:'citizenship',                   label:'Citizenship Applications' },
  { id:'dual-citizenship',              label:'Dual Citizenship' },
  { id:'real-estate',                   label:'Real Estate Transactions' },
  { id:'property-transfer',             label:'Property Transfer' },
  { id:'corporate-expansion',           label:'Corporate Expansion' },
  { id:'foreign-business-registration', label:'Foreign Business Registration' },
  { id:'legal-filings',                 label:'Legal Proceedings' },
  { id:'immigration',                   label:'Immigration & Residency' },
  { id:'visa-processing',               label:'Visa Processing' },
  { id:'international-marriage',        label:'International Marriage' },
]
