var importer = {
    array_filters: [],
    EXCLUDE: '[exclude]',

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
        // Export URL filters from AdBlock subscriptions.
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

                for (var preRule, i = 0, l = arr.length; i < l; i++) {
                    preRule = arr[i];
                    if (preRule && re_is_filter.test(preRule)) {
                        var rule = preRule.replace(re_mnemonics, '');

                        if ((preRule.charAt(0) === '|') && (preRule.charAt(1) === '|')) {
                            rez.push(pushRule(preRule, '*://*.' + rule));
                            rez.push(pushRule(preRule, '*://' + rule));
                        } else {
                            rez.push(pushRule(preRule, rule));
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
        css_rules_list = [],
        return_length = 0;

        if (!add_rules) {
            css_rules_list = getHidingRules(list, all_rules);
            // OUTDATED: we get url-filter rules only from .ini subscriptions now.
            //this.array_filters = getFilterRules(list);
        } else {
            css_rules_list = unique.call(getValue('noads_list').split('\n').concat(getHidingRules(list, all_rules)));
            css_rules_list.sort();
            for (var i = css_rules_list.length; i--;) {
                if (css_rules_list[i].indexOf('##') === -1) {
                    css_rules_list.splice(i, 1);
                }
            }

            //this.array_filters = unique.call(getValue('noads_urlfilterlist').split('\n').concat(getFilterRules(list)));
            //this.array_filters.sort();
        }

        if (css_rules_list.length) {
            return_length += css_rules_list.length;
            setValue('noads_list', css_rules_list.join('\n'));
        }

        /*if (this.array_filters.length) {
            return_length += this.setFilterRules();
        }*/
        return return_length;
    },

    setFilterRules: function () {
        var length = this.array_filters.length;
        setValue('noads_urlfilterlist', this.array_filters.join('\n'));
        this.array_filters = [];
        return length;
    },

    importFilters: function (list, add_rules) {
        var pos = list.indexOf(this.EXCLUDE);
        if (~pos) {
            var subscriptions_array = list.substring(pos + this.EXCLUDE.length).split('\n');

            if (!add_rules && this.array_filters.length) {
                this.array_filters = [];
            }

            for (var i = 0, l = subscriptions_array.length; i < l; i++) {
                subscriptions_array[i] = subscriptions_array[i].replace(/[\s\n\r]+/g, '');
                // not empty or too short
                if (subscriptions_array[i] != '' && subscriptions_array[i].length > 4) {
                    var firstChar = subscriptions_array[i][0];
                    // not comment
                    if (firstChar !== '#' && firstChar !== ';') {
                        log('URL filter added -> ' + subscriptions_array[i]);
                        this.array_filters.push(subscriptions_array[i]);
                    }
                }
            }

            this.array_filters = unique.call(this.array_filters);
            this.array_filters.sort();

            return this.setFilterRules();
        }
        return -1;
    },


    request: function (url, add_rules, all_rules, callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState === 4 /*XMLHttpRequest.DONE*/) {
                if (xmlhttp.status === 200) {
                    setValue('noads_last_update', Date.now());
                    if (~url.indexOf('.ini')) {
                        callback(importer.importFilters(xmlhttp.responseText, add_rules), url, 'good');
                    } else {
                        callback(importer.importSubscriptions(xmlhttp.responseText, url, all_rules, add_rules), url, 'good');
                    }
                } else {
                    callback(-1, url, 'download error');
                }
            }
        };
        xmlhttp.overrideMimeType('text/plain');
        try {
            xmlhttp.open('GET', url+((/\?/).test(url) ? "&" : "?") + (new Date()).getTime(), true);
            xmlhttp.send(null);
        } catch (bug) {
            callback(-1, url, 'download error');
        }
    }
};