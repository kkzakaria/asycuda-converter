# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ASYCUDA Converter is a Next.js application for converting RFCV (Rapport Final de Classification et de Valeur) PDF documents into XML format compatible with the ASYCUDA customs system used in Côte d'Ivoire.

**Core Purpose**: Parse customs clearance documents (RFCV) from PDF format to structured XML for the Ivorian customs authority's ASYCUDA system.

## Tech Stack

- **Framework**: Next.js 15.5.5 with App Router and React 19
- **Package Manager**: pnpm (NOT npm/yarn)
- **UI Library**: Shadcn UI (New York style variant)
- **Styling**: Tailwind CSS v4 with CSS variables
- **Type Safety**: TypeScript with strict mode enabled
- **Validation**: Zod for schema validation (implemented with rfcv.schema.ts)
- **Vision AI**: Google Gemini 2.0 Flash for PDF document extraction (implemented, 71.4% success rate)

## Essential Commands

```bash
# Development
pnpm dev                 # Start dev server with Turbopack on http://localhost:3000

# Production
pnpm build              # Build for production with Turbopack
pnpm start              # Start production server

# Code Quality
pnpm lint               # Run ESLint checks
```

## Architecture & Key Patterns

### Project Structure Philosophy
- **App Router**: All routes defined in `app/` directory following Next.js 15 conventions
- **Component Organization**: Shadcn UI components live in `components/ui/`, custom components in `components/`
- **Type Safety**: Strict TypeScript configuration with `@/*` path alias for clean imports
- **Schema-Driven Development**: `rfcv_schema.json` defines the complete RFCV document structure

### RFCV Schema Understanding

The `rfcv_schema.json` file is central to this application. It defines:

1. **Document Metadata**: RFCV numbers, dates, importer codes, FDI/DAI references
2. **Parties**: Importer and exporter information with addresses
3. **Transport Details**: Shipping methods, container numbers, ports (using UN/LOCODE)
4. **Financial Information**: Invoice details, Incoterms (CFR/FOB/CIF), currency conversions, attestation values
5. **Articles**: Line items with HS codes (format: XXXX.XX.XX.XX), quantities, FOB/taxable values
6. **Totals**: Aggregated financial values for customs declaration

**Important**: RFCV documents are issued by DGD-DARRV (Direction Générale des Douanes - Direction de l'Analyse des Risques et du Renseignement sur la Valeur) and serve as official attestations for customs clearance in Côte d'Ivoire.

### Shadcn UI Integration

The project uses Shadcn UI with specific configuration:
- **Style**: "new-york" variant (cleaner, more modern aesthetic)
- **Icons**: Lucide React
- **Base Color**: Gray
- **Utility Function**: `cn()` helper in `lib/utils.ts` combines clsx + tailwind-merge for conditional classes

When adding new Shadcn components:
```bash
npx shadcn@latest add [component-name]
```

Components will be added to `components/ui/` automatically with proper aliasing.

### Path Aliases

```typescript
@/components  → /components
@/lib         → /lib
@/hooks       → /hooks
@/ui          → /components/ui
```

Always use `@/` imports instead of relative paths for consistency.

## Development Workflow

### Adding New Features

1. **Schema First**: Verify against `rfcv_schema.json` for data structure alignment
2. **Type Definitions**: Create TypeScript types/interfaces matching schema structure
3. **Validation**: Implement Zod schemas for runtime validation
4. **Components**: Build UI with Shadcn components for consistency
5. **Styling**: Use Tailwind with `cn()` utility for conditional classes

### PDF to XML Conversion Pipeline

The current implementation:
1. **Upload**: Accept RFCV PDF documents via API endpoint `/api/rfcv/extract`
2. **Vision Extraction**: Direct PDF → JSON extraction using Google Gemini 2.0 Flash
3. **Normalization**: Data cleaning and formatting (HS codes, dates, empty strings)
4. **Validation**: Validate extracted data against Zod schema (lib/schemas/rfcv.schema.ts)
5. **Transformation**: Convert validated JSON to ASYCUDA-compatible XML (to be implemented)
6. **Download**: Provide XML output for customs system import (to be implemented)

**Key Implementation Details**:
- Service: `lib/services/rfcv-vision.service.ts` (Gemini Vision)
- Config: `lib/config/gemini.config.ts` (API configuration)
- Normalizers: `lib/utils/rfcv-normalizers.ts` (data cleaning)
- Success Rate: 71.4% (5/7 PDFs) with complete article extraction

### Working with RFCV Data

Key considerations when implementing RFCV processing:
- **HS Codes**: Must maintain exact format `XXXX.XX.XX.XX` (10 digits with dots)
- **Currency Handling**: Track both transaction currency and XOF conversion using attestation rates
- **Port Codes**: Use UN/LOCODE format (e.g., CIABJ for Abidjan, CNHUA for Huangpu)
- **Incoterms**: Support CFR, FOB, CIF with proper financial calculations
- **Multiple Articles**: RFCV documents contain multiple line items with distinct HS codes
- **Attestation Values**: FOB, freight, insurance, charges all have "attested" values from DGD-DARRV

## Critical Files

- `rfcv_schema.json`: Complete RFCV document structure definition - **reference this before implementing any data models**
- `components.json`: Shadcn UI configuration - determines component generation behavior
- `lib/utils.ts`: Utility functions including the essential `cn()` helper
- `app/layout.tsx`: Root layout with Geist font configuration and global styles

## Current State

### Completed ✅

- ✅ Next.js 15.5.5 scaffold with App Router and Turbopack
- ✅ Shadcn UI configured (New York style)
- ✅ RFCV schema defined (rfcv_schema.json)
- ✅ Zod validation schema implemented (lib/schemas/rfcv.schema.ts)
- ✅ Google Gemini Vision integration (lib/services/rfcv-vision.service.ts)
- ✅ Data normalization utilities (lib/utils/rfcv-normalizers.ts)
- ✅ API endpoint for PDF extraction (/api/rfcv/extract)
- ✅ **PDF extraction working with 71.4% success rate** (5/7 test documents)
- ✅ **100% article extraction on valid documents** (25/25 articles)

### In Progress ⏳

- ⏳ Frontend upload UI implementation
- ⏳ XML generation from validated JSON
- ⏳ Error handling improvements for edge cases (RFCV TRICYCLE.pdf parsing)

### Performance Metrics

- **Success Rate**: 71.4% (5/7 PDFs validated)
- **Article Extraction**: 100% on valid documents (vs 0% with previous approach)
- **Average Processing Time**: 23.3 seconds per document (-28% vs baseline)
- **Critical Fields**: 71-100% extraction rate (exportateur, transport, codes SH)

### Known Issues

1. **RFCV TRICYCLE.pdf**: JSON parsing error (malformed response from Gemini)
2. **FCVR-189.pdf**: Missing container and weight data (validation errors)

See `claudedocs/gemini-vs-mistral-comparison.md` for detailed performance analysis.

### Environment Variables Required

```bash
# .env.local
GOOGLE_AI_API_KEY=your_api_key_here  # Get from https://aistudio.google.com/apikey
MISTRAL_API_KEY=your_mistral_key     # (legacy, not used with Gemini)
```
