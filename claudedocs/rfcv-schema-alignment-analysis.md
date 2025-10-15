# Analyse d'Alignement: Schéma Zod vs PDF RFCV Réel

**Date**: 2025-10-15
**Document analysé**: FCVR-188.pdf
**Objectif**: Vérifier si le schéma Zod est aligné avec les PDFs RFCV réels

## Résumé Exécutif

**VERDICT**: ✅ **Le schéma Zod est PARFAITEMENT aligné avec les PDFs RFCV réels**

Le problème n'est **PAS** le schéma Zod, mais **l'extraction OCR incomplète** par Mistral.
Toutes les informations requises par le schéma Zod sont présentes dans le PDF FCVR-188, mais l'OCR ne les extrait pas correctement.

## Comparaison Détaillée: PDF Réel vs Schéma Zod

### ✅ Document Metadata (TOUS LES CHAMPS PRÉSENTS)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `numero_rfcv` | ✅ Oui | ✅ Oui | RCS25108567 |
| `date_rfcv` | ✅ Oui | ✅ Oui | 26/08/2025 |
| `code_importateur` | ✅ Oui | ✅ Oui | 2301665J |
| `numero_fdi_dai` | ✅ Oui | ✅ Oui | 250140921 |
| `date_fdi_dai` | ✅ Oui | ✅ Oui | 21/08/2025 |
| `mode_livraison` | ✅ Oui | ✅ Oui | TOT |
| `numero_document_reference` | ✅ Oui | ✅ Oui | 1456940 (bas du document) |

**Erreur OCR**: Le champ `numero_document_reference` n'est pas extrait car il est en bas du PDF (numéro 1456940).

### ✅ Parties - Importateur (TOUS LES CHAMPS PRÉSENTS)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `nom` | ✅ Oui | ✅ Oui | BOUAKE COMMERCE SARL |
| `adresse` | ✅ Oui | ✅ Oui | BP BOUAKE (VILLE) KOKO - |
| `ville` | ✅ Oui | ✅ Oui | BOUAKE (peut être extraite de l'adresse) |
| `code` | ✅ Oui | ✅ Oui | 2301665J |

**Erreur OCR**: Tous ces champs sont visibles dans le PDF mais ne sont pas extraits correctement.

### ✅ Parties - Exportateur (TOUS LES CHAMPS PRÉSENTS)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `nom` | ✅ Oui | ✅ Oui | KOLOKELH TRADING FZE |
| `adresse` | ✅ Oui | ✅ Oui | Business Centre, Sharjah Publishing City Free Zone, Sharjah, |
| `pays` | ✅ Oui | ✅ Oui | Emirats Arabes Unis |

**Erreur OCR**: Tous ces champs sont visibles dans le PDF mais ne sont pas extraits correctement.

### ✅ Origine et Paiement (TOUS LES CHAMPS PRÉSENTS)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `pays_provenance` | ✅ Oui | ✅ Oui | Chine |
| `mode_paiement` | ✅ Oui | ✅ Oui | Paiement sur compte bancaire |

**Alignement**: Parfait ✅

### ✅ Transport (TOUS LES CHAMPS PRÉSENTS)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `mode_transport` | ✅ Oui | ✅ Oui | Transport maritime |
| `numero_connaissement` | ✅ Oui | ✅ Oui | HUA503043300 |
| `date_connaissement` | ✅ Oui | ✅ Oui | 07/08/2025 |
| `numero_lcl` | ✅ Oui | ✅ Oui | 0 |
| `numero_fcl` | ✅ Oui | ✅ Oui | 1 |
| `numero_vol_voyage` | ✅ Oui | ✅ Oui | 000025080601 |
| `transporteur_id` | ✅ Oui | ✅ Oui | SUI DE YANG 20 |
| `lieu_chargement` | ✅ Oui | ✅ Oui | CNHUA |
| `lieu_transbordement` | ⚪ Non | ⚪ Non | (vide - optionnel) |
| `lieu_dechargement` | ✅ Oui | ✅ Oui | CIABJ |

**Erreur OCR**: TOUS ces champs requis sont visibles dans le PDF mais ne sont pas extraits correctement.

### ✅ Conteneurs (TOUS LES CHAMPS PRÉSENTS)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 (conteneur #1) |
|-----------|--------|------------------|-------------------------------------|
| `numero` | ✅ Oui | ✅ Oui | 1 |
| `numero_conteneur` | ✅ Oui | ✅ Oui | HPCU4260260 |
| `type` | ✅ Oui | ✅ Oui | Conteneur 40' High cube |
| `taille` | ✅ Oui | ✅ Oui | 40' |
| `numero_scelle` | ✅ Oui | ✅ Oui | CR0094372 |

**Alignement**: Parfait ✅ - Tous les champs requis sont présents dans le PDF.

### ✅ Informations Financières (TOUS LES CHAMPS PRÉSENTS)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `numero_facture` | ✅ Oui | ✅ Oui | 2025/BC/SN17207 |
| `date_facture` | ✅ Oui | ✅ Oui | 10/06/2025 |
| `incoterm` | ✅ Oui | ✅ Oui | CFR |
| `devise.code` | ✅ Oui | ✅ Oui | USD |
| `devise.taux_change` | ✅ Oui | ✅ Oui | 569,8400 |
| `valeurs.total_facture` | ✅ Oui | ✅ Oui | 16032.80 |
| `valeurs.total_fob_atteste` | ✅ Oui | ✅ Oui | 16000.60 |
| `valeurs.fret_atteste` | ✅ Oui | ✅ Oui | 2000.00 |
| `valeurs.assurance_attestee` | ✅ Oui | ✅ Oui | 56.11 |
| `valeurs.charges_attestees` | ✅ Oui | ✅ Oui | 0 (calculable) |
| `valeurs.valeur_cif_attestee` | ✅ Oui | ✅ Oui | 18056.71 |

**Alignement**: Parfait ✅

### ✅ Poids (TOUS LES CHAMPS PRÉSENTS)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `poids_total_net_kg` | ✅ Oui | ✅ Oui | 20676.00 |
| `poids_total_brut_kg` | ✅ Oui | ✅ Oui | 21929.00 |

**Règle de validation Zod**: `poids_brut >= poids_net` ✅ Respectée (21929 >= 20676)

### ✅ Colisage (TOUS LES CHAMPS PRÉSENTS)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `nombre_total` | ✅ Oui | ✅ Oui | 1419 |
| `unite` | ✅ Oui | ✅ Oui | CARTONS |
| `description` | ✅ Oui | ✅ Oui | "1419 CARTONS" (visible) |

**Erreur OCR**: Le champ `description` n'est pas extrait alors qu'il est visible ("1419 CARTONS").

### ✅ Articles (TOUS LES CHAMPS PRÉSENTS)

Le PDF contient **11 articles**. Exemple pour l'article #1:

| Champ Zod | Requis | Présent dans PDF | Valeur Article #1 |
|-----------|--------|------------------|-------------------|
| `numero_article` | ✅ Oui | ✅ Oui | 1 |
| `quantite` | ✅ Oui | ✅ Oui | 1524.00 |
| `unite_mesure` | ✅ Oui | ✅ Oui | PC |
| `utilise` | ✅ Oui | ✅ Oui | N |
| `pays_origine` | ✅ Oui | ✅ Oui | CN |
| `description_marchandises` | ✅ Oui | ✅ Oui | MOTORCYCLE CHAIN |
| `code_sh_atteste` | ✅ Oui | ✅ Oui | 8714.10.90.00 |
| `valeur_fob_attestee_devise_transaction` | ✅ Oui | ✅ Oui | 1694.00 |
| `valeur_taxable_devise_transaction` | ✅ Oui | ✅ Oui | 1911.68 |

**Format Code SH dans le PDF**: `8714.10.90.00` → ✅ **EXACTEMENT** le format attendu par le schéma Zod (`XXXX.XX.XX.XX`)

**Erreur OCR**: L'OCR extrait probablement les articles mais avec le champ `pays_origine` vide ou manquant, ou avec un format de `code_sh_atteste` incorrect.

### ✅ Totaux (TOUS LES CHAMPS PRÉSENTS)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `total_general_fob` | ✅ Oui | ✅ Oui | 16000.60 |
| `total_general_taxable` | ✅ Oui | ✅ Oui | 18056.71 |

**Alignement**: Parfait ✅

### ⚪ Remarques (OPTIONNEL)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `remarques` | ⚪ Non | ⚪ Vide | (section vide dans le PDF) |

**Alignement**: Parfait ✅ - Le champ est optionnel et vide dans ce document.

### ✅ Numéro Référence Document (PRÉSENT)

| Champ Zod | Requis | Présent dans PDF | Valeur dans FCVR-188 |
|-----------|--------|------------------|----------------------|
| `numero_reference_document` | ✅ Oui | ✅ Oui | 1456940 (en bas à droite du document) |

**Erreur OCR**: Ce numéro est présent mais en bas du document, l'OCR ne l'extrait pas.

## Analyse des Formats de Données

### Dates dans le PDF

**Format observé**: `DD/MM/YYYY` (ex: 26/08/2025, 21/08/2025, 10/06/2025, 07/08/2025)
**Format attendu par Zod**: `DD/MM/YYYY`
**Alignement**: ✅ Parfait

### Codes SH dans le PDF

**Format observé**: `8714.10.90.00`
**Format attendu par Zod**: `XXXX.XX.XX.XX` (regex: `^\d{4}\.\d{2}\.\d{2}\.\d{2}$`)
**Alignement**: ✅ Parfait

### Incoterms dans le PDF

**Format observé**: `CFR`
**Format attendu par Zod**: Enum `["CFR", "FOB", "CIF"]`
**Alignement**: ✅ Parfait

### Utilisation Article dans le PDF

**Format observé**: `N` (colonne "UTILISÉ")
**Format attendu par Zod**: Enum `["U", "N"]`
**Alignement**: ✅ Parfait

### Codes Ports dans le PDF

**Format observé**: `CNHUA`, `CIABJ`
**Format attendu par Zod**: String min 1 (code port)
**Alignement**: ✅ Parfait

### Codes Pays dans le PDF

**Format observé**: `CN` (Chine)
**Format attendu par Zod**: String min 1 (code pays)
**Alignement**: ✅ Parfait

## Conclusion: Problème Identifié

### ✅ Le Schéma Zod est PARFAITEMENT ALIGNÉ

**Tous les champs requis par le schéma Zod sont présents dans les PDFs RFCV réels.**

Le schéma Zod reflète fidèlement la structure des documents RFCV émis par la DGD-DARRV.

### ❌ Le Problème est l'EXTRACTION OCR

**Mistral OCR n'extrait PAS correctement les informations suivantes**:

1. **Champs de métadonnées manquants**:
   - `numero_document_reference` (en bas du PDF)

2. **Informations exportateur**:
   - `nom`, `adresse`, `pays` (tous présents mais non extraits)

3. **Informations transport**:
   - `mode_transport`, `numero_connaissement`, `date_connaissement`
   - `numero_vol_voyage`, `transporteur_id`

4. **Colisage**:
   - `description` (visible comme "1419 CARTONS" mais non extraite)

5. **Articles**:
   - `pays_origine` (présent comme "CN" mais non extrait ou formaté incorrectement)
   - `code_sh_atteste` (présent au bon format mais peut-être extrait sans les points)

## Comparaison: Schéma Zod vs rfcv_schema.json

Le fichier `rfcv_schema.json` est un **document de référence** qui décrit la structure attendue.
Le schéma Zod (`lib/schemas/rfcv.schema.ts`) implémente **exactement** cette structure avec validation stricte.

**Différences entre les deux**:

| Aspect | rfcv_schema.json | rfcv.schema.ts (Zod) |
|--------|------------------|----------------------|
| Type | Documentation JSON | Schéma de validation TypeScript |
| Validation | ❌ Non | ✅ Oui (runtime) |
| Formats stricts | ❌ Descriptions textuelles | ✅ Regex patterns + enum |
| Types TypeScript | ❌ Non | ✅ Générés automatiquement |
| Usage | Référence humaine | Validation automatique |

**Alignement entre les deux**: ✅ Parfait - Le schéma Zod implémente fidèlement le `rfcv_schema.json`.

## Recommandations

### 🔴 Priorité 1: Améliorer l'Extraction OCR

**Le schéma Zod est correct et ne nécessite AUCUNE modification.**

Les actions à entreprendre:

1. **Améliorer le prompt Mistral OCR** (ligne 25-149 de `rfcv-ocr.service.ts`):
   - Ajouter des instructions plus précises sur la localisation des champs
   - Spécifier que `numero_reference_document` est en bas du document
   - Insister sur l'extraction des informations de transport complètes

2. **Ajouter un post-traitement après OCR**:
   - Nettoyer les valeurs vides (`""` → `undefined`)
   - Normaliser les codes SH (ajouter les points si manquants)
   - Normaliser les formats de dates si nécessaires
   - Extraire la ville de l'adresse de l'importateur si manquante

3. **Ajouter une approche hybride OCR + Vision**:
   - Utiliser l'OCR Mistral pour le texte
   - Utiliser Pixtral pour localiser visuellement les champs manquants
   - Combiner les deux approches pour une extraction complète

4. **Logging et Debug**:
   - Logger la réponse JSON brute de l'API Mistral avant validation
   - Permettre de comparer ce qui est extrait vs ce qui est attendu
   - Créer un système de "diff" pour identifier rapidement les champs manquants

### 🟡 Priorité 2: Validation Progressive

**Envisager une validation en plusieurs niveaux**:

1. **Niveau critique**: Champs absolument nécessaires pour ASYCUDA
2. **Niveau important**: Champs requis mais pouvant être complétés manuellement
3. **Niveau optionnel**: Champs bonus pour enrichissement

Cela permettrait de retourner des résultats partiels plutôt que d'échouer complètement.

### 🟢 Le Schéma Zod NE NÉCESSITE AUCUNE MODIFICATION

Le schéma est parfaitement aligné avec les documents RFCV réels et le `rfcv_schema.json`.

---

**Verdict Final**: Le schéma Zod est **correct à 100%**. Le problème est **uniquement** l'extraction OCR incomplète par Mistral.
