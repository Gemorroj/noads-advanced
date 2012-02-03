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
var none = '{display: none !important;}';
var highlightCSS = '{background-color: #FF5555 !important; outline: 1px solid #FF1111 !important; opacity: 0.6 !important;}';
var outlineCSS = '1px solid #306EFF';
var outlineBgCSS = '#C6DEFF';
var paddingCSS = 'iframe, embed, object, audio, video {\
padding-left: 15px !important;\
background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAQAAABHeoekAAAAc0lEQVQY02P4z4AfMlBPAQMzAzNWNlwIRPEygAA7mM3JgGYCL5gSgUrrMCgwsKEqYABKwjg6DGog09AVMDCIgZmmEGlMBexwjiREPaoCmN3GULegKoD6AmI3xC0C6CZwMijD7AZKamLzBRsQwgCYTZ24AAD8Zqzk4ASGSwAAAABJRU5ErkJggg=="),\
-o-linear-gradient( top, rgba(220,0,0,1) 0%, rgba(255,255,255,0) 30% ) !important;\
background-repeat: no-repeat !important;\
background-position: 0px 0px !important;\
z-index: 1001 !important;\
}';
var contentHelperCSS = ' \
.noads_button_placeholder {display:block !important;float:none;position:fixed;right:0;top:0;height:auto;width:auto;padding:2px;margin:0;border:1px solid #bbb;background:-o-skin("Window Skin");z-index:10001;}\
.noads_button_hide{display:block !important;float:left;height:18px;width:18px;padding:0;margin:0;border:none;background:-o-skin("Caption Minimize Button Skin");cursor:pointer;z-index:1000002;}\
.noads_button_close{display:block !important;float:left;height:18px;width:18px;padding:0;margin:0;border:none;background:-o-skin("Caption Close Button Skin");cursor:pointer;z-index:1000002;}\
.noads_helper_content{font-weight:bold;color:#e00;display:block;float:none;position:absolute;left:0;top:0;width:auto;height:auto;overflow:auto;margin:0;padding:0;z-index:1000000;}\
.noads_placeholder{display:block !important;width:auto;min-width:20px;max-width:900px;min-height:20px;max-height:100px;margin:0 !important;padding:0 !important;border:1px outset #aaa;font:16px Times New Roman;color:black;background-color:white;}\
';


// NoAds Advanced main
var noads = {
    clearCSSrules: function (css) {
        var a = splitCSS(css), rule, j;
        for (var i = a.length; i--; ) {
            rule = a[i] + '>';
            for (j = a.length; j--; ) {
                if (a[j].indexOf(rule) === 0) {
                    a.splice(j, 1);
                }
            }
        }
        return a.join(',');
    },

    deleleCSSrule: function (css, del) {
        var a = splitCSS(css);
        if (del) {
            for (var i = a.length; i--; ) {
                if (del.indexOf(a[i]) === 0) {
                    a.splice(i, 1)
                }
            }
        } else {
            a.pop();
        }
        return a.join(',');
    },

    getAttrSelector: function (el, tags) {
        var rez = '';
        if (el.attributes) {
            var r = new RegExp('^(' + tags + ')$'), n;
            for (var i = 0, a; a = el.attributes[i]; i++) {
                n = a.nodeName.toLowerCase();
                if (r.test(n)) {
                    if (n === 'id') {
                        if (a.nodeValue.match(/[^_a-zA-Z0-9-]/i)) {
                            // check for unallowed values
                            continue;
                        }
                        rez = '#' + a.nodeValue.replace(/[\x22\x5C]/g, '');
                        break;
                    } else if (n === 'class') {
                        if (~a.nodeValue.indexOf(' ')) {
                            rez += '[' + n + '=\x22' + a.nodeValue.replace(/[\x22\x5C]/g, '\\$&') + '\x22]';
                        } else if (!a.nodeValue.match(/[^_a-zA-Z0-9-]/i)) {
                            // check for unallowed values
                            rez += '.' + a.nodeValue.replace(/[\x22\x5C]/g, '');
                        }
                    } else {
                        rez += '[' + n + '=\x22' + a.nodeValue.replace(/[\x22\x5C]/g, '\\$&') + '\x22]';
                    }
                }
            }
        }
        return rez;
    },

    getNth: function (el) {
        var nth, n = 0, p = el.parentElement;
        for (var i = 0, c; c = p.children[i]; i++) {
            n++;
            if (c === el) {
                nth = n;
            }
        }
        return (!nth || n < 2) ? '' : ':nth-child(' + nth + ')';
    },

    getCSSrule: function (el, wide) {
        var att, single, tag, rez = [];
        while (el) {
            tag = el.nodeName;
            if (/^(html|body)$/i.test(tag)) break;
            att = this.getAttrSelector(el, 'src') || this.getAttrSelector(el, 'href') || this.getAttrSelector(el, 'data');
            if (att) {
                if (this.getAttrSelector(el, 'servicenoads')) {
                    // for blocker helper
                    tag = '';
                }
                if (~att.indexOf('://')) {
                    rez.unshift(tag + (wide ? att.replace(/^(\[\w+)(=\x22\w+:\/\/)([^?#]+\/[^?#]+\/|[^?#]+).*(\x22\])$/i, '$1^$2$3$4') : att));
                } else {
                    rez.unshift(tag + (wide ? att.replace(/^(\[\w+)(=\x22[\/\.]*)([^?#]+\/[^?#]+\/|[^?#]+).*(\x22\])$/i, '$1*$2$3$4') : att));
                }
                break;
            } else {
                att = this.getAttrSelector(el, 'id|class|name|height|width|color|bgcolor|align|valign|type');
                try {
                    single = (document.querySelectorAll(tag + att).length === 1);
                } catch (e) {
                    break;
                }
                rez.unshift(tag + att + ((wide !== false) ? '' : this.getNth(el)));
                if (wide && att && single) break;
            }
            el = el.parentElement;
        }
        return rez.join('>');
    },

    getFilterLink: function (css, domain) {
        if (/not\s*\(/i.test(css)) return;
        var ruleURL = css.match(/(?:src|href|data)\s*\^=\s*"([^"]+)"/i);
        if (ruleURL && ruleURL[1]) {
            ruleURL[1] += '*';
        } else {
            ruleURL = css.match(/(?:src|href|data)\s*\*=\s*"([^"]+)"/i);
            if (ruleURL && ruleURL[1]) {
                if (ruleURL[1].length < 5) {
                    return;
                } else {
                    ruleURL[1] = '*' + ruleURL[1] + '*';
                }
            } else {
                ruleURL = css.match(/(?:src|href|data)\s*=\s*"([^"]+)"/i);
                if (!ruleURL || !ruleURL[1]) return;
             }
        }

        ruleURL[1] = ruleURL[1].replace(/^\.\/|\.\.\/?/g,'*'); // "../" or "./" -> *
        if (ruleURL[1].match(/^https?:?\/?\/?\*+$/gi)) return; // "http(s)://"
        if (ruleURL[1].indexOf('http') === -1) {
            if (domain) {
                if (ruleURL[1].indexOf('*') !== 0 && (ruleURL[1].charAt(0) === '/' || domain.charAt(domain.length - 1) === '/')) {
                    return domain + ruleURL[1];
                } else {
                    return domain + '/' + ruleURL[1];
                }
            }
        } else {
            return ruleURL[1];
        }
    }
};


// Helper Objects
var run = {
    stop: null,
    setStatus: function (value) {
        if (window.top === window.self) {
            window.status = value;
            window.defaultStatus = value;
            window.setTimeout(function () {
                window.defaultStatus = '';
            }, 4000);
        }
    },
    // disable and enable blocking globally
    toggleBlocking: function (){
        if (block && !options.checkEnabled('noads_disable')) {
            sendMessage({ type: 'reload_rules', global: false, clear: true });
            sendMessage({ type: 'reload_rules', global: true, clear: true });
            options.setEnabled('noads_disable', true);
            this.setStatus(lng.globallyDisabled);
        } else {
            sendMessage({ type: 'reload_rules', global: false, clear: false });
            sendMessage({ type: 'reload_rules', global: true, clear: false });
            options.setEnabled('noads_disable', false);
            this.setStatus(lng.globallyEnabled);
        }
    },
    // disable and enable blocking for current site
    toggleBlockingSite: function (block) {
        if (arguments.length ? !block : options.getForSite(domain)) {
            options.setForSite(domain, false);
            run.updateCSS(domain);
            this.setStatus(lng.nDisabled);
        } else {
            options.setForSite(domain, true);
            run.updateCSS(domain);
            this.setStatus(lng.nEnabled);
        }
    },
    // NoAds
    editStyles: function () {
        var rez = window.prompt(lng.eStyles, options.getRules('noads_userlist', domain));
        if (rez !== null) {
            rez = options.setRules('noads_userlist', domain, rez);
            uCSS = rez;
            if (rez) rez += none;
            if (uStyle) {
                replaceStyle(uStyle, rez);
            } else {
                uStyle = addStyle(rez);
            }
        }
    },

    updateCSS: function (domain) {
        sCSS = (options.checkEnabled('noads_list_state') && options.isActiveDomain('noads_list_white', domain)) ? options.getRules('noads_list', domain) : '';
        if (sStyle) {
            replaceStyle(sStyle, sCSS ? sCSS + none : '');
        } else if (sCSS) {
            sStyle = addStyle(sCSS + none);
        }
        uCSS = (options.checkEnabled('noads_userlist_state') && options.isActiveDomain('noads_userlist_white', domain)) ? options.getRules('noads_userlist', domain) : '';
        if (uStyle) {
            replaceStyle(uStyle, uCSS ? uCSS + none : '');
        } else if (uCSS) {
            uStyle = addStyle(uCSS + none);
        }
    },

    unblockElement: function (latest) {
        if (this.stop) {
            this.stop();
            return;
        }
        var padCSS, css = options.getRules('noads_userlist', domain);
        if (!uStyle || !css) return;

        var remove = function () {
            document.removeEventListener('click', click, true);
            document.removeEventListener('mousedown', rightclick, false);
            document.removeEventListener('keyup', press, false);
            delElement(padCSS);
            run.stop = null;
        },
        click = function (ev) {
            ev.preventDefault();
            ev.stopPropagation();

            var oldCSS = options.getRules('noads_userlist', domain),
                cssRule = noads.getCSSrule(ev.target, false),
                newCSS = noads.deleleCSSrule(oldCSS, cssRule),
                curLink = noads.getFilterLink(cssRule); //if rule contains href^=link src*=link or data=link removing link from urlfilter

            if (curLink && (newCSS != oldCSS)) {
                sendMessage({type: 'unblock_address', url: curLink});
            }

            //if rule is not in CSS then searching for more general rules?
            cssRule = noads.getCSSrule(ev.target, null);
            if (newCSS == oldCSS) {
                newCSS = noads.deleleCSSrule(oldCSS, cssRule);
            }
            curLink = noads.getFilterLink(cssRule);
            if (curLink && (newCSS != oldCSS)) {
                sendMessage({type: 'unblock_address', url: curLink});
            }

            cssRule = noads.getCSSrule(ev.target, true);
            if (newCSS == oldCSS) {
                newCSS = noads.deleleCSSrule(oldCSS, cssRule);
            }
            curLink = noads.getFilterLink(cssRule);
            if (curLink && (newCSS != oldCSS)) {
                sendMessage({type: 'unblock_address', url: curLink});
            }

            // setting new rules
            if (newCSS != oldCSS) {
                newCSS = options.setRules('noads_userlist', domain, newCSS);
            }

            uCSS = newCSS;
            replaceStyle(uStyle, newCSS ? newCSS + (ev.shiftKey ? highlightCSS : none) : '');
            if (!ev.shiftKey) {
                remove();
            }
            return false;
        },
        rightclick = function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.button && ev.button == 2) {
                run.stop();
            }
            return false;
        },
        press = function (ev) {
            if (ev.keyCode === 27) {
                run.stop();
            }
        };

        if (latest) {
            //if last rule contains href^=link src*=link removing link from urlfilter
            var lastEl = noads.getFilterLink(splitCSS(css).pop());
            if (lastEl) {
                sendMessage({ type: 'unblock_address', url: lastEl});
            }

            css = options.setRules('noads_userlist', domain, noads.deleleCSSrule(css));
            uCSS = css;
            replaceStyle(uStyle, css ? css + none : '');
        } else {
            this.stop = function () {
                var css = options.getRules('noads_userlist', domain);
                replaceStyle(uStyle, css ? css + none : '');
                remove();
            };
            padCSS = addStyle(paddingCSS);
            replaceStyle(uStyle, css + highlightCSS);
            document.addEventListener('click', click, true);
            document.addEventListener('mousedown', rightclick, false);
            document.addEventListener('keyup', press, false);
        }
    },

    blockElement: function (wide, noremove) {
        if (this.stop) {
            this.stop();
            return;
        }
        var css, tmpCSS, padCSS, ele = null, outline = '', bgColor = '', title = '';

        var remove = function () {
            document.removeEventListener('mouseover', over, false);
            document.removeEventListener('mouseout', out, false);
            document.removeEventListener('mousedown', mousebutton, true);
            document.removeEventListener('click', click, true);
            document.removeEventListener('keyup', press, false);
            delElement(tmpCSS);
            delElement(padCSS);
            run.stop = null;
        },
        over = function (ev) {
            if (!ev) return;
            ele = ev.target;
            title = ele.getAttribute('title');
            outline = ele.style.outline;
            bgColor = ele.style.backgroundColor;

            if (!ele.getAttribute('servicenoads')) {
                ele.title = 'Tag: ' + ele.nodeName + (ele.id ? ', ID: ' + ele.id : '') + (ele.className ? ', Class: ' + ele.className : '');
                ele.style.outline = outlineCSS;
                ele.style.backgroundColor = outlineBgCSS;
            }
        },
        out = function () {
            if (ele) {
                // restore attributes
                title ? ele.title = title : ele.removeAttribute('title');

                ele.style.outline = outline;
                ele.style.backgroundColor = bgColor;
                if (ele.style.length < 1) {
                    ele.removeAttribute('style');
                }
            }
        },
        click = function (ev) {
            if (!ele || ele.getAttribute('servicenoads')) return;
            ev.preventDefault();
            ev.stopPropagation();
            
            // Hide top element with Ctrl-click, can't undo.
            if (ev.ctrlKey) {
                ele.style.zIndex = '1';
                ele.style.display = 'none';
                return;
            }
            
            var rules, rule = noads.getCSSrule(ele, !wide != !ev.altKey); // get CSS rule for current element

            css = css ? (css != (rules = noads.deleleCSSrule(css, rule)) ? (ev.shiftKey ? rules : css) : css + ',' + rule) : rule;
            if (tmpCSS) {
                replaceStyle(tmpCSS, css + highlightCSS);
            } else {
                tmpCSS = addStyle(css + highlightCSS);
            }

            if (!ev.shiftKey) {
                // highlight elements marked for removing
                var backup = [], demo;
                try {
                    demo = document.querySelectorAll(css);
                    for (var i = 0, backAttr = {}, l = demo.length; i < l; i++) {
                         backAttr = {title: demo[i].title, outline: demo[i].style.outline, bgColor: demo[i].style.backgroundColor};
                         demo[i].style.outline = '1px solid #306EFF';
                         demo[i].style.backgroundColor = '#C6DEFF';
                         backup.push(backAttr);
                    }
                } catch (ex) {
                    log('Invalid selector generated: ' + css);
                    demo = null;
                    backup = null;
                }
                css = window.prompt(lng.bElement, css); // ask user to fix selector
                if (backup && demo && backup.length) {
                    for (var i = 0, l = demo.length; i < l; i++) {
                         demo[i].style.outline = backup[i].outline;
                         demo[i].style.backgroundColor = backup[i].bgColor;
                    }
                    backup = null;
                }
                if (css) {
                    try {
                        document.querySelectorAll(css);
                    } catch (e) {
                        window.alert(lng.pInvalidSelector);
                        css = null;
                    }
                }
                if (css) {
                    /*
                    * if rule contains href^=link src*=link or data=link adding link to the urlfilter
                    *  then we are getting double protection: urlfilter + CSS. sure-kill ^_^
                    *  But there is certain setback as we can't block it for defined sites so blocked URL
                    *  will become totally! unavailible from adress-bar until manual unblocking via extension.
                    */
                    var arrCSS = css.split(/\s*, \s*/);
                    // trying to get links out of selectors
                    for (var i = 0, link = noads.getFilterLink(arrCSS[i]), l = arrCSS.length; i < l; i++) {
                        if (link) {
                            sendMessage({type: 'block_address', url: link});
                        }
                    }

                    rules = options.getRules('noads_userlist', domain);
                    if (rules) {
                        css = noads.clearCSSrules(rules + ',' + css);
                    }
                    css = options.setRules('noads_userlist', domain, css);
                    uCSS = css;
                    if (uStyle) {
                        replaceStyle(uStyle, css + none);
                    } else {
                        uStyle = addStyle(css + none);
                    }
                }
                if (!noremove) remove();
            }
            out();
            return false;
        },
        press = function (ev) {
            if (ev.keyCode === 27) run.stop();
        },
        mousebutton = function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        
            // middle and left mouse button
            switch (ev.button) {
                case 0: // Left button
                    // Pre-filter some events for selected element and it's parents.
                    // I know it's possibly overkill and brakes the page logic until reload but..
                    var el = ele;
                    while(el !== null) {
                        if(el.nodeName.toLowerCase() === 'html')
                            break;
                        el.removeAttribute('onclick');
                        el.removeAttribute('onmousedown');
                        el.removeAttribute('onmouseup');
                        el.removeAttribute('onmousemove');
                        el.removeAttribute('onmouseout');
                        el.onclick = null;
                        el.onmousedown = null;
                        el.onmouseup = null;
                        el.onmousemove = null;
                        el.onmouseout = null;
                        el = el.parentElement;
                    }
                    break;
                case 1: // Middle button
                    break;
                case 2: // Right button
                    run.stop();
                    break;
                default:
            }
            return false;
        };

        this.stop = function () {
            out();
            remove();
        };

        padCSS = addStyle(paddingCSS);
        document.addEventListener('mouseover', over, false);
        document.addEventListener('mouseout', out, false);
        document.addEventListener('mousedown', mousebutton, true);
        document.addEventListener('click', click, true);
        document.addEventListener('keyup', press, false);
    },
    // the quick button
    noreload: true,
    createButton: function (css, blocked) {
        var enabled = options.getForSite(domain);
        if (this.stop) {
            this.stop();
            return;
        }

        if (enabled && this.noreload && !blocked && !css) return;
        var sCount, eCount, txt, title, b = document.getElementById('noads_button');

        if (!b) {
            // checking for invalid CSS in preferences and removing unused ones
            // FIXME:
            //  Isn't it too slow for dynaminc button?
            var arrCSS = splitCSS(css);
            try {
                for (var i = arrCSS.length; i--;)
                    document.querySelectorAll(arrCSS[i]).length === 0 ? arrCSS.splice(i, 1) : '';
            } catch (e) {
                log('invalid CSS encountered: ' + arrCSS[i]);
                return;
            }
            css = arrCSS.join(',');

            sCount = blocked.split('; ').length;
            eCount = arrCSS.length;
            txt = this.noreload ? (enabled ? lng.blocked + ': ' + (blocked ? sCount + ' ' + lng.script + lng._s(sCount) + (css ? lng.and : '') : '') + (css ? eCount + ' ' + lng.element + lng._s(eCount) : '') : lng.disabled) : lng.reload;
            title = (enabled && this.noreload) ? lng.unblock + ': ' + (blocked ? blocked + (css ? '; ' : '') : '') + css : '';
                
            b = document.createElement('input');
            b.setAttribute('servicenoads', 'true');
            b.type = 'button';
            b.value = txt;
            b.title = title;
            b.style = 'right: -100px;';
            b.id = 'noads_button';
            b.addEventListener('click', function (e) {
                if (e.ctrlKey && !e.shiftKey && !e.altKey) {
                    options.showPreferences(domain);
                    return;
                }
                if (run.noreload) {
                    run.toggleBlockingSite(!enabled);
                    if (css && !blocked) {
                        delElement(this);
                    } else {
                        this.value = lng.reload;
                        this.style.width = 'auto';
                        run.noreload = false;
                    }
                } else {
                    window.location.reload();
                }
            }, false);
            b.addEventListener('mouseout', function () {
                //this.setAttribute('style', 'visibility:hidden;');
                //this.setAttribute('style', 'right:'+b.offsetWidth+'px;');
                this.style = 'right: -100px;';
                delElement(this, this.offsetHeight * this.offsetWidth);
            }, false);
            try {
                document.body.appendChild(b);
            } catch(e) {}
        }
        
        //b.style.visibility = 'visible';
        b.style = 'right: 0;';
    },

    contentBlockHelper: function () {
        var overlay = document.getElementById('noads_helper');
        if (overlay) {
            this.blockElement(); //stop
            overlay.close();
            return;
        }

        var diffHeight = window.outerHeight - window.innerHeight,
            scripts = document.querySelectorAll('script'),
            objects = document.querySelectorAll('iframe,embed,object,param[name="flashvars"],param[name="movie"],audio,video'),
            resize = function () {
                if (diffHeight > (diffHeight = window.outerHeight - window.innerHeight)) {
                    window.setTimeout(overlay.close, 200);
                }
            },
            getStyleSheet = function () {
                var css = '', styles = document.styleSheets;
                for (var i = 0, l = styles.length; i < l; i++) {
                    try {
                        for (var j = 0, len = styles[i].cssRules.length; j < len; j++) {
                            css += styles[i].cssRules[j].cssText;
                        }
                    } catch (e) {}
                }
                return css;
            };

        if (scripts.length || objects.length) {
            window.scrollTo(0, 0);
            overlay = document.createElement('div');
            overlay.setAttribute('servicenoads', 'true');
            overlay.id = 'noads_helper';
            overlay.clearStyle = addStyle(contentHelperCSS);
            overlay.close = function () {
                delElement(this.clearStyle);
                window.removeEventListener('resize', resize, false);
                for (var imgs = document.querySelectorAll('.noads_placeholder'), i = imgs.length; i--;) {
                    delElement(imgs[i]);
                }
                delElement(this);
            };
            window.addEventListener('resize', resize, false);

            var buttons = document.createElement('div');
            buttons.setAttribute('servicenoads', 'true');
            buttons.className = 'noads_button_placeholder';

            var hide = document.createElement('div');
            hide.title = lng.pHide;
            hide.setAttribute('servicenoads', 'true');
            hide.className = 'noads_button_hide';
            buttons.appendChild(hide);

            var close = document.createElement('div');
            close.title = lng.pClose;
            close.setAttribute('servicenoads', 'true');
            close.className = 'noads_button_close';
            close.addEventListener('click', function () {
                run.blockElement(); //stop
                overlay.close();
            }, false);
            buttons.appendChild(close);

            overlay.appendChild(buttons);
            var content = document.createElement('div');
            content.setAttribute('servicenoads', 'true');
            content.className = 'noads_helper_content';
            content.hide = function () {
                this.style.visibility = (this.style.visibility !== 'hidden') ? 'hidden' : 'visible';
            };

            for (var i = 0, script, a = blockedScripts.split('; '); script = scripts[i]; i++) {
                if (script.src && a.indexOf(script.src) === -1) {
                    var link = document.createElement('a'), img = document.createElement('img');

                    link.href = script.src;
                    link.target = '_blank';

                    img.className = 'noads_placeholder';
                    img.src = script.src;
                    img.alt = 'script: ' + script.src.replace(/[\?&]+.*$/g, '') + ' ';
                    img.setAttribute('servicenoads', 'true');

                    link.appendChild(img);
                    content.appendChild(link);
                }
            }

            for (var i = 0, alttext, l = objects.length; i < l; i++) {
                var source = objects[i].src || objects[i].value || objects[i].data;
                if (source && (alttext = source.replace(/[\?&]+.*$/g, '').replace(/^[\w_]+=/g, ''))) {
                    if (alttext.indexOf('widget://') === 0) {
                        continue;
                    }

                    var link = document.createElement('a'), img = document.createElement('img');

                    link.href = source;
                    link.target = '_blank';

                    img.className = 'noads_placeholder';
                    img.src = source;
                    img.alt = objects[i].tagName.toLowerCase() + ': ' + alttext + ' ';
                    img.setAttribute('servicenoads', 'true');

                    content.appendChild(img);
                    link.appendChild(img);
                    content.appendChild(link);
                }
            }
            overlay.appendChild(content);

            // @see noads.js
            //  bgImages = bgImages.split('; ');

            var bgImages = [];
            getStyleSheet().replace(/(?:url\(['"]?)([^'"\)]+)(?:['"]?\))/ig, function (str, p1) {
                bgImages.push(p1);
            });
            bgImages = unique.call(bgImages);

            if (bgImages.length) {
                content.appendChild(document.createTextNode(lng.pCSSlinks + ':'));
                overlay.appendChild(content);

                for (var i in bgImages) {
                    if (bgImages.hasOwnProperty(i)) {
                        if (bgImages[i].indexOf('data:') === -1) {
                            var link = document.createElement('a'), img = document.createElement('img');

                            link.href = bgImages[i];
                            link.target = '_blank';

                            img.className = 'noads_placeholder';
                            img.src = bgImages[i];
                            img.alt = 'url( ' + bgImages[i].replace(/^[\/\.]+|[\?&]+.*$/g, '') + ' )';
                            img.setAttribute('servicenoads', 'true');

                            link.appendChild(img);
                            content.appendChild(link);
                        }
                    }
                }
                overlay.appendChild(content);
            }

            if (content.childElementCount) {
                hide.addEventListener('click', content.hide, false);
            } else {
                hide.style.opacity = 0.5;
            }

            try {
                (document.body || document.documentElement).appendChild(overlay);
                this.blockElement(false, true);
            } catch (e) {
                delElement(overlay.clearStyle);
                window.removeEventListener('resize', resize, false);
                delElement(overlay);
            }
        }
    }
};
