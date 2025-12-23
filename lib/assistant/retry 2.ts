/**
 * Utilitaires pour le retry automatique avec backoff exponentiel
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // en millisecondes
  maxDelay?: number; // en millisecondes
  backoffMultiplier?: number;
  retryableErrors?: string[]; // Types d'erreurs pour lesquelles on retry
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 seconde
  maxDelay: 10000, // 10 secondes
  backoffMultiplier: 2,
  retryableErrors: [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ECONNREFUSED",
    "timeout",
    "network",
    "fetch failed",
  ],
};

/**
 * Vérifie si une erreur est retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;

  const errorMessage = (error.message || String(error)).toLowerCase();
  const errorName = (error.name || "").toLowerCase();
  const errorCode = (error.code || "").toLowerCase();

  return retryableErrors.some((retryableError) => {
    const retryableLower = retryableError.toLowerCase();
    return (
      errorMessage.includes(retryableLower) ||
      errorName.includes(retryableLower) ||
      errorCode.includes(retryableLower)
    );
  });
}

/**
 * Calcule le délai avant le prochain retry (backoff exponentiel)
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Retry une fonction avec backoff exponentiel
 * @param fn Fonction à exécuter (peut être async)
 * @param options Options de retry
 * @returns Résultat de la fonction
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Si c'est le dernier essai, on ne retry pas
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Vérifier si l'erreur est retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        throw error; // Erreur non retryable, on la propage immédiatement
      }

      // Calculer le délai avant le prochain retry
      const delay = calculateDelay(attempt, opts);
      
      console.log(
        `Tentative ${attempt + 1}/${opts.maxRetries + 1} échouée, retry dans ${delay}ms...`,
        error instanceof Error ? error.message : String(error)
      );

      // Attendre avant le prochain retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Toutes les tentatives ont échoué
  throw lastError;
}

/**
 * Wrapper pour les appels OpenAI avec retry automatique
 */
export async function openaiWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    retryableErrors: [
      ...(options.retryableErrors || DEFAULT_OPTIONS.retryableErrors),
      "rate_limit_error",
      "server_error",
      "timeout",
    ],
  });
}

