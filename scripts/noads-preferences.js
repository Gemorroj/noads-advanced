var lng = new TRANSLATION();

opera.extension.onmessage = function (e) {
    var message = decodeMessage(e.data);
    if (message.type === 'noads_import_status') {
        window.alert(message.status);
        var btn = document.getElementById("noads_dlsubscription");
        btn.firstChild.src = imgRefresh;
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