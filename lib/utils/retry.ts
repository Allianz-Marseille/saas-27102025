/**
 * Utilitaire de retry pour les opérations asynchrones
 * 
 * Permet de retenter automatiquement une opération en cas d'échec,
 * avec un délai exponentiel entre les tentatives.
 */

export interface RetryOptions {
  /**
   * Nombre maximum de tentatives (défaut: 3)
   */
  maxAttempts?: number;

  /**
   * Délai initial en millisecondes (défaut: 1000)
   */
  initialDelay?: number;

  /**
   * Facteur de multiplication du délai entre chaque tentative (défaut: 2)
   */
  backoffFactor?: number;

  /**
   * Fonction pour déterminer si l'erreur est "retryable" (défaut: toutes les erreurs)
   */
  shouldRetry?: (error: unknown) => boolean;

  /**
   * Callback appelé avant chaque retry avec le numéro de tentative
   */
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Délai avec promesse
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exécute une fonction asynchrone avec retry automatique
 * 
 * @param fn Fonction asynchrone à exécuter
 * @param options Options de retry
 * @returns Résultat de la fonction ou throw de la dernière erreur
 * 
 * @example
 * ```typescript
 * const result = await retryAsync(
 *   () => fetch('/api/data'),
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 1000,
 *     onRetry: (attempt, error) => {
 *       console.log(`Retry attempt ${attempt}:`, error);
 *     }
 *   }
 * );
 * ```
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;
  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Si c'est la dernière tentative, throw l'erreur
      if (attempt === maxAttempts) {
        throw error;
      }

      // Vérifier si on doit retry cette erreur
      if (!shouldRetry(error)) {
        throw error;
      }

      // Callback avant le retry
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Attendre avant de retenter
      await delay(currentDelay);

      // Augmenter le délai pour la prochaine tentative
      currentDelay *= backoffFactor;
    }
  }

  // Ne devrait jamais arriver ici, mais TypeScript a besoin de cette ligne
  throw lastError;
}

/**
 * Vérifie si une erreur est liée au réseau
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("timeout") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT")
    );
  }
  return false;
}

/**
 * Vérifie si une erreur Firebase est "retryable"
 */
export function isFirebaseRetryableError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const firebaseError = error as { code?: string };
    
    // Codes d'erreur Firebase qui justifient un retry
    const retryableCodes = [
      "unavailable",
      "deadline-exceeded",
      "resource-exhausted",
      "aborted",
      "internal",
      "unknown",
    ];

    return retryableCodes.some((code) => firebaseError.code?.includes(code));
  }

  return isNetworkError(error);
}

