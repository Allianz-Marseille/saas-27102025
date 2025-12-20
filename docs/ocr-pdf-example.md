# Exemple d'utilisation de l'API OCR PDF

## Appel depuis le frontend

```typescript
/**
 * Exemple d'appel à l'API OCR PDF
 * 
 * @param file - Fichier PDF à traiter
 * @returns Texte OCR extrait du PDF
 */
async function processPdfOcr(file: File): Promise<string> {
  // Vérifier que c'est bien un PDF
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Le fichier doit être un PDF");
  }

  // Créer le FormData
  const formData = new FormData();
  formData.append("file", file);

  // Appeler l'API
  const response = await fetch("/api/ocr/pdf", {
    method: "POST",
    body: formData,
  });

  // Vérifier la réponse
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Erreur HTTP ${response.status}`);
  }

  // Récupérer le texte OCR
  const data = await response.json();
  
  if (!data.success || !data.text) {
    throw new Error(data.error || "Aucun texte extrait");
  }

  return data.text;
}

// Exemple d'utilisation avec un input file
function PdfOcrUploader() {
  const [loading, setLoading] = React.useState(false);
  const [text, setText] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setText(null);

    try {
      const ocrText = await processPdfOcr(file);
      setText(ocrText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={loading}
      />
      
      {loading && <p>Traitement OCR en cours...</p>}
      
      {error && <p style={{ color: "red" }}>Erreur: {error}</p>}
      
      {text && (
        <div>
          <h3>Texte extrait ({text.length} caractères):</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{text}</pre>
        </div>
      )}
    </div>
  );
}
```

## Exemple avec fetch vanilla JavaScript

```javascript
async function uploadPdfForOcr(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/ocr/pdf", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Erreur ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Erreur OCR:", error);
    throw error;
  }
}

// Utilisation
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      const text = await uploadPdfForOcr(file);
      console.log("Texte OCR:", text);
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
});
```

## Configuration requise

### Variable d'environnement

Ajoutez dans `.env.local` (local) et dans les variables d'environnement Vercel :

```
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Important** : Le JSON doit être sur une seule ligne ou échappé correctement.

### Permissions Google Cloud

Le compte de service doit avoir la permission `Cloud Vision API User` activée.

