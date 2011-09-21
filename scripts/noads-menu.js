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

if (opera.extension) {
    opera.extension.onmessage = function (e) {
        if (decodeMessage(e.data). type === 'noads_tab_port') {
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

function sendCommand (message) {
    if (theport && message) {
        try {
            theport.postMessage(encodeMessage(message));
        } catch(e) {}
    }
    window.close();
}


window.addEventListener('load', function () {
    var menu = document.createElement('div');
    menu.className = 'menu';
    menu.id = 'noads_toolbar_menu';

    var command = document.createElement('div');
    command.onclick = function () {
        sendCommand({type: 'block_ads'});
    };
    command.appendChild(document.createTextNode(lng.blockAds));
    menu.appendChild(command);
    command = document.createElement('div');
    command.onclick = function () {
        sendCommand({type: 'block_ele'});
    };
    command.appendChild(document.createTextNode(lng.blockEle));
    menu.appendChild(command);
    command = document.createElement('div');
    command.onclick = function () {
        sendCommand({type: 'unblock_ele'});
    };
    command.appendChild(document.createTextNode(lng.unblockEle));
    menu.appendChild(command);
    command = document.createElement('div');
    command.onclick = function () {
        sendCommand({type: 'unblock_latest'});
    };
    command.appendChild(document.createTextNode(lng.unblockLatest));
    command.className = 'end';
    menu.appendChild(command);
    command = document.createElement('div');
    command.onclick = function () {
        sendCommand({type: 'show_preferences'});
    };
    command.appendChild(document.createTextNode(lng.preferences));
    command.className = 'end';
    menu.appendChild(command);
    command = document.createElement('div');
    command.onclick = function () {
        sendCommand({type: 'content_block_helper'});
    };
    command.appendChild(document.createTextNode(lng.contentBlockHelper));
    menu.appendChild(command);
    document.body.appendChild(menu);

    if (theport) {
        try {
            theport.postMessage(encodeMessage({type: 'ask_menu_status'}));
        } catch(e) {}
    }

    document.body.style.color = enabled ? 'black' : 'gray';
}, false);