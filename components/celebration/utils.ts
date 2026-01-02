/**
 * Vérifie si la date actuelle est dans la période du Nouvel An
 * (du 1er au 7 janvier inclus)
 */
export function isNewYearPeriod(): boolean {
  const now = new Date();
  const month = now.getMonth(); // 0-11 (janvier = 0)
  const day = now.getDate(); // 1-31
  
  return month === 0 && day >= 1 && day <= 7;
}

/**
 * Vérifie si la célébration a déjà été affichée pour l'année en cours
 */
export function hasShownCelebrationThisYear(): boolean {
  const year = new Date().getFullYear();
  const storageKey = `newYearCelebration_${year}`;
  return localStorage.getItem(storageKey) === "true";
}

/**
 * Marque la célébration comme affichée pour l'année en cours
 */
export function markCelebrationAsShown(): void {
  const year = new Date().getFullYear();
  const storageKey = `newYearCelebration_${year}`;
  localStorage.setItem(storageKey, "true");
}

