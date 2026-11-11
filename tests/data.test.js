/**
 * Tests for the real plant data (plants-data.js) and its translations (i18n.js).
 * Agreement with the reference PDF itself is checked by tools/sync-from-pdf.py.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(root, file), 'utf-8');

const dataSource = read('plants-data.js');
const plants = JSON.parse(dataSource.slice(dataSource.indexOf('['), dataSource.indexOf('\n];') + 2));
const i18n = read('i18n.js');
const pages = readdirSync(join(root, 'plants')).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5));

const sectionOf = (name) => {
    const start = i18n.indexOf(`const ${name} = {`);
    return i18n.slice(start, i18n.indexOf('\n    };', start));
};
const blockOf = (section, lang) => {
    const start = section.indexOf(`\n        ${lang}: {`);
    return section.slice(start, section.indexOf('\n        },', start));
};
const keysOf = (block) => new Set([...block.matchAll(/^\s+"(.+?)":/gm)].map(m => m[1]));

describe('plants-data.js', () => {
    it('has plants', () => {
        expect(plants.length).toBeGreaterThan(0);
    });

    it('every plant has names in all three languages, a family and properties', () => {
        for (const p of plants) {
            for (const field of ['commonName', 'botanicalName', 'danishName', 'frenchName', 'family', 'fileSlug']) {
                expect(typeof p[field] === 'string' && p[field].trim() !== '', `${p.botanicalName}: ${field}`).toBe(true);
            }
            expect(p.properties.length, `${p.botanicalName}: properties`).toBeGreaterThan(0);
            expect(p.status, `${p.botanicalName}: status`).toBe('enabled');
        }
    });

    it('has no duplicate botanical names or page names', () => {
        const names = plants.map(p => p.botanicalName);
        const slugs = plants.map(p => p.fileSlug);
        expect(new Set(names).size).toBe(names.length);
        expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('every plant has a page, and every page belongs to a plant', () => {
        const slugs = plants.map(p => p.fileSlug).sort();
        expect(pages.sort()).toEqual(slugs);
    });
});

describe('translations in i18n.js', () => {
    const properties = [...new Set(plants.flatMap(p => p.properties))];
    const families = [...new Set(plants.map(p => p.family.split(' (')[0]))];

    for (const lang of ['da', 'fr']) {
        it(`every property has a ${lang} label`, () => {
            const keys = keysOf(blockOf(sectionOf('PROPERTY_TRANSLATIONS'), lang));
            expect(properties.filter(p => !keys.has(p))).toEqual([]);
        });

        it(`every family has a ${lang} description`, () => {
            const keys = keysOf(blockOf(sectionOf('FAMILY_TRANSLATIONS'), lang));
            expect(families.filter(f => !keys.has(f))).toEqual([]);
        });
    }

    it('every label key exists in English, Danish and French', () => {
        const section = sectionOf('TRANSLATIONS');
        const keys = (lang) => new Set([...blockOf(section, lang).matchAll(/^\s+'([\w.]+)':/gm)].map(m => m[1]));
        const en = keys('en');
        expect([...en].filter(k => !keys('da').has(k))).toEqual([]);
        expect([...en].filter(k => !keys('fr').has(k))).toEqual([]);
    });
});

describe('plant pages', () => {
    it('every page loads the data and the page script, and has the translation hooks', () => {
        for (const slug of pages) {
            const html = read(`plants/${slug}.html`);
            for (const needle of ['../plants-data.js', '../plant-page.js', '../i18n.js', 'data-plant="name"',
                                  'data-plant="properties"', 'data-plant="family"', 'footer-placeholder']) {
                expect(html.includes(needle), `${slug}.html: ${needle}`).toBe(true);
            }
        }
    });

    it('text written in several languages has all three versions', () => {
        for (const slug of pages) {
            const html = read(`plants/${slug}.html`);
            const count = (lang) => (html.match(new RegExp(`data-lang="${lang}"`, 'g')) || []).length;
            expect(count('da'), `${slug}.html: Danish paragraphs`).toBe(count('en'));
            expect(count('fr'), `${slug}.html: French paragraphs`).toBe(count('en'));
        }
    });
});
