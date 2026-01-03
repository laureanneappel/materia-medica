# Properties Reference - DO NOT MODIFY WITHOUT USER APPROVAL

## ⚠️ CRITICAL: Source of Truth

**File**: `egenskaber.pdf` (Danish: "properties")

**STATUS**: ✅ Database verified as matching PDF exactly (as of latest commit)

This PDF document is the **SOLE AUTHORITATIVE SOURCE** for:
- All valid medicinal properties
- Correct property names and spelling
- Which plants should have which properties
- Which plants should be enabled vs disabled

## ❌ ABSOLUTE RULES - DO NOT VIOLATE

1. **NEVER add, remove, or modify properties without explicit user instruction**
2. **NEVER enable plants that are not in egenskaber.pdf**
3. **NEVER add properties to plants that are not listed in the PDF**
4. **NEVER change property names, even to "improve" them**
5. **ALWAYS verify against egenskaber.pdf before making ANY changes to properties**

## Database Structure Rules

### Enabled Plants (138 plants)
- **Must have**: All properties listed in egenskaber.pdf for that plant
- **Must not have**: Any properties not in the PDF
- **Status**: "enabled"

### Disabled Plants
- **Should have**: No properties (or minimal/placeholder properties)
- **Status**: "disabled"
- **Only enable when**: User provides verified properties from a trusted source

## When User Requests Changes

If the user asks to add/modify/remove properties:

1. **READ egenskaber.pdf first** to verify the request matches the PDF
2. **If request conflicts with PDF**: Ask user to confirm they want to override the PDF
3. **If adding new properties**: Ask user for source/verification
4. **After changes**: Verify database still matches PDF exactly
5. **Document changes**: Update this file with what was changed and why

## Property Translations

File: `property-statistics-renderer.js`

- English property names must match plants-data.js exactly
- Danish translations must match egenskaber.pdf terminology
- French translations are supplementary

## Verification Commands

To verify database matches PDF:
```bash
# Check that all enabled plants have properties
grep -A 10 '"status": "enabled"' plants-data.js | grep -c "properties"

# Count enabled plants
grep -c '"status": "enabled"' plants-data.js
# Should return: 138
```

## Last Verified

**Date**: 2026-01-03
**Verified by**: Claude Code session
**Result**: ✅ EXACT MATCH - 138 enabled plants, all properties match PDF
**Commits**:
- 9c57cd3: Remove properties not in PDF source
- 2073c7a: Remove non-PDF property Anticancer preventive

## Change Log

### 2026-01-03
- Removed 10 properties not in PDF: Anhidrotic, Antacid, Anti-inflammatory (prostate), Antiparasitic, Antiperspirant, Antipruritic (general), Antiseptic (general), Antithyroid, Antiviral (general), Thyroid regulating
- Consolidated "Analgesic (pain relief)" → "Analgesic"
- Verified all 138 enabled plants match PDF exactly
