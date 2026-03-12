function capitalizeToken(token: string): string {
  if (!token) return "";
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function normalizeWord(word: string): string {
  if (!word) return "";
  return word
    .split(/([\-/'`])/g)
    .map((part) => {
      if (part === "-" || part === "/" || part === "'" || part === "`") return part;
      return capitalizeToken(part);
    })
    .join("");
}

export function normalizeCompanyName(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  return raw
    .split(/\s+/)
    .map((word) => normalizeWord(word))
    .join(" ");
}

export function sanitizeInternetLink(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:") {
      return parsed.toString();
    }
    return "";
  } catch {
    return "";
  }
}
