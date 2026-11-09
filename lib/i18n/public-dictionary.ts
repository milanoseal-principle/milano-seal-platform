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
    subtitle: "Document execution, notarization & international authentication",
    description: "From a straightforward online notarization to complex international document execution, The Milano Seal coordinates the appropriate execution path from start to finish.",
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
  hero:{...EN.hero,init:["Inizializzazione dell'ambiente di esecuzione internazionale...","Verifica dei requisiti di instradamento transfrontaliero...","Preparazione del coordinamento protetto della pratica..."],line1:"Sigillare la Fiducia",line2a:"Oltre i",line2b:"Confini",subtitle:"Esecuzione documentale, notarizzazione e autenticazione internazionale",description:"Notarizzazione online da remoto, coordinamento apostille e supporto all'esecuzione internazionale dei documenti con revisione strutturata del percorso, esecuzione subordinata al pagamento e rilascio sicuro.",compliance:"L'uso internazionale è soggetto ai requisiti del Paese di destinazione e dell'autorità ricevente.",intake:"Avvia Intake Sicuro",intelligence:"Esplora la Global Document Intelligence",whatYouGet:"Cosa Ottieni",benefits:["Intake Sicuro e\nVerificato","Notarizzazione\nOnline da Remoto","Percorso Apostille\nGestito","Regole di Destinazione\nVerificate","Risorse Riservate\nalla Pratica","Tracciamento Completo\ndall'Intake al Rilascio"],ronCompliance:"La disponibilità RON dipende dal tipo di documento, dalla posizione del firmatario, dalla giurisdizione e dai requisiti dell'autorità ricevente.",founderLed:"Esecuzione Guidata dal Fondatore",founderSummary:"Notaio pubblico della Florida e Remote Online Notary. Coordinamento apostille, esecuzione internazionale e rilascio sicuro.",meetFounder:"Conosci il Fondatore →",beginIntake:"Avvia Intake →"},
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
  hero:{...EN.hero,init:["Inicializando o ambiente de execução internacional...","Revisando requisitos de roteamento internacional...","Preparando a coordenação protegida da matéria..."],line1:"Selando Confiança",line2a:"Além das",line2b:"Fronteiras",subtitle:"Execução documental, reconhecimento notarial e autenticação internacional",description:"Notarização remota online, coordenação de apostila e suporte à execução internacional de documentos com revisão estruturada de rota, execução condicionada ao pagamento e coordenação segura de liberação.",compliance:"O uso internacional está sujeito aos requisitos do destino e da autoridade receptora.",intake:"Iniciar Intake Seguro",intelligence:"Explorar Inteligência Global de Documentos",whatYouGet:"O Que Você Recebe",benefits:["Intake Seguro e\nVerificado","Notarização\nRemota Online","Rota de Apostila\nCoordenada","Regras do Destino\nRevisadas","Recursos Reservados\npara sua Matéria","Acompanhe Cada Etapa\ndo Intake à Liberação"],ronCompliance:"A disponibilidade de RON depende do tipo de documento, localização do signatário, jurisdição e requisitos da autoridade receptora.",founderLed:"Execução Liderada pelo Fundador",founderSummary:"Notário Público da Flórida e Remote Online Notary. Coordenação de apostila, execução internacional e liberação segura.",meetFounder:"Conheça o Fundador →",beginIntake:"Iniciar Intake →"},
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
  header:{nav:["Servicios","Precios","Proceso","Inteligencia Global","Profesionales","Portal Seguro"],professionalNav:["Área Profesional","Ruta por País","Alcance de Ejecución","Límite de Asesoría","Portal Seguro"],login:"Iniciar sesión",professionalLogin:"Acceso Profesional",intake:"Iniciar Intake Seguro",submitClientMatter:"Enviar Asunto del Cliente",globalExecution:"Ejecución Global de Documentos",professionalAccess:"Acceso Profesional de Ejecución",openMenu:"Abrir menú",closeMenu:"Cerrar menú"},
  hero:{...EN.hero,init:["Inicializando el entorno de ejecución internacional...","Revisando los requisitos de ruteo transfronterizo...","Preparando la coordinación protegida del asunto..."],line1:"Sellando Confianza",line2a:"Más Allá de las",line2b:"Fronteras",subtitle:"Ejecución documental, notarización y autenticación internacional",description:"Notarización remota en línea, coordinación de apostilla y soporte de ejecución internacional con revisión estructurada de ruta, ejecución condicionada al pago y coordinación segura de liberación.",compliance:"El uso internacional está sujeto a los requisitos del destino y de la autoridad receptora.",intake:"Iniciar Intake Seguro",intelligence:"Explorar Inteligencia Global de Documentos",whatYouGet:"Lo Que Obtienes",benefits:["Intake Seguro y\nVerificado","Notarización\nRemota en Línea","Ruta de Apostilla\nCoordinada","Reglas del Destino\nRevisadas","Recursos Reservados\npara tu Asunto","Seguimiento Completo\ndel Intake a la Liberación"],ronCompliance:"La disponibilidad de RON depende del tipo de documento, la ubicación del firmante, la jurisdicción y los requisitos de la autoridad receptora.",founderLed:"Ejecución Dirigida por el Fundador",founderSummary:"Notario Público de Florida y Remote Online Notary. Coordinación de apostilla, ejecución internacional y liberación segura.",meetFounder:"Conoce al Fundador →",beginIntake:"Iniciar Intake →"},
  services:{eyebrow:"Nuestros Servicios",title:"Ejecución Documental Integral",summary:"Gestión de alta confianza para documentos de uso internacional. Ruteo gobernado, custodia y control de liberación en cada etapa.",cards:[
    {title:"Coordinación de Notarización Remota en Línea",description:"Soporte RON de Florida para documentos elegibles, incluida la coordinación de verificación de identidad, revisión de preparación del firmante, preparación de la sesión y QA posterior a la ejecución antes de la apostilla o liberación.",features:["Flujo de verificación de identidad","Revisión de preparación del firmante","Preparación de la sesión","QA posterior a la ejecución"],tooltips:["La verificación multifactor de identidad se realiza mediante procedimientos aprobados de la plataforma RON.","","",""]},
    {title:"Coordinación de Apostilla Hague",description:"Soporte de ruteo para países de la Convención de La Haya, incluida revisión notarial, revisión de la vía de apostilla estatal o federal, requisitos del destino, custodia de mensajería y controles de la autoridad receptora.",features:["Revisión de la vía de apostilla","Requisitos del destino","Custodia de mensajería","Controles de la autoridad receptora"],tooltips:["La autoridad competente estatal o federal se revisa según el origen del documento y los hechos actuales del asunto antes de la presentación.","El ruteo de destino se revisa contra el estado gobernado del tratado y los requisitos de la autoridad receptora.","",""]},
    {title:"Revisión de Autenticación y Legalización No-Hague",description:"Revisión estructurada para documentos destinados a jurisdicciones no-Hague que pueden requerir autenticación estatal, revisión federal, legalización consular o de embajada, revisión de traducción u otro manejo especializado de liberación.",features:["Revisión de autenticación estatal","Vía de revisión federal","Legalización de embajada/consulado","Soporte de revisión de traducción"],tooltips:["","","",""]},
    {title:"Logística Documental Ejecutiva",description:"Soporte de alto control para documentos privados, corporativos, patrimoniales, marítimos, ecuestres, de activos de lujo y transacciones internacionales que requieren intake cuidadoso, revisión del paquete, visibilidad de custodia y coordinación de liberación.",features:["Intake de alto control","Revisión del paquete documental","Visibilidad de cadena de custodia","Coordinación de liberación"],tooltips:["","","",""]},
  ]},
  process:{eyebrow:"Ruta de Ejecución",title:"Flujo de Ejecución Documental Internacional",summary:"Del intake estructurado a la liberación estructurada. Cada etapa se revisa antes de la siguiente.",steps:[
    {title:"Intake Seguro",description:"Cliente, documento, firmante, destino, autoridad receptora, urgencia y método de ejecución se capturan mediante un flujo estructurado."},
    {title:"Revisión Operativa",description:"El asunto se revisa según tipo y origen del documento, ubicación del firmante, país de destino, vía de apostilla/autenticación e información faltante."},
    {title:"Gate de Pago",description:"La programación y ejecución permanecen bloqueadas hasta confirmar el alcance del asunto y el estado del pago."},
    {title:"Ejecución del Documento",description:"Los documentos elegibles pasan por notarización presencial, coordinación RON o preparación del paquete conforme a la ruta aprobada."},
    {title:"Cadena de Custodia",description:"Los documentos ejecutados se revisan, empaquetan, rastrean y monitorean mediante custodia de mensajería o ruteo de apostilla/autenticación."},
    {title:"Mesa de Liberación",description:"Los documentos se liberan solo cuando se cumplen las condiciones requeridas de ejecución, pago, custodia y revisión."},
  ]},
  founder:{eyebrow:"Ancla de Confianza del Fundador",title:"Ejecución Dirigida por el Fundador",role:"Fundador · Chief Trust Officer",credentials:["Notario Público de Florida","Remote Online Notary de Florida","Enlace de Ejecución Documental Internacional","Comisión Notarial de Florida #668288"],overseen:"Ejecución Dirigida por el Fundador // Supervisión Personal",bio:"Nicholas Milano trabaja en la intersección de la ejecución documental internacional, el cumplimiento procedimental y la coordinación transfronteriza. Su metodología combina los estándares notariales de Florida con la precisión operativa requerida por las transacciones globales.",founderProfile:"Ver Perfil del Fundador",about:"Sobre The Milano Seal",linkedin:"Ver LinkedIn",instagram:"Seguir en Instagram",reviews:"Leer Reseñas de Google",facebook:"Facebook",tagline:"Sellando Confianza Más Allá de las Fronteras"},
  footer:{globalExecution:"Ejecución Global de Documentos",positioning:"Ejecución Documental Internacional y Coordinación de Apostilla",brandPromise:"Sellando Confianza en Cada Firma",location:"Florida, Estados Unidos",availableUponIntake:"Disponible después del intake",services:"Servicios",documents:"Documentos",apostilleServices:"Servicios de Apostilla",allRights:"Todos los derechos reservados.",privacy:"Política de Privacidad",terms:"Términos de Servicio",disclaimer:"Nicholas Milano es Notario Público comisionado en Florida. Los servicios de Remote Online Notarization se coordinan conforme a la ley aplicable de Florida y a los requisitos específicos del asunto. La coordinación de apostilla se facilita mediante la autoridad competente correspondiente. The Milano Seal no es un bufete de abogados y no presta asesoría ni representación legal.",network:["Red de Socios Alliance","Alianza de Notarios RON","Red de Soporte de Ejecución"],serviceLinks:["Notarización Remota en Línea","Coordinación de Apostilla","Ejecución Internacional","Notario Móvil","Servicios Gubernamentales"],documentLinks:["Poder Notarial","Declaraciones Juradas","Certificados de Nacimiento","Certificados de Matrimonio","Documentos Corporativos"],countryLinks:["Apostilla para Italia","Apostilla para España","Apostilla para Alemania","Apostilla para Francia","Apostilla para Brasil"]},
  finalCta:{title:"¿Listo para preparar un documento para uso en el extranjero?",body:"Envía primero la solicitud. Revisaremos el asunto antes de programar o liberar.",intake:"Iniciar Intake Seguro",portal:"Abrir Portal Seguro del Asunto"},
  loading:{title:"Preparando la siguiente vista",body:"Conservando tu contexto actual mientras se prepara la superficie de destino.",aria:"Preparando la siguiente vista"},
  ticker:{railA:["INTELIGENCIA GLOBAL DE DOCUMENTOS","REVISIÓN DE RUTA HAGUE","EJECUCIÓN CONDICIONADA AL PAGO","VISIBILIDAD DE CADENA DE CUSTODIA","REFERENCIA DE PAGO WISE","RASTREO DE LIBERACIÓN DE MENSAJERÍA","REVISIÓN PRE-FLIGHT","BÓVEDA DE DOCUMENTOS","PAGADO Y LIBERADO","COORDINACIÓN DE APOSTILLA","COORDINACIÓN INTERNACIONAL","VISIBILIDAD DEL COORDINADOR"],workflows:["Ruta de validación de la Convención de La Haya","Vía de revisión de apostilla","Flujo de autenticación consular","Corredor de liberación internacional","Ruta de revisión de apostilla Hague","Ruta de revisión de apostilla Hague","Ruta documental de la Convención de La Haya"]},
};

const DE: PublicTranslation = {
  ...EN,
  header:{nav:["Leistungen","Preise","Ablauf","Globale Intelligence","Professionals","Sicheres Portal"],professionalNav:["Professional Home","Länderroute","Ausführungsumfang","Beratungsgrenze","Sicheres Portal"],login:"Anmelden",professionalLogin:"Professional Login",intake:"Sicheren Intake starten",submitClientMatter:"Mandanten-Vorgang einreichen",globalExecution:"Globale Dokumentenausführung",professionalAccess:"Professioneller Ausführungszugang",openMenu:"Menü öffnen",closeMenu:"Menü schließen"},
  hero:{...EN.hero,init:["Internationale Ausführungsumgebung wird initialisiert...","Grenzüberschreitende Routing-Anforderungen werden geprüft...","Geschützte Vorgangskoordination wird vorbereitet..."],line1:"Vertrauen Besiegeln",line2a:"Über",line2b:"Grenzen",subtitle:"Dokumentenausführung, notarielle Beglaubigung und internationale Authentifizierung",description:"Remote Online Notarization, Apostille-Koordination und internationale Dokumentenausführung mit strukturierter Routenprüfung, zahlungsgesteuerter Ausführung und sicherer Freigabekoordination.",compliance:"Die internationale Verwendung unterliegt den Anforderungen des Bestimmungslands und der empfangenden Behörde.",intake:"Sicheren Intake starten",intelligence:"Globale Dokumenten-Intelligence erkunden",whatYouGet:"Ihre Vorteile",benefits:["Sicherer, geprüfter\nIntake","Remote Online\nNotarization","Apostille-Route\nkoordiniert","Zielanforderungen\ngeprüft","Ressourcen für Ihren\nVorgang reserviert","Jeden Schritt verfolgen\nIntake bis Freigabe"],ronCompliance:"Die RON-Verfügbarkeit hängt von Dokumenttyp, Standort des Unterzeichners, Jurisdiktion und Anforderungen der empfangenden Behörde ab.",founderLed:"Vom Gründer geleitete Dokumentenausführung",founderSummary:"Florida Notary Public & Remote Online Notary. Apostille-Koordination, internationale Ausführung und sichere Freigabe.",meetFounder:"Gründer kennenlernen →",beginIntake:"Intake starten →"},
  services:{eyebrow:"Unsere Leistungen",title:"Umfassende Dokumentenausführung",summary:"Vertrauenswürdige Dokumentenabwicklung für internationale Verwendung. Gesteuertes Routing, Verwahrung und Freigabekontrolle in jeder Phase.",cards:[
    {title:"Koordination der Remote Online Notarization",description:"Florida-RON-Unterstützung für geeignete Dokumente, einschließlich Koordination der Identitätsprüfung, Prüfung der Unterzeichnerbereitschaft, Sitzungs­vorbereitung und QA nach der Ausführung vor Apostille oder Freigabe.",features:["Identitätsprüfungsablauf","Prüfung der Unterzeichnerbereitschaft","Sitzungsvorbereitung","QA nach Ausführung"],tooltips:["Mehrstufige Identitätsprüfung über genehmigte RON-Plattformverfahren.","","",""]},
    {title:"Hague-Apostille-Koordination",description:"Routing-Unterstützung für Staaten des Haager Übereinkommens, einschließlich notarieller Prüfung, staatlicher oder föderaler Apostille-Route, Zielanforderungen, Kurierverwahrung und Prüfungen der empfangenden Behörde.",features:["Prüfung der Apostille-Route","Zielanforderungen","Kurierverwahrung","Prüfungen der empfangenden Behörde"],tooltips:["Die zuständige staatliche oder föderale Behörde wird anhand der Dokumentenherkunft und der aktuellen Vorgangsdaten vor Einreichung geprüft.","Das Zielrouting wird anhand des gesteuerten Vertragsstatus und der Anforderungen der empfangenden Behörde geprüft.","",""]},
    {title:"Prüfung von Authentifizierung & Legalisierung außerhalb Hague",description:"Strukturierte Routenprüfung für Dokumente in Nicht-Hague-Jurisdiktionen, die staatliche Authentifizierung, föderale Prüfung, Botschafts- oder Konsularlegalisierung, Übersetzungsprüfung oder besondere Freigabe erfordern können.",features:["Prüfung staatlicher Authentifizierung","Föderaler Prüfpfad","Botschafts-/Konsularlegalisierung","Unterstützung bei Übersetzungsprüfung"],tooltips:["","","",""]},
    {title:"Executive-Dokumentenlogistik",description:"Kontrollierte Unterstützung für private, unternehmerische, nachlassbezogene, maritime, reiterliche, Luxusgüter- und internationale Transaktionsdokumente mit sorgfältigem Intake, Paketprüfung, Verwahrung und Freigabekoordination.",features:["Kontrollierter Intake","Dokumentenpaket-Prüfung","Chain-of-Custody-Sichtbarkeit","Freigabekoordination"],tooltips:["","","",""]},
  ]},
  process:{eyebrow:"Ausführungspfad",title:"Internationaler Dokumentenausführungs-Workflow",summary:"Vom strukturierten Intake bis zur strukturierten Freigabe. Jeder Schritt wird vor dem nächsten geprüft.",steps:[
    {title:"Sicherer Intake",description:"Mandant, Dokument, Unterzeichner, Ziel, empfangende Behörde, Dringlichkeit und Ausführungsmethode werden strukturiert erfasst."},
    {title:"Operative Prüfung",description:"Der Vorgang wird nach Dokumenttyp, Herkunft, Standort des Unterzeichners, Zielland, Apostille-/Authentifizierungsroute und fehlenden Angaben geprüft."},
    {title:"Zahlungsgate",description:"Terminierung und Ausführung bleiben gesperrt, bis Vorgangsumfang und Zahlungsstatus bestätigt sind."},
    {title:"Dokumentenausführung",description:"Geeignete Dokumente durchlaufen Präsenznotarisierung, RON-Koordination oder Dokumentenpaket-Vorbereitung gemäß genehmigter Route."},
    {title:"Verwahrungsweg",description:"Ausgeführte Dokumente werden geprüft, verpackt, verfolgt und über Kurierverwahrung oder Apostille-/Authentifizierungsrouting überwacht."},
    {title:"Freigabestelle",description:"Dokumente werden erst freigegeben, wenn die erforderlichen Ausführungs-, Zahlungs-, Verwahrungs- und Prüfbedingungen erfüllt sind."},
  ]},
  founder:{eyebrow:"Vertrauensanker des Gründers",title:"Ausführung unter Leitung des Gründers",role:"Gründer · Chief Trust Officer",credentials:["Florida Notary Public","Florida Remote Online Notary","Liaison für internationale Dokumentenausführung","Florida Notary Commission #668288"],overseen:"Gründergeführte Ausführung // Persönlich überwacht",bio:"Nicholas Milano arbeitet an der Schnittstelle von internationaler Dokumentenausführung, Verfahrens-Compliance und grenzüberschreitender Koordination. Seine Methodik verbindet die notariellen Standards Floridas mit der operativen Präzision globaler Transaktionen.",founderProfile:"Gründerprofil ansehen",about:"Über The Milano Seal",linkedin:"LinkedIn ansehen",instagram:"Auf Instagram folgen",reviews:"Google-Bewertungen lesen",facebook:"Facebook",tagline:"Vertrauen über Grenzen hinweg"},
  footer:{globalExecution:"Globale Dokumentenausführung",positioning:"Internationale Dokumentenausführung und Apostille-Koordination",brandPromise:"Vertrauen mit jeder Unterschrift besiegeln",location:"Florida, Vereinigte Staaten",availableUponIntake:"Nach Intake verfügbar",services:"Leistungen",documents:"Dokumente",apostilleServices:"Apostille-Leistungen",allRights:"Alle Rechte vorbehalten.",privacy:"Datenschutz",terms:"Nutzungsbedingungen",disclaimer:"Nicholas Milano ist ein in Florida bestellter Notary Public. Remote-Online-Notarisierungsdienste werden gemäß anwendbarem Recht Floridas und den vorgangsspezifischen Ausführungsanforderungen koordiniert. Die Apostille-Koordination erfolgt über die jeweils zuständige Behörde. The Milano Seal ist keine Anwaltskanzlei und erbringt keine Rechtsberatung oder Rechtsvertretung.",network:["Alliance-Partnernetzwerk","RON-Notary-Allianz","Ausführungs-Supportnetzwerk"],serviceLinks:["Remote Online Notarization","Apostille-Koordination","Internationale Ausführung","Mobiler Notary","Behördendienste"],documentLinks:["Vollmacht","Eidesstattliche Erklärungen","Geburtsurkunden","Heiratsurkunden","Unternehmensdokumente"],countryLinks:["Apostille für Italien","Apostille für Spanien","Apostille für Deutschland","Apostille für Frankreich","Apostille für Brasilien"]},
  finalCta:{title:"Bereit, ein Dokument für die Verwendung im Ausland vorzubereiten?",body:"Reichen Sie zuerst die Anfrage ein. Wir prüfen den Vorgang vor Terminierung oder Freigabe.",intake:"Sicheren Intake starten",portal:"Sicheres Vorgangsportal öffnen"},
  loading:{title:"Nächste Ansicht wird vorbereitet",body:"Ihr aktueller Kontext bleibt erhalten, während die Zielansicht vorbereitet wird.",aria:"Nächste Ansicht wird vorbereitet"},
  ticker:{railA:["GLOBALE DOKUMENTEN-INTELLIGENCE","HAGUE-ROUTENPRÜFUNG","ZAHLUNGSGESTEUERTE AUSFÜHRUNG","CHAIN-OF-CUSTODY-SICHTBARKEIT","WISE-ZAHLUNGSREFERENZ","KURIER-FREIGABEVERFOLGUNG","PRE-FLIGHT-PRÜFUNG","DOKUMENTEN-TRESOR","BEZAHLT & FREIGEGEBEN","APOSTILLE-KOORDINATION","INTERNATIONALE KOORDINATION","KOORDINATOREN-SICHTBARKEIT"],workflows:["Validierungsroute des Haager Übereinkommens","Apostille-Prüfpfad","Konsularischer Authentifizierungsablauf","Internationaler Freigabekorridor","Hague-Apostille-Prüfpfad","Hague-Apostille-Prüfpfad","Dokumentenroute des Haager Übereinkommens"]},
};

const FR: PublicTranslation = {
  ...EN,
  header:{nav:["Services","Tarifs","Processus","Intelligence Globale","Professionnels","Portail Sécurisé"],professionalNav:["Espace Professionnel","Parcours Pays","Périmètre d'Exécution","Limite de Conseil","Portail Sécurisé"],login:"Connexion",professionalLogin:"Connexion Professionnelle",intake:"Commencer l'Intake Sécurisé",submitClientMatter:"Soumettre le Dossier Client",globalExecution:"Exécution Globale de Documents",professionalAccess:"Accès Professionnel à l'Exécution",openMenu:"Ouvrir le menu",closeMenu:"Fermer le menu"},
  hero:{...EN.hero,init:["Initialisation de l'environnement d'exécution internationale...","Vérification des exigences de routage transfrontalier...","Préparation de la coordination protégée du dossier..."],line1:"Sceller la Confiance",line2a:"Au-delà des",line2b:"Frontières",subtitle:"Exécution de Documents Américains pour Usage International",description:"Notarisation en ligne à distance, coordination d'apostille et support d'exécution internationale avec revue structurée du routage, exécution conditionnée au paiement et coordination sécurisée de la libération.",compliance:"L'utilisation internationale reste soumise aux exigences du pays de destination et de l'autorité destinataire.",intake:"Commencer l'Intake Sécurisé",intelligence:"Explorer l'Intelligence Globale des Documents",whatYouGet:"Ce Que Vous Obtenez",benefits:["Intake Sécurisé et\nVérifié","Notarisation\nEn Ligne à Distance","Routage Apostille\nCoordonné","Exigences de Destination\nVérifiées","Ressources Réservées\npour Votre Dossier","Suivi de Chaque Étape\nde l'Intake à la Libération"],ronCompliance:"La disponibilité RON dépend du type de document, du lieu du signataire, de la juridiction et des exigences de l'autorité destinataire.",founderLed:"Exécution Dirigée par le Fondateur",founderSummary:"Notary Public de Floride et Remote Online Notary. Coordination d'apostille, exécution internationale et libération sécurisée.",meetFounder:"Découvrir le Fondateur →",beginIntake:"Commencer l'Intake →"},
  services:{eyebrow:"Nos Services",title:"Exécution Documentaire Complète",summary:"Traitement de haute confiance pour l'usage international. Routage gouverné, garde et contrôle de libération à chaque étape.",cards:[
    {title:"Coordination de la Notarisation en Ligne à Distance",description:"Support RON de Floride pour les documents éligibles, avec coordination de la vérification d'identité, vérification de la préparation du signataire, préparation de session et QA post-exécution avant apostille ou libération.",features:["Flux de vérification d'identité","Vérification de préparation du signataire","Préparation de session","QA post-exécution"],tooltips:["Vérification d'identité multifacteur effectuée selon les procédures approuvées de la plateforme RON.","","",""]},
    {title:"Coordination Apostille Hague",description:"Support de routage pour les pays de la Convention de La Haye, avec revue notariale, examen de la voie d'apostille étatique ou fédérale, exigences de destination, garde du transporteur et contrôles de l'autorité destinataire.",features:["Revue de la voie d'apostille","Exigences de destination","Garde du transporteur","Contrôles de l'autorité destinataire"],tooltips:["L'autorité compétente étatique ou fédérale est vérifiée selon l'origine du document et les faits actuels du dossier avant soumission.","Le routage de destination est vérifié selon le statut conventionnel gouverné et les exigences de l'autorité destinataire.","",""]},
    {title:"Revue d'Authentification et de Légalisation Hors Hague",description:"Revue structurée pour les documents destinés aux juridictions hors Hague pouvant exiger une authentification étatique, une revue fédérale, une légalisation consulaire ou d'ambassade, une revue de traduction ou une libération spécialisée.",features:["Revue d'authentification étatique","Voie de revue fédérale","Légalisation ambassade/consulat","Support de revue de traduction"],tooltips:["","","",""]},
    {title:"Logistique Documentaire Executive",description:"Support à haut contrôle pour documents privés, d'entreprise, successoraux, maritimes, équestres, d'actifs de luxe et de transactions internationales nécessitant intake rigoureux, revue du dossier, visibilité de garde et coordination de libération.",features:["Intake à haut contrôle","Revue du dossier documentaire","Visibilité de la chaîne de garde","Coordination de libération"],tooltips:["","","",""]},
  ]},
  process:{eyebrow:"Parcours d'Exécution",title:"Flux d'Exécution Documentaire Internationale",summary:"De l'intake structuré à la libération structurée. Chaque étape est vérifiée avant la suivante.",steps:[
    {title:"Intake Sécurisé",description:"Client, document, signataire, destination, autorité destinataire, urgence et méthode d'exécution sont saisis dans un flux structuré."},
    {title:"Revue Opérationnelle",description:"Le dossier est vérifié selon le type et l'origine du document, le lieu du signataire, le pays de destination, la voie apostille/authentification et les informations manquantes."},
    {title:"Gate de Paiement",description:"La planification et l'exécution restent bloquées jusqu'à confirmation du périmètre du dossier et du statut du paiement."},
    {title:"Exécution du Document",description:"Les documents éligibles passent par notarisation en personne, coordination RON ou préparation du dossier selon la voie approuvée."},
    {title:"Chaîne de Garde",description:"Les documents exécutés sont vérifiés, emballés, suivis et surveillés via la garde du transporteur ou le routage apostille/authentification."},
    {title:"Bureau de Libération",description:"Les documents ne sont libérés qu'après satisfaction des conditions requises d'exécution, paiement, garde et revue."},
  ]},
  founder:{eyebrow:"Ancrage de Confiance du Fondateur",title:"Exécution Dirigée par le Fondateur",role:"Fondateur · Chief Trust Officer",credentials:["Notary Public de Floride","Remote Online Notary de Floride","Liaison d'Exécution Documentaire Internationale","Commission Notariale de Floride #668288"],overseen:"Exécution Dirigée par le Fondateur // Supervision Personnelle",bio:"Nicholas Milano intervient à l'intersection de l'exécution documentaire internationale, de la conformité procédurale et de la coordination transfrontalière. Sa méthodologie associe les standards notariaux de Floride à la précision opérationnelle requise par les transactions mondiales.",founderProfile:"Voir le Profil du Fondateur",about:"À propos de The Milano Seal",linkedin:"Voir LinkedIn",instagram:"Suivre sur Instagram",reviews:"Lire les Avis Google",facebook:"Facebook",tagline:"Sceller la Confiance au-delà des Frontières"},
  footer:{globalExecution:"Exécution Globale de Documents",positioning:"Exécution Documentaire Internationale et Coordination d’Apostille",brandPromise:"Sceller la Confiance à Chaque Signature",location:"Floride, États-Unis",availableUponIntake:"Disponible après l'intake",services:"Services",documents:"Documents",apostilleServices:"Services d'Apostille",allRights:"Tous droits réservés.",privacy:"Politique de Confidentialité",terms:"Conditions de Service",disclaimer:"Nicholas Milano est Notary Public commissionné en Floride. Les services de Remote Online Notarization sont coordonnés conformément au droit applicable de Floride et aux exigences propres à chaque dossier. La coordination de l'apostille est facilitée auprès de l'autorité compétente appropriée. The Milano Seal n'est pas un cabinet d'avocats et ne fournit ni conseil ni représentation juridique.",network:["Réseau de Partenaires Alliance","Alliance de Notaires RON","Réseau de Support d'Exécution"],serviceLinks:["Notarisation en Ligne à Distance","Coordination d'Apostille","Exécution Internationale","Notaire Mobile","Services Gouvernementaux"],documentLinks:["Procuration","Déclarations Sous Serment","Actes de Naissance","Actes de Mariage","Documents d'Entreprise"],countryLinks:["Apostille pour l'Italie","Apostille pour l'Espagne","Apostille pour l'Allemagne","Apostille pour la France","Apostille pour le Brésil"]},
  finalCta:{title:"Prêt à préparer un document pour une utilisation à l'étranger ?",body:"Soumettez d'abord la demande. Nous examinerons le dossier avant toute planification ou libération.",intake:"Commencer l'Intake Sécurisé",portal:"Ouvrir le Portail Sécurisé du Dossier"},
  loading:{title:"Préparation de la prochaine vue",body:"Votre contexte actuel est conservé pendant la préparation de la surface de destination.",aria:"Préparation de la prochaine vue"},
  ticker:{railA:["INTELLIGENCE GLOBALE DES DOCUMENTS","REVUE DE ROUTE HAGUE","EXÉCUTION CONDITIONNÉE AU PAIEMENT","VISIBILITÉ DE LA CHAÎNE DE GARDE","RÉFÉRENCE DE PAIEMENT WISE","SUIVI DE LIBÉRATION DU TRANSPORTEUR","REVUE PRE-FLIGHT","COFFRE DE DOCUMENTS","PAYÉ ET LIBÉRÉ","COORDINATION D'APOSTILLE","COORDINATION INTERNATIONALE","VISIBILITÉ DU COORDINATEUR"],workflows:["Route de validation de la Convention de La Haye","Voie de revue d'apostille","Flux d'authentification consulaire","Corridor de libération internationale","Route de revue d'apostille Hague","Route de revue d'apostille Hague","Route documentaire de la Convention de La Haye"]},
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
