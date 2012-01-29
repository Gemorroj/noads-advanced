var lng = new MENU_TRANSLATION(), theport, enabled = false;

function onMessageHandler (e) {
    if (!e || !e.data) return;
    // if we want to interact with the menu from injected script
    if (decodeMessage(e.data).type === 'menu_status_enable') {
        if (document && document.body) {
            document.body.style.color = 'black';
        }
        enabled = true;
    }
}

function sendCommand (message) {
    if (theport && message) {
        try {
            theport.postMessage(encodeMessage(message));
        } catch(e) {}
    }
    window.close();
}


if (opera.extension) {
    opera.extension.onmessage = function (e) {
        if (decodeMessage(e.data).type === 'noads_tab_port') {
            if (e.ports.length > 0) {
                theport = e.ports[0];
                theport.onmessage = onMessageHandler;
                if (document && document.body) {
                    document.body.style.color = 'black';
                }
                enabled = true;
            }
        }
    };
}

window.addEventListener('DOMContentLoaded', function () {
    // fix for a higher font height settings, default font defined in CSS as 12px
    var default_size = 12,
        actual_font;
    try {
        actual_font = opera.extension.bgProcess.actual_font || parseInt(window.getComputedStyle(document.getElementById("id-menu"),null).getPropertyValue("font-size").replace(/[a-z]/gi,''),10);
        if (!opera.extension.bgProcess.menu_resized && actual_font / default_size > 1) {
            var height = opera.extension.bgProcess.button.popup.height,
            width = opera.extension.bgProcess.button.popup.width;
            opera.extension.bgProcess.button.popup.height = Math.round(height*actual_font/default_size);
            opera.extension.bgProcess.button.popup.width = Math.round(width*actual_font/default_size);
            opera.extension.bgProcess.menu_resized = true;
            opera.extension.bgProcess.actual_font = actual_font;
        }
    } catch (bug) {}

    var block_ads = document.getElementById('block_ads'),
        block_ele = document.getElementById('block_ele'),
        unblock_ele = document.getElementById('unblock_ele'),
        unblock_latest = document.getElementById('unblock_latest'),
        show_preferences = document.getElementById('show_preferences'),
        content_block_helper = document.getElementById('content_block_helper');

    block_ads.onclick = function () {
        sendCommand({type: 'block_ads'});
    };
    block_ads.appendChild(document.createTextNode(lng.blockAds));

    block_ele.onclick = function () {
        sendCommand({type: 'block_ele'});
    };
    block_ele.appendChild(document.createTextNode(lng.blockEle));

    unblock_ele.onclick = function () {
        sendCommand({type: 'unblock_ele'});
    };
    unblock_ele.appendChild(document.createTextNode(lng.unblockEle));

    unblock_latest.onclick = function () {
        sendCommand({type: 'unblock_latest'});
    };
    unblock_latest.appendChild(document.createTextNode(lng.unblockLatest));

    show_preferences.onclick = function () {
        sendCommand({type: 'show_preferences'});
    };
    show_preferences.appendChild(document.createTextNode(lng.preferences));

    content_block_helper.onclick = function () {
        sendCommand({type: 'content_block_helper'});
    };
    content_block_helper.appendChild(document.createTextNode(lng.contentBlockHelper));

    if (theport) {
        try {
            theport.postMessage(encodeMessage({type: 'ask_menu_status'}));
        } catch(e) {}
    }

    document.body.style.color = enabled ? 'black' : 'gray';
}, false);