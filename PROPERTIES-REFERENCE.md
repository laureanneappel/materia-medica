# Properties Reference - DO NOT MODIFY WITHOUT USER APPROVAL

## Source of truth

**File**: `Egenskaber, redigeret  21.9.26.pdf` (Danish: "properties"), in the project folder, not in git

This PDF is the **only authoritative source** for:
- which properties exist, and their names and spelling
- which plants are on the site
- which plants have which properties
- the botanical names used

**Status**: ✅ The database matches the PDF: 157 plants, 100 properties.

## Rules

1. **Never add, remove or change properties without explicit user instruction**
2. **Every plant on the site must be in the PDF**; a plant removed from the PDF is removed from the site
3. **Never give a plant a property the PDF doesn't list for it**
4. **Never change property names**: the Danish names are the PDF headings exactly
5. **Always check against the PDF** before changing anything about properties
6. **Never commit or push without explicit user approval**
7. **Commit messages: very short, no Claude attribution, no emojis**

## Database rules

- Each plant in `plants-data.js` has exactly the properties the PDF lists for it, and `"status": "enabled"`.
- Different species are separate plants, even when they share a genus (e.g. *Salvia officinalis* and *Salvia miltiorrhiza*).
- Spelling variants and typos of the same plant are merged through `PDF-NAME-CORRECTIONS.json`.

## When the user requests changes

1. **Read the PDF first** to check the request matches it
2. **If the request conflicts with the PDF**: ask the user to confirm, or to change the PDF
3. **After changes**: run `python3 tools/sync-from-pdf.py --check` (should report 0 plants changed)
4. **Document changes** in the change log below

## Translation files

See [README-TRANSLATIONS.md](README-TRANSLATIONS.md).

- English property names must match `plants-data.js` exactly
- Danish property labels in `i18n.js` must be the PDF headings exactly
- `DANISH-TO-ENGLISH-PROPERTIES.json` maps each PDF heading to its English name

## Verification

```bash
python3 tools/sync-from-pdf.py --check
# Should end with: 0 plants changed, 100 properties, 157 plants in the PDF.
```

**Last verified**: 2026-11-11, against `Egenskaber, redigeret  21.9.26.pdf`

## Change Log

The January 2026 entries refer to the previous PDF (`egenskaber.pdf`) and to Node scripts that have since been replaced by `tools/sync-from-pdf.py`.

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
- Removed Picrorrhiza kurroa (no longer in the PDF); site now has exactly the 157 PDF plants
- Fixed plant names: "Ashwagandha" (Asparagus racemosa) renamed Shatavari; several Danish/French names corrected
