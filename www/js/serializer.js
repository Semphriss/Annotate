function Uint8ArrayToBase64(arr) {
  var binary = '';
  for (const byte of arr) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary)
}

function Base64ToUint8Array(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

function parseElement(s) {
  const tokens = s.split(',');
  const elem = tokens[0];

  switch(elem) {
    case 'stroke':
      return parseStrokeElement(tokens[1]);
  }

  throw "Unknown element '" + elem + "'";
}

async function serializeAll() {
  var s = currentPdf ? Uint8ArrayToBase64(await currentPdf.getData()) : ''
  s += '\n';
  for (const page of docPages) {
    s += page.serialize() + '\n';
  }
  s = s.slice(0, -1);
  return s;
}

async function parseAll(s) {
  loader.classList.remove('hide');

  var i = 0;
  for (const page of s.split('\n')) {
    i++
    if (i === 1) {
      if (page === "") {
        currentPdf = null;
      } else {
        const data = Base64ToUint8Array(page);
        console.log(data[0], data[1], data[2], data[3]);
        try {
          currentPdf = await pdfjsLib.getDocument({ data: data }).promise;
        } catch(e) {
          console.log("Couldn't load PDF:");
          console.log(e);
          alert("Could not load PDF. The file may be corrupted, or not a PDF file at all.");
          loader.classList.add('hide');
          return false;
        }
        await loadPdf(false);
      }
      continue;
    } else if (i === 2) {
      // Not doing this at the end of `i === 1` allows files with no pages
      // to automatically load the default PDF pages
      docPages = [];
      pagesContainer.innerHTML = '';
    }

    const tokens = page.split(':');

    if (tokens.length === 0)
      continue;

    if (tokens.length !== 4) {
      console.log("Can't parseAll: page token length !== 4");
      alert("Could not load annotation data. The file is probably corrupted.");
      return false;
    }

    const p = addPage(null, parseInt(tokens[0]), {
      x: parseInt(tokens[1]),
      y: parseInt(tokens[2])
    });

    for (const elem of tokens[3].split(';').filter((e) => e !== '')) {
      p.elements.push(parseElement(elem));
    }

    p.redraw();
  }

  loader.classList.add('hide');
  return true;
}
