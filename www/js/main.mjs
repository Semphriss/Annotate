//  Annotate - View and annotate your PDF files
//  Copyright 2022-2024 Semphris <semphris@semphris.com>
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

import { openFile, listFiles, renameFile, deleteFile, importFile, exportFile }
  from './file_manager.mjs';
import { Document } from './document.mjs';
import { DelayJob } from './job.mjs';

const addempty = document.getElementById('addempty');
const docname = document.getElementById('doc-name');
const filelist = document.getElementById('filelist');
const loading = document.getElementById('loading');
const loadpdf = document.getElementById('load-pdf');
const menu = document.getElementById('tool-menu');
const share = document.getElementById('tool-share');
const pages = document.getElementById('pages');
const pdflist = document.getElementById('pdflist');
const settings = document.getElementById('settings');

let files = [];
export let doc = null;
let editing = false;

function setDocument(newDoc) {
  doc = newDoc;

  if (doc) {
    docname.value = doc.name;
    document.title = 'Annotate | ' + doc.name;
  } else {
    document.title = 'Annotate';
  }
}

async function refreshFileList() {
  files = await listFiles();
  renderMenu();
}

async function openDocument(file) {
  loading.classList.remove('hide');

  pages.innerHTML = '';

  try {
    const data = await openFile(file);
    setDocument(await Document.fromSaveData(data, pages, file));

    loading.classList.add('hide');
    pdflist.classList.add('hide');
  } catch (e) {
    console.error(e);
    alert('Could not load document: ' + e.toString());
    loading.classList.add('hide');
  }
}

async function deleteDocument(file) {
  if (!confirm('Are you sure you want to delete ' + file + '?'))
    return;

  loading.classList.remove('hide');

  await deleteFile(file);
  await refreshFileList();

  loading.classList.add('hide');
}

async function renameDocument(file, name) {
  loading.classList.remove('hide');

  const newname = name.replace(/[^a-z0-9_-]+/gi, '_');

  await renameFile(file, newname);
  await refreshFileList();

  loading.classList.add('hide');
}

/**
 * Re-creates the file list. Handles whether or not the files are being edited.
 *
 * NOTE: Several callers rely on this being synchronous to avoid using the
 * loader during rendering.
 */
function renderMenu() {
  filelist.innerHTML = '';

  if (editing) {
    for (const file of files) {
      const li = document.createElement('li');
      const delBtn = document.createElement('button');

      delBtn.classList.add('tool');
      delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path fill="#FF0000" d="M135.2 17.69C140.6 6.848 151.7 0 163.8 0H284.2C296.3 0 307.4 6.848 312.8 17.69L320 32H416C433.7 32 448 46.33 448 64C448 81.67 433.7 96 416 96H32C14.33 96 0 81.67 0 64C0 46.33 14.33 32 32 32H128L135.2 17.69zM31.1 128H416V448C416 483.3 387.3 512 352 512H95.1C60.65 512 31.1 483.3 31.1 448V128zM111.1 208V432C111.1 440.8 119.2 448 127.1 448C136.8 448 143.1 440.8 143.1 432V208C143.1 199.2 136.8 192 127.1 192C119.2 192 111.1 199.2 111.1 208zM207.1 208V432C207.1 440.8 215.2 448 223.1 448C232.8 448 240 440.8 240 432V208C240 199.2 232.8 192 223.1 192C215.2 192 207.1 199.2 207.1 208zM304 208V432C304 440.8 311.2 448 320 448C328.8 448 336 440.8 336 432V208C336 199.2 328.8 192 320 192C311.2 192 304 199.2 304 208z"/></svg>';
      delBtn.addEventListener('click', () => void deleteDocument(file));

      const input = document.createElement('input');
      input.value = file;
      input.addEventListener('blur', () => renameDocument(file, input.value));
      input.addEventListener('keypress', (e) => {
        if (e.keyCode == 10 || e.keyCode == 13) {
          input.blur();
        }
      });

      li.appendChild(delBtn);
      li.appendChild(input);

      filelist.appendChild(li);
    }

    settings.classList.add('selected');
  } else {
    for (const file of files) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.appendChild(document.createTextNode(file));
      li.appendChild(span);

      li.addEventListener('click', () => void openDocument(file));

      filelist.appendChild(li);
    }

    settings.classList.remove('selected');
  }
}

async function showMenu() {
  pdflist.classList.remove('hide');
  loading.classList.remove('hide');

  pages.innerHTML = '';

  await refreshFileList();

  loading.classList.add('hide');
}

export async function saveCurrentDoc() {
  return await doc.save();
}

// Bind various buttons
addempty.addEventListener('click', async () => {
  loading.classList.remove('hide');

  // Generate a unique name based on timestamp
  const filetmp = new Date().toISOString().replace(/[^a-z0-9_-]+/gi, '_');
  let file = filetmp;

  var i = 0;
  while (files.includes(file)) {
    i++;
    file = filetmp + i;
  }

  pages.innerHTML = '';
  setDocument(Document.fromEmpty(pages, file));

  // Necessary to add the entry in the saved files
  await doc.save();

  loading.classList.add('hide');
  pdflist.classList.add('hide');
});

settings.addEventListener('click', () => {
  editing = !editing;
  renderMenu();
});

loadpdf.addEventListener('click', async () => {
  // WORKAROUND: Canceling does not work in Morph, so to avoid an eternal
  // wait, don't show the loader at all. See commit f23dd07.
  //loading.classList.remove('hide');

  try {
    const file = await importFile();

    loading.classList.remove('hide'); // <- Workaround

    try {
      pages.innerHTML = '';

      const name = file.name.replace(/[^a-z0-9_-]+/gi, '_');
      const data = file.data;

      setDocument(await Document.fromPdfData(data, pages, name));

      // Necessary to add the entry in the saved files
      await doc.save();

      pdflist.classList.add('hide');
    } catch (e) {
      console.error(e);
      alert('Could not load PDF: ' + e.toString());
    }

    loading.classList.add('hide'); // <- Workaround
  } catch(e) {
    // The user interrupted the import file
  }

  //loading.classList.add('hide'); // <- Workaround
});

menu.addEventListener('click', () => {
  if (doc) {
    loading.classList.remove('hide');

    doc.onSaved(async (needsRerun) => {
      if (needsRerun)
        return;

      pages.innerHTML = '';
      setDocument(null);

      showMenu();
    });
    doc.save();
  }
});

share.addEventListener('click', async () => {
  if (!doc) {
    alert('Attempt to export no document (this shouldn\'t be happening)');
    return;
  }

  if (!confirm('Would you like to export this document as PDF?')) {
    return;
  }

  loading.classList.remove('hide');

  try {
    const pdfBase64 = await doc.exportPdf();
    await exportFile(doc.name + '.pdf', pdfBase64);
  } catch (e) {
    console.error(e);
    alert('Could not export document: ' + e.toString());
  }

  loading.classList.add('hide');
});

docname.addEventListener('blur', async () => {
  if (!doc) {
    return;
  }

  loading.classList.remove('hide');

  const newname = docname.value.replace(/[^a-z0-9_-]+/gi, '_');

  await renameFile(doc.name, newname);
  doc.name = newname;
  docname.value = newname;

  loading.classList.add('hide');
});

docname.addEventListener('keypress', (e) => {
  if (e.keyCode == 10 || e.keyCode == 13) {
    docname.blur();
  }
});

// Auto-resize the canvas
const resizeJob = new DelayJob(() => { if (doc) doc.refresh(); });
window.addEventListener('resize', () => void resizeJob.run());

// Zooming
let currentZoom = 1.0;
let currentLen = null;
let currentPanMid = null;
const scrollTarget = document.body.parentElement;

pages.addEventListener('touchstart', e => {
  if (e.touches.length == 2) {
    const offset = { x: e.touches[0].pageX - e.touches[1].pageX,
                     y: e.touches[0].pageY - e.touches[1].pageY };
    currentLen = Math.sqrt(Math.pow(offset.x, 2) + Math.pow(offset.y, 2));

    // All code below is to initialize currentPanMid for panning
    const midpoint = { x: (e.touches[0].pageX + e.touches[1].pageX) / 2,
                       y: (e.touches[0].pageY + e.touches[1].pageY) / 2 };
    const currScroll = { x: scrollTarget.scrollLeft,
                         y: scrollTarget.scrollTop };
    const currScrollMid = { x: midpoint.x - currScroll.x,
                            y: midpoint.y - currScroll.y };
    currentPanMid = currScrollMid;
  }
});

pages.addEventListener('touchmove', e => {
  if (e.touches.length == 2 && currentLen) {
    const offset = { x: e.touches[0].pageX - e.touches[1].pageX,
                     y: e.touches[0].pageY - e.touches[1].pageY };
    const newLen = Math.sqrt(Math.pow(offset.x, 2) + Math.pow(offset.y, 2));
    const oldZoom = currentZoom;
    currentZoom *= newLen / currentLen;
    currentZoom = Math.max(currentZoom, 1.0);

    // Without this midpoint math madness, zooming will send the user towards
    // or away from the origin point at the complete top of the document.
    const currScroll = { x: scrollTarget.scrollLeft,
                         y: scrollTarget.scrollTop };
    const newScroll = { x: currScroll.x * currentZoom / oldZoom,
                        y: currScroll.y * currentZoom / oldZoom };

    // The above is enough to zoom relatively to the top left corner of the
    // screen, but we want to zoom relatively to the middle of the pinch.
    const midpoint = { x: (e.touches[0].pageX + e.touches[1].pageX) / 2,
                       y: (e.touches[0].pageY + e.touches[1].pageY) / 2 };
    const currScrollMid = { x: midpoint.x - currScroll.x,
                            y: midpoint.y - currScroll.y };
    const newScrollMid = { x: currScrollMid.x * currentZoom / oldZoom,
                           y: currScrollMid.y * currentZoom / oldZoom, };
    const newMidOffset = { x: newScrollMid.x - currScrollMid.x,
                           y: newScrollMid.y - currScrollMid.y };
    newScroll.x += newMidOffset.x;
    newScroll.y += newMidOffset.y;

    // While we're at it, enable panning with two fingers.
    newScroll.x -= currScrollMid.x - currentPanMid.x;
    newScroll.y -= currScrollMid.y - currentPanMid.y;

    currentLen = newLen;
    currentPanMid = currScrollMid;
    pages.style.width = (currentZoom * 100) + 'vw';
    document.body.parentElement.scrollLeft = newScroll.x;
    document.body.parentElement.scrollTop = newScroll.y;
  }
});

pages.addEventListener('touchend', e => {
  if (e.touches.length < 2) {
    currentLen = null;
  }
});

// Initialize the app
showMenu();
