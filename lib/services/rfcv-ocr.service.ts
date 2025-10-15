import type { Mistral } from "@mistralai/mistralai";
import { getMistralClient, defaultMistralConfig } from "@/lib/config/mistral.config";
import { uploadFileForOCR } from "@/lib/services/mistral-file-upload.service";
import { rfcvSchema } from "@/lib/schemas/rfcv.schema";
import type {
  RFCVExtractionResult,
  RFCVOCROptions,
  ValidationErrorDetail,
} from "@/lib/types/rfcv-ocr.types";
import { formatZodErrors } from "@/lib/types/rfcv-ocr.types";

/**
 * Service d'extraction OCR de documents RFCV avec Mistral AI
 *
 * Ce service utilise l'API Mistral OCR pour extraire les données structurées
 * des documents RFCV (Rapport Final de Classification et de Valeur) émis par
 * la DGD-DARRV en Côte d'Ivoire.
 */

/**
 * Construit le prompt d'extraction pour guider Mistral OCR
 *
 * Ce prompt détaillé aide l'OCR à comprendre la structure RFCV et à extraire
 * les données selon le schéma attendu.
 */
function buildExtractionPrompt(): string {
  return `Tu es un expert en extraction de données de documents douaniers ivoiriens.

CONTEXTE:
Ce document est un RFCV (Rapport Final de Classification et de Valeur) émis par la DGD-DARRV
(Direction Générale des Douanes - Direction de l'Analyse des Risques et du Renseignement sur la Valeur)
de la République de Côte d'Ivoire.

OBJECTIF:
Extraire TOUTES les informations du document de manière structurée selon le schéma JSON fourni.

RÈGLES D'EXTRACTION STRICTES:

1. DATES: Format DD/MM/YYYY obligatoire (ex: 15/03/2025)

2. CODES SH: Format XXXX.XX.XX.XX exactement (ex: 8714.10.90.00)

3. INCOTERMS: Uniquement CFR, FOB ou CIF

4. UTILISATION ARTICLE: "U" (utilisé) ou "N" (non utilisé)

5. CODES PORTS: Format UN/LOCODE (ex: CIABJ, CNHUA)

6. VALEURS NUMÉRIQUES:
   - Toutes les valeurs monétaires doivent être >= 0
   - Poids brut >= Poids net (règle de validation)
   - Quantités doivent être > 0

7. ARRAYS:
   - Extraire TOUS les articles (au moins 1 requis)
   - Extraire TOUS les conteneurs (au moins 1 requis)

8. CHAMPS OPTIONNELS:
   - lieu_transbordement: peut être vide
   - remarques: peut être vide

STRUCTURE À EXTRAIRE:

document_metadata:
  - numero_rfcv
  - date_rfcv (DD/MM/YYYY)
  - code_importateur
  - numero_fdi_dai
  - date_fdi_dai (DD/MM/YYYY)
  - mode_livraison
  - numero_document_reference

parties:
  importateur:
    - nom, adresse, ville, code
  exportateur:
    - nom, adresse, pays

origine_et_paiement:
  - pays_provenance
  - mode_paiement

transport:
  - mode_transport
  - numero_connaissement
  - date_connaissement (DD/MM/YYYY)
  - numero_lcl (integer)
  - numero_fcl (integer)
  - numero_vol_voyage
  - transporteur_id
  - lieu_chargement (code port)
  - lieu_transbordement (optionnel)
  - lieu_dechargement (code port)

conteneurs (array):
  - numero (integer)
  - numero_conteneur
  - type
  - taille
  - numero_scelle

informations_financieres:
  - numero_facture
  - date_facture (DD/MM/YYYY)
  - incoterm (CFR/FOB/CIF)
  - devise:
      code (3 lettres: USD, EUR...)
      taux_change (decimal)
  - valeurs:
      total_facture
      total_fob_atteste
      fret_atteste
      assurance_attestee
      charges_attestees
      valeur_cif_attestee

poids:
  - poids_total_net_kg (decimal > 0)
  - poids_total_brut_kg (decimal > 0, >= poids_net)

colisage:
  - nombre_total (integer > 0)
  - unite (ex: CARTONS, PACKAGES)
  - description

articles (array):
  - numero_article (integer)
  - quantite (decimal > 0)
  - unite_mesure (ex: PC, KG, U, PR)
  - utilise ("U" ou "N")
  - pays_origine (code pays)
  - description_marchandises
  - code_sh_atteste (format: XXXX.XX.XX.XX)
  - valeur_fob_attestee_devise_transaction (decimal >= 0)
  - valeur_taxable_devise_transaction (decimal >= 0)

totaux:
  - total_general_fob (decimal >= 0)
  - total_general_taxable (decimal >= 0)

remarques (optionnel)

numero_reference_document

IMPORTANT:
- Extraire TOUTES les données visibles dans le document
- Respecter EXACTEMENT les formats requis
- Ne pas inventer de données manquantes
- Si un champ obligatoire est introuvable, retourner une chaîne vide "" pour les strings ou 0 pour les nombres
`;
}

/**
 * Extrait les données RFCV d'un document PDF avec Mistral OCR
 *
 * @param pdfBuffer - Buffer contenant le PDF du document RFCV
 * @param fileName - Nom du fichier (optionnel, défaut: "rfcv.pdf")
 * @param options - Options d'extraction OCR
 * @param client - Client Mistral optionnel (utilise l'instance partagée si non fourni)
 * @returns Résultat de l'extraction (succès avec données ou échec avec erreurs)
 *
 * @example
 * ```typescript
 * const result = await extractRFCVFromPDF(pdfBuffer);
 *
 * if (result.success) {
 *   console.log("RFCV extrait:", result.data);
 * } else {
 *   console.error("Erreur:", result.error.message);
 * }
 * ```
 */
export async function extractRFCVFromPDF(
  pdfBuffer: Buffer,
  fileName: string = "rfcv.pdf",
  options: RFCVOCROptions = {},
  client?: Mistral
): Promise<RFCVExtractionResult> {
  const startTime = Date.now();
  const mistralClient = client ?? getMistralClient();

  try {
    // 1. Upload du fichier
    const uploadedFile = await uploadFileForOCR(
      pdfBuffer,
      fileName,
      mistralClient
    );

    // 2. Appel à Mistral OCR avec le schéma Zod
    const extractionPrompt = buildExtractionPrompt();

    const ocrResponse = await mistralClient.chat.complete({
      model: options.timeoutMs
        ? defaultMistralConfig.model
        : defaultMistralConfig.model,
      messages: [
        {
          role: "system",
          content: extractionPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extraire les données RFCV de ce document selon le schéma fourni:",
            },
            {
              type: "image_url",
              imageUrl: `https://api.mistral.ai/v1/files/${uploadedFile.fileId}/content`,
            },
          ],
        },
      ],
      responseFormat: {
        type: "json_object",
      },
      temperature: 0, // Déterministe pour extraction
    });

    // 3. Extraction du JSON de la réponse
    const content = ocrResponse.choices?.[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        error: {
          type: "PARSING_ERROR",
          message: "Aucune réponse reçue de Mistral OCR",
        },
      };
    }

    // Parse le JSON
    let extractedData: unknown;
    try {
      extractedData =
        typeof content === "string" ? JSON.parse(content) : content;
    } catch (parseError) {
      return {
        success: false,
        error: {
          type: "PARSING_ERROR",
          message: "Impossible de parser la réponse JSON de Mistral OCR",
          details: parseError,
        },
      };
    }

    // 4. Validation avec le schéma Zod
    const validationResult = rfcvSchema.safeParse(extractedData);

    if (!validationResult.success) {
      const validationErrors: ValidationErrorDetail[] = formatZodErrors(
        validationResult.error
      );

      return {
        success: false,
        error: {
          type: "VALIDATION_ERROR",
          message: `Validation Zod échouée: ${validationErrors.length} erreur(s) détectée(s)`,
          details: validationErrors,
        },
      };
    }

    // 5. Succès - retour des données validées
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: validationResult.data,
      metadata: {
        extractionDate: new Date().toISOString(),
        processingTimeMs: processingTime,
      },
    };
  } catch (error) {
    // Gestion des erreurs API ou système
    if (error instanceof Error) {
      // Détection du type d'erreur
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("fichier") || errorMessage.includes("file")) {
        return {
          success: false,
          error: {
            type: "FILE_ERROR",
            message: error.message,
          },
        };
      }

      if (
        errorMessage.includes("api") ||
        errorMessage.includes("rate limit") ||
        errorMessage.includes("timeout")
      ) {
        return {
          success: false,
          error: {
            type: "API_ERROR",
            message: `Erreur API Mistral: ${error.message}`,
          },
        };
      }

      return {
        success: false,
        error: {
          type: "API_ERROR",
          message: error.message,
          details: error,
        },
      };
    }

    return {
      success: false,
      error: {
        type: "API_ERROR",
        message: "Erreur inconnue lors de l'extraction OCR",
        details: error,
      },
    };
  }
}

/**
 * Extrait les données RFCV depuis un chemin de fichier local
 *
 * @param filePath - Chemin vers le fichier PDF
 * @param options - Options d'extraction OCR
 * @param client - Client Mistral optionnel
 * @returns Résultat de l'extraction
 */
export async function extractRFCVFromFile(
  filePath: string,
  options: RFCVOCROptions = {},
  client?: Mistral
): Promise<RFCVExtractionResult> {
  const fs = await import("fs/promises");
  const path = await import("path");

  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileName = path.basename(filePath);

    return extractRFCVFromPDF(fileBuffer, fileName, options, client);
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: {
          type: "FILE_ERROR",
          message: `Impossible de lire le fichier: ${error.message}`,
        },
      };
    }

    return {
      success: false,
      error: {
        type: "FILE_ERROR",
        message: "Erreur inconnue lors de la lecture du fichier",
      },
    };
  }
}
