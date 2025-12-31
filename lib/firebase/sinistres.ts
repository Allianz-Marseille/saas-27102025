/**
 * Utilitaires Firestore pour la gestion des sinistres
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./config";
import {
  Sinistre,
  SinistreFilters,
  SinistreKPI,
  SinistreStatus,
  SinistreRoute,
  LastImportInfo,
  SinistreNote,
  SinistreHistory,
} from "@/types/sinistre";
import { UserData } from "./auth";
import { detectAllAlerts } from "@/lib/utils/sinistres-alerts";

/**
 * Convertit un Timestamp Firestore en Date
 */
function toDate(value: Date | Timestamp | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
}

/**
 * Récupère les sinistres avec filtres optionnels
 */
export async function getSinistres(
  filters?: SinistreFilters
): Promise<Sinistre[]> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const constraints: QueryConstraint[] = [];

  // Filtres temporels
  if (filters?.year) {
    const startDate = new Date(filters.year, 0, 1);
    const endDate = new Date(filters.year + 1, 0, 1);
    constraints.push(where("incidentDate", ">=", Timestamp.fromDate(startDate)));
    constraints.push(where("incidentDate", "<", Timestamp.fromDate(endDate)));
  }

  if (filters?.month && filters?.year) {
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 1);
    constraints.push(where("incidentDate", ">=", Timestamp.fromDate(startDate)));
    constraints.push(where("incidentDate", "<", Timestamp.fromDate(endDate)));
  }

  if (filters?.dateRange) {
    constraints.push(
      where("incidentDate", ">=", Timestamp.fromDate(filters.dateRange.start))
    );
    constraints.push(
      where("incidentDate", "<=", Timestamp.fromDate(filters.dateRange.end))
    );
  }

  // Filtres par caractéristiques
  if (filters?.damagedCoverage) {
    constraints.push(where("damagedCoverage", "==", filters.damagedCoverage));
  }

  if (filters?.route) {
    constraints.push(where("route", "==", filters.route));
  }

  if (filters?.status && filters.status.length > 0) {
    if (filters.status.length === 1) {
      constraints.push(where("status", "==", filters.status[0]));
    } else {
      // Firestore ne supporte pas "in" avec plusieurs valeurs directement
      // On doit faire plusieurs requêtes et les combiner
      // Pour simplifier, on filtre côté client si plusieurs statuts
    }
  }

  if (filters?.assignedTo) {
    constraints.push(where("assignedTo", "==", filters.assignedTo));
  }

  // Filtres montants (nécessitent un index composite, filtrer côté client pour l'instant)
  // Filtres booléens (filtrer côté client)

  // Tri par défaut : date d'incident décroissante
  constraints.push(orderBy("incidentDate", "desc"));

  // Pagination
  if (filters?.limit) {
    constraints.push(limit(filters.limit));
  }

  const q = query(collection(db, "sinistres"), ...constraints);
  const snapshot = await getDocs(q);

  let sinistres = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      incidentDate: toDate(data.incidentDate),
      importDate: toDate(data.importDate),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Sinistre;
  });

  // Filtres côté client (pour les cas non supportés par Firestore)
  if (filters?.status && filters.status.length > 1) {
    sinistres = sinistres.filter((s) => s.status && filters.status!.includes(s.status));
  }

  if (filters?.hasTiers !== undefined) {
    // Pour l'instant, on n'a pas de champ hasTiers, donc on filtre sur recours
    // À adapter selon les besoins
  }

  if (filters?.hasRecourse !== undefined) {
    sinistres = sinistres.filter((s) => s.recourse === filters.hasRecourse);
  }

  if (filters?.amountMin !== undefined) {
    sinistres = sinistres.filter((s) => s.totalAmount >= filters.amountMin!);
  }

  if (filters?.amountMax !== undefined) {
    sinistres = sinistres.filter((s) => s.totalAmount <= filters.amountMax!);
  }

  if (filters?.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    sinistres = sinistres.filter(
      (s) =>
        s.clientName.toLowerCase().includes(searchLower) ||
        s.clientLagonNumber.toLowerCase().includes(searchLower) ||
        s.policyNumber.toLowerCase().includes(searchLower) ||
        s.claimNumber.toLowerCase().includes(searchLower) ||
        s.productType.toLowerCase().includes(searchLower) ||
        s.damagedCoverage.toLowerCase().includes(searchLower)
    );
  }

  return sinistres;
}

/**
 * Récupère un sinistre par son ID
 */
export async function getSinistreById(id: string): Promise<Sinistre | null> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const docRef = doc(db, "sinistres", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    incidentDate: toDate(data.incidentDate),
    importDate: toDate(data.importDate),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as Sinistre;
}

/**
 * Met à jour un sinistre et enregistre l'historique
 */
export async function updateSinistre(
  id: string,
  data: Partial<Sinistre>,
  userId?: string,
  userEmail?: string
): Promise<void> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  // Récupérer le sinistre actuel pour comparer les changements
  const currentSinistre = await getSinistreById(id);
  if (!currentSinistre) {
    throw new Error("Sinistre non trouvé");
  }

  const docRef = doc(db, "sinistres", id);
  const updateData: any = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  // Convertir les dates en Timestamp
  if (data.incidentDate instanceof Date) {
    updateData.incidentDate = Timestamp.fromDate(data.incidentDate);
  }
  if (data.importDate instanceof Date) {
    updateData.importDate = Timestamp.fromDate(data.importDate);
  }

  // Préparer l'historique des modifications AVANT la mise à jour
  const historyRef = collection(db, "sinistres", id, "history");
  const historyEntries: any[] = [];

  // Détecter les changements et préparer les données de mise à jour
  if (data.status !== undefined && data.status !== currentSinistre.status) {
    historyEntries.push({
      type: "status_change",
      field: "status",
      oldValue: currentSinistre.status,
      newValue: data.status,
      description: `Statut changé de "${currentSinistre.status || "Non défini"}" à "${data.status}"`,
    });
  }

  if (data.route !== undefined && data.route !== currentSinistre.route) {
    historyEntries.push({
      type: "route_change",
      field: "route",
      oldValue: currentSinistre.route,
      newValue: data.route,
      description: `Route changée de "${currentSinistre.route || "Non définie"}" à "${data.route}"`,
    });
  }

  if (data.assignedTo !== undefined && data.assignedTo !== currentSinistre.assignedTo) {
    // Récupérer l'email du nouveau chargé de clientèle si nécessaire
    let newAssigneeEmail = "Non affecté";
    if (data.assignedTo) {
      try {
        const charges = await getChargesClientele();
        const charge = charges.find((c) => c.id === data.assignedTo);
        if (charge) {
          newAssigneeEmail = charge.email;
          updateData.assignedToEmail = charge.email;
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du chargé de clientèle:", error);
      }
    } else {
      updateData.assignedToEmail = undefined;
    }

    historyEntries.push({
      type: "assignment_change",
      field: "assignedTo",
      oldValue: currentSinistre.assignedToEmail || "Non affecté",
      newValue: newAssigneeEmail,
      description: data.assignedTo
        ? `Sinistre affecté à ${newAssigneeEmail}`
        : `Affectation retirée`,
    });
  }

  // Ne pas inclure les champs système
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.createdBy;

  // Mettre à jour le document
  await updateDoc(docRef, updateData);

  // Enregistrer chaque entrée d'historique
  for (const entry of historyEntries) {
    await addDoc(historyRef, {
      sinistreId: id,
      ...entry,
      authorId: userId || "",
      authorEmail: userEmail || "",
      timestamp: Timestamp.now(),
    });
  }
}

/**
 * Supprime un sinistre (admin uniquement)
 */
export async function deleteSinistre(id: string): Promise<void> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const docRef = doc(db, "sinistres", id);
  await deleteDoc(docRef);
}

/**
 * Calcule les KPIs des sinistres
 */
export async function getSinistresKPIs(
  filters?: SinistreFilters
): Promise<SinistreKPI> {
  const sinistres = await getSinistres(filters);

  // Calculer les KPIs
  const totalOpen = sinistres.filter(
    (s) => s.status !== SinistreStatus.CLOS && s.status !== SinistreStatus.LITIGE_CONTESTATION
  ).length;

  // Sinistres en retard (statut inchangé > 30 jours)
  const alerts = detectAllAlerts(sinistres);
  const totalAlerts = alerts.filter((a) => a.severity === "error" || a.severity === "warning").length;

  const totalUnassigned = sinistres.filter((s) => !s.assignedTo).length;

  const totalAmountOpen = sinistres
    .filter(
      (s) => s.status !== SinistreStatus.CLOS && s.status !== SinistreStatus.LITIGE_CONTESTATION
    )
    .reduce((sum, s) => sum + s.remainingAmount, 0);

  // Répartition par route
  const distributionByRoute: Record<SinistreRoute, number> = {
    [SinistreRoute.ROUTE_A]: 0,
    [SinistreRoute.ROUTE_B]: 0,
    [SinistreRoute.ROUTE_C]: 0,
    [SinistreRoute.ROUTE_D]: 0,
    [SinistreRoute.ROUTE_E]: 0,
    [SinistreRoute.ROUTE_F]: 0,
    [SinistreRoute.NON_DEFINIE]: 0,
  };

  sinistres.forEach((s) => {
    if (s.route) {
      distributionByRoute[s.route] = (distributionByRoute[s.route] || 0) + 1;
    } else {
      distributionByRoute[SinistreRoute.NON_DEFINIE]++;
    }
  });

  // Répartition par statut
  const distributionByStatus: Record<SinistreStatus, number> = {
    [SinistreStatus.A_QUALIFIER]: 0,
    [SinistreStatus.EN_ATTENTE_PIECES_ASSURE]: 0,
    [SinistreStatus.EN_ATTENTE_INFOS_TIERS]: 0,
    [SinistreStatus.MISSION_EN_COURS]: 0,
    [SinistreStatus.EN_ATTENTE_DEVIS]: 0,
    [SinistreStatus.EN_ATTENTE_RAPPORT]: 0,
    [SinistreStatus.EN_ATTENTE_ACCORD_COMPAGNIE]: 0,
    [SinistreStatus.TRAVAUX_EN_COURS]: 0,
    [SinistreStatus.EN_ATTENTE_FACTURE]: 0,
    [SinistreStatus.REGLEMENT_EN_COURS]: 0,
    [SinistreStatus.CLOS]: 0,
    [SinistreStatus.LITIGE_CONTESTATION]: 0,
  };

  sinistres.forEach((s) => {
    if (s.status) {
      distributionByStatus[s.status] = (distributionByStatus[s.status] || 0) + 1;
    }
  });

  // Sinistres en attente de pièces (depuis > 7 jours)
  const pendingDocuments = sinistres.filter((s) => {
    if (s.status !== SinistreStatus.EN_ATTENTE_PIECES_ASSURE) return false;
    const daysSinceUpdate = Math.floor(
      (Date.now() - toDate(s.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceUpdate > 7;
  }).length;

  // Délai moyen de traitement (jours depuis ouverture)
  const openSinistres = sinistres.filter(
    (s) => s.status !== SinistreStatus.CLOS && s.status !== SinistreStatus.LITIGE_CONTESTATION
  );
  const averageProcessingTime =
    openSinistres.length > 0
      ? openSinistres.reduce((sum, s) => {
          const daysSinceIncident = Math.floor(
            (Date.now() - toDate(s.incidentDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + daysSinceIncident;
        }, 0) / openSinistres.length
      : 0;

  // Taux de clôture
  const totalSinistres = sinistres.length;
  const closedSinistres = sinistres.filter(
    (s) => s.status === SinistreStatus.CLOS
  ).length;
  const closureRate = totalSinistres > 0 ? (closedSinistres / totalSinistres) * 100 : 0;

  // Sinistres avec recours
  const withRecourseSinistres = sinistres.filter((s) => s.recourse);
  const withRecourse = {
    count: withRecourseSinistres.length,
    amount: withRecourseSinistres.reduce((sum, s) => sum + s.totalAmount, 0),
  };

  return {
    totalOpen,
    totalAlerts,
    totalUnassigned,
    totalAmountOpen,
    distributionByRoute,
    distributionByStatus,
    pendingDocuments,
    averageProcessingTime: Math.round(averageProcessingTime),
    closureRate: Math.round(closureRate * 100) / 100,
    withRecourse,
  };
}

/**
 * Récupère les utilisateurs avec le rôle CDC_COMMERCIAL
 */
export async function getChargesClientele(): Promise<UserData[]> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    where("role", "==", "CDC_COMMERCIAL"),
    where("active", "==", true)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      role: data.role,
      active: data.active,
      createdAt: toDate(data.createdAt),
    } as UserData;
  });
}

/**
 * Récupère les informations du dernier import Excel
 */
export async function getLastImportInfo(): Promise<LastImportInfo | null> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  try {
    const docRef = doc(db, "sinistres_metadata", "lastImport");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const importDate = toDate(data.importDate);
    const daysSinceImport = Math.floor(
      (Date.now() - importDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      importDate,
      excelVersion: data.excelVersion || "",
      newSinistres: data.newSinistres || 0,
      totalLines: data.totalLines || 0,
      isRecent: daysSinceImport < 7,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du dernier import:", error);
    return null;
  }
}

/**
 * Récupère les notes d'un sinistre
 */
export async function getSinistreNotes(sinistreId: string): Promise<SinistreNote[]> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const notesRef = collection(db, "sinistres", sinistreId, "notes");
  const q = query(notesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      sinistreId,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
    } as SinistreNote;
  });
}

/**
 * Récupère l'historique d'un sinistre
 */
export async function getSinistreHistory(sinistreId: string): Promise<SinistreHistory[]> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const historyRef = collection(db, "sinistres", sinistreId, "history");
  const q = query(historyRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      sinistreId,
      ...data,
      timestamp: toDate(data.timestamp),
    } as SinistreHistory;
  });
}

