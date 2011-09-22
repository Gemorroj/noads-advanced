var lng = new TRANSLATION();

opera.extension.onmessage = function (e) {
    var message = decodeMessage(e.data);
    if (message.type === 'noads_import_status') {
        if (message.status === 'good') {
            window.alert(lng.iSubs.replace('%url', message.url).replace('%d', message.length));
        } else {
            window.alert(lng.mSubscriptions + ' ' + lng.pError + ': ' + message.status + '\n\nURL: ' + message.url);
        }
        var btn = document.getElementById("noads_dlsubscription");
        btn.childNodes[0].src = imgRefresh;
        btn.disabled = false;
    }
};

addEventListener('load', function () {
    // Add default whitelist for blocking external scripts
    if (!getValue('noads_scriptlist_white')) {
        options.setDefWhiteList();
    }
    options.showPreferences(null);
}, false);