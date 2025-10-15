"use client";

import { CheckCircle2, Download, FileText, Package, TruckIcon } from "lucide-react";
import type { RFCVDocument } from "@/lib/schemas/rfcv.schema";
import { Button } from "@/components/ui/button";

/**
 * Props pour le composant d'affichage des résultats RFCV
 */
export interface RFCVResultDisplayProps {
  data: RFCVDocument;
  processingTimeMs?: number;
  onNewDocument?: () => void;
}

/**
 * Composant pour afficher les résultats de l'extraction RFCV
 */
export function RFCVResultDisplay({
  data,
  processingTimeMs,
  onNewDocument,
}: RFCVResultDisplayProps) {
  /**
   * Télécharge le JSON structuré
   */
  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `rfcv-${data.document_metadata.numero_rfcv}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header avec succès */}
      <div className="flex items-center gap-3 rounded-lg border bg-green-50 dark:bg-green-950/20 p-4">
        <CheckCircle2 className="size-6 text-green-600 dark:text-green-500 shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-green-900 dark:text-green-100">
            Extraction réussie!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Document RFCV extrait et validé avec succès
            {processingTimeMs && ` en ${(processingTimeMs / 1000).toFixed(2)}s`}
          </p>
        </div>
      </div>

      {/* Statistiques clés */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Numéro RFCV</p>
              <p className="text-lg font-semibold">
                {data.document_metadata.numero_rfcv}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Articles</p>
              <p className="text-lg font-semibold">{data.articles.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <TruckIcon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conteneurs</p>
              <p className="text-lg font-semibold">{data.conteneurs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informations principales */}
      <div className="space-y-4 rounded-lg border bg-background p-6">
        <h4 className="font-semibold text-lg">Informations du document</h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date RFCV</p>
            <p className="text-base">{data.document_metadata.date_rfcv}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Importateur</p>
            <p className="text-base">{data.parties.importateur.nom}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Exportateur</p>
            <p className="text-base">{data.parties.exportateur.nom}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Pays de provenance</p>
            <p className="text-base">{data.origine_et_paiement.pays_provenance}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Incoterm</p>
            <p className="text-base">{data.informations_financieres.incoterm}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Devise</p>
            <p className="text-base">
              {data.informations_financieres.devise.code} (Taux:{" "}
              {data.informations_financieres.devise.taux_change})
            </p>
          </div>
        </div>
      </div>

      {/* Valeurs financières */}
      <div className="space-y-4 rounded-lg border bg-background p-6">
        <h4 className="font-semibold text-lg">Valeurs financières</h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total général FOB
            </p>
            <p className="text-xl font-bold text-primary">
              {data.totaux.total_general_fob.toLocaleString()}{" "}
              {data.informations_financieres.devise.code}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Valeur CIF attestée
            </p>
            <p className="text-xl font-bold text-primary">
              {data.informations_financieres.valeurs.valeur_cif_attestee.toLocaleString()}{" "}
              {data.informations_financieres.devise.code}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Fret attesté
            </p>
            <p className="text-base">
              {data.informations_financieres.valeurs.fret_atteste.toLocaleString()}{" "}
              {data.informations_financieres.devise.code}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Assurance attestée
            </p>
            <p className="text-base">
              {data.informations_financieres.valeurs.assurance_attestee.toLocaleString()}{" "}
              {data.informations_financieres.devise.code}
            </p>
          </div>
        </div>
      </div>

      {/* Liste des articles (aperçu) */}
      <div className="space-y-4 rounded-lg border bg-background p-6">
        <h4 className="font-semibold text-lg">
          Articles ({data.articles.length})
        </h4>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {data.articles.slice(0, 5).map((article) => (
            <div
              key={article.numero_article}
              className="rounded border bg-muted/30 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    Article {article.numero_article}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {article.description_marchandises}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Code SH: {article.code_sh_atteste} • Quantité:{" "}
                    {article.quantite} {article.unite_mesure}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">
                    {article.valeur_fob_attestee_devise_transaction.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">FOB</p>
                </div>
              </div>
            </div>
          ))}
          {data.articles.length > 5 && (
            <p className="text-xs text-center text-muted-foreground py-2">
              ... et {data.articles.length - 5} autres articles
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <Button
          onClick={handleDownloadJSON}
          className="flex-1 sm:flex-none"
          size="lg"
        >
          <Download className="size-4 mr-2" />
          Télécharger JSON
        </Button>

        {onNewDocument && (
          <Button
            onClick={onNewDocument}
            variant="outline"
            className="flex-1 sm:flex-none"
            size="lg"
          >
            Nouveau document
          </Button>
        )}
      </div>
    </div>
  );
}
