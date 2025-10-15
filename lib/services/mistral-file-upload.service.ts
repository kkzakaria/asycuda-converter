import type { Mistral } from "@mistralai/mistralai";
import { getMistralClient, MISTRAL_OCR_LIMITS } from "@/lib/config/mistral.config";
import type { UploadedFileInfo } from "@/lib/types/rfcv-ocr.types";

/**
 * Service d'upload de fichiers vers Mistral OCR
 */

/**
 * Vérifie si la taille du fichier est dans les limites autorisées
 *
 * @param sizeBytes - Taille du fichier en bytes
 * @returns true si la taille est valide
 */
function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes <= MISTRAL_OCR_LIMITS.MAX_FILE_SIZE_BYTES;
}

/**
 * Vérifie si l'extension du fichier est supportée
 *
 * @param fileName - Nom du fichier
 * @returns true si l'extension est supportée
 */
function validateFileExtension(fileName: string): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return false;

  const allSupportedFormats = [
    ...MISTRAL_OCR_LIMITS.SUPPORTED_IMAGE_FORMATS,
    ...MISTRAL_OCR_LIMITS.SUPPORTED_DOCUMENT_FORMATS,
  ] as readonly string[];

  return allSupportedFormats.includes(extension);
}

/**
 * Upload un fichier PDF vers Mistral pour traitement OCR
 *
 * @param fileBuffer - Buffer du fichier à uploader
 * @param fileName - Nom du fichier (doit inclure l'extension)
 * @param client - Client Mistral optionnel (utilise l'instance partagée si non fourni)
 * @returns Informations sur le fichier uploadé
 * @throws {Error} Si le fichier dépasse la limite de taille ou a une extension non supportée
 */
export async function uploadFileForOCR(
  fileBuffer: Buffer,
  fileName: string,
  client?: Mistral
): Promise<UploadedFileInfo> {
  const mistralClient = client ?? getMistralClient();

  // Validation de la taille
  if (!validateFileSize(fileBuffer.length)) {
    throw new Error(
      `Fichier trop volumineux: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB. ` +
        `Limite: ${MISTRAL_OCR_LIMITS.MAX_FILE_SIZE_MB} MB`
    );
  }

  // Validation de l'extension
  if (!validateFileExtension(fileName)) {
    const supportedFormats = [
      ...MISTRAL_OCR_LIMITS.SUPPORTED_IMAGE_FORMATS,
      ...MISTRAL_OCR_LIMITS.SUPPORTED_DOCUMENT_FORMATS,
    ].join(", ");
    throw new Error(
      `Extension de fichier non supportée. Formats supportés: ${supportedFormats}`
    );
  }

  try {
    // Upload du fichier avec purpose "ocr"
    const uploadResponse = await mistralClient.files.upload({
      file: {
        fileName: fileName,
        content: fileBuffer,
      },
      purpose: "ocr",
    });

    return {
      fileUrl: uploadResponse.id, // Mistral utilise l'ID comme référence
      fileId: uploadResponse.id,
      fileName: uploadResponse.filename,
      sizeBytes: fileBuffer.length, // Utilise la taille du buffer
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Échec de l'upload du fichier: ${error.message}`);
    }
    throw new Error("Échec de l'upload du fichier: erreur inconnue");
  }
}

/**
 * Upload un fichier depuis un chemin local
 *
 * @param filePath - Chemin vers le fichier
 * @param client - Client Mistral optionnel
 * @returns Informations sur le fichier uploadé
 */
export async function uploadFileFromPath(
  filePath: string,
  client?: Mistral
): Promise<UploadedFileInfo> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const fileBuffer = await fs.readFile(filePath);
  const fileName = path.basename(filePath);

  return uploadFileForOCR(fileBuffer, fileName, client);
}
