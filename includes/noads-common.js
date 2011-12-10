var storage = widget.preferences; // var storage = window.opera.storage;
var extension = window.opera.extension;

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
    if (!(document.documentElement instanceof window.HTMLHtmlElement)) {
        throw "Not an HTML page.";
    }
    var s = document.createElement('style');
    if (id) {
        s.id = id;
    }
    s.type = 'text/css';
    //s.style = 'display: none !important;'; //TODO:???
    s.appendChild(document.createTextNode(css));
    return (document.querySelectorAll('head')[0] || document.documentElement).appendChild(s);
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
    var a = [];
    for (var i = 0, l = this.length; i < l; i++) {
        for (var j = i + 1; j < l; j++) {
            if (this[i] === this[j]) {
                j = ++i;
            }
        }
        a.push(this[i]);
    }
    return a;
};


//var extend = function (first, second) { for (var prop in second) { if (!first[prop]) first[prop] = second[prop];} };
/*
function getFunctionName(func) {
    if ( typeof func === "function" || typeof func === "object" )
    var fName = (""+func).match(/function\s*([\w\$]*)\s*\(/); if ( fName !== null ) return fName[1];
}
*/