'use strict';

// Saves options to chrome.storage
function save_options() {
  var server = document.getElementById('jira-server').value;
  if (server.endsWith('/')) {
    server = server.slice(0, -1);
  }

  chrome.storage.sync.set({
    jira_server: server,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'JIRA server saved: ' + server;
    setTimeout(function() {
      status.textContent = '';
    }, 2000);
  });
}

function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    jira_server: 'https://issues.apache.org/jira'
  }, function(data) {
    document.getElementById('jira-server').value = data.jira_server
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);