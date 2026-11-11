# Tests

Unit tests for the plant data, the translations and the shared helpers.

You don't need these to check the site: `python3 tools/sync-from-pdf.py --check` runs the same data and translation checks (plus the PDF check) without Node.js.

## Running the tests

The tests need [Node.js](https://nodejs.org/). Once it's installed, from the project folder:

```bash
npm install          # first time only
npm run test:run     # run all tests once
npm test             # re-run automatically when files change
```

## What is tested

### Plant data and translations (`data.test.js`)
- Every plant has English, Danish and French names, a family and at least one property
- No duplicate botanical names or page names
- Every plant has a page in `plants/`, and every page belongs to a plant
- Every property and every family has a Danish and French translation in `i18n.js`
- Every label exists in all three languages
- Every plant page loads the data and translation scripts and has the translation hooks
- Text written in several languages on a page has all three versions

### Plant validation (`plant-validation.test.js`)
- Required fields (commonName, botanicalName, fileSlug) and their types
- Plant names with special characters or HTML are escaped safely

### Shared helpers (`utils.test.js`)
- HTML escaping (protection against injected HTML/scripts)
- String and array validation
- Debouncing
- Error and warning logging

## Current results

3 test files, 43 tests, all passing.

## Test framework

- [Vitest](https://vitest.dev/) with jsdom (a simulated browser)
- `tests/setup.js` loads `utils.js` before the tests run
