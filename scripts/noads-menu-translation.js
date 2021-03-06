/*
The main idea is to convey the content, so do not be afraid to localize
the original text with something different (something that fits, of course).
Read the original text, understand its content, and consider how you would formulate
the text in your language (without first having heard of the original).

All non-ascii text should be properly JavaSript-escaped.
*/

var MENU_TRANSLATION = function () {
    switch (window.navigator.language) {
        case 'ru-RU':
        case 'ru_RU':
        case 'uk':
        case 'uz':
        case 'be':
        case 'ru': return {
            blockAds: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043e\u0431\u0449\u0435\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u043e',
            blockEle: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0447\u0430\u0441\u0442\u043d\u043e\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u043e',
            unblockEle: '\u0420\u0430\u0437\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u0442\u044c...',
            unblockLatest: '\u0420\u0430\u0437\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435',
            preferences: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0441\u0430\u0439\u0442\u0430',
            disableForSite: '\u041e\u0442\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043d\u0430 \u044d\u0442\u043e\u043c \u0441\u0430\u0439\u0442\u0435',
            contentBlockHelper: '\u041f\u043e\u043c\u043e\u0449\u043d\u0438\u043a \u0434\u043b\u044f \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0438',
            toggleExtensionOn: '\u041e\u0442\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u0438\u0435',
            toggleExtensionOff: '\u0412\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u0438\u0435',
            baseMenuWidth: 180,
            baseMenuHeight: 170
        };
        case 'es-ES':
        case 'es-AR':
        case 'es': return {
            blockAds: 'Bloquear anuncio',
            blockEle: 'Bloquear elemento',
            unblockEle: 'Desbloquear...',
            unblockLatest: 'Desbloquear \u00faltimo',
            preferences: 'Preferencias',
            contentBlockHelper: 'Auxiliar bloqueo de contenido',
            toggleExtensionOn: 'Disable extension',
            toggleExtensionOff: 'Enable extension'
        };
        case 'pl': return {
            blockAds: 'Blokowanie reklam',
            blockEle: 'Blokowanie element\u00f3w',
            unblockEle: 'Odblokuj...',
            unblockLatest: 'Odblokuj ostatni element',
            preferences: 'Ustawienia strony',
            disableForSite: 'Wy\u0142\u0105cz blokowanie na tej stronie',
            contentBlockHelper: 'Pomocnik blokowania zawarto\u015bci',
            toggleExtensionOn: 'Disable extension',
            toggleExtensionOff: 'Enable extension'
        };
        case 'fr': return {
            blockAds: 'Bloquer pub. group\u00e9e',
            blockEle: 'Bloquer par \u00e9l\u00e9ment',
            unblockEle: 'D\u00e9bloquer...',
            unblockLatest: 'D\u00e9bloquer le dernier',
            preferences: 'Pr\u00e9f\u00e9rences',
            disableForSite: 'D\u00e9sactiver pour ce site',
            contentBlockHelper: 'Assistant contenus bloqu\u00e9s',
            toggleExtensionOn: 'Disable extension',
            toggleExtensionOff: 'Enable extension'
        };
        case 'de': return {
            blockAds: 'Blockiere werbung',
            blockEle: 'Blockiere element',
            unblockEle: 'Deblockiere...',
            unblockLatest: 'Deblockiere letztes element',
            preferences: 'Einstellungen',
            disableForSite: 'F\u00fcr diese seite deaktivieren',
            contentBlockHelper: 'Inhalt blockieren helfer',
            toggleExtensionOn: 'Disable extension',
            toggleExtensionOff: 'Enable extension'
        };
        // International English (en)
        // Contributor: <author> <additional-info>
        default: return {
            blockAds: 'Create general rule',
            blockEle: 'Create accurate rule',
            unblockEle: 'Unblock...',
            unblockLatest: 'Unblock latest',
            preferences: 'Site preferences',
            disableForSite: 'Disable for the site',
            contentBlockHelper: 'Content block helper',
            toggleExtensionOn: 'Disable extension',
            toggleExtensionOff: 'Enable extension',
            baseMenuWidth: 150, 
            baseMenuHeight: 170
        }
    }
};