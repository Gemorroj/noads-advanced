var bDebug = false, lng = {};

window.addEventListener('load', function () {
    bDebug = options.checkEnabled('noads_debug_enabled_state');
    lng = new TRANSLATION();


    var button;
    if (options.checkEnabled('noads_tb_enabled_state')) {
        button = opera.contexts.toolbar.createItem({
            disabled: true,
            title: 'NoAds Advanced',
            icon: 'icons/icon18.png',
            popup: {
                href: 'menu.html',
                width: 180,
                height: 155
            }
        });
        opera.contexts.toolbar.addItem(button);
    } else {
        // lol, had problems with button if it was all in if(_state)
        button = {disabled: true};
    }

    function enableButton () {
        button.disabled = !opera.extension.tabs.getFocused();
    }

    function onConnectHandler (e) {
        if (e && e.origin && e.origin.indexOf('menu.html') > -1 && e.origin.indexOf('widget://') > -1) {
            var tab = opera.extension.tabs.getFocused();
            if (tab) {
                tab.postMessage(encodeMessage({type: 'noads_bg_port'}), [e.source]);
            }
        } else {
            enableButton();
        }
    }

    function onMessageHandler (e) {
        var message = decodeMessage(e.data);
        switch (message.type) {
            case 'get_filters':
                if (!e.source) return;

                if (!message.url) {
                    log('URL/CSS filter import error -> invalid URL.');
                    e.source.postMessage(encodeMessage({
                        type: 'noads_import_status',
                        status: 'download failed',
                        url: 'unknown'
                    }));
                    return;
                }

                var message_rules = 0, message_success = [], message_error = [], message_fileerror = [],
                importerCallback = function (rulesN) {
                    if (rulesN) {
                        message_success.push(message.url[subsc]);
                        message_rules += rulesN;
                    } else {
                        message_fileerror.push(message.url[subsc]);
                    }
                };
                for (var subsc = 0, l = message.url.length; subsc < l; subsc++) {
                    try {
                        importer.request(message.url[subsc], subsc, message.allRules, importerCallback);
                    } catch (ex) {
                        log('URL/CSS filter import error -> ' + ex);
                        message_error.push(message.url[subsc]);
                    }
                }
                if (message_success.length) {
                    e.source.postMessage(encodeMessage({
                        type: 'noads_import_status',
                        status: 'good',
                        url: '\n' + message_success.join('\n') + '\n',
                        length: message_rules
                    }));
                }
                if (message_fileerror.length) {
                    e.source.postMessage(encodeMessage({
                        type: 'noads_import_status',
                        status: 'file error',
                        url: '\n' + message_fileerror.join('\n') + '\n'
                    }));
                }
                if (message_error.length) {
                    e.source.postMessage(encodeMessage({
                        type: 'noads_import_status',
                        status: 'download failed',
                        url: '\n' + message_error.join('\n') + '\n'
                    }));
                }
                break;

            case 'unblock_address':
                if (!options.checkEnabled('noads_userurlfilterlist_state')/* && options.isActiveDomain('noads_userurlfilterlist_white')*/) {
                    break;
                }
                log('user URL-filter unblocked url -> ' + message.url);
                opera.extension.urlfilter.block.remove(message.url);
                var l = importer.arrayUserFilters.length;
                for (var i = 0; i < l; i++) {
                    if (importer.arrayUserFilters[i] == message.url) {
                        importer.arrayUserFilters.splice(i, 1);
                        break;
                    }
                }
                if (l) {
                    setValue('noads_userurlfilterlist', '##' + importer.arrayUserFilters.join('\n##'));
                } else {
                    setValue('noads_urlfilterlist', '');
                }
                break;

            case 'block_address':
                if (!options.checkEnabled('noads_userurlfilterlist_state') /*&& options.isActiveDomain('noads_userurlfilterlist_white') ???*/) {
                    break;
                }
                log('user URL-filter blocked url -> ' + message.url);
                opera.extension.urlfilter.block.add(message.url);
                importer.arrayUserFilters.unshift(message.url);
                setValue('noads_userurlfilterlist', '##' + importer.arrayUserFilters.join('\n##'));
                break;

            case 'reload_rules':
                importer.reloadRules(message.global, false);
                break;

            case 'noads_import_status':
                if (message.status === 'good') {
                    window.alert(lng.iSubs.replace('%url', message.url).replace('%d', message.length));
                } else {
                    window.alert(lng.mSubscriptions + ' ' + lng.pError + ': ' + message.status + '\n\nURL: ' + message.url);
                }
                break;
        }
    }


    if (options.checkEnabled('noads_autoupdate_state')) {
        var next_update = Number(getValue('noads_last_update')) + Number(getValue('noads_autoupdate_interval'));
        bDebug && window.console.log(next_update + ' - ' + (new Date()).getTime());
        if (next_update < (new Date()).getTime()) {
            var url = options.getSubscriptions(), allRules = options.checkEnabled('noads_allrules_state'),
            importerCallback = function (rulesN) {
                //TODO:notification
            };
            for (var subsc = 0, l = url.length; subsc < l; subsc++) {
                try {
                    importer.request(url[subsc], subsc, allRules, importerCallback);
                } catch (ex) {
                    log('URL/CSS filter import error -> ' + ex);
                }
            }
        }
    }

    // adding URL filters on load
    importer.reloadRules(true, false);
    importer.reloadRules(false, false);

    // Enable the button when a tab is ready.
    opera.extension.onconnect = onConnectHandler;
    opera.extension.tabs.onfocus = enableButton;
    opera.extension.tabs.onblur = enableButton;
    opera.extension.onmessage = onMessageHandler;
}, false);