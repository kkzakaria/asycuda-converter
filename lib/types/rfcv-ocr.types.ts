import type { z } from "zod";
import type { RFCVDocument } from "@/lib/schemas/rfcv.schema";

/**
 * Types pour le service d'extraction OCR de documents RFCV
 */

/**
 * Résultat d'une extraction OCR réussie
 */
export interface RFCVExtractionSuccess {
  success: true;
  data: RFCVDocument;
  metadata: {
    extractionDate: string;
    processingTimeMs: number;
    pageCount?: number;
  };
}

/**
 * Détails d'une erreur de validation Zod
 */
export interface ValidationErrorDetail {
  path: string[];
  message: string;
  code: string;
}

/**
 * Résultat d'une extraction OCR échouée
 */
export interface RFCVExtractionFailure {
  success: false;
  error: {
    type: "VALIDATION_ERROR" | "API_ERROR" | "FILE_ERROR" | "PARSING_ERROR";
    message: string;
    details?: ValidationErrorDetail[] | unknown;
  };
}

/**
 * Résultat d'une extraction OCR (succès ou échec)
 */
export type RFCVExtractionResult =
  | RFCVExtractionSuccess
  | RFCVExtractionFailure;

/**
 * Options pour l'extraction OCR
 */
export interface RFCVOCROptions {
  /**
   * Inclure les images en base64 dans la réponse
   * @default false
   */
  includeImageBase64?: boolean;

  /**
   * Forcer l'utilisation des bbox annotations (utile pour documents > 8 pages)
   * @default false
   */
  forceBboxAnnotations?: boolean;

  /**
   * Timeout personnalisé en millisecondes
   * @default 120000 (2 minutes)
   */
  timeoutMs?: number;

  /**
   * Activer le mode debug avec logging détaillé
   * @default false
   */
  debug?: boolean;
}

/**
 * Informations sur un fichier uploadé
 */
export interface UploadedFileInfo {
  fileUrl: string;
  fileId: string;
  fileName: string;
  sizeBytes: number;
}

/**
 * Format d'erreur Zod pour messages utilisateur
 */
export function formatZodErrors(
  zodError: z.ZodError
): ValidationErrorDetail[] {
  return zodError.issues.map((err) => ({
    path: err.path.map(String),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Vérifie si un résultat est un succès
 */
export function isExtractionSuccess(
  result: RFCVExtractionResult
): result is RFCVExtractionSuccess {
  return result.success === true;
}

/**
 * Vérifie si un résultat est un échec
 */
export function isExtractionFailure(
  result: RFCVExtractionResult
): result is RFCVExtractionFailure {
  return result.success === false;
}
