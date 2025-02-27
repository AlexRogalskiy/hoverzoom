﻿var options,
    siteDomain,
    prgPreloading, lblPreloading, aPreload,
    VK_CTRL = 1024,
    VK_SHIFT = 2048,
    actionKeys = ['actionKey', 'toggleKey', 'closeKey', 'hideKey', 'openImageInWindowKey', 'openImageInTabKey', 'lockImageKey', 'saveImageKey', 'fullZoomKey', 'prevImgKey', 'nextImgKey', 'flipImageKey', 'copyImageKey', 'copyImageUrlKey'];

function keyCodeToString(key) {
    var s = '';
    if (key & VK_CTRL) {
        s += 'Ctrl+';
        key &= ~VK_CTRL;
    }
    if (key & VK_SHIFT) {
        s += 'Shift+';
        key &= ~VK_SHIFT;
    }
    if (key >= 65 && key < 91) {
        s += String.fromCharCode('A'.charCodeAt(0) + key - 65);
    } else if (key >= 112 && key < 124) {
        s += 'F' + (key - 111);
    }
    return s;
}

// Options that are only enabled for Chromium-based browsers
const chromiumOnly = ['copyImageKey', 'copyImageUrlKey'];

function initActionKeys() {
    actionKeys
    .filter(key => isChromiumBased || !chromiumOnly.includes(key))
    .forEach(key => {
        var id = key[0].toUpperCase() + key.substr(1);
        var title = chrome.i18n.getMessage("opt" + id + "Title");
        var description = "opt" + id + "Description";
        $('<tr><td class="ttip" data-i18n-tooltip="' + description + '">' + title + '</td>' + '<td><select id="sel' + id + '" class="actionKey picker"/></td></tr>').appendTo($('#tableActionKeys'));
        loadKeys($('#sel' + id));
    });
}

function loadKeys(sel) {
    $('<option value="0">None</option>').appendTo(sel);
    if (sel.attr('id') != 'lockImageKey')
        $('<option value="-1">Right Click</option>').appendTo(sel);
    if (sel.attr('id') != 'selOpenImageInTabKey')
        $('<option value="16">Shift</option>').appendTo(sel);
    $('<option value="17">Ctrl</option>').appendTo(sel);
    if (navigator.appVersion.indexOf('Macintosh') > -1) {
        $('<option value="91">Command</option>').appendTo(sel);
    }
    for (var i = 65; i < 91; i++) {
        $('<option value="' + i + '">&#' + i + ';</option>').appendTo(sel);
    }
    for (var i = 112; i < 124; i++) {
        $('<option value="' + i + '">F' + (i - 111) + '</option>').appendTo(sel);
    }
    $('<option value="27">Escape</option>').appendTo(sel);
    $('<option value="33">Page Up</option>').appendTo(sel);
    $('<option value="34">Page Down</option>').appendTo(sel);
    $('<option value="35">End</option>').appendTo(sel);
    $('<option value="36">Home</option>').appendTo(sel);
    $('<option value="37">Left</option>').appendTo(sel);
    $('<option value="38">Up</option>').appendTo(sel);
    $('<option value="39">Right</option>').appendTo(sel);
    $('<option value="40">Down</option>').appendTo(sel);
    $('<option value="45">Insert</option>').appendTo(sel);
    $('<option value="46">Delete</option>').appendTo(sel);
}

// Saves options to localStorage.
// TODO: Migrate to https://developer.chrome.com/extensions/storage
function saveOptions() {

    actionKeys.forEach(function(key) {
        var id = key[0].toUpperCase() + key.substr(1);
        options[key] = parseInt($('#sel' + id).val());
    });

    localStorage.options = JSON.stringify(options);
    sendOptions(options);
    restoreOptions();
    return false;
}

// Restores options from factory settings
function restoreOptionsFromFactorySettings() {
    restoreOptions(Object.assign({}, factorySettings));
}

// Restores options from localStorage.
function restoreOptions(optionsFromFactorySettings) {
    options = optionsFromFactorySettings || loadOptions();

    actionKeys.forEach(function(key) {
        var id = key[0].toUpperCase() + key.substr(1);
        $('#sel' + id).val(options[key]);
    });

    return false;
}

function selKeyOnChange(event) {
    var currSel = $(event.target);
    if (currSel.val() != '0') {
        $('.actionKey').each(function () {
            if (!$(this).is(currSel) && $(this).val() == currSel.val()) {
                $(this).val('0').effect("highlight", {color:'red'}, 5000);
            }
        });
    }
}

const Saved = Symbol("saved");
const Cancel = Symbol("cancel");
const Reset = Symbol("reset");
function displayMsg(msg) {
    switch (msg)  {
        case Saved:
            $('#msgtxt').removeClass().addClass('centered text-center alert success').text(chrome.i18n.getMessage('optSaved')).clearQueue().animate({opacity:1}, 500).delay(5000).animate({opacity:0}, 500);
            break;
        case Cancel:
            $('#msgtxt').removeClass().addClass('centered text-center alert warning').text(chrome.i18n.getMessage('optCancel')).clearQueue().animate({opacity:1}, 500).delay(5000).animate({opacity:0}, 500);
            break;
        case Reset:
            $('#msgtxt').removeClass().addClass('centered text-center alert info').text(chrome.i18n.getMessage('optReset')).clearQueue().animate({opacity:1}, 500).delay(5000).animate({opacity:0}, 500);
            break;
        default:
            break;
    }
}

$(function () {
    initActionKeys();
    i18n();
    options = loadOptions();

    $('#btnSave').click(function() { saveOptions(); displayMsg(Saved); return false; }); // "return false" needed to prevent page scroll
    $('#btnCancel').click(function() { restoreOptions(); displayMsg(Cancel); return false; });
    $('#btnReset').click(function() { restoreOptionsFromFactorySettings(); displayMsg(Reset); return false; });

    $('.actionKey').change(selKeyOnChange);

    restoreOptions();

    chrome.runtime.onMessage.addListener(onMessage);
});

function onMessage(message, sender, callback) {
    switch (message.action) {
        case 'optionsChanged':
            restoreOptions();
            break;
    }
}
