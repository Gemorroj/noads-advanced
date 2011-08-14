var MENU_TRANSLATION = function () {
    switch (window.navigator.language) {
        case 'ru': return {
            blockAds: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043e\u0431\u0449\u0435\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u043e',
            blockEle: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0447\u0430\u0441\u0442\u043d\u043e\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u043e',
            unblockEle: '\u0420\u0430\u0437\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u0442\u044c...',
            unblockLatest: '\u0420\u0430\u0437\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435',
            preferences: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0441\u0430\u0439\u0442\u0430',
            disableForSite: '\u041e\u0442\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043d\u0430 \u044d\u0442\u043e\u043c \u0441\u0430\u0439\u0442\u0435',
            contentBlockHelper: '\u041f\u043e\u043c\u043e\u0449\u043d\u0438\u043a \u0434\u043b\u044f \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0438'
        };
        case 'es': return {
            blockAds: 'Bloquear anuncio',
            blockEle: 'Bloquear elemento',
            unblockEle: 'Desbloquear...',
            unblockLatest: 'Desbloquear \u00faltimo',
            preferences: 'Preferencias',
            contentBlockHelper: 'Content block Helper'
        };
        case 'pl': return {
            blockAds: 'Blokowanie reklam',
            blockEle: 'Blokowanie element\u00f3w',
            unblockEle: 'Odblokuj...',
            unblockLatest: 'Odblokuj ostatni element',
            preferences: 'Ustawienia strony',
            disableForSite: 'Wy\u0142\u0105cz blokowanie na tej stronie',
            contentBlockHelper: 'Pomocnik blokowania zawarto\u015bci'
        };
        case 'fr': return {
            blockAds: 'Bloquer pub. group\u00e9e',
            blockEle: 'Bloquer par \u00e9l\u00e9ment',
            unblockEle: 'D\u00e9bloquer...',
            unblockLatest: 'D\u00e9bloquer le dernier',
            preferences: 'Pr\u00e9f\u00e9rences',
            disableForSite: 'D\u00e9sactiver pour ce site',
            contentBlockHelper: 'Assistant contenus bloqu\u00e9s'
        };
        case 'de': return {
            blockAds: 'Blockiere werbung',
            blockEle: 'Blockiere element',
            unblockEle: 'Deblockiere...',
            unblockLatest: 'Deblockiere letztes element',
            preferences: 'Einstellungen',
            disableForSite: 'F\u00fcr diese seite deaktivieren',
            contentBlockHelper: 'Inhalt blockieren helfer'
        };
        default: return {
            blockAds: 'Create general rule',
            blockEle: 'Create accurate rule',
            unblockEle: 'Unblock...',
            unblockLatest: 'Unblock latest',
            preferences: 'Site preferences',
            disableForSite: 'Disable for the site',
            contentBlockHelper: 'Content block helper'
        }
    }
};