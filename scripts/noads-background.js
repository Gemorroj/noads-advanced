var bDebug = false, lng = {};

window.addEventListener('load', function () {
    bDebug = options.checkEnabled('noads_debug_enabled_state');
    lng = new TRANSLATION();

    // adding URL filters on load
    importer.reloadRules(true, false);
    importer.reloadRules(false, false);

    var button;
    if (options.checkEnabled('noads_tb_enabled_state')) {
        button = opera.contexts.toolbar.createItem({
            disabled: true,
            title: 'NoAds Advanced',
            icon: 'icons/icon18.png',
            popup: {
                href: 'menu.html',
                width: 180,
                height: 140
            }
        });
        opera.contexts.toolbar.addItem(button);
    } else { button = {disabled: true}; } // lol, had problems with button if it was all in if(_state)

    function enableButton () {
        button.disabled = !opera.extension.tabs.getFocused();
    }

    function onConnectHandler (e) {
        if (e && e.origin && e.origin.indexOf('menu.html') > -1 && e.origin.indexOf('widget://') > -1) {
            var tab = opera.extension.tabs.getFocused();
            if (tab) tab.postMessage(encodeMessage({type: 'noads_bg_port'}), [e.source]);
        } else enableButton();
    }

    // Enable the button when a tab is ready.
    opera.extension.onconnect = onConnectHandler;
    opera.extension.tabs.onfocus = enableButton;
    opera.extension.tabs.onblur = enableButton;

    opera.extension.onmessage = function (e) {
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

                var rulesN = 0, message_rules = 0, message_success = [], message_error = [], message_fileerror = [];
                var addRules = false;
                for (var subsc = 0; subsc < message.url.length; subsc++) {
                    log('Start importing subscription nr: ' + (subsc + 1));
                    var url = message.url[subsc];
                    //if(0 < i) addRules = true;//?
                    addRules = subsc;

                    try {
                        var xmlhttp = new XMLHttpRequest();
                        xmlhttp.onreadystatechange = function () {
                            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                                if (~url.indexOf('.ini')) {
                                    rulesN = importer.importFilters(xmlhttp.responseText, addRules);
                                } else {
                                    rulesN = importer.importSubscriptions(xmlhttp.responseText, url, message.allRules, addRules);
                                }

                                if (rulesN) {
                                    message_success.push(url);
                                    message_rules += rulesN;
                                } else {
                                    message_fileerror.push(url);
                                }
                                log('End importing subscription nr: ' + (subsc + 1));
                            }
                            else if (xmlhttp.readyState >= 4) {
                                message_error.push(url);
                            }
                        };
                        xmlhttp.open("GET", url, false);
                        xmlhttp.send();
                    }
                    catch (ex) {
                        log('URL/CSS filter import error -> ' + ex);
                        message_error.push(url);
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
                if (!options.checkEnabled('noads_userurlfilterlist_state')/* && options.isActiveDomain('noads_userurlfilterlist_white')*/) break;
                log('user URL-filter unblocked url -> ' + message.url);
                opera.extension.urlfilter.block.remove(message.url);
                for (var i = 0; i < importer.arrayUserFilters.length; i++) {
                    if (importer.arrayUserFilters[i] == message.url) { importer.arrayUserFilters.splice(i, 1); break; }
                }
                if (importer.arrayUserFilters.length) setValue('noads_userurlfilterlist', '##' + importer.arrayUserFilters.join('\n##'));
                else setValue('noads_urlfilterlist', '');
                break;

            case 'block_address':
                if (!options.checkEnabled('noads_userurlfilterlist_state') /*&& options.isActiveDomain('noads_userurlfilterlist_white') ???*/) break;
                log('user URL-filter blocked url -> ' + message.url);
                opera.extension.urlfilter.block.add(message.url);
                importer.arrayUserFilters.unshift(message.url);
                setValue('noads_userurlfilterlist', '##' + importer.arrayUserFilters.join('\n##'));
                break;

            case 'reload_rules':
                importer.reloadRules(message.global, false);
                break;
        }
    }
}, false);