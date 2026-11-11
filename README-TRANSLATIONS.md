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
- Source: Egenskaber PDF (Danish)
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
- Generated from the Egenskaber PDF by tools/sync-from-pdf.py

## Sync Tool

`tools/sync-from-pdf.py` reads the reference PDF (`Egenskaber*.pdf` in the project folder, kept out of git) and makes the database match it. It needs only the Python and Swift that come with the macOS developer tools.

```bash
python3 tools/sync-from-pdf.py --check   # show differences, write nothing
python3 tools/sync-from-pdf.py           # apply them
```

It updates `plants-data.js` (properties and status), `PDF-PROPERTIES-TO-PLANTS.json`, `PDF-MASTER-PLANT-LIST.txt`, `PLANT-NAME-TRANSLATIONS.json` and the Botanical Name / Properties sections of `plants/*.html`.

If the PDF has a heading or plant name it doesn't know, it stops without writing anything and says what to add.

## Workflow

1. **PDF is edited** → save it in the project folder as `Egenskaber….pdf`
2. **Check** → `python3 tools/sync-from-pdf.py --check`
3. **New heading?** → add it to `DANISH-TO-ENGLISH-PROPERTIES.json` and its Danish/French labels to `i18n.js`
4. **New spelling of a known plant?** → add it to `PDF-NAME-CORRECTIONS.json`
5. **New plant?** → add it to `plants-data.js` and create its page in `plants/`
6. **Apply** → `python3 tools/sync-from-pdf.py`

## Writing Text on Plant Pages

Headings, labels, names, properties and family switch language automatically.
For text you write yourself, put one paragraph per language; only the active one is shown:

```html
<p data-lang="en"><strong>Sunlight:</strong> Prefers partial shade.</p>
<p data-lang="da"><strong>Lys:</strong> Foretrækker halvskygge.</p>
<p data-lang="fr"><strong>Ensoleillement :</strong> Préfère la mi-ombre.</p>
```

Plant names (English, Danish, French) are edited in `plants-data.js` only; the pages read them from there.

## Language Priorities

1. **Latin** - Primary reference (botanical names)
2. **Danish** - Source for property names (Egenskaber PDF)
3. **English** - Database language (plants-data.js)
4. **French** - Supplementary translations

## Key Principle

> **Latin botanical names are always the source of truth for plant identification.**
> All other names (English, Danish, French) are translations that reference the Latin name.
