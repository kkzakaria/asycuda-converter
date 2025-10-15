import { NextRequest, NextResponse } from "next/server";
import { extractRFCVFromPDF } from "@/lib/services/rfcv-ocr.service";
import { MISTRAL_OCR_LIMITS } from "@/lib/config/mistral.config";

/**
 * API Route pour l'extraction OCR de documents RFCV
 *
 * POST /api/rfcv/extract
 * Content-Type: multipart/form-data
 * Body: { file: File }
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Récupération du fichier depuis FormData
    const formData = await request.formData();
    const file = formData.get("file");

    // Validation du fichier
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "FILE_ERROR",
            message: "Aucun fichier fourni. Veuillez uploader un document RFCV.",
          },
        },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "FILE_ERROR",
            message: "Format de fichier invalide.",
          },
        },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "FILE_ERROR",
            message: `Type de fichier non supporté: ${file.type}. Seuls les fichiers PDF sont acceptés.`,
          },
        },
        { status: 400 }
      );
    }

    // Validation de la taille
    if (file.size > MISTRAL_OCR_LIMITS.MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "FILE_ERROR",
            message: `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)} MB. Limite: ${MISTRAL_OCR_LIMITS.MAX_FILE_SIZE_MB} MB.`,
          },
        },
        { status: 400 }
      );
    }

    // 2. Conversion File → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Appel au service d'extraction OCR
    const result = await extractRFCVFromPDF(buffer, file.name);

    // 4. Retour du résultat
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      // Erreur d'extraction (validation, API, parsing)
      const statusCode =
        result.error.type === "VALIDATION_ERROR"
          ? 422 // Unprocessable Entity
          : result.error.type === "API_ERROR"
            ? 503 // Service Unavailable
            : 500; // Internal Server Error

      return NextResponse.json(result, { status: statusCode });
    }
  } catch (error) {
    // Erreur inattendue
    console.error("Erreur API /api/rfcv/extract:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          type: "API_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Erreur serveur inattendue lors de l'extraction RFCV.",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler pour CORS (si nécessaire)
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
