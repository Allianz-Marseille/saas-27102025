/**
 * Utilitaires pour détecter les alertes automatiques sur les sinistres
 */

import { Sinistre, SinistreStatus } from "@/types/sinistre";
import { Timestamp } from "firebase/firestore";

/**
 * Helper pour convertir Date | Timestamp en Date
 */
function toDate(value: Date | Timestamp): Date {
  return value instanceof Timestamp ? value.toDate() : value;
}

export interface SinistreAlert {
  sinistreId: string;
  type: "status_unchanged" | "pending_documents" | "pending_quote" | "pending_report" | "overdue_rdv" | "missing_documents" | "old_sinistre";
  severity: "warning" | "error" | "info";
  message: string;
  days: number;
}

/**
 * Détecte les sinistres en retard (statut inchangé > X jours)
 */
export function detectStatusUnchangedAlerts(
  sinistres: Sinistre[],
  thresholdDays: number = 30
): SinistreAlert[] {
  const alerts: SinistreAlert[] = [];
  const now = Date.now();

  sinistres.forEach((sinistre) => {
    if (!sinistre.status || !sinistre.updatedAt) return;

    const updatedAtDate = toDate(sinistre.updatedAt);
    const daysSinceUpdate = Math.floor(
      (now - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceUpdate > thresholdDays) {
      alerts.push({
        sinistreId: sinistre.id!,
        type: "status_unchanged",
        severity: daysSinceUpdate > 60 ? "error" : "warning",
        message: `Statut inchangé depuis ${daysSinceUpdate} jours`,
        days: daysSinceUpdate,
      });
    }
  });

  return alerts;
}

/**
 * Détecte les sinistres en attente de devis/rapport > X jours
 */
export function detectPendingQuoteAlerts(
  sinistres: Sinistre[],
  thresholdDays: number = 14
): SinistreAlert[] {
  const alerts: SinistreAlert[] = [];
  const now = Date.now();

  sinistres.forEach((sinistre) => {
    if (sinistre.status !== SinistreStatus.EN_ATTENTE_DEVIS) return;
    if (!sinistre.updatedAt) return;

    const updatedAtDate = toDate(sinistre.updatedAt);
    const daysSinceUpdate = Math.floor(
      (now - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceUpdate > thresholdDays) {
      alerts.push({
        sinistreId: sinistre.id!,
        type: "pending_quote",
        severity: daysSinceUpdate > 30 ? "error" : "warning",
        message: `En attente de devis depuis ${daysSinceUpdate} jours`,
        days: daysSinceUpdate,
      });
    }
  });

  return alerts;
}

/**
 * Détecte les sinistres en attente de rapport > X jours
 */
export function detectPendingReportAlerts(
  sinistres: Sinistre[],
  thresholdDays: number = 21
): SinistreAlert[] {
  const alerts: SinistreAlert[] = [];
  const now = Date.now();

  sinistres.forEach((sinistre) => {
    if (sinistre.status !== SinistreStatus.EN_ATTENTE_RAPPORT) return;
    if (!sinistre.updatedAt) return;

    const updatedAtDate = toDate(sinistre.updatedAt);
    const daysSinceUpdate = Math.floor(
      (now - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceUpdate > thresholdDays) {
      alerts.push({
        sinistreId: sinistre.id!,
        type: "pending_report",
        severity: daysSinceUpdate > 45 ? "error" : "warning",
        message: `En attente de rapport depuis ${daysSinceUpdate} jours`,
        days: daysSinceUpdate,
      });
    }
  });

  return alerts;
}

/**
 * Détecte les sinistres en attente de pièces > X jours
 */
export function detectMissingDocumentsAlerts(
  sinistres: Sinistre[],
  thresholdDays: number = 7
): SinistreAlert[] {
  const alerts: SinistreAlert[] = [];
  const now = Date.now();

  sinistres.forEach((sinistre) => {
    if (sinistre.status !== SinistreStatus.EN_ATTENTE_PIECES_ASSURE) return;
    if (!sinistre.updatedAt) return;

    const updatedAtDate = toDate(sinistre.updatedAt);
    const daysSinceUpdate = Math.floor(
      (now - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceUpdate > thresholdDays) {
      alerts.push({
        sinistreId: sinistre.id!,
        type: "missing_documents",
        severity: daysSinceUpdate > 14 ? "error" : "warning",
        message: `Pièces manquantes depuis ${daysSinceUpdate} jours`,
        days: daysSinceUpdate,
      });
    }
  });

  return alerts;
}

/**
 * Détecte les sinistres ouverts depuis > X jours
 */
export function detectOldSinistresAlerts(
  sinistres: Sinistre[],
  thresholds: { warning: number; error: number } = { warning: 60, error: 90 }
): SinistreAlert[] {
  const alerts: SinistreAlert[] = [];
  const now = Date.now();

  sinistres.forEach((sinistre) => {
    // Ignorer les sinistres clos
    if (
      sinistre.status === SinistreStatus.CLOS ||
      sinistre.status === SinistreStatus.LITIGE_CONTESTATION
    ) {
      return;
    }

    const incidentDate = sinistre.incidentDate instanceof Timestamp
      ? sinistre.incidentDate.toDate()
      : sinistre.incidentDate;
    const daysSinceIncident = Math.floor(
      (now - incidentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceIncident > thresholds.error) {
      alerts.push({
        sinistreId: sinistre.id!,
        type: "old_sinistre",
        severity: "error",
        message: `Sinistre ouvert depuis ${daysSinceIncident} jours`,
        days: daysSinceIncident,
      });
    } else if (daysSinceIncident > thresholds.warning) {
      alerts.push({
        sinistreId: sinistre.id!,
        type: "old_sinistre",
        severity: "warning",
        message: `Sinistre ouvert depuis ${daysSinceIncident} jours`,
        days: daysSinceIncident,
      });
    }
  });

  return alerts;
}

/**
 * Détecte toutes les alertes pour une liste de sinistres
 */
export function detectAllAlerts(sinistres: Sinistre[]): SinistreAlert[] {
  const alerts: SinistreAlert[] = [];

  alerts.push(...detectStatusUnchangedAlerts(sinistres, 30));
  alerts.push(...detectPendingQuoteAlerts(sinistres, 14));
  alerts.push(...detectPendingReportAlerts(sinistres, 21));
  alerts.push(...detectMissingDocumentsAlerts(sinistres, 7));
  alerts.push(...detectOldSinistresAlerts(sinistres, { warning: 60, error: 90 }));

  // Trier par sévérité puis par nombre de jours
  alerts.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.days - a.days;
  });

  return alerts;
}

/**
 * Compte le nombre d'alertes par type
 */
export function countAlertsByType(alerts: SinistreAlert[]): {
  total: number;
  errors: number;
  warnings: number;
  byType: Record<SinistreAlert["type"], number>;
} {
  const byType: Record<SinistreAlert["type"], number> = {
    status_unchanged: 0,
    pending_documents: 0,
    pending_quote: 0,
    pending_report: 0,
    overdue_rdv: 0,
    missing_documents: 0,
    old_sinistre: 0,
  };

  let errors = 0;
  let warnings = 0;

  alerts.forEach((alert) => {
    byType[alert.type]++;
    if (alert.severity === "error") errors++;
    if (alert.severity === "warning") warnings++;
  });

  return {
    total: alerts.length,
    errors,
    warnings,
    byType,
  };
}

