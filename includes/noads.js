// ==UserScript==
// @include http*
// @exclude opera:*
// @exclude about:*
// @exclude widget:*
// @exclude *://localhost*
// @exclude *://192.168.*
// @exclude *://0.0.0.0*
// @exclude *dragonfly.opera.com*
// @exclude *acid3.acidtests.org*
// @exclude *.futuremark.com*
// @exclude *v8.googlecode.com*
// ==/UserScript==

// global variables
var bDebug = options.checkEnabled('noads_debug_enabled_state'), currentdomain, reSkip, reBlock, sStyle, uStyle, sMagic = '', sCSS = '', uCSS = '', bgImages = '', blockedScripts = '', inlineScripts = 0;

(function() {
    //if(document !== undefined && document.documentElement && !(document.documentElement instanceof window.HTMLHtmlElement)) return;
    if (typeof storage === undefined || !storage) { run.setStatus(TRANSLATE().iNoQuota); alert(TRANSLATE().iNoQuota); return; };
    var blockingText = '', domain = window.location.hostname;

    // Set subscription listener here?
    //if(options.checkEnabled('noads_subscription_state')){};
    
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
                        (function(name, debug) {
                            window.opera.defineMagicFunction(j[1], function () { if (debug) window.opera.postError('[NoAdsAdvanced] function ' + name + ' is void'); return; }); 
                        })(j[1], bDebug);
                    //}

                    (function(name, debug) {
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
        var append = function (str, p1, offset, s) {
            bgImages += p1 + '; ';
        };
        userJSEvent.cssText.replace(/(?:url\(['"]?)([^'"\)]+)(?:['"]?\))/ig, append);
    }, false);

    // Block external scripts
    if (options.checkEnabled('noads_scriptlist_state') && (reSkip = options.isActiveDomain('noads_scriptlist_white', domain, true))) {
        blockingText += ', external scripts';
        window.opera.addEventListener('BeforeExternalScript', function (e) {
            var src = e.element.src;
            if (!src || reSkip.test(src) || e.element.isNoAdsSubscription) return;
            var site = window.location.hostname, full = !/\.(com|[a-z]{2})$/i.test(site);
            var a = src.match(/^https?:\/\/([^\/]+@)?([^:\/]+)/i);
            if (getTLD(a ? a[2] : site, full) != getTLD(site, full)) {
                e.preventDefault();
                if (blockedScripts.indexOf(src) == -1) blockedScripts += blockedScripts ? '; ' + src : src;
                log('blocked script -> ' + src + ' for <' + site + '>');
            }
        }, false);

        if (reBlock = options.getReScriptBlock('noads_scriptlist')) {
            window.opera.addEventListener('BeforeScript', function (e) {
                if (reBlock.test(e.element.text)) {
                    e.preventDefault();
                    inlineScripts++;
                }
            }, false);
        }
    }

    var showButton = function (e) {
        var docEle;

        if (document && document.compatMode == 'CSS1Compat' && window.postMessage) docEle = document.documentElement;
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
            //window.removeEventListener('mousemove', showButton, false); 
            if (options.checkEnabled('noads_button_state')) {
                log('button is enabled...');
                addStyle(quickButtonCSS, 'qbCSS');
                window.addEventListener('mousemove', showButton, false);
            }
        }
    };

    try { onCSSAllowed(); }
    catch(ex) { window.opera.addEventListener('BeforeCSS', function(event) {
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
            if (message.type == 'noads_bg_port') {
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
            delEle(document.getElementById('sCSS'));
            delEle(document.getElementById('uCSS'));
            delEle(document.getElementById('qbCSS'));
            window.removeEventListener('mousemove', showButton, false); 
        }
    },false);
})();