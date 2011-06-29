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

var storage = widget.preferences; // var storage = window.opera.storage;
var extension = window.opera.extension;

// Helper Functions
// Example: log('[NoAds]: test..');
var decodeMessage = function(data) { return JSON.parse(data); }
var encodeMessage = function(data) { return JSON.stringify(data); }
var log = function(){ if (bDebug) opera.postError('[NoAdsAdvanced] '+Array.prototype.slice.call(arguments)); }
var extend = function(first, second){ for (var prop in second){ if(!first[prop]) first[prop] = second[prop];} };
var getValue = function (name) { return storage[name] || '' };
var setValue = function (name, value) { storage[name] = value };
function getFunctionName(func) {
  if ( typeof func == "function" || typeof func == "object" )
  var fName = (""+func).match(/function\s*([\w\$]*)\s*\(/); if ( fName !== null ) return fName[1];
}
var postMsg = function(msg){
    /*for (var i = 0, f = window.frames, l = f.length; i < l; i++) if (f[i]) f[i].postMessage(msg, '*');*/
    opera.extension.postMessage(encodeMessage(msg));
}
var delEle = function (ele) { if (ele && ele.parentNode) ele.parentNode.removeChild(ele) };
var addStyle = function (css, id) {
    if(!(document.documentElement instanceof window.HTMLHtmlElement)) throw "Not an HTML page.";
    var s = document.createElement('style');
    if(id) s.id = id;
    s.setAttribute('type', 'text/css');
    s.setAttribute('style', 'display: none !important;');
    s.appendChild(document.createTextNode(css));
    return (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(s);
};
var replaceStyle = function (ele, css) {
    if (ele) {
        if(!(document.documentElement instanceof window.HTMLHtmlElement)) throw "Not an HTML page.";
        while (ele.firstChild) ele.removeChild(ele.firstChild);
        ele.appendChild(document.createTextNode(css));
    }
};
var splitCSS = function (css) {
    var rez = [];
    css.replace(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/g, function (s, m) { rez.push(m.replace(/^\s+|\s+$/g, '')) });
    return rez;
};
var getTLD = function (domain, full) {
    if (!domain) return '';
    var r = domain.match(/^((?:\d{1,3}\.){3})\d{1,3}$/); if (r) return r[1] + '0';
    var a = domain.split('.'), l = a.length; if (l < 2) return domain;
    return full ? a[l - 2] + '.' + a[l - 1] : a[(l > 2 && /^(co|com|net|org|edu|gov|mil|int)$/i.test(a[l - 2])) ? l - 3 : l - 2];
};
var unique = function(){
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) if (this[i] === this[j]) j = ++i;
      a.push(this[i]);
    }
    return a;
};