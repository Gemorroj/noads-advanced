var filters = {
    array_filters: [],
    array_user_filters: [],
    EXCLUDE: '[exclude]',
    reloadRules: function (global, clear) {
        // empty rules
        filters.removeFilters(global ? filters.array_filters : filters.array_user_filters);
        if (!clear) {
            if (global) {
                filters.array_filters = filters.setFilters(getValue('noads_urlfilterlist'));
            } else {
                filters.array_user_filters = filters.setFilters(getValue('noads_userurlfilterlist'));
            }
        }
    },

    removeFilters: function (rules_array) {
        var block = opera.extension.urlfilter.block;
        for (var i = 0, l = rules_array.length; i < l; i++) {
            log('url removed on URL filter reload -> ' + rules_array[i]);
            block.remove(rules_array[i]);
        }
    },

    setFilters: function (rules_raw) {
        var filters = (rules_raw === '') ? [] : rules_raw.split('\n');
        var block = opera.extension.urlfilter.block;
        for (var i = 0, l = filters.length; i < l; i++) {
            log('url added on URL filter reload -> ' + filters[i]);
            block.add(filters[i]);
        }
        return filters;
    }
};