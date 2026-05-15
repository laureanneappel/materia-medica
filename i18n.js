/**
 * Internationalization module
 * Handles language selection via ?lang= URL parameter, with localStorage fallback.
 * Exposes window.I18n with: getLang, setLang, t, withLang, applyTranslations.
 */

(function() {
    'use strict';

    const SUPPORTED = ['en', 'da', 'fr'];
    // Default UI language when the user has no preference set. Danish matches the
    // source PDF (egenskaber.pdf).
    const DEFAULT_LANG = 'da';
    // Language that plant data (properties, families, commonName) is stored in.
    // This is separate from DEFAULT_LANG so that switching the default UI language
    // doesn't break property/family translation lookups.
    const DATA_LANG = 'en';
    // Fallback for missing translation keys — English has full coverage.
    const FALLBACK_LANG = 'en';
    const STORAGE_KEY = 'mm_lang';

    const TRANSLATIONS = {
        en: {
            'site.title': 'Materia Medica',
            'site.tagline': 'Medicinal Plants',

            'nav.all': 'All Plants',
            'nav.properties': 'Properties',

            'search.placeholder': 'Search by plant name...',
            'search.aria': 'Search plants by name',
            'filter.property.label': 'Filter by property:',
            'filter.property.placeholder': 'Select a property...',
            'filter.family.label': 'Filter by family:',
            'filter.family.placeholder': 'Select a family...',
            'results.all': 'Showing all plants',

            'back.list': '← Back to Plant List',
            'lang.picker.label': 'Language',

            'filter.clearAll': 'Clear All',
            'results.allCount': 'Showing all {count} plants',
            'results.partial': 'Showing {count} of {total} plants',
            'results.empty': 'No plants found matching your criteria.',

            'props.pageTitle': 'Medicinal Property Statistics',
            'props.stats.unique': 'Unique Properties',
            'props.stats.withProps': 'Plants with Properties',
            'props.stats.total': 'Total Plants',
            'props.search.placeholder': 'Search properties or plants...',
            'props.table.property': 'Property',
            'props.table.count': 'Count',
            'props.table.plants': 'Plants',
            'props.loading': 'Loading properties...',
        },
        da: {
            'site.title': 'Materia Medica',
            'site.tagline': 'Lægeplanter',

            'nav.all': 'Alle planter',
            'nav.properties': 'Egenskaber',

            'search.placeholder': 'Søg efter plantenavn...',
            'search.aria': 'Søg planter efter navn',
            'filter.property.label': 'Filtrér efter egenskab:',
            'filter.property.placeholder': 'Vælg en egenskab...',
            'filter.family.label': 'Filtrér efter familie:',
            'filter.family.placeholder': 'Vælg en familie...',
            'results.all': 'Viser alle planter',

            'back.list': '← Tilbage til planteliste',
            'lang.picker.label': 'Sprog',

            'filter.clearAll': 'Ryd alle',
            'results.allCount': 'Viser alle {count} planter',
            'results.partial': 'Viser {count} af {total} planter',
            'results.empty': 'Ingen planter matcher dine kriterier.',

            'props.pageTitle': 'Medicinske egenskaber',
            'props.stats.unique': 'Unikke egenskaber',
            'props.stats.withProps': 'Planter med egenskaber',
            'props.stats.total': 'Planter i alt',
            'props.search.placeholder': 'Søg efter egenskaber eller planter...',
            'props.table.property': 'Egenskab',
            'props.table.count': 'Antal',
            'props.table.plants': 'Planter',
            'props.loading': 'Indlæser egenskaber...',
        },
        fr: {
            'site.title': 'Materia Medica',
            'site.tagline': 'Plantes médicinales',

            'nav.all': 'Toutes les plantes',
            'nav.properties': 'Propriétés',

            'search.placeholder': 'Rechercher par nom de plante...',
            'search.aria': 'Rechercher des plantes par nom',
            'filter.property.label': 'Filtrer par propriété :',
            'filter.property.placeholder': 'Choisir une propriété...',
            'filter.family.label': 'Filtrer par famille :',
            'filter.family.placeholder': 'Choisir une famille...',
            'results.all': 'Affichage de toutes les plantes',

            'back.list': '← Retour à la liste',
            'lang.picker.label': 'Langue',

            'filter.clearAll': 'Tout effacer',
            'results.allCount': 'Affichage des {count} plantes',
            'results.partial': 'Affichage de {count} sur {total} plantes',
            'results.empty': 'Aucune plante ne correspond à vos critères.',

            'props.pageTitle': 'Propriétés médicinales',
            'props.stats.unique': 'Propriétés uniques',
            'props.stats.withProps': 'Plantes avec propriétés',
            'props.stats.total': 'Total des plantes',
            'props.search.placeholder': 'Rechercher des propriétés ou plantes...',
            'props.table.property': 'Propriété',
            'props.table.count': 'Nombre',
            'props.table.plants': 'Plantes',
            'props.loading': 'Chargement des propriétés...',
        },
    };

    // English -> Danish property translations (inverted from DANISH-TO-ENGLISH-PROPERTIES.json).
    // When two Danish terms map to the same English (e.g., "Analgesic"), the modern term is kept.
    const PROPERTY_TRANSLATIONS = {
        da: {
            "Adaptogen": "Adaptogener",
            "Aphrodisiac": "Afrodisiakum",
            "Aldose reductase inhibitor": "Aldosereduktase Hæmmende+andre senskader",
            "Analgesic": "Smertestillende",
            "Antiallergic": "Antiallergiske",
            "Antibacterial": "Antibakterielle",
            "Anticancer": "Anticancer -forebyggende",
            "Antidepressant": "Antidepressive",
            "Antiemetic": "Antiemetika (kvalmestillende)",
            "Anti-inflammatory (general)": "Antiinflammatoriske (generelt)",
            "Anti-inflammatory (musculoskeletal)": "Antiinflammatoriske (bevægapparatet)",
            "Anti-inflammatory (brain)": "Antiinflammatoriske (hjerne)",
            "Anti-inflammatory (cardiovascular)": "Antiinflammatoriske (kredsløb)",
            "Anti-inflammatory (female reproductive)": "Antiinflammatoriske (kvindelige kønsorganer)",
            "Anti-inflammatory (liver)": "Antiinflammatoriske (lever)",
            "Anti-inflammatory (respiratory)": "Antiinflammatoriske (luftveje)",
            "Anti-inflammatory (digestive/mucous membranes/skin)": "Antiinflammatoriske (mave/tarm +slimhinder/hud)",
            "Anti-inflammatory (external)": "Antiinflammatoriske (udvortes)",
            "Anti-inflammatory (urinary)": "Antiinflammatoriske (urinveje)",
            "Anticoagulant": "Antikoagulerende",
            "Antilithic": "Antilitiske (modvirker stendannelse- forebyggende)",
            "Antimicrobial": "Antimikrobiske",
            "Antioxidant": "Antioxidante",
            "Antirheumatic": "Antireumatiske",
            "Antiseptic (urinary)": "Antiseptiske i urinvejene",
            "Antiviral (internal)": "Antivirale (indvortes)",
            "Antiviral (external)": "Antivirale (udvortes)",
            "Appetite stimulant": "Appetitstimulerende",
            "Astringent": "Astringerende",
            "Metabolism raising": "Basalstofskiftet (hæves)",
            "Sedative": "Beroligende",
            "Connective tissue strengthening": "Bindevævsstyrkende",
            "Adrenal tonic": "Binyrebarktonic",
            "Bitter tonic": "Bitter tonics",
            "Vasodilator": "Blodkarudvidende",
            "Blood purifier": "Blodrensende",
            "Hemostatic": "Blodstillende",
            "Blood strengthening": "Blodstyrkende",
            "Blood sugar regulating": "Blodsukkerregulerende",
            "Blood pressure lowering": "Blodtrykssænkende",
            "Blood pressure regulating": "Blodtryksregulerende",
            "Bronchial spasmolytic": "Bronkie spasmolytiske (krampeløsnende)",
            "Carminative": "Carminative",
            "Demulcent": "Emollierende",
            "Fibrinolytic": "Fibrinmodvirkende (protein medvirkende i blodets størkningsproces)",
            "Cholagogue": "Galdedrivende",
            "Choleretic": "Galdestimulerende",
            "Healing": "Helende",
            "Cardioprotective": "Hjertebeskyttende",
            "Heart tonic": "Hjertetonics",
            "Expectorant": "Hostemidler (ekspektorente)",
            "Immunosuppressive": "Immunhæmmende",
            "Immunomodulating": "Immunregulerende",
            "Interferon stimulating": "Interferon fremmende",
            "Cholesterol lowering": "Kolesterolnedsættende",
            "Anticonvulsant (epilepsy)": "Krampeløsende (epilepsi)",
            "Antispasmodic": "Krampeløsnende",
            "Circulatory stimulant": "Kredsløbsstimulerende",
            "Woman tonic": "Kvindetonics",
            "Antipruritic (external)": "Kløestillende (udvortes)",
            "Laxative": "Laxative",
            "Hepatoprotective": "Leverbeskyttende",
            "Liver regenerating": "Levercellehelende",
            "Uterine contracting": "Livmodersammentrækkende",
            "Uterine tonic": "Livmodertonics",
            "Male tonic": "Mandetonics",
            "Emmenagogue": "Menstruationsregulerende",
            "Galactagogue": "Mælkedrivende (oxytoksin stimulerende)",
            "Galactofuge": "Mælkehæmmende",
            "Nerve tonic": "Nervetonic",
            "Nootropic": "Nootropiske (hjerneforstærkere)",
            "Kidney tonic": "Nyretonic",
            "Prostate growth inhibiting": "Prostata vækst-hæmmende",
            "Mucolytic": "Slimdrivende",
            "Mucostatic (lower respiratory)": "Slimhæmmende (nedre luftveje)",
            "Mucostatic (upper respiratory)": "Slimhæmmende (øvre luftveje)",
            "Mucous membrane strengthening": "Slimhindestyrkende",
            "Mucous membrane tonic": "Slimhindetonic",
            "Sialagogue": "Spytdrivende",
            "Antifungal": "Svampehæmmende",
            "Diaphoretic": "Sveddrivende",
            "Tonic": "Tonics",
            "Diuretic": "Vanddrivende",
            "Venotonic": "Venestyrkende",
            "Weight reducing": "Vægtreducerende",
            "Anti-ulcer": "Anti-ulcer (peptisk)",
            "Antiarrhythmic": "Arytmimodvirkende",
            "Blood pressure raising": "Blodtrykshævende",
            "Bladder tonic": "Blæretonics",
            "Warming": "Brændende (varmende)",
            "Hypnotic": "Hypnotiske (sovemidler)",
            "Uterine relaxant": "Livmoderafslappende",
            "Lymphatic stimulant": "Lymfestimulerende",
            "Antiparasitic": "Parasithæmmende",
            "Progesterone effect": "Progesteron effekt",
            "Prolactin inhibiting": "Prolaktinhæmmende",
            "Antiperspirant": "Svedhæmmende",
            "Antacid": "Syredæmpende",
            "Estrogen regulating": "Østrogenregulerende",
        },
        fr: {
            "Adaptogen": "Adaptogène",
            "Adrenal tonic": "Tonique surrénalien",
            "Aldose reductase inhibitor": "Inhibiteur d'aldose réductase",
            "Analgesic": "Analgésique",
            "Antiallergic": "Anti-allergique",
            "Antacid": "Antiacide",
            "Antibacterial": "Antibactérien",
            "Anticancer": "Anticancéreux",
            "Anticoagulant": "Anticoagulant",
            "Anticonvulsant (epilepsy)": "Anticonvulsivant (épilepsie)",
            "Antidepressant": "Antidépresseur",
            "Antiemetic": "Antiémétique",
            "Antifungal": "Antifongique",
            "Anti-inflammatory (brain)": "Anti-inflammatoire (cerveau)",
            "Anti-inflammatory (cardiovascular)": "Anti-inflammatoire (cardiovasculaire)",
            "Anti-inflammatory (digestive/mucous membranes/skin)": "Anti-inflammatoire (digestif/muqueuses/peau)",
            "Anti-inflammatory (external)": "Anti-inflammatoire (externe)",
            "Anti-inflammatory (female reproductive)": "Anti-inflammatoire (reproducteur féminin)",
            "Anti-inflammatory (general)": "Anti-inflammatoire (général)",
            "Anti-inflammatory (liver)": "Anti-inflammatoire (foie)",
            "Anti-inflammatory (musculoskeletal)": "Anti-inflammatoire (musculo-squelettique)",
            "Anti-inflammatory (respiratory)": "Anti-inflammatoire (respiratoire)",
            "Anti-inflammatory (urinary)": "Anti-inflammatoire (urinaire)",
            "Antilithic": "Antilithique",
            "Antimicrobial": "Antimicrobien",
            "Antioxidant": "Antioxydant",
            "Antiparasitic": "Antiparasitaire",
            "Antiperspirant": "Antiperspirant",
            "Antipruritic (external)": "Antipruritique (externe)",
            "Antirheumatic": "Antirhumatismal",
            "Antiarrhythmic": "Antiarythmique",
            "Antiseptic (urinary)": "Antiseptique (urinaire)",
            "Antispasmodic": "Antispasmodique",
            "Anti-ulcer": "Anti-ulcéreux",
            "Antiviral (external)": "Antiviral (externe)",
            "Antiviral (internal)": "Antiviral (interne)",
            "Aphrodisiac": "Aphrodisiaque",
            "Appetite stimulant": "Stimulant de l'appétit",
            "Astringent": "Astringent",
            "Bitter tonic": "Tonique amer",
            "Bladder tonic": "Tonique vésical",
            "Blood pressure lowering": "Hypotenseur",
            "Blood pressure raising": "Hypertenseur",
            "Blood pressure regulating": "Régulateur de tension artérielle",
            "Blood purifier": "Purificateur de sang",
            "Blood strengthening": "Fortifiant sanguin",
            "Blood sugar regulating": "Régulateur de glycémie",
            "Bronchial spasmolytic": "Spasmolytique bronchique",
            "Cardioprotective": "Cardioprotecteur",
            "Carminative": "Carminatif",
            "Cholagogue": "Cholagogue",
            "Choleretic": "Cholérétique",
            "Cholesterol lowering": "Hypocholestérolémiant",
            "Circulatory stimulant": "Stimulant circulatoire",
            "Connective tissue strengthening": "Renforçant du tissu conjonctif",
            "Demulcent": "Émollient",
            "Diaphoretic": "Diaphorétique",
            "Diuretic": "Diurétique",
            "Emmenagogue": "Emménagogue",
            "Estrogen regulating": "Régulateur d'œstrogène",
            "Expectorant": "Expectorant",
            "Fibrinolytic": "Fibrinolytique",
            "Galactagogue": "Galactagogue",
            "Galactofuge": "Galactofuge",
            "Healing": "Cicatrisant",
            "Heart tonic": "Tonique cardiaque",
            "Hemostatic": "Hémostatique",
            "Hepatoprotective": "Hépatoprotecteur",
            "Hypnotic": "Hypnotique",
            "Immunomodulating": "Immunomodulateur",
            "Immunosuppressive": "Immunosuppresseur",
            "Interferon stimulating": "Stimulant d'interféron",
            "Kidney tonic": "Tonique rénal",
            "Laxative": "Laxatif",
            "Liver regenerating": "Régénérant hépatique",
            "Lymphatic stimulant": "Stimulant lymphatique",
            "Male tonic": "Tonique masculin",
            "Metabolism raising": "Stimulant du métabolisme",
            "Mucolytic": "Mucolytique",
            "Mucostatic (lower respiratory)": "Mucostatique (voies respiratoires inférieures)",
            "Mucostatic (upper respiratory)": "Mucostatique (voies respiratoires supérieures)",
            "Mucous membrane strengthening": "Renforçant des muqueuses",
            "Mucous membrane tonic": "Tonique des muqueuses",
            "Nerve tonic": "Tonique nerveux",
            "Nootropic": "Nootropique",
            "Progesterone effect": "Effet progestéronique",
            "Prolactin inhibiting": "Inhibiteur de prolactine",
            "Prostate growth inhibiting": "Inhibiteur de croissance de la prostate",
            "Sedative": "Sédatif",
            "Sialagogue": "Sialagogue",
            "Tonic": "Tonique",
            "Uterine contracting": "Contractant utérin",
            "Uterine relaxant": "Relaxant utérin",
            "Uterine tonic": "Tonique utérin",
            "Vasodilator": "Vasodilatateur",
            "Venotonic": "Veinotonique",
            "Warming": "Réchauffant",
            "Weight reducing": "Amaigrissant",
            "Woman tonic": "Tonique féminin",
        },
    };

    function tProperty(prop) {
        if (typeof prop !== 'string') return prop;
        const lang = getLang();
        // Property strings in plants-data.js are stored in DATA_LANG ('en').
        if (lang === DATA_LANG) return prop;
        const dict = PROPERTY_TRANSLATIONS[lang];
        return (dict && dict[prop]) ? dict[prop] : prop;
    }

    // Family names in plants-data.js look like "Fabaceae (Legume family)".
    // The Latin part (before " (") is universal across languages; in non-English
    // modes we drop the parenthetical English description.
    function tFamily(family) {
        if (typeof family !== 'string') return family;
        const lang = getLang();
        if (lang === DATA_LANG) return family;
        const parenIdx = family.indexOf(' (');
        return parenIdx > 0 ? family.slice(0, parenIdx) : family;
    }

    function format(template, vars) {
        if (!template || !vars) return template;
        return template.replace(/\{(\w+)\}/g, (_, key) =>
            vars[key] !== undefined ? String(vars[key]) : '{' + key + '}'
        );
    }

    function getLang() {
        try {
            const params = new URLSearchParams(window.location.search);
            const fromUrl = params.get('lang');
            if (fromUrl && SUPPORTED.includes(fromUrl)) return fromUrl;

            const fromStorage = localStorage.getItem(STORAGE_KEY);
            if (fromStorage && SUPPORTED.includes(fromStorage)) return fromStorage;
        } catch (e) {
            // localStorage or URL parsing failed — fall through
        }
        return DEFAULT_LANG;
    }

    function setLang(lang) {
        if (!SUPPORTED.includes(lang)) return;
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            // ignore storage failures
        }
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.location.href = url.toString();
    }

    function t(key) {
        const lang = getLang();
        const dict = TRANSLATIONS[lang] || TRANSLATIONS[FALLBACK_LANG];
        if (dict[key] !== undefined) return dict[key];
        const fallback = TRANSLATIONS[FALLBACK_LANG][key];
        return fallback !== undefined ? fallback : key;
    }

    function withLang(url) {
        if (!url || typeof url !== 'string') return url;
        const lang = getLang();
        const hashIndex = url.indexOf('#');
        const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
        const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}lang=${lang}${hash}`;
    }

    function applyTranslations(root) {
        const scope = root || document;
        const lang = getLang();

        try {
            document.documentElement.setAttribute('lang', lang);
        } catch (e) {
            // ignore
        }

        scope.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
        });

        scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) el.setAttribute('placeholder', t(key));
        });

        scope.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria-label');
            if (key) el.setAttribute('aria-label', t(key));
        });

        scope.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                el.setAttribute('title', t(key));
                if (el.tagName === 'TITLE') el.textContent = t(key);
            }
        });

        // Auto-translate the "Back to Plant List" link found on plant detail pages,
        // and preserve the current language on its href.
        scope.querySelectorAll('a.back-link').forEach(link => {
            link.textContent = t('back.list');
            const href = link.getAttribute('href');
            if (href) link.setAttribute('href', withLang(href));
        });
    }

    function injectLanguagePicker() {
        if (document.querySelector('.lang-picker')) return;

        const currentLang = getLang();
        const picker = document.createElement('div');
        picker.className = 'lang-picker';
        picker.setAttribute('role', 'group');
        picker.setAttribute('aria-label', t('lang.picker.label'));

        SUPPORTED.forEach(code => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = code.toUpperCase();
            btn.setAttribute('data-lang', code);
            if (code === currentLang) btn.className = 'active';
            btn.addEventListener('click', () => setLang(code));
            picker.appendChild(btn);
        });

        document.body.insertBefore(picker, document.body.firstChild);
    }

    window.I18n = {
        getLang,
        setLang,
        t,
        withLang,
        applyTranslations,
        tProperty,
        tFamily,
        format,
        SUPPORTED,
    };

    function bootstrap() {
        applyTranslations();
        injectLanguagePicker();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
