/**
 * Utilitaires pour le traitement des images dans l'assistant IA
 */

export interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

/**
 * Optimise une image (redimensionne si nécessaire, compresse en JPEG)
 * @param file Fichier image à optimiser
 * @returns Fichier optimisé
 */
export async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (typeof window === "undefined") {
          resolve(file);
          return;
        }
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Redimensionner si nécessaire (max 2048x2048)
        if (width > 2048 || height > 2048) {
          const ratio = Math.min(2048 / width, 2048 / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Essayer WebP d'abord, fallback sur JPEG
        let supportsWebP = false;
        try {
          const testWebP = canvas.toDataURL("image/webp");
          supportsWebP = testWebP.indexOf("data:image/webp") === 0;
        } catch (e) {
          supportsWebP = false;
        }

        const mimeType = supportsWebP ? "image/webp" : "image/jpeg";
        const quality = supportsWebP ? 0.85 : 0.9;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, supportsWebP ? ".webp" : ".jpg"), {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          mimeType,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convertit une liste d'images en Base64
 * @param images Liste d'images à convertir
 * @returns Tableau de chaînes Base64
 */
export async function convertImagesToBase64(images: ImageFile[]): Promise<string[]> {
  const base64Images: string[] = [];
  for (const img of images) {
    const reader = new FileReader();
    const promise = new Promise<string>((resolve) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
    });
    reader.readAsDataURL(img.file);
    const base64 = await promise;
    base64Images.push(base64);
  }
  return base64Images;
}

/**
 * Traite des fichiers et crée des objets ImageFile
 * @param files Fichiers à traiter
 * @returns Tableau d'ImageFile
 */
export async function processImageFiles(files: File[]): Promise<ImageFile[]> {
  const imageFiles: ImageFile[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      continue;
    }

    if (file.size > 5 * 1024 * 1024) {
      continue;
    }

    // Optimiser l'image
    const optimizedFile = await optimizeImage(file);

    // Créer la prévisualisation
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(optimizedFile);
    });

    imageFiles.push({
      file: optimizedFile,
      preview,
      id: `${Date.now()}-${Math.random()}`,
    });
  }

  return imageFiles;
}

