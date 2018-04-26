'use strict';

var UPPERCASE_NUMERIC_HYPHEN_REGEX = /[A-Z0-9-]/;
var JIRA_REGEX = /[A-Z]+-\d+/;

function getJIRATicket(r) {
  // here startContainer == endContainer, startOffset == endOffset
  var container = r.startContainer;
  var containerLen = container.length;
  var data = container.data;

  if (!data) {
    return null;
  }

  if (r.startOffset >= containerLen || data[r.startOffset].search(UPPERCASE_NUMERIC_HYPHEN_REGEX) === -1) {
    return null;
  }

  // read backward until non-word character or beginning of container
  var numHyphens = 0;
  if (data[r.startOffset] === '-') {
    numHyphens = 1;
  }

  var i = r.startOffset - 1;
  while (i >= 0) {
    if (data[i].search(UPPERCASE_NUMERIC_HYPHEN_REGEX) === -1) {
      break;
    }

    if (data[i] === '-' && numHyphens === 1) {
      break;
    }

    r.setStart(container, i);
    i--;
  }

  if (data[r.startOffset] === '-') {
    // JIRA can't start with hyphen
    return null;
  }

  // read forward
  if (data[r.endOffset] === '-') {
    r.setEnd(container, r.endOffset + 1);
  }
  i = r.endOffset;
  while (i < containerLen) {
    if (data[i].search(UPPERCASE_NUMERIC_HYPHEN_REGEX) === -1) {
      break;
    }

    if (data[i] === '-' && numHyphens === 1) {
      break;
    }

    // + 1 because endOffset is not inclusive
    r.setEnd(container, i + 1);
    i++;
  }

  if (data[r.endOffset] === '-') {
    // JIRA can't end in hyphen
    return null;
  }

  var candidate = r.toString();
  if (candidate.search(JIRA_REGEX) === -1) {
    return null;
  }

  return candidate;
}

function getWord(range) {
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    return getJIRATicket(range);
  }
  return null;
}

function highlightWord(r) {
  var sel = document.defaultView.getSelection();
  if (!sel.isCollapsed && window.createjiralink.prevword !== sel.toString()) {
    return;
  }

  sel.removeAllRanges();
  sel.addRange(r);
}

function processMatch(range, word, e) {
  console.log('Matched word: $' + word + '$');
  console.log(range.startOffset);
  console.log(range.endOffset);

  // highlight the word
  highlightWord(range);

  var popup = document.getElementById('jira-link-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'jira-link-popup';
    document.documentElement.appendChild(popup);
  }

  popup.innerHTML = "<a href='" + window.createjiralink.config.jira_server + '/browse/' + word + "'>" + word + '</a>';
  popup.style.display = 'block';
  popup.style['z-index'] = 999;
  popup.style.position = 'absolute';
  popup.style.top = (e.clientY + window.scrollY).toString() + 'px';
  popup.style.left = (e.clientX + window.scrollX).toString() + 'px';
  popup.style.background = '#FFFFBF';
  popup.style.border = '1px solid #D0D0D0';

  window.createjiralink.prevword = word;
}

function doSomething(e) {
  var range = document.caretRangeFromPoint(e.clientX, e.clientY);
  var word = getWord(range);
  console.log(word);
  if (word) {
    // if (word && word.search(/[A-Z]+-\d+/) !== -1) {
    processMatch(range, word, e);
  } else {
    hidePopup();
  }
  // console.log(range);
}

function hidePopup() {
  var popup = document.getElementById('jira-link-popup');
  if (popup) {
    popup.style.display = 'none';
  }
}

function onMouseClick(e) {
  doSomething(e);
}

function onKeyDown(e) {
  if (e.ctrlKey || e.metaKey) {
    return;
  }

  switch (e.keyCode) {
    case 27:  // Esc
      hidePopup();
      break;
    default:
      return;
  }
}

document.addEventListener('click', onMouseClick);
document.addEventListener('keydown', onKeyDown);

window.createjiralink = {};

chrome.storage.sync.get({ jira_server: 'https://issues.apache.org/jira' }, function(data) {
  console.log('Got JIRA server value ' + data.jira_server);
  window.createjiralink.config = data;
});