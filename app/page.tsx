import { RFCVUpload } from "@/components/rfcv-upload";
import { FileTextIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileTextIcon className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                ASYCUDA Converter
              </h1>
              <p className="text-sm text-muted-foreground">
                Extraction automatique de documents RFCV
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Introduction */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Convertissez vos documents RFCV en JSON
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Extrayez automatiquement les données structurées des Rapports
              Finaux de Classification et de Valeur émis par la DGD-DARRV de
              Côte d&apos;Ivoire
            </p>
          </div>

          {/* Upload Component */}
          <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
            <RFCVUpload />
          </div>

          {/* Features */}
          <div className="grid gap-6 sm:grid-cols-3 text-center pt-8">
            <div className="space-y-2">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Rapide et précis</h3>
              <p className="text-sm text-muted-foreground">
                Extraction OCR avec Mistral AI
                <br />
                Précision de 94.89%
              </p>
            </div>

            <div className="space-y-2">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Validé et structuré</h3>
              <p className="text-sm text-muted-foreground">
                Validation automatique avec Zod
                <br />
                Conformité au schéma RFCV
              </p>
            </div>

            <div className="space-y-2">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Export JSON</h3>
              <p className="text-sm text-muted-foreground">
                Téléchargement instantané
                <br />
                Format compatible ASYCUDA
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>
              Documents RFCV émis par la DGD-DARRV
              <br />
              Direction Générale des Douanes - Direction de l&apos;Analyse des
              Risques et du Renseignement sur la Valeur
            </p>
            <p className="text-xs">
              République de Côte d&apos;Ivoire
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
