var importer = {
    array_filters: [],
    array_user_filters: [],
    EXCLUDE: '[exclude]',

    // import subscription to a local storage
    getHidingRulesLength: function (arr) {
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

    importSubscriptions: function (list, url, all_rules, add_rules) {
        var convertOldRules = function (tag_name, attribute_rules) {
            var rule, rules, sep, additional = '', id = null, re_attribute_rules = /\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\)/g;
            if (tag_name === '*') {
                tag_name = '';
            }
            if (attribute_rules) {
                rules = attribute_rules.match(re_attribute_rules);
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
                return tag_name + '.' + id + additional + ',' + tag_name + '#' + id + additional;
            } else {
                return (tag_name || additional) ? tag_name + additional : '';
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
                    re_is_filter = /^[^#@!~\[][a-zA-Z0-9:\.\-\/\?*\^\|_&=~]+$/, // regexp not supported
                    re_mnemonics = /\||\^/g, // ^ not supported
                    pushRule = function (in_rule, out_rule) {
                        if (in_rule.charAt(in_rule.length - 1) !== '|') {
                            out_rule += '*';
                        }
                        if (in_rule.charAt(0) !== '|') {
                            out_rule = '*' + out_rule;
                        }

                        return out_rule.replace('**', '*');
                    };

                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i] && re_is_filter.test(arr[i])) {
                        var rule = arr[i].replace(re_mnemonics, '');

                        if ((arr[i].charAt(0) === '|') && (arr[i].charAt(1) === '|')) {
                            rez.push(pushRule(arr[i], '*://*.' + rule));
                            rez.push(pushRule(arr[i], '*://' + rule));
                        } else {
                            rez.push(pushRule(arr[i], rule));
                        }
                    }
                }
            }
            rez.sort();
            return rez;
        },
        getHidingRules = function (list, all) {
            var rez = [],
                re_trim = /^\s+|\s+$/g,
                re_blank = /^(?:$|[\[!@]|\/.*\/$)/,
                re_elem_hide = /^([^\/\*\|@"]*?)#(?:([\w\-]+|\*)((?:\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\))*)|#([^{}]+))$/,
                re_pre_gecko = /(~pregecko2,|,~pregecko2)/; // Legacy rules (for Firefox 3 and similar Gecko 1 browsers)
            if (list) {
                var rule, domains, tag_name, attribute_rules, selector, arr = list.split('\n');
                for (var i = 0, l = arr.length; i < l; i++) {
                    rule = arr[i].replace(re_trim, '');
                    if (!re_blank.test(rule) && re_elem_hide.test(rule)) {
                        domains = (RegExp.$1).replace(re_pre_gecko, '');
                        tag_name = RegExp.$2;
                        attribute_rules = RegExp.$3;
                        selector = RegExp.$4 || convertOldRules(tag_name, attribute_rules);
                        if (selector && isValidSelector(selector) && (all || isSiteOnly(domains))) {
                            rez.push([domains, selector]);
                        }
                    }
                }

                rez.sort();
                for (i = rez.length; i--;) {
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
        adblock_rules_list = [],
        return_length = 0;

        if (!add_rules) {
            adblock_rules_list = getHidingRules(list, all_rules);
            importer.array_filters = getFilterRules(list);
        } else {
            adblock_rules_list = unique.call(getValue('noads_list').split('\n').concat(getHidingRules(list, all_rules)));
            adblock_rules_list.sort();
            for (var i = adblock_rules_list.length; i--;) {
                if (adblock_rules_list[i].indexOf('##') === -1) {
                    adblock_rules_list.splice(i, 1);
                }
            }

            importer.array_filters = unique.call(getValue('noads_urlfilterlist').split('\n').concat(getFilterRules(list)));
            importer.array_filters.sort();
        }

        if (adblock_rules_list.length) {
            setValue('noads_list', adblock_rules_list.join('\n'));
            return_length += this.getHidingRulesLength(adblock_rules_list);
        }
        if (importer.array_filters.length) {
            return_length += importer.setFilterRules();
        }

        return return_length;
    },

    setFilterRules: function () {
        importer.array_filters = unique.call(importer.array_filters);
        importer.array_filters.sort();
        setValue('noads_urlfilterlist', importer.array_filters.join('\n'));
        importer.reloadRules(true, false);

        return importer.getHidingRulesLength(getValue('noads_list').split('\n')) + importer.array_filters.length;
    },

    importFilters: function (list, add_rules) {
        var pos = list.indexOf(importer.EXCLUDE);
        if (~pos) {
            var subscriptions_array = list.substring(pos + importer.EXCLUDE.length).split('\n');
            importer.reloadRules(true, true);
            if (!add_rules && importer.array_filters.length) {
                importer.array_filters = [];
            }

            for (var i = 0, l = subscriptions_array.length; i < l; i++) {
                subscriptions_array[i] = subscriptions_array[i].replace(/[\s\n\r]+/g, '');
                // not empty or too short
                if (subscriptions_array[i] != '' && subscriptions_array[i].length > 4) {
                    var firstChar = subscriptions_array[i][0];
                    // not comment
                    if (firstChar !== '#' && firstChar !== ';') {
                        log('URL filter added -> ' + subscriptions_array[i]);
                        importer.array_filters.push(subscriptions_array[i]);
                    }
                }
            }

            return importer.setFilterRules();
        }

        return 0;
    },

    reloadRules: function (global, clear) {
        // empty rules
        importer.removeFilters(global ? importer.array_filters : importer.array_user_filters);
        if (!clear) {
            if (global) {
                importer.array_filters = importer.setFilters(getValue('noads_urlfilterlist'));
            } else {
                importer.array_user_filters = importer.setFilters(getValue('noads_userurlfilterlist'));
            }
        }
    },

    removeFilters: function (rules_array) {
        for (var i = 0, l = rules_array.length; i < l; i++) {
            log('url removed on URL filter reload -> ' + rules_array[i]);
            opera.extension.urlfilter.block.remove(rules_array[i]);
        }
    },

    setFilters: function (rules_raw) {
        var filters = (rules_raw === '') ? [] : rules_raw.split('\n');
        for (var i = 0, l = filters.length; i < l; i++) {
            log('url added on URL filter reload -> ' + filters[i]);
            opera.extension.urlfilter.block.add(filters[i]);
        }
        return filters;
    },

    request: function (url, add_rules, all_rules, callback) {
        opera.postError(url);
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                setValue('noads_last_update', new Date().getTime());
                if (~url.indexOf('.ini')) {
                    callback(importer.importFilters(xmlhttp.responseText, add_rules));
                } else {
                    callback(importer.importSubscriptions(xmlhttp.responseText, url, all_rules, add_rules));
                }
            } else if (xmlhttp.readyState >= 4) {
                return 0;
            }
        };
        xmlhttp.open("GET", url, false);
        xmlhttp.send(null);
    }
};
