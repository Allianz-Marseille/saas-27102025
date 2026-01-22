/**
 * Moteur de calcul déterministe pour l'Assistant Antécédents Auto
 * 
 * IMPORTANT : Ce moteur ne fait JAMAIS appel à l'IA pour les calculs.
 * Tous les calculs sont déterministes et basés sur les règles métier.
 */

import { antecedentsRules } from "./antecedentsRules";
import type {
  ContexteSouscription,
  ReleveInformations,
  Sinistre,
  ResultatCRM,
  RegleSinistres,
  Blocage,
  Alerte,
  JournalDecision,
  PiecesAConserver,
  SourceReglementaire,
  ResponsabiliteSinistre,
  NatureSinistre,
  UsageVehicule,
  TypeSouscripteur,
  SituationSouscription,
} from "./antecedentsTypes";

export class AntecedentsEngine {
  private regles = antecedentsRules.regles;
  private version = antecedentsRules.version;

  /**
   * Vérifie si une condition simple est satisfaite
   */
  private verifierConditionSimple(
    condition: string,
    valeur: any,
    valeurAttendue: any
  ): boolean {
    if (typeof valeurAttendue === "string") {
      // Gestion des opérateurs de comparaison
      if (valeurAttendue.startsWith("<=")) {
        const seuil = parseFloat(valeurAttendue.substring(2));
        return typeof valeur === "number" && valeur <= seuil;
      }
      if (valeurAttendue.startsWith(">=")) {
        const seuil = parseFloat(valeurAttendue.substring(2));
        return typeof valeur === "number" && valeur >= seuil;
      }
      if (valeurAttendue.startsWith(">")) {
        const seuil = parseFloat(valeurAttendue.substring(1));
        return typeof valeur === "number" && valeur > seuil;
      }
      if (valeurAttendue.startsWith("<")) {
        const seuil = parseFloat(valeurAttendue.substring(1));
        return typeof valeur === "number" && valeur < seuil;
      }
      if (valeurAttendue.includes("AND")) {
        // Condition composée (ex: ">=3 AND <=30")
        const parts = valeurAttendue.split(" AND ");
        return parts.every((part) => this.verifierConditionSimple(condition, valeur, part.trim()));
      }
    }
    return valeur === valeurAttendue;
  }

  /**
   * Vérifie si les conditions d'une règle sont satisfaites
   */
  private verifierConditions(
    conditions: Record<string, any>,
    contexte: ContexteSouscription,
    ri?: ReleveInformations
  ): boolean {
    for (const [key, valeurAttendue] of Object.entries(conditions)) {
      let valeur: any;

      switch (key) {
        case "type_souscripteur":
          valeur = contexte.type_souscripteur;
          break;
        case "nb_vehicules_actuels":
          valeur = contexte.nb_vehicules_actuels;
          break;
        case "conducteur_designe":
          valeur = contexte.conducteur_designe;
          break;
        case "usage":
          valeur = contexte.usage;
          // Si la condition attend un tableau, vérifier si usage est dans le tableau
          if (Array.isArray(valeurAttendue)) {
            return valeurAttendue.includes(valeur);
          }
          break;
        case "crm_ri":
          valeur = ri?.crm_ri;
          break;
        case "duree_ri_consecutive":
          valeur = ri?.duree_ri_consecutive_mois;
          break;
        case "societe":
          // À implémenter si nécessaire
          break;
        default:
          continue;
      }

      if (Array.isArray(valeurAttendue)) {
        // Condition "usage" peut être un tableau
        if (valeur === undefined || !valeurAttendue.includes(valeur)) {
          return false;
        }
      } else if (valeur === undefined) {
        return false;
      } else if (!this.verifierConditionSimple(key, valeur, valeurAttendue)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calcule le CRM selon les règles applicables
   */
  calculerCRM(
    contexte: ContexteSouscription,
    ri?: ReleveInformations,
    crmVehiculesParc?: number[] // Pour PM_02 (moyenne parc)
  ): ResultatCRM | { erreur: string; regles?: any[] } {
    const reglesApplicables = this.regles.crm.filter((r) =>
      this.verifierConditions(r.conditions, contexte, ri)
    );

    if (reglesApplicables.length === 0) {
      return { erreur: "Aucune règle applicable" };
    }

    if (reglesApplicables.length > 1) {
      return {
        erreur: "Conflit de règles",
        regles: reglesApplicables.map((r) => r.id),
      };
    }

    const regle = reglesApplicables[0];

    // Si calcul dynamique (ex: moyenne parc)
    if (regle.calcul) {
      return this.executerCalcul(regle, contexte, crmVehiculesParc);
    }

    // Si résultat direct
    let valeurCRM: number;
    if (regle.resultat?.crm === "crm_ri") {
      if (!ri?.crm_ri) {
        return { erreur: "CRM RI requis mais non fourni" };
      }
      valeurCRM = ri.crm_ri;
    } else {
      valeurCRM = regle.resultat?.crm as number;
    }

    return {
      valeur: valeurCRM,
      regle_id: regle.id,
      justification: regle.resultat?.justification || "",
      annees_ri_justifiees: regle.resultat?.annees_ri,
      sources: regle.sources,
    };
  }

  /**
   * Exécute un calcul dynamique (moyenne parc, bonus-malus, etc.)
   */
  private executerCalcul(
    regle: any,
    contexte: ContexteSouscription,
    crmVehiculesParc?: number[]
  ): ResultatCRM {
    if (regle.calcul.methode === "moyenne") {
      // PM_02 : Moyenne parc
      if (!crmVehiculesParc || crmVehiculesParc.length === 0) {
        throw new Error("Liste des CRM véhicules requise pour calcul moyenne parc");
      }

      const somme = crmVehiculesParc.reduce((acc, crm) => acc + crm, 0);
      const moyenne = somme / crmVehiculesParc.length;

      // Précision à 2 décimales SANS arrondir (tronquer)
      const precision = regle.calcul.precision || 2;
      const facteur = Math.pow(10, precision);
      const valeur = Math.floor(moyenne * facteur) / facteur;

      const calcul = `(${crmVehiculesParc.join(" + ")}) / ${crmVehiculesParc.length} = ${valeur}`;

      return {
        valeur,
        regle_id: regle.id,
        justification: regle.resultat?.justification || "Moyenne parc",
        calcul,
        sources: regle.sources,
      };
    }

    if (regle.calcul.methode === "bonus_malus") {
      // BM_01 : Actualisation bonus-malus
      return this.calculerBonusMalus(regle, contexte, crmVehiculesParc);
    }

    throw new Error(`Méthode de calcul non implémentée: ${regle.calcul.methode}`);
  }

  /**
   * Calcule la moyenne parc (sans arrondi)
   */
  calculerMoyenneParc(crmVehicules: number[]): number {
    if (crmVehicules.length === 0) {
      throw new Error("Liste des CRM véhicules vide");
    }

    const somme = crmVehicules.reduce((acc, crm) => acc + crm, 0);
    const moyenne = somme / crmVehicules.length;

    // Précision à 2 décimales SANS arrondir (tronquer)
    const facteur = Math.pow(10, 2);
    return Math.floor(moyenne * facteur) / facteur;
  }

  /**
   * Actualise le CRM selon les règles bonus-malus
   */
  actualiserBonusMalus(
    crmActuel: number,
    usage: UsageVehicule,
    sinistres: Sinistre[],
    echeanceMois?: number
  ): number {
    const regleBM = this.regles.bonus_malus.find((r) => r.conditions.actualiser);

    if (!regleBM) {
      return crmActuel; // Pas d'actualisation si pas de règle
    }

    // Déterminer les coefficients selon l'usage
    const coefs =
      usage === "prive" || usage === "professionnel"
        ? regleBM.usage_prive
        : regleBM.usage_tous_deplacements;

    // Calculer le malus des sinistres
    let malusTotal = 0;
    for (const sinistre of sinistres) {
      if (sinistre.responsabilite === "responsable") {
        malusTotal += coefs.sinistre_responsable;
      } else if (sinistre.responsabilite === "partiellement_responsable") {
        malusTotal += coefs.sinistre_part_responsable;
      }
    }

    // Formule : CRM_nouveau = CRM_actuel × coef_annuel × (1 + malus_sinistres)
    let nouveauCRM = crmActuel * coefs.coefficient_annuel * (1 + malusTotal);

    // Appliquer plancher et plafond
    nouveauCRM = Math.max(regleBM.plancher, Math.min(regleBM.plafond, nouveauCRM));

    // Précision à 2 décimales
    const facteur = Math.pow(10, 2);
    return Math.round(nouveauCRM * facteur) / facteur;
  }

  /**
   * Calcule le bonus-malus (méthode interne)
   */
  private calculerBonusMalus(
    regle: any,
    contexte: ContexteSouscription,
    crmVehiculesParc?: number[]
  ): ResultatCRM {
    // Cette méthode sera appelée depuis actualiserBonusMalus
    // Pour l'instant, on retourne une erreur car le calcul se fait ailleurs
    throw new Error("Utiliser actualiserBonusMalus() directement");
  }

  /**
   * Vérifie les règles d'interruption
   */
  verifierInterruption(
    interruptionMois?: number
  ): { reprise_bonus: boolean; justification: string; regle_id: string } | null {
    if (interruptionMois === undefined) {
      return null;
    }

    const regleInterruption = this.regles.interruption.find((r) => {
      if (r.conditions.interruption_mois === "<36") {
        return interruptionMois < 36;
      } else if (r.conditions.interruption_mois === ">=36") {
        return interruptionMois >= 36;
      }
      return false;
    });

    if (!regleInterruption) {
      return null;
    }

    return {
      reprise_bonus: regleInterruption.resultat.reprise_bonus,
      justification: regleInterruption.resultat.justification,
      regle_id: regleInterruption.id,
    };
  }

  /**
   * Compte le nombre de véhicules où un gérant est désigné
   */
  compterVehiculesGerant(
    gerantId: string,
    vehicules: Array<{ conducteur_type?: string; conducteur_id?: string }>
  ): number {
    return vehicules.filter(
      (v) => v.conducteur_type === "gerant" && v.conducteur_id === gerantId
    ).length;
  }

  /**
   * Détermine la règle de sinistres applicable
   */
  determinerSinistres(
    contexte: ContexteSouscription
  ): RegleSinistres | { erreur: string } {
    const regle = this.regles.sinistres.find((r) =>
      this.verifierConditions(r.conditions, contexte)
    );

    if (!regle) {
      return { erreur: "Aucune règle sinistres applicable" };
    }

    return {
      regle_id: regle.id,
      periode_mois: regle.periode_mois,
      a_retenir: (regle.a_retenir || []) as ResponsabiliteSinistre[],
      a_exclure: (regle.a_exclure || []) as NatureSinistre[],
      regle_speciale: regle.regle_speciale,
      sources: regle.sources,
    };
  }

  /**
   * Vérifie les blocages (souscription impossible)
   */
  verifierBlocages(
    contexte: ContexteSouscription,
    crm?: number,
    carteVTC?: boolean
  ): Blocage[] {
    const blocages: Blocage[] = [];

    for (const blocage of this.regles.blocages) {
      let conditionSatisfaite = false;

      // Évaluer la condition (simplifié, à améliorer avec un vrai parser)
      if (blocage.condition.includes("usage == 'VTC'")) {
        if (contexte.usage === "VTC") {
          if (blocage.condition.includes("crm > 1.00") && crm && crm > 1.00) {
            conditionSatisfaite = true;
          } else if (
            blocage.condition.includes("carte_vtc == false") &&
            carteVTC === false
          ) {
            conditionSatisfaite = true;
          }
        }
      } else if (
        blocage.condition.includes("conducteur_type == 'gerant'") &&
        contexte.conducteur_type === "gerant"
      ) {
        if (
          blocage.condition.includes("nb_vehicules_gerant > 2") &&
          (contexte.nb_vehicules_gerant || 0) > 2
        ) {
          conditionSatisfaite = true;
        }
      }

      if (conditionSatisfaite) {
        blocages.push({
          id: blocage.id,
          message: blocage.message,
          type: blocage.type,
          source: blocage.source,
        });
      }
    }

    return blocages;
  }

  /**
   * Détecte les alertes de vigilance
   */
  detecterAlertes(
    contexte: ContexteSouscription,
    ri?: ReleveInformations,
    sinistres?: Sinistre[]
  ): Alerte[] {
    const alertes: Alerte[] = [];

    for (const alerte of this.regles.alertes) {
      let conditionSatisfaite = false;

      if (alerte.condition) {
        // Évaluer la condition
        if (alerte.condition.includes("ri_absent")) {
          conditionSatisfaite = ri?.present === false;
        } else if (alerte.condition.includes("ri_date > 3_mois")) {
          if (ri?.date) {
            const troisMoisAgo = new Date();
            troisMoisAgo.setMonth(troisMoisAgo.getMonth() - 3);
            conditionSatisfaite = ri.date < troisMoisAgo;
          }
        }
      } else {
        // Alerte toujours affichée (ex: ALERT_SINISTRE_CLOS)
        conditionSatisfaite = true;
      }

      if (conditionSatisfaite) {
        alertes.push({
          id: alerte.id,
          message: alerte.message,
          type: alerte.type,
          action: alerte.action,
        });
      }
    }

    // Alerte spécifique VTC : CRM > 0.85
    if (
      contexte.usage === "VTC" &&
      ri?.crm_ri &&
      ri.crm_ri > 0.85 &&
      ri.crm_ri <= 1.0
    ) {
      alertes.push({
        id: "ALERT_VTC_MAJORATION",
        message: "VTC : CRM RI >0.85 → majoration DTR +80%",
        type: "vigilance",
      });
    }

    return alertes;
  }

  /**
   * Liste les pièces à conserver
   */
  private listerPieces(
    contexte: ContexteSouscription,
    ri?: ReleveInformations
  ): PiecesAConserver {
    return {
      ri_conducteur: contexte.conducteur_designe || false,
      ri_vehicule: contexte.nb_vehicules_actuels > 0,
      carte_vtc: contexte.usage === "VTC",
      justificatif_affectation:
        contexte.conducteur_designe && contexte.conducteur_type === "salarie",
    };
  }

  /**
   * Consolide les sources réglementaires
   */
  private consoliderSources(
    sources: SourceReglementaire[][]
  ): SourceReglementaire[] {
    const sourcesUniques = new Map<string, SourceReglementaire>();

    for (const sourceArray of sources) {
      for (const source of sourceArray) {
        const key = `${source.document}-${source.page}`;
        if (!sourcesUniques.has(key)) {
          sourcesUniques.set(key, source);
        }
      }
    }

    return Array.from(sourcesUniques.values());
  }

  /**
   * Formate le contexte pour le journal
   */
  private formaterContexte(contexte: ContexteSouscription): string {
    const typeLabels: Record<TypeSouscripteur, string> = {
      personne_morale: "Personne morale",
      personne_physique: "Personne physique",
      assimile_pm: "Assimilé PM",
    };

    const usageLabels: Record<UsageVehicule, string> = {
      prive: "Privé",
      tous_deplacements: "Tous déplacements",
      professionnel: "Professionnel",
      VTC: "VTC",
      transport_marchandises: "Transport marchandises",
      transport_personnes: "Transport personnes",
    };

    const situationLabels: Record<SituationSouscription, string> = {
      premier_vehicule: "1er véhicule",
      ajout_vehicule: "Ajout véhicule",
      remplacement: "Remplacement",
      flotte_importante: "Flotte importante",
    };

    return `• Souscripteur : ${typeLabels[contexte.type_souscripteur]}
• Usage : ${usageLabels[contexte.usage]}
• Situation : ${situationLabels[contexte.situation]}
• Nombre de véhicules actuels : ${contexte.nb_vehicules_actuels}
• Conducteur désigné : ${contexte.conducteur_designe ? "Oui" : "Non"}`;
  }

  /**
   * Formate le CRM pour le journal
   */
  private formaterCRM(crm: ResultatCRM): string {
    let texte = `📊 CRM RETENU : ${crm.valeur}
─────────────────────────────────────────────────────────
Règle appliquée : ${crm.regle_id}
${crm.calcul ? `Calcul : ${crm.calcul}` : ""}
Justification : ${crm.justification}`;

    if (crm.annees_ri_justifiees !== undefined) {
      texte += `\nAnnées RI justifiées : ${crm.annees_ri_justifiees} mois`;
    }

    texte += `\nSource : ${crm.sources.map((s) => `${s.document}, p.${s.page}`).join(" ; ")}`;

    return texte;
  }

  /**
   * Formate les sinistres pour le journal
   */
  private formaterSinistres(
    regle: RegleSinistres,
    sinistres: Sinistre[]
  ): string {
    let texte = `📝 SINISTRES À SAISIR
─────────────────────────────────────────────────────────
Règle : ${regle.regle_id}
Période : ${regle.periode_mois} mois`;

    if (regle.regle_speciale) {
      texte += `\nRègle spéciale : ${regle.regle_speciale}`;
    }

    texte += `\nListe :
  • ${regle.a_retenir.map((r) => `Tous sinistres ${r}`).join("\n  • ")}`;

    if (regle.a_exclure.length > 0) {
      texte += `\n\nExclusions :
  ✗ ${regle.a_exclure.map((e) => e.replace("_", " ")).join("\n  ✗ ")}`;
    }

    if (sinistres.length > 0) {
      texte += `\n\nNombre déclaré : ${sinistres.length} sinistre(s)`;
      sinistres.forEach((sin, index) => {
        const dateStr = sin.date.toLocaleDateString("fr-FR");
        texte += `\n  ${index + 1}. ${dateStr} – ${sin.nature.replace("_", " ")} – ${sin.responsabilite.replace("_", " ")} – ${sin.montant} €`;
      });
    }

    return texte;
  }

  /**
   * Formate les alertes pour le journal
   */
  private formaterAlertes(alertes: Alerte[]): string {
    if (alertes.length === 0) {
      return "";
    }

    let texte = `⚠️ ALERTES
─────────────────────────────────────────────────────────`;

    alertes.forEach((alerte) => {
      texte += `\n• ${alerte.message}`;
      if (alerte.action) {
        texte += `\n  → ${alerte.action}`;
      }
    });

    return texte;
  }

  /**
   * Génère le journal de décision complet
   */
  genererJournal(
    contexte: ContexteSouscription,
    crm: ResultatCRM,
    regleSinistres: RegleSinistres,
    sinistres: Sinistre[],
    blocages: Blocage[],
    alertes: Alerte[],
    ri?: ReleveInformations
  ): JournalDecision {
    const pieces = this.listerPieces(contexte, ri);
    const sources = this.consoliderSources([
      crm.sources,
      regleSinistres.sources,
    ]);

    return {
      contexte,
      crm,
      sinistres: {
        regle: regleSinistres,
        liste: sinistres,
      },
      pieces,
      blocages,
      alertes,
      sources,
      date_generation: new Date(),
      version_regles: this.version,
    };
  }

  /**
   * Formate le journal en texte brut (copier-coller)
   */
  formaterJournalTexte(journal: JournalDecision): string {
    const contexte = this.formaterContexte(journal.contexte);
    const crm = this.formaterCRM(journal.crm);
    const sinistres = this.formaterSinistres(
      journal.sinistres.regle,
      journal.sinistres.liste
    );
    const alertes = this.formaterAlertes(journal.alertes);

    let texte = `═══════════════════════════════════════════════════════════
  JOURNAL DE DÉCISION – ANTÉCÉDENTS AUTO
  Généré le ${journal.date_generation.toLocaleDateString("fr-FR")} à ${journal.date_generation.toLocaleTimeString("fr-FR")}
═══════════════════════════════════════════════════════════

📋 CONTEXTE
─────────────────────────────────────────────────────────
${contexte}

─────────────────────────────────────────────────────────
${crm}

─────────────────────────────────────────────────────────
${sinistres}

─────────────────────────────────────────────────────────
📎 PIÈCES À CONSERVER
─────────────────────────────────────────────────────────
${journal.pieces.ri_conducteur ? "☑️" : "☐"} Relevé d'informations conducteur${journal.pieces.ri_vehicule ? "\n☑️ Relevé d'informations véhicule(s)" : ""}
${journal.pieces.carte_vtc ? "☑️ Carte VTC" : "☐ Carte VTC (non applicable)"}
${journal.pieces.justificatif_affectation ? "☑️ Justificatif affectation conducteur" : "☐ Justificatif conducteur (non applicable)"}`;

    if (alertes) {
      texte += `\n\n─────────────────────────────────────────────────────────\n${alertes}`;
    }

    if (journal.blocages.length > 0) {
      texte += `\n\n─────────────────────────────────────────────────────────
🚫 BLOCAGES
─────────────────────────────────────────────────────────`;
      journal.blocages.forEach((blocage) => {
        texte += `\n• ${blocage.message}\n  Source : ${blocage.source}`;
      });
    }

    texte += `\n\n─────────────────────────────────────────────────────────
🔍 SOURCES RÉGLEMENTAIRES
─────────────────────────────────────────────────────────`;
    journal.sources.forEach((source) => {
      texte += `\n• ${source.document} (p.${source.page}${source.section ? `, ${source.section}` : ""})`;
    });

    texte += `\n\n═══════════════════════════════════════════════════════════`;

    return texte;
  }

  /**
   * Formate le journal en email client-friendly
   */
  formaterEmail(journal: JournalDecision): string {
    const typeLabels: Record<TypeSouscripteur, string> = {
      personne_morale: "Personne morale",
      personne_physique: "Personne physique",
      assimile_pm: "Assimilé PM",
    };

    return `Bonjour,

Suite à l'étude du dossier, voici les antécédents retenus :

CRM : ${journal.crm.valeur} (${journal.crm.justification})
Sinistres : ${journal.sinistres.liste.length} sur ${journal.sinistres.regle.periode_mois} mois
Pièces conservées : ${Object.entries(journal.pieces).filter(([_, v]) => v).length} pièce(s)

Règles appliquées : ${journal.crm.regle_id} + ${journal.sinistres.regle.regle_id}
Conformité : ${journal.sources.map((s) => s.document).join(", ")}

N'hésitez pas si questions.

Cordialement,`;
  }
}

// Types déjà importés en haut du fichier
