<<<<<<< HEAD
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

=======
>>>>>>> 3716c3327a445d93298410c276055e452322ef3a
var storage = widget.preferences; // var storage = window.opera.storage;
var extension = window.opera.extension;
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
    if (bDebug) opera.postError('[NoAdsAdvanced] ' + Array.prototype.slice.call(arguments));
},
getValue = function (name) {
    return storage[name] || '';
},
setValue = function (name, value) {
    storage[name] = value;
},
postMsg = function (msg) {
    /*for (var i = 0, f = window.frames, l = f.length; i < l; i++) if (f[i]) f[i].postMessage(msg, '*');*/
    opera.extension.postMessage(encodeMessage(msg));
},
delElement = function (ele) {
    if (ele && ele.parentNode) ele.parentNode.removeChild(ele);
},
addStyle = function (css, id) {
<<<<<<< HEAD
    if (!(document.documentElement instanceof window.HTMLHtmlElement)) throw "Not an HTML page.";
=======
    if (!(document.documentElement instanceof window.HTMLHtmlElement)) {
        throw "Not an HTML page.";
    }
>>>>>>> 3716c3327a445d93298410c276055e452322ef3a
    var s = document.createElement('style');
    if (id) {
        s.id = id;
    }
    s.type = 'text/css';
    //s.style = 'display: none !important;'; //TODO:???
    s.appendChild(document.createTextNode(css));
<<<<<<< HEAD
    return (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(s);
=======
    return (document.querySelectorAll('head')[0] || document.documentElement).appendChild(s);
>>>>>>> 3716c3327a445d93298410c276055e452322ef3a
},
replaceStyle = function (ele, css) {
    if (ele) {
        if (!(document.documentElement instanceof window.HTMLHtmlElement)) {
            throw "Not an HTML page.";
        }


        ele.innerHTML = "";
        //TODO:???
        /*
        while (ele.firstChild) {
            ele.removeChild(ele.firstChild);
        }
        */


        ele.appendChild(document.createTextNode(css));
    }
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
    var r = domain.match(/^((?:\d{1,3}\.){3})\d{1,3}$/);
    if (r) return r[1] + '0';
    var a = domain.split('.'), l = a.length;
    if (l < 2) return domain;
    return full ? a[l - 2] + '.' + a[l - 1] : a[(l > 2 && /^(co|com|net|org|edu|gov|mil|int)$/i.test(a[l - 2])) ? l - 3 : l - 2];
},
unique = function () {
<<<<<<< HEAD
    var a = [], l = this.length, j;
    for (var i = 0; i < l; i++) {
        for (j = i + 1; j < l; j++) {
            if (this[i] === this[j]) {
                j = ++i;
            }
=======
    var u = {}, a = [];
    for (var i = 0, l = this.length; i < l; ++i) {
        if (this[i] in u) {
            continue;
>>>>>>> 3716c3327a445d93298410c276055e452322ef3a
        }
        a.push(this[i]);
        u[this[i]] = 1;
   }
   return a;
};
