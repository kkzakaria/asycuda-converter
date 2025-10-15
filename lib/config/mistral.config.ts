import { Mistral } from "@mistralai/mistralai";

/**
 * Configuration Mistral OCR
 *
 * Configure le client Mistral AI pour l'extraction OCR de documents RFCV
 */

/**
 * Options de configuration pour le client Mistral
 */
export interface MistralConfig {
  apiKey: string;
  model: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Configuration par défaut pour Mistral OCR
 */
export const defaultMistralConfig: Omit<MistralConfig, "apiKey"> = {
  model: "mistral-ocr-latest",
  timeout: 120000, // 2 minutes
  maxRetries: 3,
};

/**
 * Crée et configure une instance du client Mistral
 *
 * @param config - Configuration optionnelle (utilise les valeurs par défaut si non fourni)
 * @returns Instance configurée du client Mistral
 * @throws {Error} Si MISTRAL_API_KEY n'est pas définie dans l'environnement
 */
export function createMistralClient(
  config?: Partial<MistralConfig>
): Mistral {
  const apiKey = config?.apiKey ?? process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error(
      "MISTRAL_API_KEY est requise. Définissez-la dans vos variables d'environnement."
    );
  }

  return new Mistral({
    apiKey,
  });
}

/**
 * Instance partagée du client Mistral (lazy-loaded)
 */
let mistralClientInstance: Mistral | null = null;

/**
 * Récupère l'instance partagée du client Mistral
 *
 * @returns Instance du client Mistral
 */
export function getMistralClient(): Mistral {
  if (!mistralClientInstance) {
    mistralClientInstance = createMistralClient();
  }
  return mistralClientInstance;
}

/**
 * Limites de l'API Mistral OCR
 */
export const MISTRAL_OCR_LIMITS = {
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  MAX_PAGES_DOCUMENT_ANNOTATION: 8,
  SUPPORTED_IMAGE_FORMATS: ["png", "jpeg", "jpg", "avif"],
  SUPPORTED_DOCUMENT_FORMATS: ["pdf", "pptx", "docx"],
} as const;
