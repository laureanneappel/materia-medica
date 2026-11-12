#!/usr/bin/env python3
"""
Sync the database with the reference PDF ("Egenskaber, redigeret ....pdf").

The PDF is the source of truth for:
  - which properties exist (Danish headings)
  - which plants have which properties
  - the botanical names used

Usage (from the project folder):
    python3 tools/sync-from-pdf.py            # finds Egenskaber*.pdf in the project folder
    python3 tools/sync-from-pdf.py file.pdf   # or a given PDF
    python3 tools/sync-from-pdf.py --check    # report differences only, write nothing

What it updates:
  - PDF-PROPERTIES-TO-PLANTS.json   Danish heading -> plant names (as parsed from the PDF)
  - PDF-MASTER-PLANT-LIST.txt       every plant named in the PDF
  - plants-data.js                  properties + status of each plant
  - PLANT-NAME-TRANSLATIONS.json    Latin -> en/da/fr names (regenerated from plants-data.js)
  - pdf-notes.js                    the PDF's notes, e.g. "(kun udvortes)" after a plant, "Samt ..." under a heading

It also checks plants-data.js, i18n.js and the written text in content/*.html.

Lookup tables you maintain by hand:
  - DANISH-TO-ENGLISH-PROPERTIES.json   every PDF heading -> English property name
  - PDF-NAME-CORRECTIONS.json           PDF spelling variants/typos -> name used on the site
  - NOTE-TRANSLATIONS.json              every note in the PDF -> English and French
  - i18n.js PROPERTY_TRANSLATIONS       English property -> Danish label / French label

If the PDF contains a heading or plant the tables don't know, the script stops and
lists it, without writing anything.
"""
import glob
import json
import os
import re
import subprocess
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Lines in the PDF that are notes, not headings or plants.
NOTE_LINE = re.compile(
    r'^(Samt\b|samt\b|Se også|Sammenfatning|Markussen|Medicinske svampe|Flavanoid|'
    r'Anti-allergiske urter|=== PAGE|\d+$)'
)
# Notes that belong to the property heading above them ("Samt ...", "Se også ...")
PROPERTY_NOTE = re.compile(r'^(Samt\b|samt\b|Se også|Flavanoid|Anti-allergiske urter)')


def path(*p):
    return os.path.join(ROOT, *p)


def load_json(name):
    with open(path(name), encoding='utf-8') as f:
        return json.load(f)


def write_json(name, data):
    with open(path(name), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def load_plants():
    raw = open(path('plants-data.js'), encoding='utf-8').read()
    start = raw.index('[')
    end = raw.index('\n];') + 2
    return json.loads(raw[start:end])


def write_plants(plants):
    body = json.dumps(plants, ensure_ascii=False, indent=2)
    with open(path('plants-data.js'), 'w', encoding='utf-8') as f:
        f.write('window.PLANTS_DATA = ' + body + ';\n\n')
        f.write('// Export for use in other modules\n')
        f.write('if (typeof module !== "undefined" && module.exports) {\n')
        f.write('  module.exports = window.PLANTS_DATA;\n')
        f.write('}\n')


def pdf_text(pdf):
    out = subprocess.run(
        ['swift', path('tools', 'pdf-to-text.swift'), pdf],
        capture_output=True, text=True,
    )
    if out.returncode != 0:
        sys.exit('Could not read the PDF:\n' + out.stderr)
    return out.stdout.splitlines()


def norm(s):
    return re.sub(r'\s+', ' ', s).strip().lower()


def clean_name(raw):
    """Remove qualifiers the PDF adds after a plant name."""
    s = re.sub(r'\s*\(.*$', '', raw)          # "Arnica montana (kun udvortes)"
    s = re.sub(r'\s+\S*\)$', '', s)           # "Smilax medica eksem)"
    s = re.sub(r'\s+-\s.*$', '', s)           # "Trifolium pratense - overgangsalder"
    s = re.sub(r',.*$', '', s)                # "Panax ginseng, ældre", "Urtica spp., folia"
    s = re.sub(r'[\s)]+$', '', s)             # "Achillea millefolium )"
    return re.sub(r'\s+', ' ', s).strip()


def plant_note(raw, cleaned):
    """The note the PDF adds after a plant name, e.g. "kun udvortes" in "Arnica montana (kun udvortes)"."""
    rest = raw[len(cleaned):] if raw.startswith(cleaned) else ''
    return re.sub(r'^[\s,\-(]+|[\s,)]+$', '', rest).strip()


def parse(lines, headings):
    """Return {danish heading: [raw plant lines]}, a list of unknown lines and
    {danish heading: [notes under it]}."""
    by_norm = {norm(h): h for h in headings}
    result, unknown, notes = {}, [], {}
    current = None
    i = 0
    lines = [l.strip() for l in lines]
    while i < len(lines):
        line = lines[i]
        nxt = lines[i + 1] if i + 1 < len(lines) else ''
        if not line or NOTE_LINE.match(line):
            if current and PROPERTY_NOTE.match(line):
                notes.setdefault(current, []).append(line)
            i += 1
            continue
        if norm(line + ' ' + nxt) in by_norm:      # heading split over two lines
            current = by_norm[norm(line + ' ' + nxt)]
            result.setdefault(current, [])
            i += 2
            continue
        if norm(line) in by_norm:
            current = by_norm[norm(line)]
            result.setdefault(current, [])
            i += 1
            continue
        if current is None:
            unknown.append(line)
        else:
            result[current].append(line)
        i += 1
    return result, unknown, notes


def i18n_block(source, const, lang):
    """Text of one language block, e.g. PROPERTY_TRANSLATIONS -> da, in i18n.js."""
    start = source.index('const %s = {' % const)
    section = source[start:source.index('\n    };', start)]
    b = section.index('\n        %s: {' % lang)
    return section[b:section.index('\n        },', b)]


def data_problems(plants, pdf_properties):
    """Checks on plants-data.js, i18n.js and content/*.html (the same checks as tests/data.test.js)."""
    problems = []

    # Plants: required fields, no duplicates
    for p in plants:
        for field in ('commonName', 'botanicalName', 'danishName', 'frenchName', 'family', 'fileSlug'):
            if not str(p.get(field) or '').strip():
                problems.append('%s has no %s in plants-data.js' % (p.get('botanicalName') or p.get('fileSlug'), field))
    for field in ('botanicalName', 'fileSlug'):
        values = [p.get(field) for p in plants]
        for v in sorted(set(x for x in values if values.count(x) > 1)):
            problems.append('Two plants in plants-data.js have the same %s: "%s"' % (field, v))

    # Botanical plates: plants-data.js "image" must point to an existing file
    for p in plants:
        if p.get('image') and not os.path.exists(path(p['image'])):
            problems.append('%s: image "%s" does not exist' % (p['botanicalName'], p['image']))
        if p.get('image') and os.path.exists(path(p['image'])):
            thumb = p['image'].replace('images/plants/', 'images/plants/thumbs/')
            if not os.path.exists(path(thumb)):
                problems.append('%s: no small version of the plate for the main page. Run: python3 tools/make-thumbs.py' % p['botanicalName'])
        if p.get('image') and not p.get('imageCredit'):
            problems.append('%s: image has no imageCredit (where it comes from)' % p['botanicalName'])

    # Written text: content/<fileSlug>.html, optional, one per plant
    slugs = {p['fileSlug'] for p in plants}
    sections = {'habitat', 'constituents', 'uses', 'parts-used', 'taste', 'effect', 'references'}
    for f in sorted(glob.glob(path('content', '*.html'))):
        name = os.path.basename(f)
        if name[:-5] not in slugs:
            problems.append('content/%s has no plant in plants-data.js (an iCloud copy, or a removed plant?)' % name)
            continue
        text = open(f, encoding='utf-8').read()
        for section in sorted(set(re.findall(r'<section data-section="([^"]*)"', text)) - sections):
            problems.append('content/%s: unknown section "%s" (use one of: %s)' % (name, section, ', '.join(sorted(sections))))
        counts = {lang: text.count('data-lang="%s"' % lang) for lang in ('en', 'da', 'fr')}
        if len(set(counts.values())) > 1:
            problems.append('content/%s: text written in several languages is incomplete '
                            '(English %d, Danish %d, French %d paragraphs)' % (name, counts['en'], counts['da'], counts['fr']))

    # Translations in i18n.js
    i18n = open(path('i18n.js'), encoding='utf-8').read()
    keys = lambda block, quote: set(re.findall(r'^\s+%s(.+?)%s:' % (quote, quote), block, re.M))
    properties = pdf_properties | {x for p in plants for x in p.get('properties') or []}
    families = {p['family'].split(' (')[0] for p in plants if p.get('family')}
    labels = {lang: keys(i18n_block(i18n, 'TRANSLATIONS', lang), "'") for lang in ('en', 'da', 'fr')}
    for lang, name in (('da', 'Danish'), ('fr', 'French')):
        known = keys(i18n_block(i18n, 'PROPERTY_TRANSLATIONS', lang), '"')
        for x in sorted(properties - known):
            problems.append('Property "%s" has no %s label in i18n.js' % (x, name))
        known = keys(i18n_block(i18n, 'FAMILY_TRANSLATIONS', lang), '"')
        for x in sorted(families - known):
            problems.append('Family "%s" has no %s description in i18n.js' % (x, name))
        for x in sorted(labels['en'] - labels[lang]):
            problems.append('Label "%s" has no %s text in i18n.js' % (x, name))
    return problems


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    check_only = '--check' in sys.argv
    if args:
        pdf = args[0]
    else:
        found = sorted(glob.glob(path('Egenskaber*.pdf')))
        if not found:
            sys.exit('No Egenskaber*.pdf found in the project folder.')
        pdf = found[-1]
    print('Reference PDF:', os.path.basename(pdf))

    da_to_en = {k: v for k, v in load_json('DANISH-TO-ENGLISH-PROPERTIES.json').items() if not k.startswith('_')}
    corrections = {k: v for k, v in load_json('PDF-NAME-CORRECTIONS.json').items() if not k.startswith('_')}
    plants = load_plants()
    by_latin = {p['botanicalName']: p for p in plants}

    sections, unknown_lines, heading_notes = parse(pdf_text(pdf), da_to_en.keys())
    note_tr = {k: v for k, v in load_json('NOTE-TRANSLATIONS.json').items() if not k.startswith('_')}

    problems = []
    if unknown_lines:
        problems.append('Lines before the first heading: %s' % unknown_lines)
    missing_headings = [h for h in da_to_en if h not in sections]
    if missing_headings:
        problems.append('Headings in DANISH-TO-ENGLISH-PROPERTIES.json not found in the PDF: %s' % missing_headings)

    expected = {name: set() for name in by_latin}
    pdf_map = {}
    plant_notes = {}      # botanical name -> {English property: Danish note}
    for heading, raw_names in sections.items():
        en = da_to_en[heading]
        names = []
        for raw in raw_names:
            name = clean_name(raw)
            name = corrections.get(name, name)
            if name not in by_latin:
                problems.append('Unknown plant or heading "%s" (under "%s"). Add it to plants-data.js, '
                                'PDF-NAME-CORRECTIONS.json or DANISH-TO-ENGLISH-PROPERTIES.json.' % (raw, heading))
                continue
            expected[name].add(en)
            note = plant_note(raw, clean_name(raw))
            if note:
                old = plant_notes.setdefault(name, {}).get(en)
                plant_notes[name][en] = note if not old or old == note else old + '; ' + note
            if name not in names:
                names.append(name)
        pdf_map[heading] = sorted(names)

    # The PDF is the reference: every plant on the site must be in it
    for name, props in sorted(expected.items()):
        if not props:
            p = by_latin[name]
            problems.append('"%s" (%s) is no longer in the PDF. Remove it from plants-data.js, and delete '
                            'content/%s.html if it exists (check it for text you want to keep first).' % (name, p['commonName'], p['fileSlug']))

    problems += data_problems(plants, set(da_to_en.values()))

    # Notes from the PDF, with their English and French translations (NOTE-TRANSLATIONS.json)
    def translated(note):
        t = note_tr.get(note)
        if not t or not t.get('en') or not t.get('fr'):
            problems.append('Note "%s" has no English/French translation in NOTE-TRANSLATIONS.json' % note)
            return {'da': note, 'en': note, 'fr': note}
        return {'da': note, 'en': t['en'], 'fr': t['fr']}
    notes_out = {
        'plants': {name: {prop: translated(n) for prop, n in sorted(v.items())} for name, v in sorted(plant_notes.items())},
        'properties': {da_to_en[h]: [translated(n) for n in ns] for h, ns in sorted(heading_notes.items())},
    }
    all_notes = set(n for v in plant_notes.values() for n in v.values()) | set(n for ns in heading_notes.values() for n in ns)
    for unused in sorted(set(note_tr) - all_notes):
        print('  (NOTE-TRANSLATIONS.json has a note no longer in the PDF: "%s")' % unused)

    if problems:
        print('\nSTOPPED - nothing was written:')
        for p in problems:
            print('  -', p)
        sys.exit(1)

    # Report differences
    changed = 0
    for p in plants:
        new = sorted(expected[p['botanicalName']])
        old = sorted(p.get('properties') or [])
        status = 'enabled' if new else 'disabled'
        if new != old or p.get('status') != status:
            changed += 1
            added = sorted(set(new) - set(old))
            removed = sorted(set(old) - set(new))
            print('  %-45s +%s -%s%s' % (p['botanicalName'], added, removed,
                  '' if p.get('status') == status else '  [%s]' % status))
            p['properties'] = new
            p['status'] = status
    print('\n%d plants changed, %d properties, %d plants in the PDF.' % (
        changed, len(sections), sum(1 for v in expected.values() if v)))

    if check_only:
        return

    write_json('PDF-PROPERTIES-TO-PLANTS.json', pdf_map)
    with open(path('pdf-notes.js'), 'w', encoding='utf-8') as f:
        f.write('// Generated by tools/sync-from-pdf.py from the reference PDF - do not edit by hand.\n')
        f.write('// plants: botanical name -> property -> note; properties: property -> notes. Each note in da/en/fr.\n')
        f.write('window.PDF_NOTES = ' + json.dumps(notes_out, ensure_ascii=False, indent=1) + ';\n')
    write_plants(plants)
    write_json('PLANT-NAME-TRANSLATIONS.json', {
        p['botanicalName']: {'en': p['commonName'], 'da': p.get('danishName', ''), 'fr': p.get('frenchName', '')}
        for p in sorted(plants, key=lambda p: p['botanicalName'])
    })
    in_pdf = sorted(n for n, v in expected.items() if v)
    with open(path('PDF-MASTER-PLANT-LIST.txt'), 'w', encoding='utf-8') as f:
        f.write('PDF MASTER PLANT LIST - %s\n' % os.path.basename(pdf))
        f.write('Total: %d unique botanical plant names\n' % len(in_pdf))
        f.write('Generated: %s by tools/sync-from-pdf.py\n\n' % date.today().isoformat())
        for i, n in enumerate(in_pdf, 1):
            f.write('%d. %s\n' % (i, n))


if __name__ == '__main__':
    main()
