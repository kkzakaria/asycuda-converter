import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Configuration pour Google Gemini Vision API
 *
 * Gemini 2.5 Flash est utilisé comme modèle par défaut pour:
 * - Meilleur rapport qualité/prix ($0.315/M tokens input)
 * - Vitesse élevée (2-3s par document)
 * - Bonne précision pour documents structurés
 *
 * Alternative: gemini-2.5-pro pour cas complexes (coût supérieur)
 */

/**
 * Instance du client Gemini AI
 *
 * Nécessite la variable d'environnement GOOGLE_AI_API_KEY
 *
 * @example
 * ```bash
 * # Dans .env.local
 * GOOGLE_AI_API_KEY=your_api_key_here
 * ```
 */
let geminiClientInstance: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClientInstance) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GOOGLE_AI_API_KEY manquante. Ajoutez-la à votre fichier .env.local"
      );
    }

    geminiClientInstance = new GoogleGenerativeAI(apiKey);
  }

  return geminiClientInstance;
}

/**
 * Configuration des modèles Gemini disponibles
 */
export const GEMINI_MODELS = {
  /**
   * Gemini 2.5 Flash - Recommandé pour extraction RFCV
   * - Prix: $0.315/M input, $2.625/M output
   * - Vitesse: Très rapide (2-3s)
   * - Performance: Très bonne pour documents structurés
   */
  FLASH: "gemini-2.0-flash-exp",

  /**
   * Gemini 2.5 Pro - Pour cas complexes uniquement
   * - Prix: $1.3125/M input, $10.50/M output
   * - Performance: Excellente
   * - Utiliser si Flash insuffisant
   */
  PRO: "gemini-2.0-exp",
} as const;

/**
 * Modèle par défaut utilisé pour l'extraction RFCV
 */
export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS.FLASH;

/**
 * Configuration des limites Gemini
 */
export const GEMINI_LIMITS = {
  /**
   * Taille maximale d'image supportée
   */
  MAX_FILE_SIZE_MB: 20,
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024,

  /**
   * Formats supportés
   */
  SUPPORTED_MIME_TYPES: ["application/pdf", "image/png", "image/jpeg"],

  /**
   * Timeout pour les requêtes API (ms)
   */
  REQUEST_TIMEOUT_MS: 120000, // 2 minutes
} as const;

/**
 * Configuration de génération par défaut
 */
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0, // Déterministe pour extraction de données
  topK: 1,
  topP: 1,
  maxOutputTokens: 8192, // Suffisant pour RFCV complet
} as const;
