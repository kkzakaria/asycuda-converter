# Rapport de Test OCR - Documents RFCV

**Date**: 2025-10-15
**Endpoint testé**: `POST http://localhost:3001/api/rfcv/extract`
**Méthode**: curl avec multipart/form-data

## Résumé Exécutif

Sur 7 documents RFCV testés, **seulement 1 document a passé la validation complète** (RFCV TRICYCLE.pdf). Les 6 autres documents présentent des erreurs de validation Zod allant de 12 à 35 erreurs.

### Statistiques Globales

| Document | Status | Nb Erreurs | Temps Traitement | Code HTTP |
|----------|--------|------------|------------------|-----------|
| FCVR-188.pdf | ❌ Échec | 12 | ~46s | 422 |
| FCVR-189.pdf | ❌ Échec | 35 | ~19s | 422 |
| FCVR-190.pdf | ❌ Échec | 25 | ~40s | 422 |
| FCVR-191.pdf | ❌ Échec | 14 | ~27s | 422 |
| FCVR-192.pdf | ❌ Échec | 14 | ~33s | 422 |
| FCVR-193.pdf | ❌ Échec | 12 | ~21s | 422 |
| RFCV TRICYCLE.pdf | ✅ Succès | 0 | ~124s | 200 |

**Taux de succès**: 14.3% (1/7)
**Temps moyen de traitement**: 44 secondes
**Temps médian**: 33 secondes

## Analyse des Erreurs Communes

### 1. Erreurs Systématiques (présentes dans tous les documents échoués)

#### Métadonnées du Document
- `document_metadata.numero_document_reference` - **100% des échecs**
  - Message: "Numéro de document de référence requis"
  - Code: `too_small`

- `numero_reference_document` - **100% des échecs**
  - Message: "Numéro de référence document requis"
  - Code: `too_small`

#### Informations Exportateur
- `parties.exportateur.nom` - **100% des échecs**
  - Message: "Nom de l'exportateur requis"
  - Code: `too_small`

- `parties.exportateur.adresse` - **100% des échecs**
  - Message: "Adresse requise"
  - Code: `too_small`

- `parties.exportateur.pays` - **100% des échecs**
  - Message: "Pays requis"
  - Code: `too_small`

#### Informations Transport
- `transport.mode_transport` - **100% des échecs**
  - Message: "Mode de transport requis"
  - Code: `too_small`

- `transport.numero_connaissement` - **100% des échecs**
  - Message: "Numéro de connaissement requis"
  - Code: `too_small`

- `transport.numero_vol_voyage` - **100% des échecs**
  - Message: "Numéro de vol/voyage requis"
  - Code: `too_small`

#### Colisage
- `colisage.description` - **100% des échecs**
  - Message: "Description requise"
  - Code: `too_small`

### 2. Erreurs Fréquentes (>50% des documents)

#### Formats de Dates
- `transport.date_connaissement` - **~83% des échecs**
  - Message: "Format de date invalide (DD/MM/YYYY)"
  - Code: `invalid_format`
  - Problème: L'OCR ne détecte pas correctement les dates ou les formate mal

#### Identifiant Transporteur
- `transport.transporteur_id` - **~67% des échecs**
  - Message: "ID transporteur requis"
  - Code: `too_small`

### 3. Erreurs Spécifiques aux Documents avec Articles

Pour **FCVR-189.pdf** (35 erreurs) et **FCVR-190.pdf** (25 erreurs):

#### Problèmes sur TOUS les Articles
- `articles[n].pays_origine` - Manquant pour chaque article
  - Message: "Pays d'origine requis (code pays)"
  - Code: `too_small`

- `articles[n].code_sh_atteste` - Format invalide pour chaque article
  - Message: "Code SH doit être au format XXXX.XX.XX.XX"
  - Code: `invalid_format`
  - Problème critique: Le format HS code n'est pas correctement extrait

#### Informations Conteneurs (FCVR-189.pdf uniquement)
- `conteneurs[0].numero` - Numéro doit être > 0
- `conteneurs[0].numero_conteneur` - Requis
- `conteneurs[0].type` - Type de conteneur requis
- `conteneurs[0].taille` - Taille requise
- `conteneurs[0].numero_scelle` - Numéro de scellé requis

#### Informations Financières
- `informations_financieres.date_facture` - Format de date invalide
- `informations_financieres.incoterm` - Doit être CFR, FOB ou CIF

## Causes Probables des Échecs

### 1. **Extraction OCR Incomplète** (🔴 Critique)
L'OCR Mistral n'extrait pas correctement les champs suivants:
- Numéros de référence de documents
- Informations complètes de l'exportateur
- Détails de transport et connaissement
- Description du colisage

**Hypothèses**:
- Position variable de ces champs dans les PDFs
- Format de document légèrement différent entre FCVR-XXX et le document TRICYCLE qui réussit
- OCR ne détecte pas les zones de texte correctement positionnées

### 2. **Format HS Code** (🔴 Critique)
Le code SH attendu: `XXXX.XX.XX.XX` (format avec points)

**Problèmes observés**:
- L'OCR extrait probablement sans points: `XXXXXXXXXX`
- Ou avec un format différent: `XXXX.XXXXXX` ou `XXXX XX XX XX`

**Solution requise**: Post-traitement pour normaliser le format HS code

### 3. **Format Dates** (🟡 Important)
Format attendu: `DD/MM/YYYY`

**Problèmes observés**:
- OCR peut extraire au format US: `MM/DD/YYYY`
- Ou format ISO: `YYYY-MM-DD`
- Ou avec séparateurs différents: `DD-MM-YYYY`

**Solution requise**: Détection et normalisation automatique des formats de dates

### 4. **Valeurs Vides vs Absentes** (🟡 Important)
De nombreux champs retournent des chaînes vides `""` au lieu d'être absents, ce qui déclenche l'erreur `too_small`.

**Solution requise**: Transformation des chaînes vides en `null` ou `undefined` avant validation

## Recommandations Prioritaires

### 🔴 Haute Priorité

1. **Améliorer les Prompts OCR Mistral**
   - Spécifier explicitement les sections attendues dans le prompt
   - Demander un format JSON structuré correspondant exactement au schéma Zod
   - Ajouter des exemples de format attendu dans le prompt système

2. **Normalisation des Codes HS**
   ```typescript
   // Fonction à ajouter dans rfcv-ocr.service.ts
   function normalizeHSCode(code: string): string {
     // Supprimer tous les espaces et points
     const digits = code.replace(/[\s.]/g, '');
     // Reformater au format XXXX.XX.XX.XX
     if (digits.length === 10) {
       return `${digits.slice(0,4)}.${digits.slice(4,6)}.${digits.slice(6,8)}.${digits.slice(8,10)}`;
     }
     return code; // Retourner tel quel si format inattendu
   }
   ```

3. **Normalisation des Dates**
   ```typescript
   function normalizeDateToDDMMYYYY(dateStr: string): string {
     // Tenter de parser différents formats
     // Convertir vers DD/MM/YYYY
     // Retourner format normalisé ou chaîne vide
   }
   ```

4. **Nettoyage des Valeurs Vides**
   ```typescript
   function cleanEmptyStrings(obj: any): any {
     // Parcourir récursivement l'objet
     // Remplacer "" par undefined
     // Permet au schéma Zod de gérer correctement les optionnels
   }
   ```

### 🟡 Priorité Moyenne

5. **Validation Progressive**
   - Séparer la validation en niveaux (critique, important, optionnel)
   - Permettre l'extraction même avec erreurs non-critiques
   - Retourner les données extraites avec warnings au lieu d'erreurs bloquantes

6. **Logging Détaillé**
   - Logger la réponse brute de l'API Mistral avant validation
   - Permettre de debugger les problèmes d'extraction vs validation
   - Sauvegarder les réponses OCR pour analyse

### 🟢 Priorité Basse

7. **Tests Automatisés**
   - Créer des tests unitaires pour les fonctions de normalisation
   - Ajouter des tests d'intégration avec les 7 PDFs existants
   - Suivre le taux de succès de validation dans le temps

8. **Optimisation Performance**
   - Le temps de traitement de 40-120s est acceptable pour l'OCR
   - Envisager un système de cache pour les documents déjà traités
   - Ajouter un indicateur de progression pour l'utilisateur

## Analyse du Document Réussi

**RFCV TRICYCLE.pdf** est le seul document qui passe la validation complète.

**Caractéristiques observées**:
- Temps de traitement: 124 secondes (le plus long)
- Taille: 366KB (le plus volumineux)
- Format potentiellement différent ou plus récent

**Actions**:
1. Examiner manuellement le PDF pour identifier les différences de structure
2. Comparer le résultat JSON extrait avec celui des documents échoués
3. Identifier les patterns d'extraction qui fonctionnent
4. Adapter les prompts OCR pour reproduire le succès sur les autres documents

## Commandes de Test Utilisées

```bash
# Test individuel avec détails complets
curl -X POST http://localhost:3001/api/rfcv/extract \
  -F "file=@PDF-RFCV/FCVR-188.pdf" \
  -s | jq '.'

# Test avec résumé
curl -X POST http://localhost:3001/api/rfcv/extract \
  -F "file=@PDF-RFCV/FCVR-188.pdf" \
  -s | jq '{success, error_count: (.error.details | length // 0), error_message: .error.message}'

# Extraction des détails d'erreur
curl -X POST http://localhost:3001/api/rfcv/extract \
  -F "file=@PDF-RFCV/FCVR-188.pdf" \
  -s | jq '.error.details'
```

## Prochaines Étapes

1. ✅ **Tests OCR complétés** - 7 documents testés, problèmes identifiés
2. ⏳ **Implémenter les fonctions de normalisation** (codes HS, dates)
3. ⏳ **Améliorer les prompts Mistral OCR** pour extraction plus précise
4. ⏳ **Ajouter système de logging** pour debug des réponses OCR
5. ⏳ **Créer tests automatisés** pour vérifier les améliorations
6. ⏳ **Analyser le document TRICYCLE réussi** pour comprendre les différences

---

**Conclusion**: Le service OCR fonctionne techniquement mais nécessite des améliorations significatives dans l'extraction et la normalisation des données pour atteindre un taux de succès acceptable en production.
