
var importer = {
    // import subscription to a local storage
    getHidingRulesLength: function(arr){
		var rule, pos, len = 0;
		for (var i = 0, l = arr.length; i < l; i++) {
			rule = arr[i];
			pos = rule.indexOf('##');
			if (pos != -1 && rule.length > pos + 2) 
				len += rule.slice(pos + 2).match(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/g).length;
		}
		return len;
	},
    importSubscription: function(list, url, allRules, addRules){
		var convertOldRules = function(tagName, attrRules){
			var rule, rules, sep, additional = '', id = null, reAttrRules = /\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\)/g;
			if (tagName == '*') tagName = '';
			if (attrRules) {
				rules = attrRules.match(reAttrRules);
				for (var i = 0, l = rules.length; i < l; i++) {
					rule = rules[i].slice(1, -1);
					sep = rule.indexOf('=');
					if (sep > 0) {
						rule = rule.slice(0, sep) + '="' + rule.slice(sep + 1) + '"';
						additional += '[' + rule + ']';
					}
					else {
						if (id) { return '' }
						else { id = rule }
					}
				}
			}
			if (id) { return tagName + '.' + id + additional + ',' + tagName + '#' + id + additional; }
			else { return (tagName || additional) ? tagName + additional : ''; }
		};
		var isSiteOnly = function(domains){
			if (domains) {
				var arr = domains.split(',');
				for (var i = 0, l = arr.length; i < l; i++) { if (arr[i].charAt(0) != '~') return true; }
			}
		};
		var isValidSelector = function(selector){
			if (document.querySelectorAll) try { document.querySelectorAll(selector) } catch (e) { return false }
			return true;
		};
		var getHidingRules = function(list, all, script){
			var rez = [], scriptList = [], reTrim = /^\s+|\s+$/g, reBlank = /^(?:$|[\[!@]|\/.*\/$)/, reElemHide = /^([^\/\*\|\@"]*?)#(?:([\w\-]+|\*)((?:\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\))*)|#([^{}]+))$/;
			if (list) {
				var rule, domains, tagName, attrRules, selector, arr = list.split('\n'), i;
				for (i = 0, l = arr.length; i < l; i++) {
					rule = arr[i].replace(reTrim, '');
					if (!reBlank.test(rule) && reElemHide.test(rule)) {
						domains = RegExp.$1;
						tagName = RegExp.$2;
						attrRules = RegExp.$3;
						selector = RegExp.$4 || convertOldRules(tagName, attrRules);
						if (selector) {
							if (selector.indexOf('$$') != 0) {
								if (isValidSelector(selector) && (all || isSiteOnly(domains))) {
									rez.push([domains, selector])
								}
							} else { if (script) scriptList.push(domains + '##' + selector) }
						}
					}
				}
				if (script) return scriptList;

				rez.sort();
				for (i = rez.length; i--;) {
					if (i > 0 && rez[i][0] == rez[i - 1][0]) {
						if (rez[i][1] != rez[i - 1][1]) 
							rez[i - 1][1] += ',' + rez[i][1];
						rez.splice(i, 1);
					}
					else {
						rez[i] = rez[i][0] + '##' + rez[i][1]
					}
				}
			}
			return rez;
		};

		var filterRulesList;
		if (!addRules) { filterRulesList = getHidingRules(list, allRules) }
		else {
			filterRulesList = getValue('noads_list').split('\n').concat(getHidingRules(list, allRules));
			filterRulesList = unique.call(filterRulesList);
            filterRulesList.sort();
			for (var i = filterRulesList.length; i--;) if (filterRulesList[i].indexOf('##') == -1) filterRulesList.splice(i, 1);
		}
		
		if (filterRulesList.length) {
			//if (confirm(lng.iSubs + url + '\n\n' + getHidingRulesLength(filterRulesList) + lng.iRules + filterRulesList.length + lng.iContinue)) {
				setValue('noads_list', filterRulesList.join('\n'));
				if (list.indexOf('##$$') != -1) setValue('noads_scriptlist', getHidingRules(list, true, true).join('\n'));
			//}
		}
		else { return null; }
		return this.getHidingRulesLength(filterRulesList);
	}
};
