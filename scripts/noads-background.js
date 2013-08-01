var button, notification_text = '', debug = options.checkEnabled('noads_debug_enabled_state'), lng = {}, menu_resized = false, actual_font = 0,
    disabled = options.checkEnabled('noads_disabled');

function toggleExtension () {
    if (disabled) {
        disabled = false;
        filters.reloadRules(true, !options.checkEnabled('noads_urlfilterlist_state'));
        filters.reloadRules(false, !options.checkEnabled('noads_userurlfilterlist_state'));
        button.badge.display = "none";
    } else {
        disabled = true;
        filters.reloadRules(true, true);
        filters.reloadRules(false, true);
        button.badge.display = "block";
    }
    options.setEnabled('noads_disabled', disabled);
}

function toggleButton (e) {
    var atab = opera.extension.tabs.getFocused();
    button.disabled = !atab.port;
}

function setButtonState (port, state) {
    // in case source tab is active
    if (port === opera.extension.tabs.getFocused().port) {
        button.disabled = !state;
    }
}

function onConnectHandler (e) {
    var atab = opera.extension.tabs.getFocused();
    if (!atab || !e) return;
    // if we got a message fom the menu
    if (e.origin && ~e.origin.indexOf('menu.html') && ~e.origin.indexOf('widget://')) {
        atab.postMessage(encodeMessage({ type: 'noads_bg_port' }), [e.source]);
    } else {
        // if we got a message fom a page
        if (notification_text !== '') {
            atab.postMessage(encodeMessage({
                type: 'noadsadvanced_autoupdate',
                text: notification_text
            }));
            notification_text = '';
        }

        // button will be disabled for new tabs
        //setButtonState(e.source, false);
    }
}

window.addEventListener('load', function () {
    var lng = new TRANSLATION (),
        mlng = new MENU_TRANSLATION ();

    function onMessageHandler (e) {
        var message = decodeMessage(e.data);
        //console.log('[NoAdsAdv]:' + JSON.stringify(message));
        switch (message.type) {
            case 'set_badge':
                button.badge.display = "block";
                button.badge.textContent = message.blocked || '0';
                button.badge.color = "white";
                break;
            case 'status_enabled':
                setButtonState(e.source, true);
                break;
            case 'get_filters':
                if (!e.source)
                    return;

                if (!message.url || !message.url.length) {
                    log('URL/CSS filter import error -> invalid URL.');
                    e.source.postMessage(encodeMessage({
                        type: 'noads_import_status',
                        status: 'download failed',
                        url: 'unknown'
                    }));
                    return;
                }

                var subsc_counter = 0, message_rules = 0, message_success = [], message_error = [], message_fileerror = [],
                    subsc_len = message.url.length,
                    add_rules = (subsc_len > 1),
                    importer_callback = function (rulesN, url, status) {
                        if (rulesN !== -1) {
                            message_rules += rulesN;
                            message_success.push(url);
                        } else {
                            if (status === 'download error') message_error.push(url);
                            else message_fileerror.push(url);
                        }
                        if (++subsc_counter === subsc_len) {
                            filters.reloadRules(true, true);
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
                        }
                    };

                // FIXME: We reset them here hoping for redownload otherwise lists will needlessly 
                // grow over time as we used add_rules option for non-original purpose in multidownloader.
                if (subsc_len && add_rules) {
                    setValue('noads_urlfilterlist', '');
                    setValue('noads_list', '');
                }

                for (var subsc = 0; subsc < subsc_len; subsc++) {
                    importer.request(message.url[subsc], add_rules, message.allRules, importer_callback.bind(this));
                }
                break;
            case 'unblock_address':
                log('user URL-filter removing url -> ' + message.url);
                opera.extension.urlfilter.block.remove(message.url);
                var filters_length = filters.array_user_filters.length;
                for (var i = 0; i < filters_length; i++) {
                    if (filters.array_user_filters[i] == message.url) {
                        filters.array_user_filters.splice(i, 1);
                        break;
                    }
                }
                if (filters_length) {
                    setValue('noads_userurlfilterlist', filters.array_user_filters.join('\n'));
                } else {
                    setValue('noads_urlfilterlist', '');
                }
                break;
            case 'block_address':
                log('user URL-filter adding url -> ' + message.url);
                opera.extension.urlfilter.block.add(message.url);
                filters.array_user_filters.unshift(message.url);
                setValue('noads_userurlfilterlist', filters.array_user_filters.join('\n'));
                break;
            case 'reload_rules':
                filters.reloadRules(message.global, message.clear);
                break;
            case 'noads_import_status':
                if (message.status === 'good') {
                    window.alert(lng.iSubs.replace('%url', message.url).replace('%d', message.length));
                } else {
                    window.alert(lng.mSubscriptions + ' ' + lng.pError + ': ' + message.status + '\n\nURL: ' + message.url);
                }
                break;
        } //switch
    }

    if (options.checkEnabled('noads_tb_enabled_state')) {
        button = opera.contexts.toolbar.createItem({
            disabled: true,
            title: 'NoAds Advanced',
            icon: 'icons/icon18.png',
            popup: {
                href: 'menu.html',
                width: mlng.baseMenuWidth || 150,
                height: mlng.baseMenuHeight || 170
            },
            badge: {
                display: disabled ? 'block' : 'none',
                textContent: 'off',
                color: 'white',
                backgroundColor: 'rgba(211, 0, 4, 1)'
            }
        });
        opera.contexts.toolbar.addItem(button);
    } else {
        button = {
            disabled: true
        };
    }

    // Check the Context Menu API is supported
    if (opera.contexts.menu && options.checkEnabled('noads_menu_enabled_state')) {
        var menu = opera.contexts.menu;

        // Create menu item properties objects
        var mainmenu = {
            title: 'NoAds Advanced',
            type: 'folder'
        };

        // Create menu items with the specified properties
        var item = menu.createItem(mainmenu);
        
        function sendMenuRequest(request) {
            try {
                opera.extension.tabs.getFocused().postMessage(encodeMessage({
                    type: 'noads_context_menu',
                    subtype: {
                        type: request 
                    }
                }));
            } catch (bug) {}
        }

        var menus = [], menuitems = [
        {
            title: mlng.blockAds,
            onclick: function (event) {
                sendMenuRequest('block_ads');
            }
        }, {
            title: mlng.blockEle,
            onclick: function (event) {
                sendMenuRequest('block_ele');
            }
        }, {
            title: mlng.unblockEle,
            onclick: function (event) {
                sendMenuRequest('unblock_ele');
            }
        }, {
            title: mlng.unblockLatest,
            onclick: function (event) {
                sendMenuRequest('unblock_latest');
            }
        }, {
            title: mlng.contentBlockHelper,
            onclick: function (event) {
                sendMenuRequest('content_block_helper');
            }
        }, {
            title: mlng.preferences,
            onclick: function (event) {
                sendMenuRequest('show_preferences');
            }
        }];

        for (var i = 0, l = menuitems.length; i < l; i++) {
            menus[i] = menu.createItem(menuitems[i]);
        }

        // Add the menu item to the context menu
        menu.addItem(item, 1);
        // Add the sub-menu items to the main menu item
        for (var i = 0, l = menus.length; i < l; i++) {
            item.addItem(menus[i]);
        }
    }

    // Enable the button when a tab is ready.
    opera.extension.onconnect = onConnectHandler;
    opera.extension.tabs.onfocus = toggleButton;
    opera.extension.onmessage = onMessageHandler;

    if (options.checkEnabled('noads_autoupdate_state')) {
        var next_update = Number(getValue('noads_last_update')) + Number(getValue('noads_autoupdate_interval'));
        if (next_update < Date.now()) {
            var subsc_counter = 0, subsc_len = url.length, add_rules = (subsc_len > 1);
            var url = options.getSubscriptions(), allRules = options.checkEnabled('noads_allrules_state'), importer_callback = function () {
                if (++subsc_counter === subsc_len) {
                    filters.reloadRules(true, true);
                    notification_text = lng.pAutoUpdateComplete || 'NoAds Advanced autoupdated';
                }
            };
            if (subsc_len && add_rules) {
                setValue('noads_urlfilterlist', '');
                setValue('noads_list', '');
            }
            for (var subsc = 0; subsc < subsc_len; subsc++) {
                importer.request(url[subsc], add_rules, allRules, importer_callback.bind(this));
            }
        }
    }

    if (options.checkEnabled('noads_disabled'))
        return;

    // adding URL filters on load
    filters.reloadRules(true, !options.checkEnabled('noads_urlfilterlist_state'));
    filters.reloadRules(false, !options.checkEnabled('noads_userurlfilterlist_state'));
}, false);
