var importer = {
    arrayFilters: [],
    arrayUserFilters: [],
    EXCLUDE: '[exclude]',

    // import subscription to a local storage
    _getHidingRulesLength: function (arr) {
        var rule, pos, len = 0;
        for (var i = 0; i < arr.length; i++) {
            rule = arr[i];
            pos = rule.indexOf('##');
            if (pos != -1 && rule.length > pos + 2) {
                len += rule.slice(pos + 2).match(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/g).length;
            }
        }
        return len;
    },

    _importSubscriptions: function (list, url, allRules, addRules) {
        var convertOldRules = function (tagName, attrRules) {
            var rule, rules, sep, additional = '', id = null, reAttrRules = /\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\)/g;
            if (tagName === '*') tagName = '';
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
                    if (arr[i].charAt(0) !== '~') {
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
        getHidingRules = function (list, all, script) {
            var rez = [],
                scriptList = [],
                reTrim = /^\s+|\s+$/g,
                reBlank = /^(?:$|[\[!@]|\/.*\/$)/,
                reElemHide = /^([^\/\*\|@"]*?)#(?:([\w\-]+|\*)((?:\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\))*)|#([^{}]+))$/;
            if (list) {
                var rule, domains, tagName, attrRules, selector, arr = list.split('\n');
                for (var i = 0; i < arr.length; i++) {
                    rule = arr[i].replace(reTrim, '');
                    if (!reBlank.test(rule) && reElemHide.test(rule)) {
                        domains = RegExp.$1;
                        tagName = RegExp.$2;
                        attrRules = RegExp.$3;
                        selector = RegExp.$4 || convertOldRules(tagName, attrRules);
                        if (selector) {
                            if (selector.indexOf('$$') != 0) {
                                if (isValidSelector(selector) && (all || isSiteOnly(domains))) {
                                    rez.push([domains, selector]);
                                }
                            } else if (script) {
                                scriptList.push(domains + '##' + selector);
                            }
                        }
                    }
                }
                if (script) {
                    return scriptList;
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
        filterRulesList = [];

        if (!addRules) {
            filterRulesList = getHidingRules(list, allRules);
        } else {
            filterRulesList = unique.call(getValue('noads_list').split('\n').concat(getHidingRules(list, allRules)));
            filterRulesList.sort();
            for (var i = filterRulesList.length; i--;) {
                if (filterRulesList[i].indexOf('##') == -1) {
                    filterRulesList.splice(i, 1);
                }
            }
        }

        if (filterRulesList.length) {
            //if (confirm(lng.iSubs + url + '\n\n' + _getHidingRulesLength(filterRulesList) + lng.iRules + filterRulesList.length + lng.iContinue)) {
                setValue('noads_list', filterRulesList.join('\n'));
                if (list.indexOf('##$$') != -1) {
                    setValue('noads_scriptlist', getHidingRules(list, true, true).join('\n'));
                }
            //}
            return this._getHidingRulesLength(filterRulesList);
        }

        return 0;
    },

    _importFilters: function (list, addRules) {
        var pos = list.indexOf(importer.EXCLUDE);
        if (~pos) {
            var arraySubscription = list.substring(pos + importer.EXCLUDE.length).split('\n');
            importer.reloadRules(true, true);
            if (!addRules && importer.arrayFilters.length) {
                importer.arrayFilters = [];
            }

            for (var i = 0, entries = arraySubscription.length; i < entries; i++) {
                arraySubscription[i] = arraySubscription[i].replace(/[\s\n\r]+/g, '');
                if (arraySubscription[i] != '' && arraySubscription[i][0] !== '#' && arraySubscription[i][0] !== ';' && arraySubscription[i].length > 4) { //not empty or comment or too short
                    log('URL filter added -> ' + arraySubscription[i]);
                    importer.arrayFilters.push(arraySubscription[i]);
                }
            }

            importer.arrayFilters = unique.call(importer.arrayFilters);
            importer.arrayFilters.sort();
            setValue('noads_urlfilterlist', '##' + importer.arrayFilters.join('\n##'));
            importer.reloadRules(true, false);
            return importer.arrayFilters.length;
        }

        return 0;
    },

    reloadRules: function (global, clean) {
        // empty rules
        importer._removeFilter(global ? importer.arrayFilters : importer.arrayUserFilters);

        if (clean) return;

        if (global) {
            if (!options.checkEnabled('noads_urlfilterlist_state') /*&& options.isActiveDomain('noads_urlfilterlist_white')*/) return;
            importer.arrayFilters = importer._setFiler(getValue('noads_urlfilterlist'));
        } else {
            if (!options.checkEnabled('noads_userurlfilterlist_state') /*&& options.isActiveDomain('noads_userurlfilterlist_white')*/) return;
            importer.arrayUserFilters = importer._setFiler(getValue('noads_userurlfilterlist'));
        }
    },

    _removeFilter: function (rulesArr) {
        for (var i = 0; i < rulesArr.length; i++) {
            log('url removed on URL filter reload -> ' + rulesArr[i]);
            opera.extension.urlfilter.block.remove(rulesArr[i]);
        }
    },

    _setFiler: function (rulesRaw) {
        var out = [], filters = (rulesRaw === '') ? [] : rulesRaw.split('\n##');

        if (filters.length) {
            filters[0] = filters[0].substring(2); // remove ## parser compatibility
            for (var i = 0; i < filters.length; i++) {
                if (filters[i].indexOf('##') == -1 && filters[i].indexOf('@@') == -1) { // check for unsupported "site##rule" format and whitlist
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
