import type { SupportedLocale } from "@/lib/i18n/config";

export type PublicTranslation = {
  header: {
    nav: string[];
    professionalNav: string[];
    login: string;
    professionalLogin: string;
    intake: string;
    submitClientMatter: string;
    globalExecution: string;
    professionalAccess: string;
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    init: string[];
    line1: string;
    line2a: string;
    line2b: string;
    subtitle: string;
    description: string;
    compliance: string;
    intake: string;
    intelligence: string;
    whatYouGet: string;
    benefits: string[];
    ronCompliance: string;
    founderLed: string;
    founderSummary: string;
    meetFounder: string;
    beginIntake: string;
  };
  services: {
    eyebrow: string;
    title: string;
    summary: string;
    cards: Array<{ title: string; description: string; features: string[]; tooltips: string[] }>;
  };
  process: {
    eyebrow: string;
    title: string;
    summary: string;
    steps: Array<{ title: string; description: string }>;
  };
  founder: {
    eyebrow: string;
    title: string;
    role: string;
    credentials: string[];
    overseen: string;
    bio: string;
    founderProfile: string;
    about: string;
    linkedin: string;
    instagram: string;
    reviews: string;
    facebook: string;
    tagline: string;
  };
  footer: {
    globalExecution: string;
    positioning: string;
    brandPromise: string;
    location: string;
    availableUponIntake: string;
    services: string;
    documents: string;
    apostilleServices: string;
    allRights: string;
    privacy: string;
    terms: string;
    disclaimer: string;
    network: string[];
    serviceLinks: string[];
    documentLinks: string[];
    countryLinks: string[];
  };
  finalCta: {
    title: string;
    body: string;
    intake: string;
    portal: string;
  };
  loading: {
    title: string;
    body: string;
    aria: string;
  };
  ticker: {
    railA: string[];
    workflows: string[];
  };
};

const EN: PublicTranslation = {
  header: {
    nav: ["Services","Pricing","Process","Global Intelligence","Professional","Secure Portal"],
    professionalNav: ["Professional Home","Country Route","Execution Scope","Counsel Boundary","Secure Portal"],
    login: "Login",
    professionalLogin: "Professional Login",
    intake: "Begin Secure Intake",
    submitClientMatter: "Submit Client Matter",
    globalExecution: "Global Document Execution",
    professionalAccess: "Professional Execution Access",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  hero: {
    init: ["Initializing International Execution Environment...","Reviewing Cross-Border Routing Requirements...","Preparing Protected Matter Coordination..."],
    line1: "Sealing Trust",
    line2a: "Across",
    line2b: "Borders",
    subtitle: "U.S. Document Execution for International Use",
    description: "Remote Online Notarization, Apostille Coordination, and International Document Execution Support with structured routing review, payment-gated execution, and secure release coordination.",
    compliance: "International use is subject to destination and receiving-authority requirements.",
    intake: "Begin Secure Intake",
    intelligence: "Explore Global Document Intelligence",
    whatYouGet: "What You Get",
    benefits: ["Secure, Verified\nIntake","Remote Online\nNotarization","Apostille Routing\nHandled For You","Destination Rules\nReviewed","Resources Reserved\nFor Your Matter","Track Every Step\nIntake to Release"],
    ronCompliance: "RON availability depends on document type, signer location, jurisdiction, and receiving-authority requirements.",
    founderLed: "Founder-Led Document Execution",
    founderSummary: "Florida Notary Public & Remote Online Notary. Apostille coordination, international execution, and secure release.",
    meetFounder: "Meet the Founder →",
    beginIntake: "Begin Intake →",
  },
  services: {
    eyebrow: "Our Services",
    title: "Comprehensive Document Execution",
    summary: "High-trust document handling for international use. Governed routing, custody, and release control at every step.",
    cards: [
      { title:"Remote Online Notarization Coordination", description:"Florida Remote Online Notarization support for eligible documents, including identity verification workflow coordination, signer readiness review, session preparation, and post-execution document QA before apostille or release movement.", features:["Identity verification workflow","Signer readiness review","Session preparation","Post-execution QA"], tooltips:["Multi-factor identity verification performed through approved RON platform procedures.","","",""] },
      { title:"Hague Apostille Coordination", description:"Document routing support for Hague Convention countries, including notarization review, state or federal apostille pathway review, destination-country awareness, courier custody, and receiving-authority sensitivity checks.", features:["Apostille pathway review","Destination-country awareness","Courier custody","Receiving-authority checks"], tooltips:["State or federal competent-authority routing is reviewed against the document origin and current Matter facts before submission.","Destination routing is reviewed against governed treaty status and receiving-authority requirements.","",""] },
      { title:"Non-Hague Authentication & Legalization Review", description:"Structured routing review for documents intended for non-Hague jurisdictions that may require state authentication, federal review, embassy or consular legalization, translation review, or specialized release handling.", features:["State authentication review","Federal review pathway","Embassy/consular legalization","Translation review support"], tooltips:["","","",""] },
      { title:"Executive Document Logistics", description:"High-control support for private-client, corporate, estate, maritime, equestrian, luxury asset, and international transaction documents requiring careful intake, document packet review, chain-of-custody awareness, and release coordination.", features:["High-control intake","Document packet review","Chain-of-custody awareness","Release coordination"], tooltips:["","","",""] },
    ],
  },
  process: {
    eyebrow:"Execution Path",
    title:"International Document Execution Workflow",
    summary:"Structured intake to structured release. Every step reviewed before the next begins.",
    steps:[
      {title:"Secure Intake",description:"Client, document, signer, destination, receiving authority, urgency, and execution method are captured through a structured intake flow."},
      {title:"Operational Review",description:"The matter is reviewed for document type, origin jurisdiction, signer location, destination country, apostille/authentication route, and missing information."},
      {title:"Payment Gate",description:"Scheduling and execution remain locked until the matter scope and payment status are confirmed."},
      {title:"Document Execution",description:"Eligible documents move through in-person notarization, Remote Online Notarization coordination, or document packet preparation according to the approved matter path."},
      {title:"Custody Rail",description:"Executed documents are reviewed, packaged, tracked, and monitored through courier custody or apostille/authentication routing."},
      {title:"Release Desk",description:"Documents are released only after the required execution, payment, custody, and review conditions are satisfied."},
    ],
  },
  founder: {
    eyebrow:"Founder Trust Anchor",
    title:"Execution Led by the Founder",
    role:"Founder · Chief Trust Officer",
    credentials:["Florida Notary Public","Florida Remote Online Notary","International Document Execution Liaison","Florida Notary Commission #668288"],
    overseen:"Founder-Led Execution // Personally Overseen",
    bio:"Nicholas Milano has built his practice at the intersection of international document execution, procedural compliance, and cross-border coordination. His methodology combines Florida notarial standards with the operational precision required by global transactions.",
    founderProfile:"View Founder Profile",
    about:"About The Milano Seal",
    linkedin:"View LinkedIn",
    instagram:"Follow on Instagram",
    reviews:"Read Google Reviews",
    facebook:"Facebook",
    tagline:"Sealing Trust Across Borders",
  },
  footer: {
    globalExecution:"Global Document Execution",
    positioning:"International Document Execution & Apostille Coordination",
    brandPromise:"Sealing Trust in Every Signature",
    location:"Florida, United States",
    availableUponIntake:"Available upon intake",
    services:"Services",
    documents:"Documents",
    apostilleServices:"Apostille Services",
    allRights:"All rights reserved.",
    privacy:"Privacy Policy",
    terms:"Terms of Service",
    disclaimer:"Nicholas Milano is a commissioned Florida Notary Public. Remote Online Notarization services are coordinated in accordance with applicable Florida law and Matter-specific execution requirements. Apostille coordination is facilitated through the appropriate competent authority. The Milano Seal is not a law firm and does not provide legal advice or legal representation.",
    network:["Alliance Partner Network","RON Notary Alliance","Execution Support Network"],
    serviceLinks:["Remote Online Notarization","Apostille Coordination","International Execution","Mobile Notary","Government Services"],
    documentLinks:["Power of Attorney","Affidavits","Birth Certificates","Marriage Certificates","Corporate Documents"],
    countryLinks:["Apostille for Italy","Apostille for Spain","Apostille for Germany","Apostille for France","Apostille for Brazil"],
  },
  finalCta:{title:"Ready to prepare a document for use abroad?",body:"Submit the request first. We will review the matter before scheduling or release.",intake:"Start Secure Intake",portal:"Open Secure Matter Portal"},
  loading:{title:"Preparing the next view",body:"Preserving your current context while the destination surface is prepared.",aria:"Preparing the next view"},
  ticker:{
    railA:["GLOBAL DOCUMENT INTELLIGENCE","HAGUE ROUTE REVIEW","PAYMENT-GATED EXECUTION","CHAIN-OF-CUSTODY VISIBILITY","WISE PAYMENT REFERENCE","COURIER RELEASE TRACKING","PRE-FLIGHT REVIEW","DOCUMENT VAULT","PAID & RELEASED","APOSTILLE COORDINATION","INTERNATIONAL COORDINATION","COORDINATOR VISIBILITY"],
    workflows:["Hague Convention Validation Route","Apostille Review Pathway","Consular Authentication Workflow","International Release Corridor","Hague Apostille Review Path","Hague Apostille Review Path","Hague Convention Document Route"],
  },
};

const IT: PublicTranslation = {
  ...EN,
  header:{nav:["Servizi","Prezzi","Processo","Intelligence Globale","Professionisti","Portale Sicuro"],professionalNav:["Area Professionisti","Percorso Paese","Ambito di Esecuzione","Confine Legale","Portale Sicuro"],login:"Accedi",professionalLogin:"Accesso Professionisti",intake:"Avvia Intake Sicuro",submitClientMatter:"Invia Pratica Cliente",globalExecution:"Esecuzione Globale di Documenti",professionalAccess:"Accesso Esecuzione Professionale",openMenu:"Apri menu",closeMenu:"Chiudi menu"},
  hero:{...EN.hero,init:["Inizializzazione dell'ambiente di esecuzione internazionale...","Verifica dei requisiti di instradamento transfrontaliero...","Preparazione del coordinamento protetto della pratica..."],line1:"Sigillare la Fiducia",line2a:"Oltre i",line2b:"Confini",subtitle:"Esecuzione di Documenti USA per Uso Internazionale",description:"Notarizzazione online da remoto, coordinamento apostille e supporto all'esecuzione internazionale dei documenti con revisione strutturata del percorso, esecuzione subordinata al pagamento e rilascio sicuro.",compliance:"L'uso internazionale è soggetto ai requisiti del Paese di destinazione e dell'autorità ricevente.",intake:"Avvia Intake Sicuro",intelligence:"Esplora la Global Document Intelligence",whatYouGet:"Cosa Ottieni",benefits:["Intake Sicuro e\nVerificato","Notarizzazione\nOnline da Remoto","Percorso Apostille\nGestito","Regole di Destinazione\nVerificate","Risorse Riservate\nalla Pratica","Tracciamento Completo\ndall'Intake al Rilascio"],ronCompliance:"La disponibilità RON dipende dal tipo di documento, dalla posizione del firmatario, dalla giurisdizione e dai requisiti dell'autorità ricevente.",founderLed:"Esecuzione Guidata dal Fondatore",founderSummary:"Notaio pubblico della Florida e Remote Online Notary. Coordinamento apostille, esecuzione internazionale e rilascio sicuro.",meetFounder:"Conosci il Fondatore →",beginIntake:"Avvia Intake →"},
  services:{...EN.services,eyebrow:"I Nostri Servizi",title:"Esecuzione Documentale Completa",summary:"Gestione ad alta affidabilità dei documenti per uso internazionale. Instradamento governato, custodia e controllo del rilascio in ogni fase.",cards:[
    {title:"Coordinamento della Notarizzazione Online da Remoto",description:"Supporto RON della Florida per documenti idonei, con coordinamento della verifica d'identità, verifica della preparazione del firmatario, preparazione della sessione e QA post-esecuzione prima dell'apostille o del rilascio.",features:["Flusso di verifica identità","Verifica preparazione firmatario","Preparazione sessione","QA post-esecuzione"],tooltips:["Verifica multifattore dell'identità tramite procedure della piattaforma RON approvata.","","",""]},
    {title:"Coordinamento Apostille Hague",description:"Supporto all'instradamento per Paesi della Convenzione dell'Aia, inclusi revisione notarile, percorso apostille statale o federale, requisiti di destinazione, custodia del corriere e controlli dell'autorità ricevente.",features:["Revisione percorso apostille","Requisiti del Paese di destinazione","Custodia corriere","Controlli autorità ricevente"],tooltips:["L'autorità competente statale o federale viene verificata in base all'origine del documento e ai fatti della pratica.","Il percorso di destinazione è verificato rispetto allo stato convenzionale governato e ai requisiti dell'autorità ricevente.","",""]},
    {title:"Revisione Autenticazione e Legalizzazione Non-Hague",description:"Revisione strutturata per documenti destinati a giurisdizioni non-Hague che possono richiedere autenticazione statale, revisione federale, legalizzazione consolare o d'ambasciata, revisione traduzione o rilascio specializzato.",features:["Revisione autenticazione statale","Percorso federale","Legalizzazione ambasciata/consolato","Supporto revisione traduzione"],tooltips:["","","",""]},
    {title:"Logistica Documentale Executive",description:"Supporto ad alto controllo per documenti privati, societari, patrimoniali, marittimi, equestri, beni di lusso e transazioni internazionali con intake accurato, revisione del fascicolo, custodia e rilascio.",features:["Intake ad alto controllo","Revisione fascicolo","Visibilità catena di custodia","Coordinamento rilascio"],tooltips:["","","",""]},
  ]},
  process:{eyebrow:"Percorso di Esecuzione",title:"Flusso di Esecuzione Documentale Internazionale",summary:"Da intake strutturato a rilascio strutturato. Ogni fase viene verificata prima della successiva.",steps:[
    {title:"Intake Sicuro",description:"Cliente, documento, firmatario, destinazione, autorità ricevente, urgenza e metodo di esecuzione vengono acquisiti in un flusso strutturato."},
    {title:"Revisione Operativa",description:"La pratica viene verificata per tipo e origine del documento, posizione del firmatario, destinazione, percorso apostille/autenticazione e informazioni mancanti."},
    {title:"Gate di Pagamento",description:"Programmazione ed esecuzione restano bloccate finché ambito della pratica e stato del pagamento non sono confermati."},
    {title:"Esecuzione del Documento",description:"I documenti idonei seguono notarizzazione in presenza, coordinamento RON o preparazione del fascicolo secondo il percorso approvato."},
    {title:"Catena di Custodia",description:"I documenti eseguiti vengono verificati, confezionati, tracciati e monitorati nel percorso di corriere o apostille/autenticazione."},
    {title:"Desk di Rilascio",description:"I documenti vengono rilasciati solo dopo il soddisfacimento dei requisiti di esecuzione, pagamento, custodia e revisione."},
  ]},
  founder:{...EN.founder,eyebrow:"Ancora di Fiducia del Fondatore",title:"Esecuzione Guidata dal Fondatore",role:"Fondatore · Chief Trust Officer",credentials:["Notaio Pubblico della Florida","Remote Online Notary della Florida","Liaison per l'Esecuzione Documentale Internazionale","Commissione Notarile Florida #668288"],overseen:"Esecuzione Guidata dal Fondatore // Supervisione Personale",bio:"Nicholas Milano opera all'intersezione tra esecuzione documentale internazionale, conformità procedurale e coordinamento transfrontaliero. La sua metodologia combina gli standard notarili della Florida con la precisione operativa richiesta dalle transazioni globali.",founderProfile:"Profilo del Fondatore",about:"Informazioni su The Milano Seal",linkedin:"LinkedIn",instagram:"Instagram",reviews:"Recensioni Google",facebook:"Facebook",tagline:"Sigillare la Fiducia Oltre i Confini"},
  footer:{...EN.footer,globalExecution:"Esecuzione Globale di Documenti",positioning:"Esecuzione Documentale Internazionale e Coordinamento Apostille",brandPromise:"Sigillare la Fiducia in Ogni Firma",location:"Florida, Stati Uniti",availableUponIntake:"Disponibile dopo l'intake",services:"Servizi",documents:"Documenti",apostilleServices:"Servizi Apostille",allRights:"Tutti i diritti riservati.",privacy:"Privacy",terms:"Termini di Servizio",disclaimer:"Nicholas Milano è un Notaio Pubblico commissionato in Florida. I servizi di Remote Online Notarization sono coordinati in conformità alla legge applicabile della Florida e ai requisiti specifici della pratica. Il coordinamento apostille avviene tramite l'autorità competente appropriata. The Milano Seal non è uno studio legale e non fornisce consulenza o rappresentanza legale.",network:["Rete Partner Alliance","Alleanza Notai RON","Rete di Supporto all'Esecuzione"],serviceLinks:["Notarizzazione Online da Remoto","Coordinamento Apostille","Esecuzione Internazionale","Notaio Mobile","Servizi Governativi"],documentLinks:["Procura","Dichiarazioni Giurate","Certificati di Nascita","Certificati di Matrimonio","Documenti Societari"],countryLinks:["Apostille per l'Italia","Apostille per la Spagna","Apostille per la Germania","Apostille per la Francia","Apostille per il Brasile"]},
  finalCta:{title:"Pronto a preparare un documento per l'uso all'estero?",body:"Invia prima la richiesta. Verificheremo la pratica prima della programmazione o del rilascio.",intake:"Avvia Intake Sicuro",portal:"Apri Portale Pratica Sicuro"},
  loading:{title:"Preparazione della prossima vista",body:"Stiamo preservando il contesto attuale mentre prepariamo la destinazione.",aria:"Preparazione della prossima vista"},
  ticker:{railA:["INTELLIGENCE DOCUMENTALE GLOBALE","REVISIONE PERCORSO HAGUE","ESECUZIONE SUBORDINATA AL PAGAMENTO","VISIBILITÀ CATENA DI CUSTODIA","RIFERIMENTO PAGAMENTO WISE","TRACCIAMENTO RILASCIO CORRIERE","REVISIONE PRE-FLIGHT","VAULT DOCUMENTI","PAGATO E RILASCIATO","COORDINAMENTO APOSTILLE","COORDINAMENTO INTERNAZIONALE","VISIBILITÀ DEL COORDINATORE"],workflows:["Percorso di validazione Convenzione dell'Aia","Percorso di revisione apostille","Flusso di autenticazione consolare","Corridoio di rilascio internazionale","Percorso di revisione apostille Hague","Percorso di revisione apostille Hague","Percorso documentale Convenzione dell'Aia"]},
};

const PT: PublicTranslation = {
  ...EN,
  header:{nav:["Serviços","Preços","Processo","Inteligência Global","Profissionais","Portal Seguro"],professionalNav:["Área Profissional","Rota por País","Escopo de Execução","Limite Jurídico","Portal Seguro"],login:"Entrar",professionalLogin:"Login Profissional",intake:"Iniciar Intake Seguro",submitClientMatter:"Enviar Matéria do Cliente",globalExecution:"Execução Global de Documentos",professionalAccess:"Acesso Profissional de Execução",openMenu:"Abrir menu",closeMenu:"Fechar menu"},
  hero:{...EN.hero,init:["Inicializando o ambiente de execução internacional...","Revisando requisitos de roteamento internacional...","Preparando a coordenação protegida da matéria..."],line1:"Selando Confiança",line2a:"Além das",line2b:"Fronteiras",subtitle:"Execução de Documentos dos EUA para Uso Internacional",description:"Notarização remota online, coordenação de apostila e suporte à execução internacional de documentos com revisão estruturada de rota, execução condicionada ao pagamento e coordenação segura de liberação.",compliance:"O uso internacional está sujeito aos requisitos do destino e da autoridade receptora.",intake:"Iniciar Intake Seguro",intelligence:"Explorar Inteligência Global de Documentos",whatYouGet:"O Que Você Recebe",benefits:["Intake Seguro e\nVerificado","Notarização\nRemota Online","Rota de Apostila\nCoordenada","Regras do Destino\nRevisadas","Recursos Reservados\npara sua Matéria","Acompanhe Cada Etapa\ndo Intake à Liberação"],ronCompliance:"A disponibilidade de RON depende do tipo de documento, localização do signatário, jurisdição e requisitos da autoridade receptora.",founderLed:"Execução Liderada pelo Fundador",founderSummary:"Notário Público da Flórida e Remote Online Notary. Coordenação de apostila, execução internacional e liberação segura.",meetFounder:"Conheça o Fundador →",beginIntake:"Iniciar Intake →"},
  services:{...EN.services,eyebrow:"Nossos Serviços",title:"Execução Documental Completa",summary:"Tratamento de alta confiança para documentos de uso internacional. Roteamento governado, custódia e controle de liberação em cada etapa.",cards:[
    {title:"Coordenação de Notarização Remota Online",description:"Suporte RON da Flórida para documentos elegíveis, incluindo coordenação da verificação de identidade, prontidão do signatário, preparação da sessão e QA pós-execução antes da apostila ou liberação.",features:["Fluxo de verificação de identidade","Revisão da prontidão do signatário","Preparação da sessão","QA pós-execução"],tooltips:["Verificação multifator de identidade por procedimentos aprovados da plataforma RON.","","",""]},
    {title:"Coordenação de Apostila Hague",description:"Suporte de roteamento para países da Convenção da Haia, incluindo revisão notarial, rota de apostila estadual ou federal, requisitos do destino, custódia de courier e verificações da autoridade receptora.",features:["Revisão da rota de apostila","Requisitos do destino","Custódia de courier","Verificações da autoridade receptora"],tooltips:["A autoridade competente estadual ou federal é revisada com base na origem do documento e nos fatos atuais da matéria.","O roteamento do destino é revisado conforme o status governado do tratado e os requisitos da autoridade receptora.","",""]},
    {title:"Revisão de Autenticação e Legalização Não-Hague",description:"Revisão estruturada para documentos destinados a jurisdições não-Hague que podem exigir autenticação estadual, revisão federal, legalização em embaixada ou consulado, revisão de tradução ou liberação especializada.",features:["Revisão de autenticação estadual","Rota de revisão federal","Legalização em embaixada/consulado","Suporte à revisão de tradução"],tooltips:["","","",""]},
    {title:"Logística Documental Executiva",description:"Suporte de alto controle para documentos privados, corporativos, patrimoniais, marítimos, equestres, de ativos de luxo e transações internacionais que exigem intake cuidadoso, revisão do pacote, custódia e coordenação de liberação.",features:["Intake de alto controle","Revisão do pacote documental","Visibilidade da cadeia de custódia","Coordenação de liberação"],tooltips:["","","",""]},
  ]},
  process:{eyebrow:"Rota de Execução",title:"Fluxo de Execução Documental Internacional",summary:"Do intake estruturado à liberação estruturada. Cada etapa é revisada antes da próxima.",steps:[
    {title:"Intake Seguro",description:"Cliente, documento, signatário, destino, autoridade receptora, urgência e método de execução são capturados em um fluxo estruturado."},
    {title:"Revisão Operacional",description:"A matéria é revisada quanto ao tipo e origem do documento, localização do signatário, destino, rota de apostila/autenticação e informações ausentes."},
    {title:"Gate de Pagamento",description:"Agendamento e execução permanecem bloqueados até a confirmação do escopo da matéria e do status do pagamento."},
    {title:"Execução do Documento",description:"Documentos elegíveis seguem por notarização presencial, coordenação RON ou preparação do pacote conforme a rota aprovada."},
    {title:"Cadeia de Custódia",description:"Documentos executados são revisados, embalados, rastreados e monitorados pela custódia do courier ou rota de apostila/autenticação."},
    {title:"Mesa de Liberação",description:"Documentos são liberados somente após o cumprimento das condições exigidas de execução, pagamento, custódia e revisão."},
  ]},
  founder:{...EN.founder,eyebrow:"Âncora de Confiança do Fundador",title:"Execução Liderada pelo Fundador",role:"Fundador · Chief Trust Officer",credentials:["Notário Público da Flórida","Remote Online Notary da Flórida","Liaison de Execução Documental Internacional","Comissão Notarial da Flórida #668288"],overseen:"Execução Liderada pelo Fundador // Supervisão Pessoal",bio:"Nicholas Milano atua na interseção entre execução documental internacional, conformidade procedimental e coordenação transfronteiriça. Sua metodologia combina os padrões notariais da Flórida com a precisão operacional exigida por transações globais.",founderProfile:"Ver Perfil do Fundador",about:"Sobre The Milano Seal",linkedin:"Ver LinkedIn",instagram:"Seguir no Instagram",reviews:"Ver Avaliações do Google",facebook:"Facebook",tagline:"Selando Confiança Além das Fronteiras"},
  footer:{...EN.footer,globalExecution:"Execução Global de Documentos",positioning:"Execução Documental Internacional e Coordenação de Apostila",brandPromise:"Selando Confiança em Cada Assinatura",location:"Flórida, Estados Unidos",availableUponIntake:"Disponível após o intake",services:"Serviços",documents:"Documentos",apostilleServices:"Serviços de Apostila",allRights:"Todos os direitos reservados.",privacy:"Política de Privacidade",terms:"Termos de Serviço",disclaimer:"Nicholas Milano é Notário Público com comissão vigente na Flórida. Os serviços de Remote Online Notarization são coordenados de acordo com a legislação aplicável da Flórida e os requisitos específicos da matéria. A coordenação de apostila é realizada por meio da autoridade competente apropriada. The Milano Seal não é um escritório de advocacia e não oferece aconselhamento nem representação jurídica.",network:["Rede de Parceiros Alliance","Aliança de Notários RON","Rede de Suporte à Execução"],serviceLinks:["Notarização Remota Online","Coordenação de Apostila","Execução Internacional","Notário Móvel","Serviços Governamentais"],documentLinks:["Procuração","Declarações Juramentadas","Certidões de Nascimento","Certidões de Casamento","Documentos Corporativos"],countryLinks:["Apostila para Itália","Apostila para Espanha","Apostila para Alemanha","Apostila para França","Apostila para Brasil"]},
  finalCta:{title:"Pronto para preparar um documento para uso no exterior?",body:"Envie primeiro a solicitação. Revisaremos a matéria antes do agendamento ou da liberação.",intake:"Iniciar Intake Seguro",portal:"Abrir Portal Seguro da Matéria"},
  loading:{title:"Preparando a próxima visualização",body:"Preservando seu contexto atual enquanto a próxima superfície é preparada.",aria:"Preparando a próxima visualização"},
  ticker:{railA:["INTELIGÊNCIA GLOBAL DE DOCUMENTOS","REVISÃO DE ROTA HAGUE","EXECUÇÃO CONDICIONADA AO PAGAMENTO","VISIBILIDADE DA CADEIA DE CUSTÓDIA","REFERÊNCIA DE PAGAMENTO WISE","RASTREAMENTO DE LIBERAÇÃO DO COURIER","REVISÃO PRÉ-EXECUÇÃO","COFRE DE DOCUMENTOS","PAGO E LIBERADO","COORDENAÇÃO DE APOSTILA","COORDENAÇÃO INTERNACIONAL","VISIBILIDADE DO COORDENADOR"],workflows:["Rota de validação da Convenção da Haia","Rota de revisão de apostila","Fluxo de autenticação consular","Corredor de liberação internacional","Rota de revisão de apostila Hague","Rota de revisão de apostila Hague","Rota documental da Convenção da Haia"]},
};

const ES: PublicTranslation = {
  ...EN,
  header:{...EN.header,nav:["Servicios","Precios","Proceso","Inteligencia Global","Profesionales","Portal Seguro"],login:"Iniciar sesión",intake:"Iniciar Intake Seguro",globalExecution:"Ejecución Global de Documentos",openMenu:"Abrir menú",closeMenu:"Cerrar menú"},
  hero:{...EN.hero,line1:"Sellando Confianza",line2a:"Más Allá de las",line2b:"Fronteras",subtitle:"Ejecución de Documentos de EE. UU. para Uso Internacional",description:"Notarización remota en línea, coordinación de apostilla y soporte de ejecución internacional con revisión estructurada de ruta, ejecución condicionada al pago y liberación segura.",compliance:"El uso internacional está sujeto a los requisitos del destino y de la autoridad receptora.",intake:"Iniciar Intake Seguro",intelligence:"Explorar Inteligencia Global de Documentos",whatYouGet:"Lo Que Obtienes",founderLed:"Ejecución Dirigida por el Fundador",meetFounder:"Conoce al Fundador →",beginIntake:"Iniciar Intake →"},
  services:{...EN.services,eyebrow:"Nuestros Servicios",title:"Ejecución Documental Integral",summary:"Gestión de alta confianza para documentos de uso internacional. Ruteo gobernado, custodia y control de liberación en cada etapa."},
  process:{...EN.process,eyebrow:"Ruta de Ejecución",title:"Flujo de Ejecución Documental Internacional",summary:"Del intake estructurado a la liberación estructurada. Cada etapa se revisa antes de la siguiente."},
  founder:{...EN.founder,eyebrow:"Ancla de Confianza del Fundador",title:"Ejecución Dirigida por el Fundador",founderProfile:"Ver Perfil del Fundador",about:"Sobre The Milano Seal",tagline:"Sellando Confianza Más Allá de las Fronteras"},
  footer:{...EN.footer,globalExecution:"Ejecución Global de Documentos",positioning:"Ejecución Documental Internacional y Coordinación de Apostilla",brandPromise:"Sellando Confianza en Cada Firma",location:"Florida, Estados Unidos",availableUponIntake:"Disponible tras el intake",services:"Servicios",documents:"Documentos",apostilleServices:"Servicios de Apostilla",allRights:"Todos los derechos reservados.",privacy:"Política de Privacidad",terms:"Términos de Servicio",disclaimer:"Nicholas Milano es Notario Público comisionado en Florida. Los servicios de notarización remota en línea se coordinan conforme a la ley aplicable de Florida y a los requisitos específicos de cada Matter. La coordinación de apostilla se facilita mediante la autoridad competente correspondiente. The Milano Seal no es un bufete de abogados y no presta asesoría ni representación legal."},
  finalCta:{title:"¿Listo para preparar un documento para uso en el extranjero?",body:"Envía primero la solicitud. Revisaremos el Matter antes de programar o liberar.",intake:"Iniciar Intake Seguro",portal:"Abrir Portal Seguro del Matter"},
  loading:{title:"Preparando la siguiente vista",body:"Conservando tu contexto actual mientras se prepara la siguiente superficie.",aria:"Preparando la siguiente vista"},
  ticker:EN.ticker,
};

const DE: PublicTranslation = {
  ...EN,
  header:{...EN.header,nav:["Leistungen","Preise","Ablauf","Globale Intelligence","Professionals","Sicheres Portal"],login:"Anmelden",intake:"Sicheren Intake starten",globalExecution:"Globale Dokumentenausführung",openMenu:"Menü öffnen",closeMenu:"Menü schließen"},
  hero:{...EN.hero,line1:"Vertrauen Besiegeln",line2a:"Über",line2b:"Grenzen",subtitle:"US-Dokumentenausführung für internationale Verwendung",description:"Remote Online Notarization, Apostille-Koordination und internationale Dokumentenausführung mit strukturierter Routenprüfung, zahlungsgesteuerter Ausführung und sicherer Freigabe.",compliance:"Die internationale Verwendung unterliegt den Anforderungen des Bestimmungslands und der empfangenden Behörde.",intake:"Sicheren Intake starten",intelligence:"Globale Dokumenten-Intelligence erkunden",whatYouGet:"Ihre Vorteile",founderLed:"Vom Gründer geleitete Dokumentenausführung",meetFounder:"Gründer kennenlernen →",beginIntake:"Intake starten →"},
  services:{...EN.services,eyebrow:"Unsere Leistungen",title:"Umfassende Dokumentenausführung",summary:"Vertrauenswürdige Dokumentenabwicklung für internationale Verwendung. Gesteuerte Routen, Verwahrung und Freigabekontrolle in jeder Phase."},
  process:{...EN.process,eyebrow:"Ausführungspfad",title:"Internationaler Dokumentenausführungs-Workflow",summary:"Vom strukturierten Intake bis zur strukturierten Freigabe. Jeder Schritt wird vor dem nächsten geprüft."},
  founder:{...EN.founder,eyebrow:"Vertrauensanker des Gründers",title:"Ausführung unter Leitung des Gründers",founderProfile:"Gründerprofil",about:"Über The Milano Seal",tagline:"Vertrauen über Grenzen hinweg"},
  footer:{...EN.footer,globalExecution:"Globale Dokumentenausführung",positioning:"Internationale Dokumentenausführung und Apostille-Koordination",brandPromise:"Vertrauen mit jeder Unterschrift besiegeln",location:"Florida, Vereinigte Staaten",availableUponIntake:"Nach Intake verfügbar",services:"Leistungen",documents:"Dokumente",apostilleServices:"Apostille-Leistungen",allRights:"Alle Rechte vorbehalten.",privacy:"Datenschutz",terms:"Nutzungsbedingungen",disclaimer:"Nicholas Milano ist ein in Florida bestellter Notary Public. Remote-Online-Notarisierungsdienste werden gemäß anwendbarem Recht in Florida und den matter-spezifischen Ausführungsanforderungen koordiniert. Die Apostille-Koordination erfolgt über die jeweils zuständige Behörde. The Milano Seal ist keine Anwaltskanzlei und erbringt keine Rechtsberatung oder Rechtsvertretung."},
  finalCta:{title:"Bereit, ein Dokument für die Verwendung im Ausland vorzubereiten?",body:"Reichen Sie zuerst die Anfrage ein. Wir prüfen den Matter vor Terminierung oder Freigabe.",intake:"Sicheren Intake starten",portal:"Sicheres Matter-Portal öffnen"},
  loading:{title:"Nächste Ansicht wird vorbereitet",body:"Ihr aktueller Kontext bleibt erhalten, während die Zielansicht vorbereitet wird.",aria:"Nächste Ansicht wird vorbereitet"},
  ticker:EN.ticker,
};

const FR: PublicTranslation = {
  ...EN,
  header:{...EN.header,nav:["Services","Tarifs","Processus","Intelligence Globale","Professionnels","Portail Sécurisé"],login:"Connexion",intake:"Commencer l'Intake Sécurisé",globalExecution:"Exécution Globale de Documents",openMenu:"Ouvrir le menu",closeMenu:"Fermer le menu"},
  hero:{...EN.hero,line1:"Sceller la Confiance",line2a:"Au-delà des",line2b:"Frontières",subtitle:"Exécution de Documents Américains pour Usage International",description:"Notarisation en ligne à distance, coordination d'apostille et support d'exécution internationale avec revue structurée du routage, exécution conditionnée au paiement et libération sécurisée.",compliance:"L'utilisation internationale reste soumise aux exigences du pays de destination et de l'autorité destinataire.",intake:"Commencer l'Intake Sécurisé",intelligence:"Explorer l'Intelligence Globale des Documents",whatYouGet:"Ce Que Vous Obtenez",founderLed:"Exécution Dirigée par le Fondateur",meetFounder:"Découvrir le Fondateur →",beginIntake:"Commencer l'Intake →"},
  services:{...EN.services,eyebrow:"Nos Services",title:"Exécution Documentaire Complète",summary:"Traitement de haute confiance pour l'usage international. Routage gouverné, garde et contrôle de libération à chaque étape."},
  process:{...EN.process,eyebrow:"Parcours d'Exécution",title:"Flux d'Exécution Documentaire Internationale",summary:"De l'intake structuré à la libération structurée. Chaque étape est vérifiée avant la suivante."},
  founder:{...EN.founder,eyebrow:"Ancrage de Confiance du Fondateur",title:"Exécution Dirigée par le Fondateur",founderProfile:"Profil du Fondateur",about:"À propos de The Milano Seal",tagline:"Sceller la Confiance au-delà des Frontières"},
  footer:{...EN.footer,globalExecution:"Exécution Globale de Documents",positioning:"Exécution Documentaire Internationale et Coordination d’Apostille",brandPromise:"Sceller la Confiance à Chaque Signature",location:"Floride, États-Unis",availableUponIntake:"Disponible après l'intake",services:"Services",documents:"Documents",apostilleServices:"Services d'Apostille",allRights:"Tous droits réservés.",privacy:"Politique de Confidentialité",terms:"Conditions de Service",disclaimer:"Nicholas Milano est Notary Public commissionné en Floride. Les services de Remote Online Notarization sont coordonnés conformément au droit applicable de Floride et aux exigences propres à chaque Matter. La coordination de l'apostille est facilitée auprès de l'autorité compétente appropriée. The Milano Seal n'est pas un cabinet d'avocats et ne fournit ni conseil ni représentation juridique."},
  finalCta:{title:"Prêt à préparer un document pour une utilisation à l'étranger ?",body:"Soumettez d'abord la demande. Nous examinerons le Matter avant toute planification ou libération.",intake:"Commencer l'Intake Sécurisé",portal:"Ouvrir le Portail Sécurisé du Matter"},
  loading:{title:"Préparation de la prochaine vue",body:"Votre contexte actuel est conservé pendant la préparation de la surface de destination.",aria:"Préparation de la prochaine vue"},
  ticker:EN.ticker,
};

export const PUBLIC_TRANSLATIONS: Record<SupportedLocale, PublicTranslation> = {
  en: EN,
  it: IT,
  es: ES,
  de: DE,
  fr: FR,
  "pt-BR": PT,
};

export function publicTranslation(locale: SupportedLocale): PublicTranslation {
  return PUBLIC_TRANSLATIONS[locale] ?? EN;
}
