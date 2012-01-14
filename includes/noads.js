// ==UserScript==
// @include http*
// @exclude opera:*
// @exclude about:*
// @exclude widget:*
// @exclude *://localhost*
// @exclude *://192.168.*
// @exclude *://0.0.0.0*
// @exclude *dragonfly.opera.com*
// ==/UserScript==


// global variables
var bDebug = options.checkEnabled('noads_debug_enabled_state'),
    lng = new TRANSLATION(),
    sStyle, uStyle,
    sCSS = '', uCSS = '',
    blockedScripts = '', inlineScripts = 0,
    domain = window.location.hostname,
    blockingText = '', reSkip, reBlock;


function showButton (e) {
    var docEle;

    if (document.compatMode === 'CSS1Compat' && window.postMessage) {
        docEle = document.documentElement;
    } else {
        docEle = document.body;
    }

    if (docEle && docEle.clientHeight - e.clientY < 20 && docEle.clientWidth - e.clientX < 40) {
        run.createButton(sCSS ? (uCSS ? sCSS + ',' + uCSS : sCSS) : uCSS, inlineScripts ? ('<script>(' + inlineScripts + ')' + (blockedScripts ? '; ' + blockedScripts : '')) : blockedScripts);
    }
}
function onCSSAllowed () {
    // Add CSS rules
    if (options.checkEnabled('noads_list_state') && options.isActiveDomain('noads_list_white', domain)) {
        sCSS = options.getRules('noads_list', domain);
        if (sCSS) {
            sStyle = addStyle(sCSS + none, 'sCSS');
            blockingText += ', ads by CSS';
            log('Blocked CSS for <' + domain + '>');
        }
    }

    // Add custom CSS rules
    if (options.checkEnabled('noads_userlist_state') && options.isActiveDomain('noads_userlist_white', domain)) {
        uCSS = options.getRules('noads_userlist', domain);
        if (uCSS) {
            uStyle = addStyle(uCSS + none, 'uCSS');
            blockingText += ', ads by user CSS';
            log('Blocked User CSS for <' + domain + '>');
        }
    }

    // Create the quick button
    // don't want that in a frames
    if (window.top === window.self && options.checkEnabled('noads_button_state')) {
        log('Button is enabled...');
        addStyle(quickButtonCSS, 'qbCSS');
        window.addEventListener('mousemove', showButton, false);
    }
}
function onPopupMessageHandler (e) {
    // Parse menu messages
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

            case 'content_block_helper':
                run.contentBlockHelper();
                break;

            case 'show_preferences':
                options.showPreferences(domain);
                break;

            case 'ask_menu_status':
                e.source.postMessage(encodeMessage({type: 'menu_status_enable'}));
                break;
        }
    }
}
function onHotkeyHandler (e) {
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
}
function onBeforeExternalScriptHandler (e) {
    var src = e.element.src;
    if (!src || reSkip.test(src)) return;
    var full = !/\.(com|net|org|edu|gov|mil|int|[a-z]{2})$/i.test(domain);
    if (getTLD(src.match(/^https?:\/\/(?:[^\/]+@)?([^:\/]+)/i)[1], full) !== getTLD(domain, full)) {
        e.preventDefault();
        if (blockedScripts.indexOf(src) === -1) {
            blockedScripts += blockedScripts ? '; ' + src : src;
        }
        log('Blocked external script -> ' + src + ' for <' + domain + '>');
    }
}
function onBeforeScriptHandler (e) {
    if (reBlock.test(e.element.text)) {
        e.preventDefault();
        inlineScripts++;
        log('Blocked inline script -> ' + inlineScripts + ' for <' + domain + '>');
    }
}
function onMessageHandler (e) {
    var message = decodeMessage(e.data);
    if (message.type === 'noads_bg_port') {
        var channel = new MessageChannel();
        e.ports[0].postMessage(encodeMessage({type: 'noads_tab_port'}), [channel.port2]);
        channel.port1.onmessage = onPopupMessageHandler;
    }
}
function magicHandler () {
    var sMagic = getValue('noads_magiclist').split('\n');
    if (sMagic) {
        blockingText += ', magic';

        var blockedFuncs = '', blockedVars = '';
        for (var i = 0, jS, j, ret = null, l = sMagic.length; i < l; i++) {
            // such parsing should mostly be when saving but...
            jS = sMagic[i];
            jS = jS.replace(/\/{2,}.*/gi, ''); // trim comments
            jS = jS.replace(/^[\s\xa0]+|[\s\xa0]+$|[^#]+(?:function|var|eval)/g, ''); //trim leading/trailing spaces and keywords
            jS = jS.replace(/[^\s\._\w\d]+/g, '');
            jS = jS.replace(/[\s]+/g, ' '); //just to be sure
            if (jS == '') continue;
            j = jS.split(' ');
            ret = window.parseInt(j[2], 10);
            ret = window.isNaN(ret) ? null : ret;
            if (j[0].match(/^function/i)) {
                // blocking functions
                blockedFuncs += ',' + j[1];

                /*if (~j[1].indexOf('.')) {
                 if (window[j[1].split('.')[0]]) {
                 var evalFn = 'window.opera.defineMagicFunction("' + j[1] + '",function(){ log("function is void"); return; });';
                 eval(evalFn); // I don't really want this x_x;
                 }
                 // also must be parsed on BeforeScript event as class sometimes unavailable before
                 } else {*/
                (function (name, debug) {
                    window.opera.defineMagicFunction(j[1], function () {
                        if (debug) window.opera.postError('[NoAdsAdvanced] function ' + name + ' is void'); return;
                    });
                })(j[1], bDebug);
                //}

                (function (name, debug) {
                    window[name] = function () {
                        if (debug) window.opera.postError('[NoAdsAdvanced] function ' + name + ' is void'); return;
                    };
                })(j[1], bDebug);
            } else if (j[0].match(/^var/i)) {
                //blocking variables
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

// In case we did something unneeded
window.addEventListener('DOMContentLoaded', function () {
    // don't want that in a frames
    if (window.top === window.self) {
        if (blockingText !== '') {
            log('On ' + domain + ' blocking:' + blockingText.substring(1));
        }

        // Setup hotkeys
        window.addEventListener('keydown', onHotkeyHandler, false);

        // Create menu messaging channel and parse background messages
        opera.extension.onmessage = onMessageHandler;
    }

    if (!(document.documentElement instanceof window.HTMLHtmlElement)) {
        delElement(document.getElementById('sCSS'));
        delElement(document.getElementById('uCSS'));
        delElement(document.getElementById('qbCSS'));
        window.removeEventListener('mousemove', showButton, false);
    }
}, false);


(function() {
    //if (document !== undefined && document.documentElement && !(document.documentElement instanceof window.HTMLHtmlElement)) return;
    if (typeof storage === "undefined" || !storage) {
        run.setStatus(lng.iNoQuota);
        window.alert(lng.iNoQuota);
        return;
    }

    // CSS
    try {
        onCSSAllowed();
    } catch (e) {
        window.opera.addEventListener('BeforeCSS', onCSSAllowed, false);
    }

    // Block external scripts
    if (options.checkEnabled('noads_scriptlist_state')) {
        reSkip = options.isActiveDomain('noads_scriptlist_white', domain, true);
        if (reSkip) {
            blockingText += ', external scripts';
            window.opera.addEventListener('BeforeExternalScript', onBeforeExternalScriptHandler, false);

            // Block inline scripts
            reBlock = options.getReScriptBlock('noads_scriptlist', domain);
            if (reBlock) {
                blockingText += ', inline scripts';
                window.opera.addEventListener('BeforeScript', onBeforeScriptHandler, false);
            }
        }
    }

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
        magicHandler();
    }
})();