# Translation Reference Files

This document describes the translation reference files used in the MateriaMedica project.

## Overview

All translation files use **Latin botanical names as the primary reference** (source of truth) and map to other languages.

## Files

### 1. PLANT-NAME-TRANSLATIONS.json
**Purpose**: Plant name translations
**Structure**: Latin botanical name → { en, da, fr }
**Count**: 170 plants (all plants in database)

```json
{
  "Allium sativum": {
    "en": "Garlic",
    "da": "Hvidløg",
    "fr": "Ail"
  }
}
```

**Usage**:
- Display plant names in different languages
- Reference for all plant name translations
- Latin name is always the key (source of truth)

### 2. DANISH-TO-ENGLISH-PROPERTIES.json
**Purpose**: Property name translations from Danish (PDF) to English (database)
**Structure**: Danish property name → English property name
**Count**: 100+ property translations

```json
{
  "Adaptogener": "Adaptogen",
  "Anticancer -forebyggende": "Anticancer",
  "Galdedrivende": "Cholagogue"
}
```

**Usage**:
- Translate PDF Danish properties to database English properties
- Source: egenskaber.pdf (Danish)
- Target: plants-data.js (English)

### 3. PDF-NAME-CORRECTIONS.json
**Purpose**: Correct PDF typos in Latin botanical names
**Structure**: PDF typo → Correct database botanical name
**Count**: 85+ corrections

```json
{
  "Allium sativus": "Allium sativum",
  "Tabebuia avellanedae": "Tabebuia impetiginosa",
  "Oreganum vulgare": "Origanum vulgare"
}
```

**Usage**:
- Automatic correction of PDF typos
- Maps incorrect PDF Latin names to correct database names
- Used by verification and fix scripts

### 4. PDF-PROPERTIES-TO-PLANTS.json
**Purpose**: Complete extraction of PDF data
**Structure**: Danish property name → [Latin plant names]
**Count**: 100 properties

```json
{
  "Adaptogener": [
    "Asparagus racemosa",
    "Astragalus membranaceus",
    "Bacopa monnieri"
  ],
  "Anticancer -forebyggende": [
    "Allium sativum",
    "Curcuma longa",
    "Ginkgo biloba"
  ]
}
```

**Usage**:
- Source of truth extracted from egenskaber.pdf
- Used by verification script to check database accuracy
- Used by fix script to correct mismatches

## Verification & Fix Scripts

### verify-against-pdf.cjs
Verifies that plants-data.js matches egenskaber.pdf 100%

```bash
node verify-against-pdf.cjs
```

Output:
- ✅ Plant status verification (enabled/disabled)
- ✅ Property accuracy verification
- 📋 Detailed report saved to verification-report.json

### fix-from-pdf.cjs
Automatically fixes database to match PDF

```bash
node fix-from-pdf.cjs
```

Actions:
- Disables plants not in PDF
- Enables plants from PDF
- Adds missing properties
- Removes incorrect properties

## Workflow

1. **PDF is modified** → Update reference files
2. **Run verification** → `node verify-against-pdf.cjs`
3. **If mismatches found** → `node fix-from-pdf.cjs`
4. **Confirm 100% match** → Verification shows ✅

## Language Priorities

1. **Latin** - Primary reference (botanical names)
2. **Danish** - Source for property names (egenskaber.pdf)
3. **English** - Database language (plants-data.js)
4. **French** - Supplementary translations

## Key Principle

> **Latin botanical names are always the source of truth for plant identification.**
> All other names (English, Danish, French) are translations that reference the Latin name.
