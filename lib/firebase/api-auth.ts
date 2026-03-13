import { auth } from "./config";

/**
 * Construit les headers JSON authentifiés pour les API routes protégées.
 */
export async function buildAuthenticatedJsonHeaders(): Promise<Record<string, string>> {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  const idToken = await currentUser.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  };
}
