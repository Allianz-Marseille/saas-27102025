// Arbre de décision pour l'outil "Assurance obligatoire - véhicules"

export interface TreeNode {
  id: string;
  question: string;
  description?: string;
  helpText?: string; // Micro-aide "Pourquoi cette question ?"
  options: TreeOption[];
}

export interface TreeOption {
  label: string;
  subLabel?: string;
  icon: string; // Nom de l'icône Lucide
  color?: "blue" | "green" | "cyan" | "amber" | "gray" | "red";
  nextId?: string; // ID du prochain node
  resultId?: string; // ID du résultat final
  keywords?: string[]; // Pour la recherche rapide
}

export interface InsuranceResult {
  id: string;
  title: string;
  verdict: "obligatoire" | "non_obligatoire";
  tag: string; // EDPM / VAE / Cyclomoteur / Auto...
  whatToDo: string[];
  why: string;
  proofInfo?: string; // Info sur la preuve d'assurance
  sources: Array<{
    label: string;
    url: string;
  }>;
  copyTemplates: {
    sms: string;
    mail: string;
    crm: string;
  };
  adviserMode?: {
    definitions?: string[];
    vigilancePoints?: string[];
    questionsToAsk?: string[];
    risks?: string[];
  };
}

export const vehicleInsuranceTree: {
  nodes: TreeNode[];
  results: InsuranceResult[];
} = {
  nodes: [
    {
      id: "START",
      question: "Quel véhicule souhaitez-vous vérifier ?",
      description: "Sélectionnez le type d'engin pour connaître les obligations d'assurance",
      options: [
        {
          label: "Voiture / Utilitaire",
          subLabel: "Camion, véhicule de société",
          icon: "Car",
          color: "blue",
          resultId: "CAR",
          keywords: ["voiture", "auto", "utilitaire", "camion", "véhicule"],
        },
        {
          label: "Moto / Scooter",
          subLabel: "2-roues motorisé",
          icon: "Bike",
          color: "blue",
          resultId: "MOTORCYCLE",
          keywords: ["moto", "scooter", "2 roues", "deux roues"],
        },
        {
          label: "Voiture sans permis",
          subLabel: "VSP, voiturette",
          icon: "Car",
          color: "blue",
          resultId: "VSP",
          keywords: ["vsp", "sans permis", "voiturette", "ligier", "aixam"],
        },
        {
          label: "Trottinette électrique",
          subLabel: "Monoroue, gyropode, EDPM",
          icon: "Footprints",
          color: "cyan",
          nextId: "EDPM_SPEED",
          keywords: ["trottinette", "edpm", "monoroue", "gyropode", "hoverboard"],
        },
        {
          label: "Vélo électrique",
          subLabel: "VAE, speedbike",
          icon: "Bike",
          color: "green",
          nextId: "VAE_PEDAL",
          keywords: ["vélo", "vae", "speedbike", "ebike", "électrique"],
        },
        {
          label: "Vélo classique",
          subLabel: "Trottinette manuelle, rollers",
          icon: "Bike",
          color: "gray",
          resultId: "NO_MOTOR",
          keywords: ["vélo", "classique", "trottinette", "manuelle", "rollers"],
        },
        {
          label: "Autre engin",
          subLabel: "Quad, engin agricole...",
          icon: "HelpCircle",
          color: "amber",
          nextId: "OTHER",
          keywords: ["quad", "agricole", "remorque", "autre"],
        },
      ],
    },
    // VAE - Question 1 : Assistance au pédalage ?
    {
      id: "VAE_PEDAL",
      question: "Assistance uniquement quand tu pédales ?",
      description: "Ou bien l'engin a un accélérateur (sans pédaler) ?",
      helpText: "Si l'engin a un accélérateur qui fonctionne sans pédaler, c'est un cyclomoteur",
      options: [
        {
          label: "Oui, uniquement au pédalage",
          icon: "Check",
          color: "green",
          nextId: "VAE_SPEED",
        },
        {
          label: "Non, accélérateur sans pédaler",
          icon: "AlertTriangle",
          color: "red",
          resultId: "SPEEDBIKE",
        },
        {
          label: "Je ne sais pas",
          icon: "HelpCircle",
          color: "gray",
          resultId: "UNKNOWN_VAE",
        },
      ],
    },
    // VAE - Question 2 : Vitesse max ?
    {
      id: "VAE_SPEED",
      question: "Assistance coupée à 25 km/h ?",
      description: "L'assistance s'arrête-t-elle automatiquement à 25 km/h ?",
      helpText: "Au-delà de 25 km/h d'assistance, l'engin est requalifié en cyclomoteur",
      options: [
        {
          label: "Oui, coupée à 25 km/h",
          icon: "Check",
          color: "green",
          nextId: "VAE_POWER",
        },
        {
          label: "Non, assistance > 25 km/h",
          icon: "AlertTriangle",
          color: "red",
          resultId: "SPEEDBIKE",
        },
        {
          label: "Je ne sais pas",
          icon: "HelpCircle",
          color: "gray",
          resultId: "UNKNOWN_VAE",
        },
      ],
    },
    // VAE - Question 3 : Puissance ?
    {
      id: "VAE_POWER",
      question: "Puissance ≤ 250W ?",
      description: "La puissance du moteur est-elle de 250W maximum ?",
      helpText: "Au-delà de 250W, l'engin est considéré comme un cyclomoteur",
      options: [
        {
          label: "Oui, ≤ 250W",
          icon: "Check",
          color: "green",
          resultId: "VAE_CONFORME",
        },
        {
          label: "Non, > 250W",
          icon: "AlertTriangle",
          color: "red",
          resultId: "SPEEDBIKE",
        },
        {
          label: "Je ne sais pas",
          icon: "HelpCircle",
          color: "gray",
          resultId: "UNKNOWN_VAE",
        },
      ],
    },
    // EDPM - Question 1 : Vitesse max ?
    {
      id: "EDPM_SPEED",
      question: "Vitesse max par construction ≤ 25 km/h ?",
      description: "L'engin a-t-il été modifié/débridé ?",
      helpText: "Un EDPM débridé (>25 km/h) est requalifié en cyclomoteur",
      options: [
        {
          label: "Oui, ≤ 25 km/h (conforme)",
          icon: "Check",
          color: "green",
          nextId: "EDPM_USAGE",
        },
        {
          label: "Non, modifié/débridé > 25 km/h",
          icon: "AlertTriangle",
          color: "red",
          resultId: "EDPM_MODIFIED",
        },
        {
          label: "Je ne sais pas",
          icon: "HelpCircle",
          color: "gray",
          resultId: "UNKNOWN_EDPM",
        },
      ],
    },
    // EDPM - Question 2 : Usage ?
    {
      id: "EDPM_USAGE",
      question: "Usage sur voie publique ?",
      description: "Ou uniquement sur terrain privé ?",
      helpText: "Si usage strictement terrain privé, pas d'obligation d'assurance RC",
      options: [
        {
          label: "Oui, voie publique",
          icon: "Check",
          color: "green",
          resultId: "EDPM_CONFORME",
        },
        {
          label: "Non, uniquement terrain privé",
          icon: "Home",
          color: "gray",
          resultId: "PRIVATE_ONLY",
        },
      ],
    },
    // Autres engins
    {
      id: "OTHER",
      question: "Quel type d'engin ?",
      description: "Sélectionnez la catégorie correspondante",
      options: [
        {
          label: "Quad / Buggy",
          icon: "Truck",
          color: "blue",
          resultId: "QUAD",
        },
        {
          label: "Engin agricole",
          subLabel: "Tracteur, moissonneuse",
          icon: "Tractor",
          color: "amber",
          resultId: "AGRICULTURAL",
        },
        {
          label: "Remorque",
          icon: "Truck",
          color: "amber",
          resultId: "TRAILER",
        },
      ],
    },
  ],
  results: [
    // Pas de moteur
    {
      id: "NO_MOTOR",
      title: "Vélo classique / Trottinette manuelle",
      verdict: "non_obligatoire",
      tag: "Sans moteur",
      whatToDo: [
        "Pas d'assurance 'véhicule à moteur' obligatoire",
        "RC conseillée (souvent couverte par l'assurance habitation)",
      ],
      why: "Les véhicules sans moteur ne sont pas considérés comme des véhicules terrestres à moteur (VTAM) au sens du Code des assurances. L'assurance RC n'est donc pas obligatoire, mais fortement recommandée pour couvrir les dommages causés à des tiers.",
      proofInfo: "Aucune preuve d'assurance obligatoire pour les véhicules sans moteur.",
      sources: [
        {
          label: "Service Public - Assurance vélo",
          url: "https://www.service-public.fr/particuliers/vosdroits/F2697",
        },
      ],
      copyTemplates: {
        sms: "Votre engin sans moteur (vélo classique, trottinette manuelle...) n'est pas soumis à l'assurance obligatoire \"véhicule à moteur\". Une RC est toutefois conseillée (souvent couverte par l'assurance habitation). Source : Service-Public.",
        mail: "Bonjour,\n\nVotre engin sans moteur (vélo classique, trottinette manuelle...) n'est pas considéré comme un véhicule terrestre à moteur (VTAM) au sens du Code des assurances.\n\nVous n'êtes donc pas soumis à l'obligation d'assurance spécifique. Toutefois, une responsabilité civile est fortement conseillée pour couvrir les dommages que vous pourriez causer à des tiers. Cette RC est généralement incluse dans votre assurance habitation (MRH).\n\nSource : Service-Public (https://www.service-public.fr/particuliers/vosdroits/F2697)\n\nCordialement.",
        crm: "Client : vélo classique (sans moteur) | Verdict : Pas d'assurance obligatoire | Recommandation : RC via MRH | Vérifié le [DATE] | Source : Service-Public F2697",
      },
    },
    // VAE conforme
    {
      id: "VAE_CONFORME",
      title: "VAE conforme (≤250W, 25 km/h)",
      verdict: "non_obligatoire",
      tag: "VAE",
      whatToDo: [
        "Pas d'assurance obligatoire (considéré comme un cycle)",
        "RC fortement recommandée (souvent couverte par MRH)",
        "Vérifier que votre MRH couvre bien les vélos électriques",
      ],
      why: "Un VAE conforme (moteur ≤250W, assistance jusqu'à 25 km/h uniquement) est considéré comme un cycle et non comme un véhicule à moteur. L'assurance n'est donc pas obligatoire, mais une RC est vivement conseillée.",
      proofInfo: "Aucune preuve d'assurance obligatoire pour les VAE conformes.",
      sources: [
        {
          label: "Service Public - Assurance vélo",
          url: "https://www.service-public.fr/particuliers/vosdroits/F2697",
        },
      ],
      copyTemplates: {
        sms: "Votre vélo est un VAE conforme (≤250W, assistance coupée à 25 km/h). Il n'y a pas d'assurance \"véhicule à moteur\" obligatoire, mais une RC est fortement conseillée (souvent via l'assurance habitation). Source : Service-Public.",
        mail: "Bonjour,\n\nVotre vélo à assistance électrique (VAE) est conforme à la réglementation (moteur ≤250W, assistance coupée à 25 km/h).\n\nIl n'est pas considéré comme un véhicule à moteur et n'est donc pas soumis à l'obligation d'assurance RC spécifique.\n\nToutefois, une responsabilité civile est fortement conseillée. Vérifiez que votre assurance habitation (MRH) couvre bien l'usage du vélo électrique, car ce n'est pas toujours automatique.\n\nSource : Service-Public (https://www.service-public.fr/particuliers/vosdroits/F2697)\n\nCordialement.",
        crm: "Client : VAE conforme (≤250W, 25 km/h) | Verdict : Pas d'obligation | Recommandation : RC via MRH à vérifier | Vérifié le [DATE] | Source : Service-Public F2697",
      },
      adviserMode: {
        definitions: [
          "VAE conforme : Vélo à Assistance Électrique avec moteur ≤250W, assistance coupée à 25 km/h, assistance uniquement au pédalage (pas d'accélérateur)",
        ],
        questionsToAsk: [
          "Puissance du moteur (en watts) ?",
          "Vitesse maximale d'assistance ?",
          "Y a-t-il un accélérateur (sans pédaler) ?",
          "Homologation CE visible ?",
        ],
      },
    },
    // Speedbike / VAE non conforme
    {
      id: "SPEEDBIKE",
      title: "Speedbike / Vélo électrique non conforme",
      verdict: "obligatoire",
      tag: "Cyclomoteur",
      whatToDo: [
        "Immatriculation obligatoire",
        "Assurance RC obligatoire (type 2-roues/cyclomoteur)",
        "Port du casque obligatoire",
        "Autres obligations : carte grise, plaque d'immatriculation",
      ],
      why: "Un vélo électrique dont le moteur dépasse 250W ou dont l'assistance fonctionne au-delà de 25 km/h (speedbike) est requalifié en cyclomoteur. Il est donc soumis aux mêmes obligations qu'un scooter.",
      proofInfo: "Véhicule immatriculé : contrôle via FVA (Fichier des Véhicules Assurés). Plus de carte verte depuis avril 2024.",
      sources: [
        {
          label: "Service Public - Immatriculation vélo électrique",
          url: "https://www.service-public.fr/particuliers/vosdroits/F32294",
        },
        {
          label: "Code des assurances - L211-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048523650",
        },
        {
          label: "Service Public - Preuve d'assurance",
          url: "https://www.service-public.fr/particuliers/vosdroits/F1362",
        },
      ],
      copyTemplates: {
        sms: "Votre vélo électrique (>250W ou assistance >25 km/h) est assimilé à un cyclomoteur : immatriculation + assurance RC obligatoire (type 2-roues). Source : Service-Public.",
        mail: "Bonjour,\n\nSi votre vélo dépasse 250W ou si l'assistance fonctionne au-delà de 25 km/h (ex. speedbike 45), il est assimilé à un cyclomoteur :\n\n- Immatriculation obligatoire\n- Assurance responsabilité civile obligatoire (type 2-roues)\n- Autres obligations : port du casque, carte grise, plaque d'immatriculation, etc.\n\nAttention : Un vélo électrique \"débridé\" n'est pas autorisé sur la voie publique.\n\nSource : Service-Public (https://www.service-public.fr/particuliers/vosdroits/F32294)\n\nCordialement.",
        crm: "Client : Speedbike / VAE non conforme (>250W ou >25 km/h) | Verdict : OBLIGATOIRE (cyclomoteur) | Actions : Immatriculation + RC 2-roues | Vérifié le [DATE] | Source : Service-Public F32294",
      },
      adviserMode: {
        vigilancePoints: [
          "Vélo débridé non autorisé sur voie publique",
          "Vérifier homologation et conformité CE",
          "Usage professionnel = obligations supplémentaires",
        ],
        risks: [
          "Défaut d'assurance : 3750€ d'amende + suspension permis",
          "Sinistre sans assurance : pas de prise en charge",
        ],
      },
    },
    // EDPM conforme
    {
      id: "EDPM_CONFORME",
      title: "EDPM conforme (trottinette électrique, monoroue...)",
      verdict: "obligatoire",
      tag: "EDPM",
      whatToDo: [
        "Assurance RC obligatoire (assimilé VTAM)",
        "Vérifier que votre MRH couvre les EDPM (pas toujours automatique)",
        "Sinon : extension MRH ou contrat spécifique EDPM",
      ],
      why: "Les EDPM (Engins de Déplacement Personnel Motorisés) dont la vitesse est comprise entre 6 et 25 km/h sont assimilés à des véhicules terrestres à moteur (VTAM). L'assurance RC est donc obligatoire. Attention : l'assurance habitation ne couvre pas toujours automatiquement les EDPM.",
      proofInfo: "Véhicule non immatriculé : preuve papier de l'assurance reste requise (attestation à conserver).",
      sources: [
        {
          label: "Service Public - Circulation EDPM",
          url: "https://www.service-public.fr/particuliers/vosdroits/F308",
        },
        {
          label: "Légifrance - Définition EDPM (R311-1)",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051682572",
        },
        {
          label: "Code des assurances - L211-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048523650",
        },
      ],
      copyTemplates: {
        sms: "Votre engin est un EDPM (trottinette électrique / monoroue…). En France, une assurance responsabilité civile est obligatoire. Si votre assurance habitation ne le prévoit pas, il faut une extension ou un contrat spécifique EDPM. Sources : Service-Public.",
        mail: "Bonjour,\n\nVotre engin de déplacement personnel motorisé (EDPM) - trottinette électrique, monoroue, gyropode, hoverboard - est soumis à l'obligation d'assurance responsabilité civile.\n\nLes EDPM (vitesse >6 km/h et ≤25 km/h) sont assimilés à des véhicules terrestres à moteur (VTAM) selon le Code des assurances (article L211-1).\n\nÀ mettre en place :\n- Assurance RC obligatoire\n- Vérifier que votre assurance habitation (MRH) couvre les EDPM\n- Si non couvert : souscrire une extension MRH ou un contrat spécifique EDPM\n\nImportant : La MRH ne couvre pas automatiquement les EDPM. Il faut le vérifier explicitement auprès de votre assureur.\n\nSources :\n- Service-Public : https://www.service-public.fr/particuliers/vosdroits/F308\n- Légifrance (R311-1) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051682572\n\nCordialement.",
        crm: "Client : EDPM conforme (trottinette électrique ≤25 km/h) | Verdict : OBLIGATOIRE | Actions : RC obligatoire, vérifier si MRH couvre, sinon extension EDPM | Vérifié le [DATE] | Source : Service-Public F308, Légifrance R311-1",
      },
      adviserMode: {
        definitions: [
          "EDPM : Engin de Déplacement Personnel Motorisé. Vitesse par construction >6 km/h et ≤25 km/h, 1 personne, sans siège (sauf gyropode)",
        ],
        questionsToAsk: [
          "Vitesse maximale de l'engin ?",
          "A-t-il été modifié/débridé ?",
          "Usage sur voie publique ou terrain privé ?",
          "Acheté neuf ou d'occasion ?",
        ],
        vigilancePoints: [
          "MRH ne couvre pas automatiquement les EDPM",
          "Vérifier extension nécessaire",
          "EDPM débridé = cyclomoteur",
        ],
      },
    },
    // EDPM modifié
    {
      id: "EDPM_MODIFIED",
      title: "EDPM modifié/débridé (> 25 km/h)",
      verdict: "obligatoire",
      tag: "Cyclomoteur",
      whatToDo: [
        "Requalification en cyclomoteur",
        "Immatriculation obligatoire",
        "Assurance RC obligatoire (type 2-roues)",
        "Port du casque obligatoire",
      ],
      why: "Un EDPM dont la vitesse dépasse 25 km/h (modifié/débridé) est requalifié en cyclomoteur. Il est soumis aux mêmes obligations qu'un scooter : immatriculation, assurance, casque, etc.",
      proofInfo: "Véhicule immatriculé : contrôle via FVA. Plus de carte verte depuis avril 2024.",
      sources: [
        {
          label: "Service Public - Assurance véhicules",
          url: "https://www.service-public.fr/particuliers/vosdroits/F2697",
        },
        {
          label: "Code des assurances - L211-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048523650",
        },
      ],
      copyTemplates: {
        sms: "Votre EDPM modifié (>25 km/h) est requalifié en cyclomoteur : immatriculation + assurance RC obligatoire + casque. Non autorisé débridé sur voie publique. Source : Service-Public.",
        mail: "Bonjour,\n\nVotre EDPM modifié ou débridé (vitesse >25 km/h) est requalifié en cyclomoteur.\n\nObligations :\n- Immatriculation obligatoire\n- Assurance RC obligatoire (type 2-roues)\n- Port du casque obligatoire\n- Autres obligations : carte grise, plaque\n\nAttention : Un EDPM débridé n'est pas autorisé sur la voie publique.\n\nSource : Service-Public\n\nCordialement.",
        crm: "Client : EDPM modifié (>25 km/h) | Verdict : OBLIGATOIRE (cyclomoteur) | Actions : Immatriculation + RC 2-roues + casque | Vérifié le [DATE] | Source : Service-Public",
      },
    },
    // Voiture / Utilitaire
    {
      id: "CAR",
      title: "Voiture / Utilitaire / Camion",
      verdict: "obligatoire",
      tag: "Automobile",
      whatToDo: [
        "Assurance RC obligatoire (au tiers minimum)",
        "Contrôle via FVA (plus de carte verte depuis 04/2024)",
        "Recommandé : protection conducteur, dommages, vol, assistance",
      ],
      why: "Tout véhicule terrestre à moteur doit être assuré conformément à l'article L211-1 du Code des assurances. L'assurance au tiers (RC) est le minimum légal obligatoire.",
      proofInfo: "Carte verte supprimée depuis le 1er avril 2024. Contrôle via FVA (Fichier des Véhicules Assurés). Document remis à la souscription.",
      sources: [
        {
          label: "Code des assurances - L211-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048523650",
        },
        {
          label: "Service Public - Preuve d'assurance",
          url: "https://www.service-public.fr/particuliers/vosdroits/F1362",
        },
      ],
      copyTemplates: {
        sms: "Votre véhicule (voiture/utilitaire) est soumis à l'assurance RC obligatoire (au minimum \"au tiers\"). Le certificat est contrôlé via le FVA (plus de carte verte depuis avril 2024). Source : Code des assurances L211-1.",
        mail: "Bonjour,\n\nVotre véhicule (voiture/utilitaire/camion) est soumis à l'obligation d'assurance responsabilité civile (au minimum \"au tiers\") conformément au Code des assurances (article L211-1).\n\nÀ mettre en place :\n- Assurance RC obligatoire (au tiers minimum)\n- Le certificat d'assurance est désormais contrôlé via le FVA (plus de carte verte depuis avril 2024)\n\nGaranties recommandées (optionnelles) :\n- Protection du conducteur\n- Dommages tous accidents\n- Vol/incendie\n- Protection juridique\n- Garantie assistance\n\nSources : Service-Public, Légifrance (Code des assurances L211-1)\n\nCordialement.",
        crm: "Client : Voiture/Utilitaire/Camion | Verdict : OBLIGATOIRE | Actions : RC au tiers minimum, contrôle via FVA | Recommandations : protection conducteur, dommages, vol, assistance | Vérifié le [DATE] | Source : Code assurances L211-1",
      },
    },
    // Moto / Scooter
    {
      id: "MOTORCYCLE",
      title: "Moto / Scooter",
      verdict: "obligatoire",
      tag: "2-roues motorisé",
      whatToDo: [
        "Assurance RC obligatoire (au tiers minimum)",
        "Contrôle via FVA (plus de carte verte depuis 04/2024)",
        "Recommandé : protection conducteur, dommages, vol, assistance, équipement",
      ],
      why: "Tout véhicule terrestre à moteur doit être assuré conformément à l'article L211-1 du Code des assurances. L'assurance au tiers (RC) est le minimum légal obligatoire.",
      proofInfo: "Carte verte supprimée depuis le 1er avril 2024. Contrôle via FVA. Document remis à la souscription.",
      sources: [
        {
          label: "Code des assurances - L211-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048523650",
        },
        {
          label: "Service Public - Preuve d'assurance",
          url: "https://www.service-public.fr/particuliers/vosdroits/F1362",
        },
      ],
      copyTemplates: {
        sms: "Votre moto/scooter est soumis à l'assurance RC obligatoire (au minimum \"au tiers\"). Le certificat est contrôlé via le FVA (plus de carte verte depuis avril 2024). Source : Code des assurances L211-1.",
        mail: "Bonjour,\n\nVotre véhicule 2-roues (moto/scooter) est soumis à l'obligation d'assurance responsabilité civile (au minimum \"au tiers\") conformément au Code des assurances (article L211-1).\n\nÀ mettre en place :\n- Assurance RC obligatoire (au tiers minimum)\n- Le certificat d'assurance est désormais contrôlé via le FVA (plus de carte verte depuis avril 2024)\n\nGaranties recommandées (optionnelles) :\n- Protection du conducteur\n- Dommages tous accidents\n- Vol/incendie\n- Protection juridique\n- Garantie assistance\n- Équipement et accessoires\n\nSources : Service-Public, Légifrance (Code des assurances L211-1)\n\nCordialement.",
        crm: "Client : Moto/Scooter | Verdict : OBLIGATOIRE | Actions : RC au tiers minimum, contrôle via FVA | Recommandations : protection conducteur, dommages, vol, assistance, équipement | Vérifié le [DATE] | Source : Code assurances L211-1",
      },
    },
    // VSP
    {
      id: "VSP",
      title: "Voiture sans permis (VSP)",
      verdict: "obligatoire",
      tag: "VSP",
      whatToDo: [
        "Assurance RC obligatoire (au tiers minimum)",
        "Contrôle via FVA (plus de carte verte depuis 04/2024)",
        "Recommandé : protection conducteur, dommages, vol",
      ],
      why: "Une voiture sans permis (VSP) est un véhicule terrestre à moteur soumis à l'obligation d'assurance RC conformément au Code des assurances (article L211-1).",
      proofInfo: "Véhicule immatriculé : contrôle via FVA. Plus de carte verte depuis avril 2024.",
      sources: [
        {
          label: "Code des assurances - L211-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048523650",
        },
        {
          label: "Service Public - Preuve d'assurance",
          url: "https://www.service-public.fr/particuliers/vosdroits/F1362",
        },
      ],
      copyTemplates: {
        sms: "Votre voiture sans permis (VSP) est soumise à l'assurance RC obligatoire (au minimum \"au tiers\"). Contrôle via FVA. Source : Code des assurances L211-1.",
        mail: "Bonjour,\n\nVotre voiture sans permis (VSP) est soumise à l'obligation d'assurance responsabilité civile (au minimum \"au tiers\") conformément au Code des assurances (article L211-1).\n\nÀ mettre en place :\n- Assurance RC obligatoire\n- Contrôle via FVA (plus de carte verte depuis avril 2024)\n\nGaranties recommandées :\n- Protection du conducteur\n- Dommages\n- Vol/incendie\n\nCordialement.",
        crm: "Client : VSP (voiture sans permis) | Verdict : OBLIGATOIRE | Actions : RC au tiers minimum, contrôle via FVA | Vérifié le [DATE] | Source : Code assurances L211-1",
      },
    },
    // Usage privé uniquement
    {
      id: "PRIVATE_ONLY",
      title: "Usage terrain privé uniquement",
      verdict: "non_obligatoire",
      tag: "Terrain privé",
      whatToDo: [
        "Pas d'obligation d'assurance RC (usage terrain privé uniquement)",
        "RC recommandée en cas d'accident sur le terrain privé",
        "À vérifier : définition 'voie publique' (parking, chemin communal...)",
      ],
      why: "Si l'usage est strictement limité à un terrain privé (pas de voie publique), l'obligation d'assurance RC ne s'applique pas. Toutefois, une RC reste recommandée.",
      sources: [
        {
          label: "Service Public - Assurance véhicules",
          url: "https://www.service-public.fr/particuliers/vosdroits/F2697",
        },
      ],
      copyTemplates: {
        sms: "Usage terrain privé uniquement : pas d'obligation RC. RC recommandée en cas d'accident. Attention : vérifier définition 'voie publique' (parking, chemin communal...). Source : Service-Public.",
        mail: "Bonjour,\n\nSi l'usage de votre engin est strictement limité à un terrain privé (pas de circulation sur voie publique), l'obligation d'assurance RC ne s'applique pas.\n\nToutefois, une RC reste recommandée pour couvrir d'éventuels dommages sur le terrain privé.\n\nAttention : vérifier la définition de 'voie publique' avec votre assureur (parking, chemin communal, etc. peuvent être considérés comme voie publique).\n\nSource : Service-Public\n\nCordialement.",
        crm: "Client : Usage terrain privé uniquement | Verdict : Pas d'obligation | Recommandation : RC conseillée | Vérifié le [DATE] | Source : Service-Public",
      },
    },
    // Je ne sais pas - VAE
    {
      id: "UNKNOWN_VAE",
      title: "VAE - Vérification nécessaire",
      verdict: "obligatoire",
      tag: "À vérifier",
      whatToDo: [
        "Vérifier les caractéristiques du vélo avec le client",
        "Questions à poser (voir mode Conseiller)",
        "Revenir dans l'outil après vérification",
      ],
      why: "Impossible de déterminer l'obligation sans connaître les caractéristiques précises du vélo électrique (puissance, vitesse, type d'assistance). Par précaution, considérer l'obligation comme possible.",
      sources: [
        {
          label: "Service Public - Vélo électrique",
          url: "https://www.service-public.fr/particuliers/vosdroits/F2697",
        },
      ],
      copyTemplates: {
        sms: "Pour votre vélo électrique, nous devons vérifier les caractéristiques (puissance, vitesse, type assistance) pour déterminer les obligations. Je vous recontacte. Source : Service-Public.",
        mail: "Bonjour,\n\nPour déterminer précisément les obligations d'assurance de votre vélo électrique, nous avons besoin de vérifier :\n- Puissance du moteur (≤250W ou >250W ?)\n- Vitesse maximale d'assistance (≤25 km/h ou >25 km/h ?)\n- Type d'assistance (uniquement au pédalage ou accélérateur ?)\n\nSelon les réponses, votre vélo sera soit un VAE conforme (pas d'obligation), soit un cyclomoteur (assurance obligatoire).\n\nJe vous recontacte après vérification.\n\nCordialement.",
        crm: "Client : VAE - caractéristiques à vérifier | Verdict : EN ATTENTE | Actions : Vérifier puissance, vitesse, type assistance | À recontacter | Vérifié le [DATE]",
      },
      adviserMode: {
        questionsToAsk: [
          "Quelle est la puissance du moteur en watts ?",
          "À quelle vitesse l'assistance se coupe-t-elle ?",
          "L'engin a-t-il un accélérateur (sans pédaler) ?",
          "Y a-t-il une marque CE visible ?",
          "Le vélo a-t-il été modifié/débridé ?",
        ],
      },
    },
    // Je ne sais pas - EDPM
    {
      id: "UNKNOWN_EDPM",
      title: "EDPM - Vérification nécessaire",
      verdict: "obligatoire",
      tag: "À vérifier",
      whatToDo: [
        "Vérifier les caractéristiques de l'EDPM avec le client",
        "Questions à poser (voir mode Conseiller)",
        "Par défaut : considérer RC obligatoire (EDPM ≤25 km/h)",
      ],
      why: "Impossible de déterminer sans connaître la vitesse maximale et l'éventuelle modification. Par précaution, considérer l'obligation RC comme applicable pour les EDPM conformes (≤25 km/h).",
      sources: [
        {
          label: "Service Public - EDPM",
          url: "https://www.service-public.fr/particuliers/vosdroits/F308",
        },
      ],
      copyTemplates: {
        sms: "Pour votre EDPM, nous devons vérifier la vitesse max et si l'engin a été modifié. Par défaut, RC obligatoire si ≤25 km/h. Je vous recontacte. Source : Service-Public.",
        mail: "Bonjour,\n\nPour déterminer précisément les obligations d'assurance de votre EDPM, nous avons besoin de vérifier :\n- Vitesse maximale de l'engin (≤25 km/h ou >25 km/h ?)\n- L'engin a-t-il été modifié/débridé ?\n- Usage voie publique ou terrain privé ?\n\nPar défaut, pour un EDPM conforme (≤25 km/h), la RC est obligatoire.\n\nJe vous recontacte après vérification.\n\nCordialement.",
        crm: "Client : EDPM - caractéristiques à vérifier | Verdict : RC OBLIGATOIRE par défaut | Actions : Vérifier vitesse max, modification | À recontacter | Vérifié le [DATE]",
      },
      adviserMode: {
        questionsToAsk: [
          "Quelle est la vitesse maximale de l'engin ?",
          "L'engin a-t-il été modifié ou débridé ?",
          "Où utilisez-vous l'engin (voie publique ou terrain privé) ?",
          "Engin acheté neuf ou d'occasion ?",
        ],
      },
    },
    // Quad
    {
      id: "QUAD",
      title: "Quad / Buggy",
      verdict: "obligatoire",
      tag: "Quad",
      whatToDo: [
        "Immatriculation obligatoire",
        "Assurance RC obligatoire (au tiers minimum)",
        "Équipement obligatoire : casque, gants",
        "Contrôle via FVA",
      ],
      why: "Un quad est un véhicule terrestre à moteur soumis à l'obligation d'assurance RC. Immatriculation et équipements de sécurité obligatoires.",
      proofInfo: "Véhicule immatriculé : contrôle via FVA. Plus de carte verte depuis avril 2024.",
      sources: [
        {
          label: "Code des assurances - L211-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048523650",
        },
      ],
      copyTemplates: {
        sms: "Votre quad est soumis à l'assurance RC obligatoire + immatriculation + équipements (casque, gants). Source : Code des assurances L211-1.",
        mail: "Bonjour,\n\nVotre quad est soumis à l'obligation d'assurance responsabilité civile conformément au Code des assurances.\n\nObligations :\n- Immatriculation\n- Assurance RC obligatoire\n- Équipements : casque, gants\n- Contrôle via FVA\n\nCordialement.",
        crm: "Client : Quad/Buggy | Verdict : OBLIGATOIRE | Actions : Immatriculation + RC + équipements | Vérifié le [DATE] | Source : Code assurances L211-1",
      },
    },
    // Engin agricole
    {
      id: "AGRICULTURAL",
      title: "Engin agricole",
      verdict: "obligatoire",
      tag: "Agricole",
      whatToDo: [
        "Assurance RC obligatoire",
        "Immatriculation selon usage (route ou champ uniquement)",
        "Vérifier avec assureur agricole",
      ],
      why: "Les engins agricoles motorisés sont soumis à l'obligation d'assurance RC s'ils circulent sur la voie publique, même occasionnellement.",
      sources: [
        {
          label: "Code des assurances - L211-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048523650",
        },
      ],
      copyTemplates: {
        sms: "Votre engin agricole motorisé est soumis à l'assurance RC obligatoire, surtout si usage voie publique (même occasionnel). Source : Code des assurances.",
        mail: "Bonjour,\n\nVotre engin agricole motorisé est soumis à l'obligation d'assurance responsabilité civile, notamment si vous circulez sur la voie publique (même occasionnellement).\n\nÀ vérifier avec votre assureur agricole :\n- Assurance RC\n- Immatriculation selon usage\n- Couverture adaptée\n\nCordialement.",
        crm: "Client : Engin agricole | Verdict : OBLIGATOIRE (si voie publique) | Actions : RC + vérif immatriculation | Vérifié le [DATE] | Source : Code assurances L211-1",
      },
    },
    // Remorque
    {
      id: "TRAILER",
      title: "Remorque",
      verdict: "obligatoire",
      tag: "Remorque",
      whatToDo: [
        "Assurance via le véhicule tracteur (généralement incluse)",
        "Vérifier PTAC et conditions du contrat",
        "Immatriculation selon PTAC",
      ],
      why: "Une remorque est généralement couverte par l'assurance du véhicule tracteur. Toutefois, il faut vérifier le PTAC et les conditions du contrat.",
      sources: [
        {
          label: "Service Public - Assurance remorque",
          url: "https://www.service-public.fr/particuliers/vosdroits/F2697",
        },
      ],
      copyTemplates: {
        sms: "Votre remorque est généralement couverte par l'assurance du véhicule tracteur. Vérifier PTAC et conditions du contrat. Source : Service-Public.",
        mail: "Bonjour,\n\nUne remorque est généralement couverte par l'assurance du véhicule tracteur.\n\nÀ vérifier :\n- PTAC de la remorque\n- Conditions de votre contrat auto (limite de poids)\n- Immatriculation selon PTAC\n\nCordialement.",
        crm: "Client : Remorque | Verdict : Couverte par véhicule tracteur | Actions : Vérifier PTAC + conditions contrat | Vérifié le [DATE] | Source : Service-Public",
      },
    },
  ],
};

// Fonction helper pour la recherche
export function searchVehicleType(query: string): string | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  for (const node of vehicleInsuranceTree.nodes) {
    for (const option of node.options) {
      if (option.keywords) {
        for (const keyword of option.keywords) {
          if (keyword.toLowerCase().includes(normalizedQuery) || 
              normalizedQuery.includes(keyword.toLowerCase())) {
            return option.resultId || option.nextId || null;
          }
        }
      }
      if (option.label.toLowerCase().includes(normalizedQuery)) {
        return option.resultId || option.nextId || null;
      }
    }
  }
  
  return null;
}
