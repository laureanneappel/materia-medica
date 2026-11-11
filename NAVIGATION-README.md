# Navigation

## Main pages

`index.html` and `property-statistics.html` get their menu from `navigation.js`. The links are defined once, in `NAV_ITEMS`:

```javascript
const NAV_ITEMS = [
    { href: 'index.html', label: 'All Plants', i18nKey: 'nav.all', id: 'all' },
    { href: 'property-statistics.html', label: 'Properties', i18nKey: 'nav.properties', id: 'properties' },
];
```

- `navigation.js` replaces `<div id="nav-placeholder"></div>` on the page with the menu.
- The current page's link is highlighted.
- Labels come from `i18n.js` (`i18nKey`), so the menu follows the chosen language; `label` is the English fallback.
- Links keep the chosen language (`?lang=…`).

### Adding a menu link

1. Add an entry to `NAV_ITEMS` in `navigation.js`
2. Add its label in English, Danish and French to `TRANSLATIONS` in `i18n.js`
3. Put `<div id="nav-placeholder"></div>` on the new page and load `navigation.js`

## Plant pages

The plant page (`plant.html?p=<fileSlug>`) has no menu; it uses the **← Back to Plant List** link at the top, which `i18n.js` translates and keeps in the chosen language.

Links to plants are built in one place, `Utils.plantUrl()` in `utils.js`. Old addresses (`plants/<name>.html`) are sent to the new page by `404.html` on GitHub Pages.

## Language buttons

The EN / DA / FR buttons are added to every page by `i18n.js`.

## Footer

`footer.js` replaces `<div id="footer-placeholder"></div>` with the footer and medical disclaimer, translated through `i18n.js`. It's on every page, including the plant page.
