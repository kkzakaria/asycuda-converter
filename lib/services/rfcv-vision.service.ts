import {
  getGeminiClient,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GENERATION_CONFIG,
  GEMINI_LIMITS,
} from "@/lib/config/gemini.config";
import { rfcvSchema } from "@/lib/schemas/rfcv.schema";
import type {
  RFCVExtractionResult,
  RFCVOCROptions,
  ValidationErrorDetail,
} from "@/lib/types/rfcv-ocr.types";
import { formatZodErrors } from "@/lib/types/rfcv-ocr.types";
import { normalizeRFCVData } from "@/lib/utils/rfcv-normalizers";

/**
 * Service d'extraction de documents RFCV avec Gemini Vision
 *
 * Utilise l'approche vision directe (PDF → Gemini → JSON structuré)
 * au lieu de l'approche hybride OCR→Chat de Mistral.
 *
 * Avantages:
 * - Vision directe du PDF structuré (pas de perte d'information)
 * - Meilleure extraction des tableaux complexes
 * - Rapport qualité/prix optimal avec Gemini 2.5 Flash
 */

/**
 * Construit le prompt d'extraction pour Gemini Vision
 *
 * Réutilise le prompt détaillé optimisé pour l'extraction RFCV
 */
function buildExtractionPrompt(): string {
  return `Tu es un expert en extraction de données de documents douaniers ivoiriens RFCV.

CONTEXTE:
Ce document est un RFCV (Rapport Final de Classification et de Valeur) émis par la DGD-DARRV
(Direction Générale des Douanes - Direction de l'Analyse des Risques et du Renseignement sur la Valeur)
de la République de Côte d'Ivoire.

OBJECTIF CRITIQUE:
Extraire TOUTES les informations du document avec une PRÉCISION MAXIMALE. Chaque champ manquant
causera un échec de validation. Tu dois être EXHAUSTIF et MÉTICULEUX.

📍 LOCALISATION DES CHAMPS DANS LE DOCUMENT:

HAUT DU DOCUMENT (Section 1):
- Nom et Adresse de l'Importateur (encadré 1)
- Code importateur (dans la section importateur)
- Nom et Adresse de l'Exportateur (encadré 2)
- Pays de l'exportateur (sous l'adresse exportateur)

SECTION TRANSPORT (Encadré 3 - Détails Transport):
- Mode de Transport (ex: Transport maritime)
- No. (LTA/Connaissement/CMR) - OBLIGATOIRE
- Date de (LTA/Connaissement/CMR) - OBLIGATOIRE
- No. de LCL (numérique)
- No. de FCL (numérique)
- No. (Vol/Voyage/Transport routier) - OBLIGATOIRE (souvent "No. (Maison Airway Bill/HBL)")
- Transporteur ID - OBLIGATOIRE
- Lieu de chargement (code port, ex: CNHUA)
- Lieu de transbordement (optionnel)
- Lieu de déchargement (code port, ex: CIABJ)

SECTION MÉTADONNÉES (Encadré 4, 5, 6):
- No. RFCV (encadré 4)
- Date RFCV (encadré 5)
- Livraison (encadré 6, ex: TOT)

SECTION FDI/DAI (Encadré 7, 8):
- No. FDI/DAI (encadré 7)
- Date FDI/DAI (encadré 8)

SECTION ORIGINE ET PAIEMENT (Encadré 9, 10):
- Pays de provenance (encadré 9)
- Mode de Paiement (encadré 10)

SECTION POIDS (Encadré 11, 12):
- Poids Total NET (KG) (encadré 11)
- Poids Total BRUT (KG) (encadré 12)

SECTION FINANCIÈRE (Encadré 13-23):
- No. Facture (13), Date Facture (14)
- INCOTERM (15) - CFR, FOB ou CIF uniquement
- Code Devise (16), Taux de Change (17)
- Total Facture (18)
- Total Valeur FOB attestée (19)
- Fret Attesté (20)
- Assurance Attestée (21)
- Charges Attestées (22)
- Valeur CIF Attestée (23)

SECTION COLISAGE (Encadré 24):
- Nombre et désignation des marchandises (ex: "1419 CARTONS")

SECTION CONTENEURS (Encadré 26):
- Tableau avec: N, No. Conteneur, Type, Taille, No. Scellé

SECTION ARTICLES (Encadré 26 - Articles):
- Tableau avec colonnes: Quantité, U (Unité Mesure), UTILISÉ, PAYS ORIGINE, Description, Code SH Attesté, Valeurs FOB et taxable
- **CRITIQUE**: Extraire TOUTES les lignes du tableau articles (peut contenir 10+ articles)

BAS DU DOCUMENT:
- TOTAL GÉNÉRAL FOB et TOTAL GÉNÉRAL TAXABLE
- Remarques (section 27, peut être vide)
- numero_reference_document: NUMÉRO EN BAS À DROITE DU DOCUMENT (très important!)

RÈGLES D'EXTRACTION STRICTES:

1. DATES: Format DD/MM/YYYY obligatoire (ex: 26/08/2025, 10/06/2025)
   - Ne pas inverser jour et mois
   - Garder les zéros de tête (ex: 07/08/2025)

2. CODES SH: Format XXXX.XX.XX.XX AVEC LES POINTS (ex: 8714.10.90.00)
   - Ne JAMAIS omettre les points
   - Toujours 10 chiffres séparés en 4 groupes

3. INCOTERMS: Uniquement CFR, FOB ou CIF (majuscules)

4. UTILISATION ARTICLE: "U" (utilisé) ou "N" (non utilisé)
   - Colonne "UTILISÉ" dans le tableau des articles

5. CODES PAYS: Format code ISO 2 lettres (ex: CN pour Chine)
   - Colonne "PAYS ORIGINE" dans le tableau des articles

6. CODES PORTS: Format UN/LOCODE (ex: CIABJ pour Abidjan, CNHUA pour Huangpu)

7. VALEURS NUMÉRIQUES:
   - Toutes les valeurs monétaires >= 0
   - Poids brut >= Poids net
   - Quantités > 0
   - Utiliser le point comme séparateur décimal (ex: 1694.00)

8. ARRAYS - EXTRAIRE TOUS LES ÉLÉMENTS:
   - Articles: Extraire CHAQUE ligne du tableau articles (ne sauter AUCUNE ligne)
   - Conteneurs: Extraire CHAQUE conteneur listé
   - Minimum 1 article et 1 conteneur requis

9. CHAMPS CRITIQUES À NE JAMAIS OUBLIER:
   - numero_reference_document (BAS DU DOCUMENT à droite)
   - mode_transport, numero_connaissement, date_connaissement
   - numero_vol_voyage, transporteur_id
   - Nom, adresse, pays de l'exportateur
   - Description du colisage (ex: "1419 CARTONS")
   - Pays origine pour CHAQUE article (colonne "PAYS ORIGINE")
   - Code SH attesté pour CHAQUE article avec les points
   - TOUS les articles du tableau (ligne par ligne)

10. CHAMPS OPTIONNELS (peuvent être vides):
    - lieu_transbordement
    - remarques

STRUCTURE JSON À RETOURNER:

{
  "document_metadata": {
    "numero_rfcv": "RCS25108567",
    "date_rfcv": "26/08/2025",
    "code_importateur": "2301665J",
    "numero_fdi_dai": "250140921",
    "date_fdi_dai": "21/08/2025",
    "mode_livraison": "TOT",
    "numero_document_reference": "1456940"
  },
  "parties": {
    "importateur": {
      "nom": "BOUAKE COMMERCE SARL",
      "adresse": "BP BOUAKE (VILLE) KOKO -",
      "ville": "BOUAKE",
      "code": "2301665J"
    },
    "exportateur": {
      "nom": "KOLOKELH TRADING FZE",
      "adresse": "Business Centre, Sharjah Publishing City Free Zone, Sharjah,",
      "pays": "Emirats Arabes Unis"
    }
  },
  "origine_et_paiement": {
    "pays_provenance": "Chine",
    "mode_paiement": "Paiement sur compte bancaire"
  },
  "transport": {
    "mode_transport": "Transport maritime",
    "numero_connaissement": "HUA503043300",
    "date_connaissement": "07/08/2025",
    "numero_lcl": 0,
    "numero_fcl": 1,
    "numero_vol_voyage": "000025080601",
    "transporteur_id": "SUI DE YANG 20",
    "lieu_chargement": "CNHUA",
    "lieu_dechargement": "CIABJ"
  },
  "conteneurs": [
    {
      "numero": 1,
      "numero_conteneur": "HPCU4260260",
      "type": "Conteneur 40' High cube",
      "taille": "40'",
      "numero_scelle": "CR0094372"
    }
  ],
  "informations_financieres": {
    "numero_facture": "2025/BC/SN17207",
    "date_facture": "10/06/2025",
    "incoterm": "CFR",
    "devise": {
      "code": "USD",
      "taux_change": 569.84
    },
    "valeurs": {
      "total_facture": 16032.80,
      "total_fob_atteste": 16000.60,
      "fret_atteste": 2000.00,
      "assurance_attestee": 56.11,
      "charges_attestees": 0,
      "valeur_cif_attestee": 18056.71
    }
  },
  "poids": {
    "poids_total_net_kg": 20676.00,
    "poids_total_brut_kg": 21929.00
  },
  "colisage": {
    "nombre_total": 1419,
    "unite": "CARTONS",
    "description": "1419 CARTONS"
  },
  "articles": [
    {
      "numero_article": 1,
      "quantite": 1524.00,
      "unite_mesure": "PC",
      "utilise": "N",
      "pays_origine": "CN",
      "description_marchandises": "MOTORCYCLE CHAIN",
      "code_sh_atteste": "8714.10.90.00",
      "valeur_fob_attestee_devise_transaction": 1694.00,
      "valeur_taxable_devise_transaction": 1911.68
    },
    {
      "numero_article": 2,
      "quantite": 3280.00,
      "unite_mesure": "PC",
      "utilise": "N",
      "pays_origine": "CN",
      "description_marchandises": "COMPLETE MOTORCYCLE STEERING WHEEL",
      "code_sh_atteste": "8714.10.90.00",
      "valeur_fob_attestee_devise_transaction": 2290.40,
      "valeur_taxable_devise_transaction": 2584.72
    }
  ],
  "totaux": {
    "total_general_fob": 16000.60,
    "total_general_taxable": 18056.71
  },
  "numero_reference_document": "1456940"
}

IMPORTANT:
- Respecter EXACTEMENT cette structure
- NE JAMAIS omettre les champs obligatoires
- Extraire TOUS les articles du tableau (pas seulement les 2 premiers!)
- Si un champ est invisible/illisible, mettre "" pour strings ou 0 pour nombres
- VÉRIFIER que numero_reference_document est bien extrait (bas du document)
- Retourner UNIQUEMENT le JSON, sans texte additionnel avant ou après
`;
}

/**
 * Extrait les données RFCV d'un document PDF avec Gemini Vision
 *
 * Approche vision directe: envoie le PDF complet à Gemini qui analyse
 * visuellement le document et extrait les données structurées.
 *
 * @param pdfBuffer - Buffer contenant le PDF du document RFCV
 * @param fileName - Nom du fichier (pour logging)
 * @param options - Options d'extraction
 * @returns Résultat de l'extraction (succès avec données ou échec avec erreurs)
 *
 * @example
 * ```typescript
 * const result = await extractRFCVWithVision(pdfBuffer, "FCVR-188.pdf");
 *
 * if (result.success) {
 *   console.log("RFCV extrait:", result.data);
 *   console.log("Temps:", result.metadata.processingTimeMs, "ms");
 * } else {
 *   console.error("Erreur:", result.error.message);
 *   if (result.error.details) {
 *     console.error("Détails:", result.error.details);
 *   }
 * }
 * ```
 */
export async function extractRFCVWithVision(
  pdfBuffer: Buffer,
  fileName: string = "rfcv.pdf",
  options: RFCVOCROptions = {}
): Promise<RFCVExtractionResult> {
  const startTime = Date.now();

  if (process.env.NODE_ENV === "development" || options.debug) {
    console.log(`📄 [GEMINI] Traitement du fichier: ${fileName}`);
    console.log(`🔧 [GEMINI] Modèle utilisé: ${DEFAULT_GEMINI_MODEL}`);
  }

  try {
    // 1. Validation de la taille du fichier
    if (pdfBuffer.length > GEMINI_LIMITS.MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        error: {
          type: "FILE_ERROR",
          message: `Fichier trop volumineux: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB. Limite: ${GEMINI_LIMITS.MAX_FILE_SIZE_MB} MB.`,
        },
      };
    }

    // 2. Convertir le PDF en base64
    const base64PDF = pdfBuffer.toString("base64");

    if (process.env.NODE_ENV === "development" || options.debug) {
      console.log(
        `📦 [GEMINI] PDF encodé: ${(base64PDF.length / 1024).toFixed(2)} KB`
      );
    }

    // 3. Préparer le prompt d'extraction
    const extractionPrompt = buildExtractionPrompt();

    // 4. Appel à Gemini Vision avec le PDF
    const geminiClient = getGeminiClient();
    const model = geminiClient.getGenerativeModel({
      model: DEFAULT_GEMINI_MODEL,
      generationConfig: {
        ...DEFAULT_GENERATION_CONFIG,
        responseMimeType: "application/json", // Force JSON response
      },
    });

    if (process.env.NODE_ENV === "development" || options.debug) {
      console.log(`🚀 [GEMINI] Envoi requête à Gemini Vision...`);
    }

    const result = await model.generateContent([
      extractionPrompt,
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64PDF,
        },
      },
    ]);

    const response = result.response;
    const content = response.text();

    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: {
          type: "PARSING_ERROR",
          message: "Gemini n'a retourné aucune donnée",
        },
      };
    }

    if (process.env.NODE_ENV === "development" || options.debug) {
      console.log(
        `📨 [GEMINI] Réponse reçue: ${(content.length / 1024).toFixed(2)} KB`
      );
    }

    // 5. Parser le JSON
    let extractedData: unknown;
    try {
      extractedData = JSON.parse(content);
    } catch (parseError) {
      if (process.env.NODE_ENV === "development" || options.debug) {
        console.error(`❌ [GEMINI] Erreur parsing JSON:`, parseError);
        console.error(`📄 [GEMINI] Contenu reçu:`, content.substring(0, 500));
      }

      return {
        success: false,
        error: {
          type: "PARSING_ERROR",
          message: "Impossible de parser la réponse JSON de Gemini",
          details: parseError,
        },
      };
    }

    // 6. Logging de debug de la réponse brute
    if (process.env.NODE_ENV === "development" || options.debug) {
      console.log("🔍 [GEMINI] Réponse JSON brute:");
      console.log(JSON.stringify(extractedData, null, 2));
    }

    // 7. Normalisation des données
    const normalizedData = normalizeRFCVData(extractedData);

    if (process.env.NODE_ENV === "development" || options.debug) {
      console.log("✨ [GEMINI] Données après normalisation:");
      console.log(JSON.stringify(normalizedData, null, 2));
    }

    // 8. Validation avec le schéma Zod
    const validationResult = rfcvSchema.safeParse(normalizedData);

    if (!validationResult.success) {
      const validationErrors: ValidationErrorDetail[] = formatZodErrors(
        validationResult.error
      );

      if (process.env.NODE_ENV === "development" || options.debug) {
        console.error(
          `❌ [GEMINI] Validation échouée: ${validationErrors.length} erreur(s)`
        );
        validationErrors.forEach((err, idx) => {
          console.error(`  ${idx + 1}. ${err.path.join(".")}: ${err.message}`);
        });
      }

      return {
        success: false,
        error: {
          type: "VALIDATION_ERROR",
          message: `Validation Zod échouée: ${validationErrors.length} erreur(s) détectée(s)`,
          details: validationErrors,
        },
      };
    }

    // 9. Succès - retour des données validées
    const processingTime = Date.now() - startTime;

    if (process.env.NODE_ENV === "development" || options.debug) {
      console.log(`✅ [GEMINI] Validation réussie en ${processingTime}ms`);
    }

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
    if (process.env.NODE_ENV === "development" || options.debug) {
      console.error(`❌ [GEMINI] Erreur durant l'extraction:`, error);
    }

    if (error instanceof Error) {
      // Détection du type d'erreur
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("api key") || errorMessage.includes("apikey")) {
        return {
          success: false,
          error: {
            type: "API_ERROR",
            message:
              "Clé API Gemini manquante ou invalide. Vérifiez GOOGLE_AI_API_KEY dans .env.local",
          },
        };
      }

      if (
        errorMessage.includes("rate limit") ||
        errorMessage.includes("quota")
      ) {
        return {
          success: false,
          error: {
            type: "API_ERROR",
            message: "Limite de taux API Gemini atteinte. Réessayez plus tard.",
          },
        };
      }

      if (errorMessage.includes("timeout")) {
        return {
          success: false,
          error: {
            type: "API_ERROR",
            message: "Timeout de la requête Gemini. Le document est peut-être trop complexe.",
          },
        };
      }

      return {
        success: false,
        error: {
          type: "API_ERROR",
          message: `Erreur Gemini: ${error.message}`,
          details: error,
        },
      };
    }

    return {
      success: false,
      error: {
        type: "API_ERROR",
        message: "Erreur inconnue lors de l'extraction avec Gemini Vision",
        details: error,
      },
    };
  }
}

/**
 * Extrait les données RFCV depuis un chemin de fichier local
 *
 * Wrapper de extractRFCVWithVision qui charge le fichier depuis le disque
 *
 * @param filePath - Chemin vers le fichier PDF
 * @param options - Options d'extraction
 * @returns Résultat de l'extraction
 */
export async function extractRFCVFromFileWithVision(
  filePath: string,
  options: RFCVOCROptions = {}
): Promise<RFCVExtractionResult> {
  const fs = await import("fs/promises");
  const path = await import("path");

  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileBaseName = path.basename(filePath);

    return extractRFCVWithVision(fileBuffer, fileBaseName, options);
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
