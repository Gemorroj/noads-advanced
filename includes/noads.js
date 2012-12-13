// ==UserScript==
// @include http*
// @exclude opera:*
// @exclude about:*
// @exclude widget:*
// @exclude *.js
// @exclude *.txt
// @exclude *.pdf
// @exclude *.fb2
// @exclude *.jpg
// @exclude *.jpeg
// @exclude *.png
// @exclude *.apng
// @exclude *.gif
// @exclude *.swf
// @exclude *://localhost*
// @exclude *://192.168.*
// @exclude *://0.0.0.0*
// @exclude *dragonfly.opera.com*
// @exclude *jsperf.com*
// ==/UserScript==

// global variables
var debug = false,
    lng = new TRANSLATION(),
    loaded = false,
    notification_text = '',
    sStyle = '', uStyle = '',
    sCSS = '', uCSS = '',
    blockedScripts = '', inlineScripts = 0,
    blockingArray = [], reSkip, reBlock;

var quickButtonCSS = ' \
#noads_button{background-image:-o-linear-gradient(bottom, rgb(250,233,167) 0%, rgb(254,243,197) 100%);-o-transition: right 1s; position:fixed;bottom:0;width:auto !important;height:auto !important;margin:0 0 2px 2px;padding:10px 10px 10px 10px;background-color:#f5f5f5 !important;border:1px solid #838383;border-top:1px solid #A5A5A5;border-left:1px solid #A5A5A5;font-family:"Lucida Grande", Tahoma, Arial, Verdana, sans-serif;font-size:14px;line-height:130%;text-decoration:none;font-weight:700;color:#565656;z-index:1000000;cursor:pointer;}\
#noads_button:hover{-o-transition: right 1s}\
';

function showQuickButton(e) {
    var docEle = (document.compatMode === 'CSS1Compat' && window.postMessage) ? document.documentElement : document.body;

    if (docEle && docEle.clientHeight - e.clientY < 20 && docEle.clientWidth - e.clientX < 40) {
        run.createButton(sCSS ? (uCSS ? sCSS + ',' + uCSS : sCSS) : uCSS, inlineScripts ? ('<script>(' + inlineScripts + ')' + (blockedScripts ? '; ' + blockedScripts : '')) : blockedScripts);
    }
}

function setupFiltersCSS() {
    // Add CSS rules
    if (options.checkEnabled('noads_list_state') && options.isActiveDomain('noads_list_white', domain)) {
        sCSS = options.getRules('noads_list', domain);
        if (sCSS) {
            sStyle = addStyle(sCSS + none, 'sCSS');
            blockingArray.push('ads by CSS');
            log('Blocked CSS for <' + domain + '>');
        }
    }

    // Add custom CSS rules
    if (options.checkEnabled('noads_userlist_state') && options.isActiveDomain('noads_userlist_white', domain)) {
        uCSS = options.getRules('noads_userlist', domain);
        if (uCSS) {
            uStyle = addStyle(uCSS + none, 'uCSS');
            blockingArray.push('ads by user CSS');
            log('Blocked User CSS for <' + domain + '>');
        }
    }
}

function onPopupMessageHandler(e) {
    // Parse menu messages
    var message = decodeMessage(e.data);
    if (options.locked) return;
    if (message.type === 'ask_status') {
        e.source.postMessage(encodeMessage({type: 'status_enabled'}));
    }  
    if (options.checkEnabled('noads_disabled')) return;
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
        }
    }
}

function onHotkeyHandler(e) {
    if (e.shiftKey && !e.ctrlKey && e.altKey) {
        switch (e.keyCode) {
            case 68:
                run.toggleBlockingSite(); // permanent unblock/block for the site with Alt+Shift+D
                break;
            case 69:
                run.editStyles(); // Edit styles with Alt+Shift+E
                break;
            case 85:
                run.unblockElement(); // Unblock elements with Alt+Shift+U
                break;
            case 66:
                run.blockElement(); // Block element with Alt+Shift+B
                break;
            case 76:
                run.unblockElement(true); // Unblock latest element with Alt+Shift+L
                break;
            case 65:
                run.blockElement(true); // Block elements (don't use nth-child) with Alt+Shift+A
                break;
            case 80:
                options.showPreferences(domain); // Show preferences with Alt+Shift+P
                break;
        }
    }
}

function onNotifyUser(notification) {
     var message = {
         extension: "NoAds Advanced",
         text: notification,
         expire:-1
     };
     try {
         var evt = document.createEvent('CustomEvent');
         evt.initCustomEvent('Notify.It', false, false, message);
         document.dispatchEvent(evt);
     } catch (bug) {
         //log(bug);
     }
}

function onBeforeExternalScriptHandler(e) {
    var src = e.element.src;
    if (!src || reSkip.test(src)) return;
    var full = !/\.(com|net|org|edu|gov|mil|int|[a-z]{2})$/i.test(domain);
    if (getTLD(/^https?:\/\/(?:[^\/]+@)?([^:\/]+)/i.exec(src)[1], full) !== getTLD(domain, full)) {
        e.preventDefault();
        if (blockedScripts.indexOf(src) === -1) {
            blockedScripts += blockedScripts ? '; ' + src : src;
        }
        log('Blocked external script -> ' + src + ' for <' + domain + '>');
    }
}

function onBeforeScriptHandler(e) {
    if (reBlock.test(e.element.text)) {
        e.preventDefault();
        inlineScripts++;
        log('Blocked inline script -> ' + inlineScripts + ' for <' + domain + '>');
    }
}

function onMessageHandler(e) {
    var message = decodeMessage(e.data);
    if (message.type === 'noads_bg_port') {
        var channel = new MessageChannel();
        e.ports[0].postMessage(encodeMessage({type: 'noads_tab_port'}), [channel.port2]);
        channel.port1.onmessage = onPopupMessageHandler;
    } else if (message.type === 'noadsadvanced_autoupdate') {
        notification_text = message.text;
        if (loaded && notification_text !== '') {
            onNotifyUser(notification_text);
            notification_text = '';
        }
    } else if (message.type === 'noads_context_menu') {
        onPopupMessageHandler({data: encodeMessage(message.subtype)});
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
function setupMagic() {
    var sMagic = getValue('noads_magiclist').split('\n');
    if (sMagic) {
        blockingArray.push('magic');

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
            if (/^function/i.test(j[0])) {
                // blocking functions
                blockedFuncs += ',' + j[1];

                (function (name, debug) {
                    window.opera.defineMagicFunction(j[1], function () {
                        if (debug) window.opera.postError('[NoAdsAdvanced] function ' + name + ' is void');
                        return null;
                    });
                })(j[1], debug);
                //}

                (function (name, debug) {
                    window[name] = function () {
                        if (debug) window.opera.postError('[NoAdsAdvanced] function ' + name + ' is void');
                        return null;
                    };
                })(j[1], debug);
            } else if (/^var/i.test(j[0])) {
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

// Main body
(function () {
    //if (document !== undefined && document.documentElement && !(document.documentElement instanceof window.HTMLHtmlElement)) return;

    // we can only work with options after checking this
    if (typeof storage === "undefined" || !storage) {
        run.setStatus(lng.iNoQuota);
        window.alert(lng.iNoQuota);
        return;
    }

    debug = options.checkEnabled('noads_debug_enabled_state');

    // Create menu messaging channel and parse messages from the background
    opera.extension.onmessage = onMessageHandler;

    if (options.checkEnabled('noads_disabled')) return;

    // CSS failsafe handling
    try {
        setupFiltersCSS();
    } catch (e) {
        window.opera.addEventListener('BeforeCSS', setupFiltersCSS, false);
    }

    // Block external scripts
    if (options.checkEnabled('noads_scriptlist_state')) {
        reSkip = options.isActiveDomain('noads_scriptlist_white', domain, true);
        if (reSkip) {
            blockingArray.push('external scripts');
            window.opera.addEventListener('BeforeExternalScript', onBeforeExternalScriptHandler, false);

            // Block inline scripts
            reBlock = options.getReScriptBlock('noads_scriptlist', domain);
            if (reBlock) {
                blockingArray.push('inline scripts');
                window.opera.addEventListener('BeforeScript', onBeforeScriptHandler, false);
            }
        }
    }

    if (debug && blockingArray.length) {
        log('On ' + domain + ' blocking: ' + blockingArray.join(', '));
    }

    if (options.checkEnabled('noads_magiclist_state') && options.isActiveDomain('noads_scriptlist_white', domain)) {
        setupMagic();
    }
})();

// On the document load
window.addEventListener('DOMContentLoaded', function () {
    if (!(document.documentElement instanceof window.HTMLHtmlElement)) {
        delElement(document.getElementById('sCSS'));
        delElement(document.getElementById('uCSS'));
        delElement(document.getElementById('qbCSS'));
        window.removeEventListener('mousemove', showQuickButton, false);
        window.removeEventListener('keydown', onHotkeyHandler, false);
    } else {
        // don't want that in a frames
        if (window.top === window.self) {
            loaded = true;

            if (notification_text !== '') {
                onNotifyUser(notification_text);
                notification_text = '';
            }
            // Setup hotkeys
            window.addEventListener('keydown', onHotkeyHandler, false);

            if (options.checkEnabled('noads_button_state')) {
                log('Button is enabled...');
                addStyle(quickButtonCSS, 'qbCSS');
                window.addEventListener('mousemove', showQuickButton, false);
            }

            sendMessage({type: 'status_enabled'});
        }
    }
}, true);
