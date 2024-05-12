var saving = false;
var lastSave = '';

async function saveFile() {
  // Javascript is single-threaded, so no race condition here between the
  // check and the set
  if (saving || !loader.classList.contains('hide') || !currentFile)
    return;

  saving = true;

  const s = await serializeAll();
  if (lastSave !== s) {
    lastSave = s;

    // The server won't close the connection, so we have to close it
    // ourselves.
    // const controller = new AbortController()
    // setTimeout(() => { controller.abort(); }, 1000);
    const response = await fetch('/cgi-bin/save.sh?file=' + currentFile + '&key=' + key, {
      method: 'POST',
      body: lastSave,
      // signal: controller.signal
    });
  }

  saving = false;
}

setInterval(saveFile, 5000);
