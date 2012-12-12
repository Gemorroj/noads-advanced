var theport, enabled = false;

var html = document.querySelector('html');
html.setAttribute('lang', window.navigator.language);
html.setAttribute('xml:lang', window.navigator.language);

function onMessageHandler (e) {
    if (!e || !e.data) return;
    // if we want to interact with the menu from injected script
    if (decodeMessage(e.data).type === 'status_enabled') {
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
        background = opera.extension.bgProcess,
        actual_font;
    try {
        actual_font = background.actual_font || parseInt(window.getComputedStyle(document.getElementById("id-menu"), null).getPropertyValue("font-size").replace(/[a-z]/gi, ''), 10);
        if (!background.menu_resized) {    
            if (actual_font / default_size > 1) {
                var height = background.button.popup.height,
                width = background.button.popup.width;
                background.button.popup.height = Math.round(height * actual_font / default_size);
                background.button.popup.width = Math.round(width * actual_font / default_size);
                background.actual_font = actual_font;
            }
            background.menu_resized = true;
        }
    } catch (bug) {}

    document.getElementById('block_ads').onclick = function () { sendCommand({type: 'block_ads'}) };
    document.getElementById('block_ele').onclick = function () { sendCommand({type: 'block_ele'}) };
    document.getElementById('unblock_ele').onclick = function () { sendCommand({type: 'unblock_ele'}) };
    document.getElementById('unblock_latest').onclick = function () { sendCommand({type: 'unblock_latest'}) };
    document.getElementById('show_preferences').onclick = function () { sendCommand({type: 'show_preferences'}) };
    document.getElementById('content_block_helper').onclick = function () { sendCommand({type: 'content_block_helper'}) };

    if (theport) {
        try {
            theport.postMessage(encodeMessage({type: 'ask_status'}));
        } catch(e) {}
    }

    document.body.style.color = enabled ? 'black' : 'gray';
}, false);