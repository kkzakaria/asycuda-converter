"use client";

import { useState } from "react";
import {
  AlertCircleIcon,
  FileTextIcon,
  FileUpIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import { useFileUpload, formatBytes } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import { RFCVResultDisplay } from "@/components/rfcv-result-display";
import type { RFCVExtractionResult, ValidationErrorDetail } from "@/lib/types/rfcv-ocr.types";

/**
 * États du processus d'upload et extraction
 */
type ProcessState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "processing" }
  | { status: "success"; result: RFCVExtractionResult }
  | { status: "error"; error: string; details?: ValidationErrorDetail[] | unknown };

/**
 * Type guard pour vérifier si details est un tableau de ValidationErrorDetail
 */
function isValidationErrorArray(details: unknown): details is ValidationErrorDetail[] {
  return Array.isArray(details) && details.length > 0;
}

/**
 * Composant principal pour l'upload et l'extraction de documents RFCV
 */
export function RFCVUpload() {
  const maxSize = 50 * 1024 * 1024; // 50 MB (limite Mistral OCR)
  const [processState, setProcessState] = useState<ProcessState>({
    status: "idle",
  });

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple: false,
    maxSize,
    accept: "application/pdf,.pdf",
  });

  /**
   * Envoie le fichier à l'API pour extraction
   */
  const handleExtractRFCV = async () => {
    if (files.length === 0) return;

    const file = files[0].file;
    if (!(file instanceof File)) return;

    setProcessState({ status: "uploading" });

    try {
      // 1. Créer le FormData
      const formData = new FormData();
      formData.append("file", file);

      // 2. Envoyer à l'API
      setProcessState({ status: "processing" });

      const response = await fetch("/api/rfcv/extract", {
        method: "POST",
        body: formData,
      });

      const result: RFCVExtractionResult = await response.json();

      // 3. Gérer la réponse
      if (result.success) {
        setProcessState({ status: "success", result });
        clearFiles();
      } else {
        setProcessState({
          status: "error",
          error: result.error.message,
          details: result.error.details,
        });
      }
    } catch (error) {
      setProcessState({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Erreur de communication avec le serveur. Veuillez réessayer.",
      });
    }
  };

  /**
   * Réinitialise pour un nouveau document
   */
  const handleNewDocument = () => {
    setProcessState({ status: "idle" });
    clearFiles();
  };

  /**
   * Affiche les résultats en cas de succès
   */
  if (processState.status === "success" && processState.result.success) {
    return (
      <RFCVResultDisplay
        data={processState.result.data}
        processingTimeMs={processState.result.metadata.processingTimeMs}
        onNewDocument={handleNewDocument}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Zone de drop */}
      <div
        role="button"
        onClick={
          processState.status === "idle" || processState.status === "error"
            ? openFileDialog
            : undefined
        }
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        data-disabled={
          processState.status === "uploading" ||
          processState.status === "processing"
            ? true
            : undefined
        }
        className="flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-input p-6 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 data-[disabled=true]:cursor-not-allowed"
      >
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload RFCV PDF"
          disabled={
            processState.status === "uploading" ||
            processState.status === "processing"
          }
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div
            className="mb-3 flex size-14 shrink-0 items-center justify-center rounded-full border bg-background"
            aria-hidden="true"
          >
            {processState.status === "uploading" ||
            processState.status === "processing" ? (
              <Loader2Icon className="size-6 opacity-60 animate-spin" />
            ) : (
              <FileUpIcon className="size-6 opacity-60" />
            )}
          </div>

          {processState.status === "uploading" && (
            <>
              <p className="mb-2 text-base font-semibold">
                Upload en cours...
              </p>
              <p className="text-sm text-muted-foreground">
                Envoi du document au serveur
              </p>
            </>
          )}

          {processState.status === "processing" && (
            <>
              <p className="mb-2 text-base font-semibold">
                Extraction OCR en cours...
              </p>
              <p className="text-sm text-muted-foreground">
                Analyse du document RFCV avec Mistral AI
              </p>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Cela peut prendre jusqu&apos;à 2 minutes
              </p>
            </>
          )}

          {(processState.status === "idle" ||
            processState.status === "error") && (
            <>
              <p className="mb-2 text-base font-semibold">
                Uploader un document RFCV
              </p>
              <p className="mb-3 text-sm text-muted-foreground">
                Glissez-déposez ou cliquez pour parcourir
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 text-xs text-muted-foreground/70">
                <span>Format PDF uniquement</span>
                <span>•</span>
                <span>Limite {formatBytes(maxSize)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Erreurs de validation fichier */}
      {errors.length > 0 && (
        <div
          className="flex items-center gap-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircleIcon className="size-4 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}

      {/* Erreur d'extraction */}
      {processState.status === "error" && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="size-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-destructive mb-1">
                Échec de l&apos;extraction
              </p>
              <p className="text-sm text-destructive/90">
                {processState.error}
              </p>

              {/* Détails d'erreur (si validation Zod) */}
              {isValidationErrorArray(processState.details) ? (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-destructive">
                      Détails des erreurs:
                    </p>
                    <ul className="text-xs text-destructive/80 space-y-0.5 ml-4 list-disc">
                      {processState.details
                        .slice(0, 5)
                        .map((detail, idx) => (
                          <li key={idx}>
                            {detail.path.join(".") || "Inconnu"}:{" "}
                            {detail.message}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
            </div>
          </div>

          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewDocument}
              className="border-destructive/30 hover:bg-destructive/20"
            >
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* Liste des fichiers */}
      {files.length > 0 && processState.status === "idle" && (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 pe-4"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex aspect-square size-11 shrink-0 items-center justify-center rounded border">
                  <FileTextIcon className="size-5 opacity-60" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-sm font-medium">
                    {file.file instanceof File
                      ? file.file.name
                      : file.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(
                      file.file instanceof File
                        ? file.file.size
                        : file.file.size
                    )}
                  </p>
                </div>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                onClick={() => removeFile(file.id)}
                aria-label="Retirer le fichier"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}

          {/* Bouton d'extraction */}
          <div>
            <Button
              size="lg"
              onClick={handleExtractRFCV}
              disabled={files.length === 0}
              className="w-full sm:w-auto"
            >
              Extraire les données RFCV
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
