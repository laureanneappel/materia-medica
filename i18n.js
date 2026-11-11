/**
 * Internationalization module
 * Handles language selection via ?lang= URL parameter, with localStorage fallback.
 * Exposes window.I18n with: getLang, setLang, t, withLang, applyTranslations.
 */

(function() {
    'use strict';

    const SUPPORTED = ['en', 'da', 'fr'];
    // Default UI language when the user has no preference set. Danish matches the
    // reference PDF (Egenskaber).
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

            'props.pageTitle': 'Medicinal Properties',
            'props.search.placeholder': 'Search properties or plants...',
            'props.stats.properties': "Properties",
            'props.stats.plants': "Plants",
            'props.sort.label': "Sort",
            'props.sort.name': "A–Z",
            'props.sort.count': "Most plants",
            'props.expandAll': "Expand all",
            'props.collapseAll': "Collapse all",
            'props.plantCount.one': "1 plant",
            'props.plantCount.many': "{count} plants",
            'props.noResults': "No properties or plants match your search.",

            'plant.botanicalName': 'Botanical Name',
            'plant.commonNames': 'Common Names',
            'plant.english': 'English:',
            'plant.danish': 'Danish:',
            'plant.french': 'French:',
            'plant.habitatGrowing': 'Habitat and Growing Conditions',
            'plant.habitat': 'Habitat',
            'plant.growing': 'Growing Conditions',
            'plant.harvesting': 'Harvesting',
            'plant.uses': 'Uses',
            'plant.constituents': 'Active Constituents',
            'plant.properties': 'Properties',
            'plant.noProperties': 'No properties in the reference list',
            'plant.notFound': "Plant not found",
            'plant.sideEffects': 'Side Effects',
            'plant.pertinent': 'Pertinent Information',
            'plant.family': 'Family',
            'plant.partsUsed': 'Parts Used',
            'plant.forms': 'Forms Used and Doses',
            'plant.personal': 'Personal Experience',
            'plant.taste': 'Taste',
            'plant.effect': 'Effect',
            'plant.references': 'References',
            'plant.ph.habitat': '[Add habitat and growing conditions here]',
            'plant.ph.constituents': '[Add active constituents/ingredients here]',
            'plant.ph.sideEffects': '[Add side effects/adverse effects here]',
            'plant.ph.parts': '[Add parts used here]',
            'plant.ph.forms': '[Add forms used and doses here]',
            'plant.ph.taste': '[Add your personal notes on taste here]',
            'plant.ph.effect': '[Add your personal notes on effects here]',
            'plant.ph.references': '[Add reference books, authors, and page numbers here]',

            'footer.title': "Personal Materia Medica Collection",
            'footer.disclaimer': "Disclaimer: This website is for informational and educational purposes only. The information provided is not intended to diagnose, treat, cure, or prevent any disease. Always consult a qualified healthcare professional before using any herbal remedies or supplements. The author takes no responsibility for any consequences arising from the use of this information.",
            'error.loadFailed': "Failed to load plant data. Please refresh the page.",
            'error.corrupted': "Plant data could not be read.",
            'info.noPlants': "No plants found.",
            'filter.remove': "Remove {label} filter",
            'a11y.skip': "Skip to main content",
            'search.label': "Search plants",
            'props.search.label': "Search properties or plants",
            'props.search.one': "1 result found",
            'props.search.many': "{count} results found",
            'nav.aria': "Main navigation",
        },
        da: {
            'site.title': 'Materia Medica',

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
            'props.search.placeholder': 'Søg efter egenskaber eller planter...',
            'props.stats.properties': "Egenskaber",
            'props.stats.plants': "Planter",
            'props.sort.label': "Sortér",
            'props.sort.name': "A–Å",
            'props.sort.count': "Flest planter",
            'props.expandAll': "Fold alle ud",
            'props.collapseAll': "Fold alle sammen",
            'props.plantCount.one': "1 plante",
            'props.plantCount.many': "{count} planter",
            'props.noResults': "Ingen egenskaber eller planter matcher din søgning.",

            'plant.botanicalName': 'Botanisk navn',
            'plant.commonNames': 'Navne',
            'plant.english': 'Engelsk:',
            'plant.danish': 'Dansk:',
            'plant.french': 'Fransk:',
            'plant.habitatGrowing': 'Voksested og dyrkning',
            'plant.habitat': 'Voksested',
            'plant.growing': 'Dyrkningsforhold',
            'plant.harvesting': 'Høst',
            'plant.uses': 'Anvendelse',
            'plant.constituents': 'Aktive indholdsstoffer',
            'plant.properties': 'Egenskaber',
            'plant.noProperties': 'Ingen egenskaber i referencelisten',
            'plant.notFound': "Planten blev ikke fundet",
            'plant.sideEffects': 'Bivirkninger',
            'plant.pertinent': 'Relevant information',
            'plant.family': 'Familie',
            'plant.partsUsed': 'Anvendte plantedele',
            'plant.forms': 'Anvendelsesformer og doser',
            'plant.personal': 'Personlige erfaringer',
            'plant.taste': 'Smag',
            'plant.effect': 'Virkning',
            'plant.references': 'Kilder',
            'plant.ph.habitat': '[Tilføj voksested og dyrkning her]',
            'plant.ph.constituents': '[Tilføj aktive indholdsstoffer her]',
            'plant.ph.sideEffects': '[Tilføj bivirkninger her]',
            'plant.ph.parts': '[Tilføj anvendte plantedele her]',
            'plant.ph.forms': '[Tilføj anvendelsesformer og doser her]',
            'plant.ph.taste': '[Tilføj dine noter om smag her]',
            'plant.ph.effect': '[Tilføj dine noter om virkning her]',
            'plant.ph.references': '[Tilføj kildebøger, forfattere og sidetal her]',

            'footer.title': "Personlig materia medica-samling",
            'footer.disclaimer': "Ansvarsfraskrivelse: Denne hjemmeside er udelukkende til information og undervisning. Oplysningerne er ikke beregnet til at diagnosticere, behandle, helbrede eller forebygge sygdom. Søg altid råd hos en kvalificeret sundhedsfaglig person, før du bruger urtemedicin eller kosttilskud. Forfatteren påtager sig intet ansvar for følger af brugen af disse oplysninger.",
            'error.loadFailed': "Plantedata kunne ikke indlæses. Genindlæs siden.",
            'error.corrupted': "Plantedata kunne ikke læses.",
            'info.noPlants': "Ingen planter fundet.",
            'filter.remove': "Fjern filteret {label}",
            'a11y.skip': "Gå til hovedindhold",
            'search.label': "Søg efter planter",
            'props.search.label': "Søg efter egenskaber eller planter",
            'props.search.one': "1 resultat fundet",
            'props.search.many': "{count} resultater fundet",
            'nav.aria': "Hovedmenu",
        },
        fr: {
            'site.title': 'Materia Medica',

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
            'props.search.placeholder': 'Rechercher des propriétés ou plantes...',
            'props.stats.properties': "Propriétés",
            'props.stats.plants': "Plantes",
            'props.sort.label': "Trier",
            'props.sort.name': "A–Z",
            'props.sort.count': "Le plus de plantes",
            'props.expandAll': "Tout déplier",
            'props.collapseAll': "Tout replier",
            'props.plantCount.one': "1 plante",
            'props.plantCount.many': "{count} plantes",
            'props.noResults': "Aucune propriété ou plante ne correspond à votre recherche.",

            'plant.botanicalName': 'Nom botanique',
            'plant.commonNames': 'Noms communs',
            'plant.english': 'Anglais :',
            'plant.danish': 'Danois :',
            'plant.french': 'Français :',
            'plant.habitatGrowing': 'Habitat et conditions de culture',
            'plant.habitat': 'Habitat',
            'plant.growing': 'Conditions de culture',
            'plant.harvesting': 'Récolte',
            'plant.uses': 'Utilisations',
            'plant.constituents': 'Principes actifs',
            'plant.properties': 'Propriétés',
            'plant.noProperties': 'Aucune propriété dans la liste de référence',
            'plant.notFound': "Plante introuvable",
            'plant.sideEffects': 'Effets secondaires',
            'plant.pertinent': 'Informations utiles',
            'plant.family': 'Famille',
            'plant.partsUsed': 'Parties utilisées',
            'plant.forms': 'Formes utilisées et doses',
            'plant.personal': 'Expérience personnelle',
            'plant.taste': 'Goût',
            'plant.effect': 'Effet',
            'plant.references': 'Références',
            'plant.ph.habitat': '[Ajouter habitat et conditions de culture ici]',
            'plant.ph.constituents': '[Ajouter les principes actifs ici]',
            'plant.ph.sideEffects': '[Ajouter les effets secondaires ici]',
            'plant.ph.parts': '[Ajouter les parties utilisées ici]',
            'plant.ph.forms': '[Ajouter les formes et doses ici]',
            'plant.ph.taste': '[Ajouter vos notes sur le goût ici]',
            'plant.ph.effect': '[Ajouter vos notes sur les effets ici]',
            'plant.ph.references': '[Ajouter livres de référence, auteurs et numéros de page ici]',

            'footer.title': "Collection personnelle de matière médicale",
            'footer.disclaimer': "Avertissement : ce site est fourni à titre informatif et éducatif uniquement. Les informations présentées ne visent pas à diagnostiquer, traiter, guérir ou prévenir une maladie. Consultez toujours un professionnel de santé qualifié avant d'utiliser des remèdes à base de plantes ou des compléments alimentaires. L'auteur décline toute responsabilité quant aux conséquences de l'utilisation de ces informations.",
            'error.loadFailed': "Impossible de charger les données des plantes. Veuillez recharger la page.",
            'error.corrupted': "Les données des plantes sont illisibles.",
            'info.noPlants': "Aucune plante trouvée.",
            'filter.remove': "Retirer le filtre {label}",
            'a11y.skip': "Aller au contenu principal",
            'search.label': "Rechercher des plantes",
            'props.search.label': "Rechercher des propriétés ou des plantes",
            'props.search.one': "1 résultat trouvé",
            'props.search.many': "{count} résultats trouvés",
            'nav.aria': "Navigation principale",
        },
    };

    // English -> Danish property translations (inverted from DANISH-TO-ENGLISH-PROPERTIES.json).
    // Danish labels are the exact headings of the reference PDF (Egenskaber).
    const PROPERTY_TRANSLATIONS = {
        da: {
            "Adaptogen": "Adaptogener",
            "Aphrodisiac": "Afrodisiakum",
            "Aldose reductase inhibitor": "Aldosereduktase hæmmende+andre senskader",
            "Analgesic": "Analgetika",
            "Pain relieving": "Smertestillende",
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
            "Immunosuppressive": "Immunhæmmende/ved overaktivt",
            "Immunomodulating": "Immunregulerende",
            "Interferon stimulating": "Interferon fremmende",
            "Cholesterol lowering": "Kolesterolnedsættende",
            "Anticonvulsant (epilepsy)": "Krampeløsende (epilepsi)",
            "Antispasmodic": "Krampeløsnende, luft, mens., tarm",
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
            "Thyroid inhibiting (mild)": "Thyroidea-hæmmende, mildt",
            "Thyroid stimulating (mild)": "Thyroidea-stimulerende, mildt",
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
            "Pain relieving": "Antidouleur",
            "Progesterone effect": "Effet progestéronique",
            "Prolactin inhibiting": "Inhibiteur de prolactine",
            "Prostate growth inhibiting": "Inhibiteur de croissance de la prostate",
            "Sedative": "Sédatif",
            "Sialagogue": "Sialagogue",
            "Thyroid inhibiting (mild)": "Inhibiteur thyroïdien (léger)",
            "Thyroid stimulating (mild)": "Stimulant thyroïdien (léger)",
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

    // Family descriptions by Latin family name. plants-data.js stores "Latin (English description)".
    const FAMILY_TRANSLATIONS = {
        da: {
            "Acanthaceae": "Akantusfamilien",
            "Adoxaceae": "Desmerurtfamilien",
            "Amaryllidaceae": "Påskeliljefamilien",
            "Apiaceae": "Skærmplantefamilien",
            "Apidae": "Biprodukt",
            "Apocynaceae": "Singrønfamilien",
            "Araliaceae": "Vedbendfamilien",
            "Arecaceae": "Palmefamilien",
            "Asparagaceae": "Aspargesfamilien",
            "Asphodelaceae": "Græsliljefamilien",
            "Asteraceae": "Kurvblomstfamilien",
            "Berberidaceae": "Berberisfamilien",
            "Betulaceae": "Birkefamilien",
            "Bignoniaceae": "Trompetkrybberfamilien",
            "Brassicaceae": "Korsblomstfamilien",
            "Burseraceae": "Røgelsetræfamilien",
            "Campanulaceae": "Klokkefamilien",
            "Cannabaceae": "Hampfamilien",
            "Capparaceae": "Kaperfamilien",
            "Caprifoliaceae": "Gedebladfamilien",
            "Caryophyllaceae": "Nellikefamilien",
            "Crassulaceae": "Stenurtfamilien",
            "Cupressaceae": "Cypresfamilien",
            "Dioscoreaceae": "Yamsfamilien",
            "Equisetaceae": "Padderokfamilien",
            "Ericaceae": "Lyngfamilien",
            "Euphorbiaceae": "Vortemælkfamilien",
            "Fabaceae": "Ærteblomstfamilien",
            "Fucaceae": "Brunalge",
            "Ganodermataceae": "Svamp",
            "Gentianaceae": "Ensianfamilien",
            "Ginkgoaceae": "Tempeltræfamilien",
            "Grossulariaceae": "Ribsfamilien",
            "Hamamelidaceae": "Troldnøddefamilien",
            "Hericiaceae": "Svamp",
            "Hymenochaetaceae": "Svamp",
            "Hypericaceae": "Perikonfamilien",
            "Iridaceae": "Irisfamilien",
            "Juglandaceae": "Valnøddefamilien",
            "Lamiaceae": "Læbeblomstfamilien",
            "Lauraceae": "Laurbærfamilien",
            "Malvaceae": "Katostfamilien",
            "Melanthiaceae": "Nyserodfamilien",
            "Myrtaceae": "Myrtefamilien",
            "Oleaceae": "Olivenfamilien",
            "Ophiocordycipitaceae": "Svamp",
            "Orobanchaceae": "Gyvelkvælerfamilien",
            "Paeoniaceae": "Pæonfamilien",
            "Passifloraceae": "Passionsblomstfamilien",
            "Pedaliaceae": "Sesamfamilien",
            "Phyllanthaceae": "Phyllanthus-familien",
            "Pinaceae": "Fyrrefamilien",
            "Plantaginaceae": "Vejbredfamilien",
            "Pleurotaceae": "Svamp",
            "Poaceae": "Græsfamilien",
            "Polygonaceae": "Pileurtfamilien",
            "Ranunculaceae": "Ranunkelfamilien",
            "Rhamnaceae": "Korsvedfamilien",
            "Rosaceae": "Rosenfamilien",
            "Rubiaceae": "Krapfamilien",
            "Rutaceae": "Rudefamilien",
            "Salicaceae": "Pilefamilien",
            "Sapindaceae": "Sæbebærfamilien",
            "Schisandraceae": "Schisandrafamilien",
            "Scrophulariaceae": "Maskeblomstfamilien",
            "Smilacaceae": "Smilaxfamilien",
            "Solanaceae": "Natskyggefamilien",
            "Theaceae": "Tefamilien",
            "Ulmaceae": "Elmefamilien",
            "Urticaceae": "Nældefamilien",
            "Verbenaceae": "Jernurtfamilien",
            "Violaceae": "Violfamilien",
            "Vitaceae": "Vinfamilien",
            "Zingiberaceae": "Ingefærfamilien",
            "Zygophyllaceae": "Pokkenholtfamilien",
        },
        fr: {
            "Acanthaceae": "Acanthacées",
            "Adoxaceae": "Adoxacées",
            "Amaryllidaceae": "Amaryllidacées",
            "Apiaceae": "Apiacées",
            "Apidae": "Produit de la ruche",
            "Apocynaceae": "Apocynacées",
            "Araliaceae": "Araliacées",
            "Arecaceae": "Arécacées",
            "Asparagaceae": "Asparagacées",
            "Asphodelaceae": "Asphodélacées",
            "Asteraceae": "Astéracées",
            "Berberidaceae": "Berbéridacées",
            "Betulaceae": "Bétulacées",
            "Bignoniaceae": "Bignoniacées",
            "Brassicaceae": "Brassicacées",
            "Burseraceae": "Burséracées",
            "Campanulaceae": "Campanulacées",
            "Cannabaceae": "Cannabacées",
            "Capparaceae": "Capparacées",
            "Caprifoliaceae": "Caprifoliacées",
            "Caryophyllaceae": "Caryophyllacées",
            "Crassulaceae": "Crassulacées",
            "Cupressaceae": "Cupressacées",
            "Dioscoreaceae": "Dioscoréacées",
            "Equisetaceae": "Équisétacées",
            "Ericaceae": "Éricacées",
            "Euphorbiaceae": "Euphorbiacées",
            "Fabaceae": "Fabacées",
            "Fucaceae": "Algue brune",
            "Ganodermataceae": "Champignon",
            "Gentianaceae": "Gentianacées",
            "Ginkgoaceae": "Ginkgoacées",
            "Grossulariaceae": "Grossulariacées",
            "Hamamelidaceae": "Hamamélidacées",
            "Hericiaceae": "Champignon",
            "Hymenochaetaceae": "Champignon",
            "Hypericaceae": "Hypéricacées",
            "Iridaceae": "Iridacées",
            "Juglandaceae": "Juglandacées",
            "Lamiaceae": "Lamiacées",
            "Lauraceae": "Lauracées",
            "Malvaceae": "Malvacées",
            "Melanthiaceae": "Mélanthiacées",
            "Myrtaceae": "Myrtacées",
            "Oleaceae": "Oléacées",
            "Ophiocordycipitaceae": "Champignon",
            "Orobanchaceae": "Orobanchacées",
            "Paeoniaceae": "Paeoniacées",
            "Passifloraceae": "Passifloracées",
            "Pedaliaceae": "Pédaliacées",
            "Phyllanthaceae": "Phyllanthacées",
            "Pinaceae": "Pinacées",
            "Plantaginaceae": "Plantaginacées",
            "Pleurotaceae": "Champignon",
            "Poaceae": "Poacées",
            "Polygonaceae": "Polygonacées",
            "Ranunculaceae": "Renonculacées",
            "Rhamnaceae": "Rhamnacées",
            "Rosaceae": "Rosacées",
            "Rubiaceae": "Rubiacées",
            "Rutaceae": "Rutacées",
            "Salicaceae": "Salicacées",
            "Sapindaceae": "Sapindacées",
            "Schisandraceae": "Schisandracées",
            "Scrophulariaceae": "Scrofulariacées",
            "Smilacaceae": "Smilacacées",
            "Solanaceae": "Solanacées",
            "Theaceae": "Théacées",
            "Ulmaceae": "Ulmacées",
            "Urticaceae": "Urticacées",
            "Verbenaceae": "Verbénacées",
            "Violaceae": "Violacées",
            "Vitaceae": "Vitacées",
            "Zingiberaceae": "Zingibéracées",
            "Zygophyllaceae": "Zygophyllacées",
        },
    };

    // Family names in plants-data.js look like "Fabaceae (Legume family)".
    // The Latin part is kept in every language; the description is translated.
    function tFamily(family) {
        if (typeof family !== 'string') return family;
        const lang = getLang();
        if (lang === DATA_LANG) return family;
        const parenIdx = family.indexOf(' (');
        const latin = parenIdx > 0 ? family.slice(0, parenIdx) : family;
        const dict = FAMILY_TRANSLATIONS[lang];
        return (dict && dict[latin]) ? `${latin} (${dict[latin]})` : latin;
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

    // Set the page language right away (this script loads in <head>), so CSS can
    // show only the matching [data-lang] text blocks without a flash of the others.
    try {
        document.documentElement.setAttribute('lang', getLang());
    } catch (e) {
        // ignore
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
