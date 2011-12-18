var importer = {
    arrayFilters: [],
    arrayUserFilters: [],
    EXCLUDE: '[exclude]',

    // import subscription to a local storage
    _getHidingRulesLength: function (arr) {
        var rule, pos, len = 0;
        for (var i = 0, l = arr.length; i < l; i++) {
            rule = arr[i];
            pos = rule.indexOf('##');
            if (pos !== -1 && rule.length > pos + 2) {
                len += rule.slice(pos + 2).match(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/g).length;
            }
        }
        return len;
    },

    _importSubscriptions: function (list, url, allRules, addRules) {
        var convertOldRules = function (tagName, attrRules) {
            var rule, rules, sep, additional = '', id = null, reAttrRules = /\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\)/g;
            if (tagName === '*') {
                tagName = '';
            }
            if (attrRules) {
                rules = attrRules.match(reAttrRules);
                for (var i = 0, l = rules.length; i < l; i++) {
                    rule = rules[i].slice(1, -1);
                    sep = rule.indexOf('=');
                    if (sep > 0) {
                        rule = rule.slice(0, sep) + '="' + rule.slice(sep + 1) + '"';
                        additional += '[' + rule + ']';
                    } else {
                        if (id) {
                            return '';
                        } else {
                            id = rule;
                        }
                    }
                }
            }
            if (id) {
                return tagName + '.' + id + additional + ',' + tagName + '#' + id + additional;
            } else {
                return (tagName || additional) ? tagName + additional : '';
            }
        },
        isSiteOnly = function (domains) {
            if (domains) {
                var arr = domains.split(',');
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i][0] !== '~') {
                        return true;
                    }
                }
            }
            return false;
        },
        isValidSelector = function (selector) {
            try {
                document.querySelectorAll(selector);
            } catch (e) {
                return false;
            }
            return true;
        },
        getFilterRules = function (list) {
            var rez = [];
            if (list) {
                var arr = list.split('\n'),
                    isFilter = /^[^#@!~\[][a-zA-Z0-9:\.\-\/\?*\^\|_&=~]+$/, // regexp not supported
                    isFullRule = /^(?:http|ftp)s?:\/\/.+/,
                    reMnemonics = /\||\^/g;

                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i] && isFilter.test(arr[i])) {
                        var rule = arr[i].replace(reMnemonics, '');
                        if (isFullRule.test(rule) === false) {
                            rule = '*' + rule;
                        }
                        rule += '*';
                        rule.replace('**', '*');
                        rez.push(rule);
                    }
                }
            }
            rez.sort();
            return rez;
        },
        getHidingRules = function (list, all) {
            var rez = [],
                reTrim = /^\s+|\s+$/g,
                reBlank = /^(?:$|[\[!@]|\/.*\/$)/,
                reElemHide = /^([^\/\*\|@"]*?)#(?:([\w\-]+|\*)((?:\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\))*)|#([^{}]+))$/,
                rePregecko = /(~pregecko2,|,~pregecko2)/; // Legacy rules (for Firefox 3 and similar Gecko 1 browsers)
            if (list) {
                var rule, domains, tagName, attrRules, selector, arr = list.split('\n');
                for (var i = 0, l = arr.length; i < l; i++) {
                    rule = arr[i].replace(reTrim, '');
                    if (!reBlank.test(rule) && reElemHide.test(rule)) {
                        domains = (RegExp.$1).replace(rePregecko, '');
                        tagName = RegExp.$2;
                        attrRules = RegExp.$3;
                        selector = RegExp.$4 || convertOldRules(tagName, attrRules);
                        if (selector && isValidSelector(selector) && (all || isSiteOnly(domains))) {
                            rez.push([domains, selector]);
                        }
                    }
                }

                rez.sort();
                for (var i = rez.length; i--;) {
                    if (i > 0 && rez[i][0] == rez[i - 1][0]) {
                        if (rez[i][1] != rez[i - 1][1]) {
                            rez[i - 1][1] += ',' + rez[i][1];
                        }
                        rez.splice(i, 1);
                    } else {
                        rez[i] = rez[i][0] + '##' + rez[i][1];
                    }
                }
            }
            return rez;
        },
        adblockRulesList = [],
        returnLength = 0;

        if (!addRules) {
            adblockRulesList = getHidingRules(list, allRules);
            importer.arrayFilters = getFilterRules(list);
        } else {
            adblockRulesList = unique.call(getValue('noads_list').split('\n').concat(getHidingRules(list, allRules)));
            adblockRulesList.sort();
            for (var i = adblockRulesList.length; i--;) {
                if (adblockRulesList[i].indexOf('##') === -1) {
                    adblockRulesList.splice(i, 1);
                }
            }

            var urlFilters = getValue('noads_urlfilterlist').substring(2); // del first ##
            importer.arrayFilters = unique.call(urlFilters.split('\n##').concat(getFilterRules(list)));
            importer.arrayFilters.sort();
        }

        if (adblockRulesList.length) {
            setValue('noads_list', adblockRulesList.join('\n'));
            returnLength += this._getHidingRulesLength(adblockRulesList);
        }
        if (importer.arrayFilters.length) {
            returnLength += importer._setFilterRules();
        }

        return returnLength;
    },
    _setFilterRules: function () {
        importer.arrayFilters = unique.call(importer.arrayFilters);
        importer.arrayFilters.sort();
        setValue('noads_urlfilterlist', '##' + importer.arrayFilters.join('\n##'));
        importer.reloadRules(true, false);
        return importer.arrayFilters.length;
    },
    _importFilters: function (list, addRules) {
        var pos = list.indexOf(importer.EXCLUDE);
        if (~pos) {
            var arraySubscription = list.substring(pos + importer.EXCLUDE.length).split('\n');
            importer.reloadRules(true, true);
            if (!addRules && importer.arrayFilters.length) {
                importer.arrayFilters = [];
            }

            for (var i = 0, l = arraySubscription.length; i < l; i++) {
                arraySubscription[i] = arraySubscription[i].replace(/[\s\n\r]+/g, '');
                //not empty or too short
                if (arraySubscription[i] != '' && arraySubscription[i].length > 4) {
                    var firstChar = arraySubscription[i][0];
                    // not comment
                    if (firstChar !== '#' && firstChar !== ';') {
                        log('URL filter added -> ' + arraySubscription[i]);
                        importer.arrayFilters.push(arraySubscription[i]);
                    }
                }
            }

            return importer._setFilterRules();
        }

        return 0;
    },

    reloadRules: function (global, clean) {
        // empty rules
        importer._removeFilter(global ? importer.arrayFilters : importer.arrayUserFilters);

        if (!clean) {
            if (global) {
                if (!options.checkEnabled('noads_urlfilterlist_state') /*&& options.isActiveDomain('noads_urlfilterlist_white')*/) {
                    return;
                }
                importer.arrayFilters = importer._setFiler(getValue('noads_urlfilterlist'));
            } else {
                if (!options.checkEnabled('noads_userurlfilterlist_state') /*&& options.isActiveDomain('noads_userurlfilterlist_white')*/) {
                    return;
                }
                importer.arrayUserFilters = importer._setFiler(getValue('noads_userurlfilterlist'));
            }
        }
    },

    _removeFilter: function (rulesArr) {
        for (var i = 0, l = rulesArr.length; i < l; i++) {
            log('url removed on URL filter reload -> ' + rulesArr[i]);
            opera.extension.urlfilter.block.remove(rulesArr[i]);
        }
    },

    _setFiler: function (rulesRaw) {
        var out = [], filters = (rulesRaw === '') ? [] : rulesRaw.split('\n##');
        var l = filters.length;

        if (l) {
            filters[0] = filters[0].substring(2); // remove ## parser compatibility
            for (var i = 0; i < l; i++) {
                if (filters[i].indexOf('##') === -1 && filters[i].indexOf('@@') === -1) { // check for unsupported "site##rule" format and whitlist
                    out.push(filters[i]);
                    log('url added on URL filter reload -> ' + filters[i]);
                    opera.extension.urlfilter.block.add(filters[i]);
                }
            }
        }

        return out;
    },

    request: function (url, addRules, allRules, functionCallback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                setValue('noads_last_update', new Date().getTime());

                if (~url.indexOf('.ini')) {
                    functionCallback(importer._importFilters(xmlhttp.responseText, addRules));
                } else {
                    functionCallback(importer._importSubscriptions(xmlhttp.responseText, url, allRules, addRules));
                }
            } else if (xmlhttp.readyState >= 4) {
                return 0;
            }
        };
        xmlhttp.open("GET", url, false);
        xmlhttp.send(null);
    }
};
