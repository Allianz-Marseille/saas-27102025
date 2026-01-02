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

