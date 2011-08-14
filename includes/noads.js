// ==UserScript==
// @include http*
// @exclude opera:*
// @exclude about:*
// @exclude *://localhost*
// @exclude *://192.168.*
// @exclude *://0.0.0.0*
// @exclude *dragonfly.opera.com*
// @exclude *acid3.acidtests.org*
// @exclude *.futuremark.com*
// @exclude *v8.googlecode.com*
// ==/UserScript==


// global variables
var bDebug = options.checkEnabled('noads_debug_enabled_state'), sStyle, uStyle, sCSS = '', uCSS = '', bgImages = '', blockedScripts = '', inlineScripts = 0;

(function() {
    //if(document !== undefined && document.documentElement && !(document.documentElement instanceof window.HTMLHtmlElement)) return;
    if (typeof storage === undefined || !storage) { run.setStatus(TRANSLATION().iNoQuota); alert(TRANSLATION().iNoQuota); return; }
    var blockingText = '', domain = window.location.hostname;

    // Set subscription listener here?
    //if (options.checkEnabled('noads_subscription_state')) {};

    /* Add custom magic; yay Merlin!
     * 
     * Magical formulae:
     *   ##function Name
     *   ##var Name
     * 
     * Users can't define function body for a security considerations.
     * Function name filter: ;:)function,{}-+[]'" 
    */
    if (options.checkEnabled('noads_magiclist_state') && options.isActiveDomain('noads_scriptlist_white', domain)) {
        blockingText += ', magic';

        var sMagic = getValue('noads_magiclist').split('\n');
        if (sMagic) {
            var blockedFuncs = '', blockedVars = '';
            for (var i = 0, jS, j, ret = null; i < sMagic.length; i++) {
                // such parsing should mostly be when saving but...
                jS = sMagic[i];
                jS = jS.replace(/\/{2,}.*/gi, ''); // trim comments
                jS = jS.replace(/^[\s\xa0]+|[\s\xa0]+$|[^#]+(?:function|var|eval)/g, ''); //trim leading/trailing spaces and keywords
                jS = jS.replace(/[^\s\.\_\w\d]+/g, '');
                jS = jS.replace(/[\s]+/g, ' '); //just to be sure
                if (jS == '') continue;
                j = jS.split(' ');
                ret = parseInt(j[2], 10);
                ret = (ret == 'NaN') ? null : ret;
                if (j[0].match(/^function/i)) {
                    // blocking functions
                    blockedFuncs += ',' + j[1];
                    
                  /*if (~j[1].indexOf('.')) {                   
                     if (window[j[1].split('.')[0]]) {
                         var evalFn = 'window.opera.defineMagicFunction("' + j[1] + '",function(){ log("function is void"); return; });';
                         eval(evalFn); // I don't really want this x_x;
                     }
                     // also must be parsed on BeforeScript event as class sometimes unavailible before
                     } else {*/
                        (function (name, debug) {
                            window.opera.defineMagicFunction(j[1], function () { if (debug) window.opera.postError('[NoAdsAdvanced] function ' + name + ' is void'); return; }); 
                        })(j[1], bDebug);
                    //}

                    (function (name, debug) {
                        window[name] = function () { if (debug) window.opera.postError('[NoAdsAdvanced] function ' + name + ' is void'); return; }; 
                    })(j[1], bDebug);
                } //blocking variables
                else if (j[0].match(/^var/i)) {
                        blockedVars += ',' + j[1];
                        window[j[1]] = ret;
                        window.opera.defineMagicVariable(j[1], function () {
                            return null;
                        }, null);
                }
            }
            //log('functions blocked: ' + blockedFuncs.slice(1)+'\nvariables blocked: ' + blockedVars.slice(1));
        }
    }

    // Enumerate backgrounds for helper
    window.opera.addEventListener('BeforeCSS', function (userJSEvent) {
        //alert(userJSEvent);
        userJSEvent.cssText.replace(/(?:url\(['"]?)([^'"\)]+)(?:['"]?\))/ig, function (str, p1, offset, s) {
            bgImages += p1 + '; ';
        });
    }, false);

    // Block external scripts
    if (options.checkEnabled('noads_scriptlist_state')) {
        var reSkip = options.isActiveDomain('noads_scriptlist_white', domain, true);
        if (reSkip) {
            blockingText += ', external scripts';
            window.opera.addEventListener('BeforeExternalScript', function (e) {
                var src = e.element.src;
                if (!src || reSkip.test(src) || e.element.isNoAdsSubscription) return;
                var site = window.location.hostname, full = !/\.(com|[a-z]{2})$/i.test(site);
                var a = src.match(/^https?:\/\/([^\/]+@)?([^:\/]+)/i);
                if (a && getTLD(a[2], full) != getTLD(site, full)) {
                    e.preventDefault();
                    if (blockedScripts.indexOf(src) == -1) blockedScripts += blockedScripts ? '; ' + src : src;
                    log('blocked script -> ' + src + ' for <' + site + '>');
                }
            }, false);

            var reBlock = options.getReScriptBlock('noads_scriptlist', domain);
            if (reBlock) {
                window.opera.addEventListener('BeforeScript', function (e) {
                    if (reBlock.test(e.element.text)) {
                        e.preventDefault();
                        inlineScripts++;
                    }
                }, false);
            }
        }
    }

    var showButton = function (e) {
        var docEle;

        if (document && document.compatMode === 'CSS1Compat' && window.postMessage) docEle = document.documentElement;
        else docEle = document.body;
        if (docEle && docEle.clientHeight - e.clientY < 20 && docEle.clientWidth - e.clientX < 70) {
            run.createButton(sCSS ? (uCSS ? sCSS + ',' + uCSS : sCSS) : uCSS, inlineScripts ? ('<script>(' + inlineScripts + ')' + (blockedScripts ? '; ' + blockedScripts : '')) : blockedScripts);
        }
    };
 
    var onCSSAllowed = function () {
        // Add CSS rules
        if (options.checkEnabled('noads_list_state') && options.isActiveDomain('noads_list_white', domain)) {
            sCSS = options.getRules('noads_list', domain);
            if (sCSS) sStyle = addStyle(sCSS + none, 'sCSS');
            blockingText += ', ads by CSS';
        }

        // Add custom CSS rules
        if (options.checkEnabled('noads_userlist_state') && options.isActiveDomain('noads_userlist_white', domain)) {
            uCSS = options.getRules('noads_userlist', domain);
            if (uCSS) uStyle = addStyle(uCSS + none, 'uCSS');
            blockingText += ', ads by user CSS';
        }

        // Create the quick button
        if (window.top === window.self) { // don't want that in a frames
            if (options.checkEnabled('noads_button_state')) {
                log('button is enabled...');
                addStyle(quickButtonCSS, 'qbCSS');
                window.addEventListener('mousemove', showButton, false);
            }
        }
    };

    try { onCSSAllowed(); }
    catch(ex) { window.opera.addEventListener('BeforeCSS', function (event) {
        window.opera.removeEventListener('BeforeCSS', arguments.callee, false);
        onCSSAllowed();
    }, false); }
  
    if (window.top === window.self) { // don't want that in a frames
        log('on ' + window.location.hostname + ' blocking:' + blockingText.substring(1) + '...');
   
        // Setup hotkeys
        window.addEventListener('keydown', function(e){
            if (e.shiftKey && !e.ctrlKey && e.altKey) {
                switch (e.keyCode) {
                    case 68:
                        run.toggleBlocking();
                        break; // permanent unblock/block for the site with Alt+Shift+D
                    case 69:
                        run.editStyles();
                        break; // Edit styles with Alt+Shift+E
                    case 85:
                        run.unblockElement();
                        break; // Unblock elements with Alt+Shift+U
                    case 66:
                        run.blockElement();
                        break; // Block element with Alt+Shift+B
                    case 76:
                        run.unblockElement(true);
                        break; // Unblock latest element with Alt+Shift+L
                    case 65:
                        run.blockElement(true);
                        break; // Block elements (don't use nth-child) with Alt+Shift+A
                    case 80:
                        options.showPreferences(domain);
                        break; // Show preferences with Alt+Shift+P
                }
            }
        }, false);
        
        // Create menu messaging channel and parse background messages
        opera.extension.onmessage = function (e) {
            var message = decodeMessage(e.data);
            if (message.type === 'noads_bg_port') {
                var channel = new MessageChannel();
                //background = e.source;
                e.ports[0].postMessage(encodeMessage({
                    type: 'noads_tab_port'
                }), [channel.port2]);
                channel.port1.onmessage = onPopupMessageHandler;
            }
        };

        // Parse menu messages
        function onPopupMessageHandler (e) {
            var message = decodeMessage(e.data);
            if (message.type) {
                switch (message.type) {
                    case 'block_ads':
                        run.blockElement(true);
                        break;
                    case 'block_ele':
                        run.blockElement();
                        break;
                    case 'unblock_ele':
                        run.unblockElement();
                        break;
                    case 'unblock_latest':
                        run.unblockElement(true);
                        break;
                    case 'get_subscription':
                        run.getSubscription();
                        break;
                    case 'content_block_helper':
                        run.contentBlockHelper();
                        break;
                    case 'show_preferences':
                        options.showPreferences(domain);
                        break;
                    case 'ask_menu_status':
                        e.source.postMessage(encodeMessage({ type: 'menu_status_enable' }));
                        break;
                }
            }
        }
    }

    // In case we did something unneeded
    window.addEventListener('DOMContentLoaded', function () {
        if (!(document.documentElement instanceof window.HTMLHtmlElement)) {
            delElement(document.getElementById('sCSS'));
            delElement(document.getElementById('uCSS'));
            delElement(document.getElementById('qbCSS'));
            window.removeEventListener('mousemove', showButton, false); 
        }
    }, false);


    window.addEventListener('load', function () {
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
})();