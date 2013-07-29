// ==UserScript==
// @include http*
// @exclude opera:*
// @exclude about:*
// @exclude widget:*
// @exclude *.js
// @exclude *.txt
// @exclude *.pdf
// @exclude *.apng
// @exclude *.gif
// @exclude *.swf
// @exclude *://localhost*
// @exclude *://192.168.*
// @exclude *://0.0.0.0*
// @exclude *dragonfly.opera.com*
// @exclude *jsperf.com*
// @exclude *peacekeeper.futuremark.com*
// @exclude *acid3.acidtests.org*
// ==/UserScript==

var storage = widget.preferences;
var domain = window.location.hostname;

// Helper Functions
var decodeMessage = function (data) {
    return JSON.parse(data);
},
encodeMessage = function (data) {
    return JSON.stringify(data);
},
log = function () {
    // Example: log('[NoAds]: test..');
    if (debug) opera.postError('[NoAdsAdvanced] ' + Array.prototype.slice.call(arguments));
},
getValue = function (name) {
    return storage[name] || '';
},
setValue = function (name, value) {
    storage[name] = value;
},
sendMessage = function (msg) {
    /*for (var i = 0, f = window.frames, l = f.length; i < l; i++) if (f[i]) f[i].postMessage(msg, '*');*/
    opera.extension.postMessage(encodeMessage(msg));
},
delElement = function (ele) {
    if (ele && ele.parentNode) ele.parentNode.removeChild(ele);
},
addStyle = function (css, id) {
    if (!(document.documentElement instanceof window.HTMLHtmlElement)) {
        throw 'Not an HTML page.';
    }
    var s = document.createElement('style');
    if (id) {
        s.id = id;
    }
    s.type = 'text/css';
    s.appendChild(document.createTextNode(css));
    return (document.head || document.documentElement).appendChild(s);
},
replaceStyle = function (ele, css) {
    if (ele) {
        if (!(document.documentElement instanceof window.HTMLHtmlElement)) {
            throw 'Not an HTML page.';
        }
        ele.innerHTML = '';
        /*
        while (ele.firstChild) {
            ele.removeChild(ele.firstChild);
        }
        */
        ele.appendChild(document.createTextNode(css));
    }
},
screenRegExp = function (text) { 
    return text.replace(/\s/g, '\\s').replace(/[[\]{}()*+?.\\^$|#]/g, "\\$&");
},
splitCSS = function (css) {
    var rez = [];
    css.replace(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/g, function (s, m) {
        rez.push(m.replace(/^\s+|\s+$/g, ''));
    });
    return rez;
},
getTLD = function (domain, full) {
    if (!domain) return '';
    var r = /^((?:\d{1,3}\.){3})\d{1,3}$/.exec(domain);
    if (r) return r[1] + '0';
    var a = domain.split('.'), l = a.length;
    if (l < 2) return domain;
    return full ? a[l - 2] + '.' + a[l - 1] : a[(l > 2 && /^(co|com|net|org|edu|gov|mil|int)$/i.test(a[l - 2])) ? l - 3 : l - 2];
},
inArray = function (needle) {
    for (var tmp, i = 0, l = this.length; i < l; ++i) {
        tmp = this[i];
        if (tmp && (tmp === needle)) {
            return true;
        }
    }
    return false;
},
unique = function () {
    var u = {}, a = [];
    for (var tmp, i = 0, l = this.length; i < l; ++i) {
        tmp = this[i];
        if (tmp in u) {
            continue;
        }
        a.push(tmp);
        u[tmp] = 1;
   }
   return a;
};