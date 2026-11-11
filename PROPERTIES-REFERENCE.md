# Properties Reference - DO NOT MODIFY WITHOUT USER APPROVAL

## ⚠️ CRITICAL: Source of Truth

**File**: `Egenskaber, redigeret  21.9.26.pdf` (Danish: "properties"), in the project folder, not in git

**STATUS**: ✅ Database verified as matching PDF exactly (as of latest commit)

This PDF document is the **SOLE AUTHORITATIVE SOURCE** for:
- All valid medicinal properties
- Correct property names and spelling
- Which plants should have which properties
- Which plants should be enabled vs disabled

## ❌ ABSOLUTE RULES - DO NOT VIOLATE

1. **NEVER add, remove, or modify properties without explicit user instruction**
2. **NEVER enable plants that are not in the Egenskaber PDF**
3. **NEVER add properties to plants that are not listed in the PDF**
4. **NEVER change property names, even to "improve" them**
5. **ALWAYS verify against the Egenskaber PDF before making ANY changes to properties**
6. **NEVER commit or push without explicit user approval**
7. **Commit messages: VERY SHORT, NO Claude attribution, NO emojis**

## Database Structure Rules

### Enabled Plants (142 plants)
- **Must have**: All properties listed in the Egenskaber PDF for that plant
- **Must not have**: Any properties not in the PDF
- **Status**: "enabled"
- Exact count verified against PDF extraction

### Disabled Plants
- **Should have**: No properties (or minimal/placeholder properties)
- **Status**: "disabled"
- **Only enable when**: User provides verified properties from a trusted source

## When User Requests Changes

If the user asks to add/modify/remove properties:

1. **READ the Egenskaber PDF first** to verify the request matches the PDF
2. **If request conflicts with PDF**: Ask user to confirm they want to override the PDF
3. **If adding new properties**: Ask user for source/verification
4. **After changes**: Verify database still matches PDF exactly
5. **Document changes**: Update this file with what was changed and why

## Translation Files

### Property Translations
Files: `i18n.js` (PROPERTY_TRANSLATIONS) and `DANISH-TO-ENGLISH-PROPERTIES.json`

- English property names must match plants-data.js exactly
- Danish translations must match the Egenskaber PDF terminology
- French translations are supplementary
- Danish → English mapping in DANISH-TO-ENGLISH-PROPERTIES.json (canonical source)
- Inverted English → Danish/French maps live in i18n.js PROPERTY_TRANSLATIONS

### Plant Name Translations
File: `PLANT-NAME-TRANSLATIONS.json`

- **Latin botanical names as keys** (source of truth)
- English common names (en)
- Danish names (da)
- French names (fr)
- All translations extracted from plants-data.js
- 170 plants total (enabled + disabled)

## Verification Commands

```bash
python3 tools/sync-from-pdf.py --check
# Should end with: 0 plants changed
```

## Last Verified

**Date**: 2026-11-11
**Result**: ✅ Database matches `Egenskaber, redigeret  21.9.26.pdf` (100 properties, 157 plants)
**Verification Command**: `python3 tools/sync-from-pdf.py --check`

## Change Log

### 2026-01-03 - Morning Session
- Removed 10 properties not in PDF: Anhidrotic, Antacid, Anti-inflammatory (prostate), Antiparasitic, Antiperspirant, Antipruritic (general), Antiseptic (general), Antithyroid, Antiviral (general), Thyroid regulating
- Consolidated "Analgesic (pain relief)" → "Analgesic"
- Verified all 138 enabled plants match PDF exactly

### 2026-01-03 - Afternoon Session: 100% PDF Match Achievement
**Systematic PDF extraction and verification:**
- ✅ Extracted complete PDF data (100 Danish properties → Latin plant names)
- ✅ Created DANISH-TO-ENGLISH-PROPERTIES.json (100 property translations)
- ✅ Created PDF-NAME-CORRECTIONS.json (corrects 85+ PDF typos)
- ✅ Created automated verification script (verify-against-pdf.cjs)
- ✅ Created automated fix script (fix-from-pdf.cjs)
- ✅ Applied 38 comprehensive fixes to plants-data.js:
  - Enabled 14 plants from PDF
  - Added missing properties to 23 plants
  - Removed incorrect properties from 10 plants
  - Fixed Tabebuia impetiginosa properties (all PDF typo variants)
- ✅ Created PLANT-NAME-TRANSLATIONS.json (170 plants: Latin → EN/DA/FR)

**Final verification: DATABASE MATCHES PDF 100%**
**Total changes: 38 fix operations across database**

### 2026-01-03 - Evening Update
**Botanical name standardization:**
- ✅ Changed "Matricaria chamomilla" → "Chamomilla recutita" (PDF name)
- ✅ Updated PDF-NAME-CORRECTIONS.json to map "Matricaria recutita" → "Chamomilla recutita"
- ✅ Regenerated PLANT-NAME-TRANSLATIONS.json with correct reference
- ✅ Verified database still matches PDF 100%

**Rationale**: Chamomilla recutita and Matricaria chamomilla are the same plant. Using the PDF's Latin name (Chamomilla recutita) as the authoritative reference ensures consistency with source document.

**Additional correction:**
- ✅ Disabled "Anthemis nobilis/Chamaemelum nobile" (Roman Chamomile) - not in PDF
- ✅ Removed all properties from Roman Chamomile
- ✅ Verified database still matches PDF 100%

**Note**: Roman Chamomile (Anthemis nobilis/Chamaemelum nobile) and German Chamomile (Chamomilla recutita) are different plants. Only German Chamomile appears in the Egenskaber PDF.

### 2026-11-11 - Sync with "Egenskaber, redigeret 21.9.26"
- Replaced the old Node scripts with `tools/sync-from-pdf.py` (no Node needed)
- 97 plants updated to the new PDF; Picrorrhiza kurroa removed (no longer in the PDF)
- Rule: every plant on the site must be in the PDF; the sync tool stops if one is not
- Property headings renamed as in the PDF: "Aldosereduktase hæmmende…", "Immunhæmmende/ved overaktivt", "Krampeløsnende, luft, mens., tarm"
- Removed (no longer in the PDF): Antiinflammatoriske (udvortes), Blodtrykssænkende
- Added: Thyroidea-hæmmende, mildt; Thyroidea-stimulerende, mildt
- "Analgetika" (Analgesic) and "Smertestillende" (Pain relieving) are now separate, as in the PDF
- Botanical names now follow the PDF (e.g. Matricaria chamomilla, Cimicifuga racemosa, Echinacea purpurea, Rosmarinus officinalis/Salvia rosmarinus, Tabebuia avellanedae, Urtica spp.); only clear typos are corrected
- Different species are no longer merged: added Salvia miltiorrhiza, Viburnum prunifolium, Panax notoginseng, Inula racemosa, Berberis aristata / vulgaris / arter, Cinnamomum aromaticum / arter, Urtica spp.
- New plants from the PDF: Aesculus hippocastanum, Cannabis sativa, Citrus x paradisi, Fragaria x ananassa, Ribes nigrum
