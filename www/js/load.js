const loadfile = document.getElementById('loadfile');

async function loadPdf(isReload) {
  pdfCanvases = [];
  if (!isReload) {
    docPages = [];
    pagesContainer.innerHTML = '';
  }

  for (var num = 1; num <= currentPdf.numPages; num++) {
    const page = await currentPdf.getPage(num);

    const canvas = document.createElement('canvas');
    const scale = (window.innerWidth - 30) * window.devicePixelRatio
                    / page.getViewport({ scale: 1 }).width;

    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport: viewport
    }).promise;

    pdfCanvases.push(canvas);

    if (!isReload) {
      addPage(num - 1, num);
    }
  }

  if (isReload) {
    for (const page of docPages) {
      page.resize();
      page.redraw();
    }
  }
}

loadfile.addEventListener('change', () => {
  if (loadfile.files.length === 0)
    return;

  loader.classList.remove('hide');

  var reader = new FileReader();
  reader.onload = async function(event) {
    const data = event.target.result;
    const origFilename = loadfile.files[0].name
                          .replace(/[^a-z0-9_-]/gi, '_')
                          .replace(/_+/gi, '_');
    try {
      currentPdf = await pdfjsLib.getDocument({ data: data }).promise;
    } catch(e) {
      console.log("Couldn't load PDF:");
      console.log(e);
      alert("Could not load PDF. The file may be corrupted, or not a PDF file at all.");
      await fetch('/cgi-bin/ack.sh?key=' + key);
      await fetch('/cgi-bin/delete.sh?file=' + origFilename + '&key=' + key);
      loader.classList.add('hide');
      return;
    }
    currentFile = origFilename;
    var i = 0;
    while (filenames.includes(currentFile)) {
      i++;
      currentFile = origFilename + i;
    }
    filenames.unshift(currentFile);
    await loadPdf(false);

    await fetch('/cgi-bin/ack.sh?key=' + key);

    saveFile();
    hideMenu();
    loader.classList.add('hide');
  };

  reader.readAsBinaryString(loadfile.files[0]);
});
