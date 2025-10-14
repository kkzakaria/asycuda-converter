import { z } from "zod";

/**
 * RFCV (Rapport Final de Classification et de Valeur) Zod Schema
 *
 * Schema de validation pour les documents RFCV émis par la DGD-DARRV
 * (Direction Générale des Douanes - Direction de l'Analyse des Risques et du Renseignement sur la Valeur)
 * République de Côte d'Ivoire
 */

// ============================================================================
// Regex Patterns
// ============================================================================

/**
 * Format de date DD/MM/YYYY
 */
const DATE_PATTERN = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

/**
 * Format code SH (Système Harmonisé): XXXX.XX.XX.XX
 */
const CODE_SH_PATTERN = /^\d{4}\.\d{2}\.\d{2}\.\d{2}$/;

// ============================================================================
// Sub-Schemas
// ============================================================================

/**
 * Métadonnées du document RFCV
 */
export const documentMetadataSchema = z.object({
  numero_rfcv: z.string().min(1, "Numéro RFCV requis"),
  date_rfcv: z.string().regex(DATE_PATTERN, "Format de date invalide (DD/MM/YYYY)"),
  code_importateur: z.string().min(1, "Code importateur requis"),
  numero_fdi_dai: z.string().min(1, "Numéro FDI/DAI requis"),
  date_fdi_dai: z.string().regex(DATE_PATTERN, "Format de date invalide (DD/MM/YYYY)"),
  mode_livraison: z.string().min(1, "Mode de livraison requis"),
  numero_document_reference: z.string().min(1, "Numéro de document de référence requis"),
});

/**
 * Informations importateur
 */
export const importateurSchema = z.object({
  nom: z.string().min(1, "Nom de l'importateur requis"),
  adresse: z.string().min(1, "Adresse requise"),
  ville: z.string().min(1, "Ville requise"),
  code: z.string().min(1, "Code requis"),
});

/**
 * Informations exportateur
 */
export const exportateurSchema = z.object({
  nom: z.string().min(1, "Nom de l'exportateur requis"),
  adresse: z.string().min(1, "Adresse requise"),
  pays: z.string().min(1, "Pays requis"),
});

/**
 * Informations des parties (importateur et exportateur)
 */
export const partiesSchema = z.object({
  importateur: importateurSchema,
  exportateur: exportateurSchema,
});

/**
 * Origine et mode de paiement
 */
export const origineEtPaiementSchema = z.object({
  pays_provenance: z.string().min(1, "Pays de provenance requis"),
  mode_paiement: z.string().min(1, "Mode de paiement requis"),
});

/**
 * Informations de transport
 */
export const transportSchema = z.object({
  mode_transport: z.string().min(1, "Mode de transport requis"),
  numero_connaissement: z.string().min(1, "Numéro de connaissement requis"),
  date_connaissement: z.string().regex(DATE_PATTERN, "Format de date invalide (DD/MM/YYYY)"),
  numero_lcl: z.coerce.number().int().nonnegative("Numéro LCL doit être >= 0"),
  numero_fcl: z.coerce.number().int().nonnegative("Numéro FCL doit être >= 0"),
  numero_vol_voyage: z.string().min(1, "Numéro de vol/voyage requis"),
  transporteur_id: z.string().min(1, "ID transporteur requis"),
  lieu_chargement: z.string().min(1, "Lieu de chargement requis (code port)"),
  lieu_transbordement: z.string().optional(),
  lieu_dechargement: z.string().min(1, "Lieu de déchargement requis (code port)"),
});

/**
 * Informations conteneur
 */
export const conteneurSchema = z.object({
  numero: z.coerce.number().int().positive("Numéro doit être > 0"),
  numero_conteneur: z.string().min(1, "Numéro de conteneur requis"),
  type: z.string().min(1, "Type de conteneur requis"),
  taille: z.string().min(1, "Taille de conteneur requise"),
  numero_scelle: z.string().min(1, "Numéro de scellé requis"),
});

/**
 * Devise
 */
export const deviseSchema = z.object({
  code: z.string().length(3, "Code devise doit faire 3 caractères (ex: USD, EUR)"),
  taux_change: z.coerce.number().positive("Taux de change doit être > 0"),
});

/**
 * Valeurs financières attestées
 */
export const valeursSchema = z.object({
  total_facture: z.coerce.number().nonnegative("Total facture doit être >= 0"),
  total_fob_atteste: z.coerce.number().nonnegative("Total FOB attesté doit être >= 0"),
  fret_atteste: z.coerce.number().nonnegative("Fret attesté doit être >= 0"),
  assurance_attestee: z.coerce.number().nonnegative("Assurance attestée doit être >= 0"),
  charges_attestees: z.coerce.number().nonnegative("Charges attestées doivent être >= 0"),
  valeur_cif_attestee: z.coerce.number().nonnegative("Valeur CIF attestée doit être >= 0"),
});

/**
 * Incoterms valides
 */
export const incotermEnum = z.enum(["CFR", "FOB", "CIF"], {
  errorMap: () => ({ message: "Incoterm doit être CFR, FOB ou CIF" }),
});

/**
 * Informations financières complètes
 */
export const informationsFinancieresSchema = z.object({
  numero_facture: z.string().min(1, "Numéro de facture requis"),
  date_facture: z.string().regex(DATE_PATTERN, "Format de date invalide (DD/MM/YYYY)"),
  incoterm: incotermEnum,
  devise: deviseSchema,
  valeurs: valeursSchema,
});

/**
 * Poids
 */
export const poidsSchema = z.object({
  poids_total_net_kg: z.coerce.number().positive("Poids total net doit être > 0"),
  poids_total_brut_kg: z.coerce.number().positive("Poids total brut doit être > 0"),
}).refine(
  (data) => data.poids_total_brut_kg >= data.poids_total_net_kg,
  {
    message: "Le poids brut doit être >= au poids net",
    path: ["poids_total_brut_kg"],
  }
);

/**
 * Colisage
 */
export const colisageSchema = z.object({
  nombre_total: z.coerce.number().int().positive("Nombre total doit être > 0"),
  unite: z.string().min(1, "Unité requise (ex: CARTONS, PACKAGES)"),
  description: z.string().min(1, "Description requise"),
});

/**
 * Utilisation article (Utilisé/Non utilisé)
 */
export const utiliseEnum = z.enum(["U", "N"], {
  errorMap: () => ({ message: "Utilise doit être 'U' (utilisé) ou 'N' (non utilisé)" }),
});

/**
 * Article (ligne item)
 */
export const articleSchema = z.object({
  numero_article: z.coerce.number().int().positive("Numéro article doit être > 0"),
  quantite: z.coerce.number().positive("Quantité doit être > 0"),
  unite_mesure: z.string().min(1, "Unité de mesure requise (ex: PC, KG, U, PR)"),
  utilise: utiliseEnum,
  pays_origine: z.string().min(1, "Pays d'origine requis (code pays)"),
  description_marchandises: z.string().min(1, "Description des marchandises requise"),
  code_sh_atteste: z.string().regex(
    CODE_SH_PATTERN,
    "Code SH doit être au format XXXX.XX.XX.XX"
  ),
  valeur_fob_attestee_devise_transaction: z.coerce.number().nonnegative(
    "Valeur FOB attestée doit être >= 0"
  ),
  valeur_taxable_devise_transaction: z.coerce.number().nonnegative(
    "Valeur taxable doit être >= 0"
  ),
});

/**
 * Totaux généraux
 */
export const totauxSchema = z.object({
  total_general_fob: z.coerce.number().nonnegative("Total général FOB doit être >= 0"),
  total_general_taxable: z.coerce.number().nonnegative("Total général taxable doit être >= 0"),
});

// ============================================================================
// Main RFCV Schema
// ============================================================================

/**
 * Schéma complet du document RFCV
 */
export const rfcvSchema = z.object({
  document_metadata: documentMetadataSchema,
  parties: partiesSchema,
  origine_et_paiement: origineEtPaiementSchema,
  transport: transportSchema,
  conteneurs: z.array(conteneurSchema).min(1, "Au moins un conteneur requis"),
  informations_financieres: informationsFinancieresSchema,
  poids: poidsSchema,
  colisage: colisageSchema,
  articles: z.array(articleSchema).min(1, "Au moins un article requis"),
  totaux: totauxSchema,
  remarques: z.string().optional(),
  numero_reference_document: z.string().min(1, "Numéro de référence document requis"),
});

// ============================================================================
// TypeScript Types
// ============================================================================

/**
 * Type TypeScript pour le document RFCV complet
 */
export type RFCVDocument = z.infer<typeof rfcvSchema>;

/**
 * Type TypeScript pour les métadonnées du document
 */
export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;

/**
 * Type TypeScript pour un importateur
 */
export type Importateur = z.infer<typeof importateurSchema>;

/**
 * Type TypeScript pour un exportateur
 */
export type Exportateur = z.infer<typeof exportateurSchema>;

/**
 * Type TypeScript pour les parties
 */
export type Parties = z.infer<typeof partiesSchema>;

/**
 * Type TypeScript pour origine et paiement
 */
export type OrigineEtPaiement = z.infer<typeof origineEtPaiementSchema>;

/**
 * Type TypeScript pour le transport
 */
export type Transport = z.infer<typeof transportSchema>;

/**
 * Type TypeScript pour un conteneur
 */
export type Conteneur = z.infer<typeof conteneurSchema>;

/**
 * Type TypeScript pour la devise
 */
export type Devise = z.infer<typeof deviseSchema>;

/**
 * Type TypeScript pour les valeurs financières
 */
export type Valeurs = z.infer<typeof valeursSchema>;

/**
 * Type TypeScript pour les informations financières
 */
export type InformationsFinancieres = z.infer<typeof informationsFinancieresSchema>;

/**
 * Type TypeScript pour le poids
 */
export type Poids = z.infer<typeof poidsSchema>;

/**
 * Type TypeScript pour le colisage
 */
export type Colisage = z.infer<typeof colisageSchema>;

/**
 * Type TypeScript pour un article
 */
export type Article = z.infer<typeof articleSchema>;

/**
 * Type TypeScript pour les totaux
 */
export type Totaux = z.infer<typeof totauxSchema>;

/**
 * Type TypeScript pour les Incoterms
 */
export type Incoterm = z.infer<typeof incotermEnum>;

/**
 * Type TypeScript pour l'utilisation d'un article
 */
export type Utilise = z.infer<typeof utiliseEnum>;
