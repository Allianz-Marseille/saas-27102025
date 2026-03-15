import crypto from "crypto"
import { EvenementCalendrier } from "./bs-gemini"

interface GoogleCalendarEvent {
  summary?: string
  start?: { date?: string; dateTime?: string }
  end?: { date?: string; dateTime?: string }
}

interface GoogleCalendarResponse {
  items?: GoogleCalendarEvent[]
}

/**
 * Récupère les événements du mois depuis Google Calendar via service account.
 * Retourne une liste d'EvenementCalendrier prêts pour le parsing Gemini.
 */
export async function fetchEvenementsCalendrier(
  moisKey: string // "2026-01"
): Promise<EvenementCalendrier[]> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!calendarId || !serviceAccountEmail || !privateKeyRaw) {
    throw new Error("[bs-calendar] Variables d'environnement manquantes (GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)")
  }

  const privateKey = privateKeyRaw
    .replace(/\\n/g, "\n")
    .replace(/"/g, "")
    .trim()

  // Calcul de la plage du mois
  const [year, month] = moisKey.split("-").map(Number)
  const timeMin = new Date(year, month - 1, 1).toISOString()
  const timeMax = new Date(year, month, 1).toISOString() // 1er du mois suivant

  const accessToken = await getAccessToken(serviceAccountEmail, privateKey)

  const encodedCalendarId = encodeURIComponent(calendarId)
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=500`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`[bs-calendar] Erreur API Google Calendar: ${res.status} — ${err}`)
  }

  const data: GoogleCalendarResponse = await res.json()
  const items = data.items ?? []

  return items
    .filter((e) => e.summary && (e.start?.date || e.start?.dateTime))
    .map((e): EvenementCalendrier => {
      const titre = e.summary!.trim()
      const avecHeure = !!e.start?.dateTime // dateTime = événement avec heure (demi-journée potentielle)

      let date: string
      if (avecHeure) {
        // Événement avec heure : date ISO (YYYY-MM-DD)
        date = e.start!.dateTime!.split("T")[0]
      } else {
        // Événement journée entière : peut être une plage
        const startDate = e.start!.date!
        const endRaw = e.end?.date
        // Google Calendar : end.date est exclusif pour les all-day events
        if (endRaw) {
          const endDate = getPreviousDay(endRaw)
          date = endDate !== startDate ? `${startDate}/${endDate}` : startDate
        } else {
          date = startDate
        }
      }

      return { titre, date, avecHeure }
    })
}

/**
 * Retourne le jour précédent (format YYYY-MM-DD).
 * Nécessaire car Google Calendar renvoie end.date exclusif pour les all-day events.
 */
function getPreviousDay(dateStr: string): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - 1)
  return d.toISOString().split("T")[0]
}

/**
 * Obtient un access token OAuth2 via JWT service account.
 * Utilise le module crypto de Node.js (createSign) — plus fiable que Web Crypto API
 * dans les environnements serverless Next.js / Vercel.
 */
async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url")

  const header = encode({ alg: "RS256", typ: "JWT" })
  const payload = encode({
    iss: email,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })

  const signingInput = `${header}.${payload}`

  // crypto.createSign gère les clés PEM directement, pas besoin de strip manuel
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(signingInput)
  const signature = signer.sign(privateKey, "base64url")

  const jwt = `${signingInput}.${signature}`

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`[bs-calendar] Erreur OAuth2 token: ${tokenRes.status} — ${err}`)
  }

  const tokenData: { access_token: string } = await tokenRes.json()
  return tokenData.access_token
}
