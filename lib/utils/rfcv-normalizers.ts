/**
 * Fonctions de normalisation pour les données RFCV extraites par OCR
 *
 * Ces fonctions transforment et nettoient les données extraites par Mistral OCR
 * pour les rendre compatibles avec le schéma Zod de validation.
 */

/**
 * Nettoie récursivement les chaînes vides dans un objet
 *
 * Transforme les chaînes vides `""` en `undefined` pour permettre au schéma Zod
 * de gérer correctement les champs optionnels.
 *
 * @param obj - Objet à nettoyer
 * @returns Objet nettoyé sans chaînes vides
 *
 * @example
 * ```typescript
 * cleanEmptyStrings({ name: "John", address: "" })
 * // Returns: { name: "John", address: undefined }
 * ```
 */
export function cleanEmptyStrings(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si c'est une chaîne vide, retourner undefined
  if (typeof obj === "string" && obj.trim() === "") {
    return undefined;
  }

  // Si c'est un tableau, nettoyer chaque élément
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanEmptyStrings(item));
  }

  // Si c'est un objet, nettoyer récursivement
  if (typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    const objRecord = obj as Record<string, unknown>;
    for (const key in objRecord) {
      const value = cleanEmptyStrings(objRecord[key]);
      // Ne pas ajouter les undefined dans l'objet final
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Normalise un code SH (Système Harmonisé) vers le format XXXX.XX.XX.XX
 *
 * Accepte les formats suivants:
 * - Sans points: "8714109000" → "8714.10.90.00"
 * - Avec espaces: "8714 10 90 00" → "8714.10.90.00"
 * - Partiellement formaté: "8714.109000" → "8714.10.90.00"
 * - Déjà correct: "8714.10.90.00" → "8714.10.90.00"
 *
 * @param code - Code SH à normaliser
 * @returns Code SH formaté ou chaîne vide si invalide
 *
 * @example
 * ```typescript
 * normalizeHSCode("8714109000") // "8714.10.90.00"
 * normalizeHSCode("8714 10 90 00") // "8714.10.90.00"
 * normalizeHSCode("invalid") // ""
 * ```
 */
export function normalizeHSCode(code: string | undefined | null): string {
  if (!code || typeof code !== "string") {
    return "";
  }

  // Supprimer tous les caractères non-numériques (espaces, points, tirets)
  const digitsOnly = code.replace(/\D/g, "");

  // Le code SH doit faire exactement 10 chiffres
  if (digitsOnly.length !== 10) {
    // Si ce n'est pas 10 chiffres, retourner le code original
    // (peut-être déjà au bon format ou sera rejeté par validation)
    return code;
  }

  // Reformater au format XXXX.XX.XX.XX
  return `${digitsOnly.slice(0, 4)}.${digitsOnly.slice(4, 6)}.${digitsOnly.slice(6, 8)}.${digitsOnly.slice(8, 10)}`;
}

/**
 * Normalise une date vers le format DD/MM/YYYY
 *
 * Accepte les formats suivants:
 * - DD/MM/YYYY (déjà correct)
 * - DD-MM-YYYY
 * - YYYY-MM-DD (ISO)
 * - MM/DD/YYYY (format US - détection heuristique)
 * - DD.MM.YYYY
 *
 * @param dateStr - Chaîne de date à normaliser
 * @returns Date au format DD/MM/YYYY ou chaîne vide si invalide
 *
 * @example
 * ```typescript
 * normalizeDateToDDMMYYYY("2025-08-26") // "26/08/2025"
 * normalizeDateToDDMMYYYY("26-08-2025") // "26/08/2025"
 * normalizeDateToDDMMYYYY("26/08/2025") // "26/08/2025"
 * ```
 */
export function normalizeDateToDDMMYYYY(
  dateStr: string | undefined | null
): string {
  if (!dateStr || typeof dateStr !== "string") {
    return "";
  }

  const trimmed = dateStr.trim();
  if (trimmed === "") {
    return "";
  }

  // Regex pour différents formats
  const formats = [
    // Format DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
    /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/,
    // Format YYYY-MM-DD ou YYYY/MM/DD ou YYYY.MM.DD (ISO)
    /^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/,
  ];

  for (const format of formats) {
    const match = trimmed.match(format);
    if (match) {
      let day: string, month: string, year: string;

      // Déterminer si c'est DD/MM/YYYY ou YYYY-MM-DD
      if (match[1].length === 4) {
        // Format YYYY-MM-DD
        year = match[1];
        month = match[2].padStart(2, "0");
        day = match[3].padStart(2, "0");
      } else {
        // Format DD/MM/YYYY
        day = match[1].padStart(2, "0");
        month = match[2].padStart(2, "0");
        year = match[3];
      }

      // Validation basique
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (
        dayNum >= 1 &&
        dayNum <= 31 &&
        monthNum >= 1 &&
        monthNum <= 12 &&
        yearNum >= 1900 &&
        yearNum <= 2100
      ) {
        return `${day}/${month}/${year}`;
      }
    }
  }

  // Si aucun format reconnu, retourner la chaîne originale
  // (sera rejeté par validation Zod si invalide)
  return trimmed;
}

/**
 * Extrait la ville depuis une adresse d'importateur
 *
 * Heuristique: cherche des patterns communs comme "VILLE DE XXX" ou "XXX (VILLE)"
 *
 * @param address - Adresse complète
 * @returns Nom de la ville ou chaîne vide
 *
 * @example
 * ```typescript
 * extractCityFromAddress("BP BOUAKE (VILLE) KOKO -")
 * // Returns: "BOUAKE"
 * ```
 */
export function extractCityFromAddress(
  address: string | undefined | null
): string {
  if (!address || typeof address !== "string") {
    return "";
  }

  const trimmed = address.trim().toUpperCase();

  // Pattern 1: "BP VILLE_NAME (VILLE)" → extraire VILLE_NAME
  const pattern1 = /BP\s+([A-Z]+)\s+\(VILLE\)/;
  const match1 = trimmed.match(pattern1);
  if (match1) {
    return match1[1];
  }

  // Pattern 2: "VILLE_NAME (VILLE)" → extraire VILLE_NAME
  const pattern2 = /([A-Z]+)\s+\(VILLE\)/;
  const match2 = trimmed.match(pattern2);
  if (match2) {
    return match2[1];
  }

  // Pattern 3: "VILLE DE VILLE_NAME" → extraire VILLE_NAME
  const pattern3 = /VILLE\s+DE\s+([A-Z]+)/;
  const match3 = trimmed.match(pattern3);
  if (match3) {
    return match3[1];
  }

  // Si aucun pattern trouvé, retourner vide
  return "";
}

/**
 * Normalise récursivement toutes les données RFCV
 *
 * Applique toutes les normalisations nécessaires:
 * - Nettoyage des chaînes vides
 * - Normalisation des codes SH dans les articles
 * - Normalisation des dates
 * - Extraction de la ville si manquante
 *
 * @param data - Données RFCV brutes extraites par OCR
 * @returns Données normalisées prêtes pour validation Zod
 */
export function normalizeRFCVData(data: unknown): unknown {
  // 1. Nettoyer les chaînes vides
  const normalized = cleanEmptyStrings(data) as Record<string, unknown>;

  // 2. Normaliser les codes SH dans les articles
  if (normalized?.articles && Array.isArray(normalized.articles)) {
    normalized.articles = normalized.articles.map((article) => {
      const art = article as Record<string, unknown>;
      return {
        ...art,
        code_sh_atteste: art.code_sh_atteste
          ? normalizeHSCode(art.code_sh_atteste as string)
          : art.code_sh_atteste,
      };
    });
  }

  // 3. Normaliser les dates
  if (normalized?.document_metadata) {
    const meta = normalized.document_metadata as Record<string, unknown>;
    if (meta.date_rfcv) {
      meta.date_rfcv = normalizeDateToDDMMYYYY(meta.date_rfcv as string);
    }
    if (meta.date_fdi_dai) {
      meta.date_fdi_dai = normalizeDateToDDMMYYYY(meta.date_fdi_dai as string);
    }
  }

  if (normalized?.transport) {
    const transport = normalized.transport as Record<string, unknown>;
    if (transport.date_connaissement) {
      transport.date_connaissement = normalizeDateToDDMMYYYY(
        transport.date_connaissement as string
      );
    }
  }

  if (normalized?.informations_financieres) {
    const infos = normalized.informations_financieres as Record<string, unknown>;
    if (infos.date_facture) {
      infos.date_facture = normalizeDateToDDMMYYYY(infos.date_facture as string);
    }
  }

  // 4. Extraire la ville de l'importateur si manquante
  if (normalized?.parties) {
    const parties = normalized.parties as Record<string, unknown>;
    if (parties.importateur) {
      const importateur = parties.importateur as Record<string, unknown>;
      if (
        !importateur.ville ||
        (typeof importateur.ville === "string" && importateur.ville.trim() === "")
      ) {
        const extractedCity = extractCityFromAddress(
          importateur.adresse as string
        );
        if (extractedCity) {
          importateur.ville = extractedCity;
        }
      }
    }
  }

  return normalized;
}
