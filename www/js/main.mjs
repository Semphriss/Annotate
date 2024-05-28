import { openFile, listFiles, renameFile, deleteFile } from './file_manager.mjs';
import { Document } from './document.mjs';
import { DelayJob } from './job.mjs';

const addempty = document.getElementById('addempty');
const filelist = document.getElementById('filelist');
const loadfile = document.getElementById('loadfile');
const loading = document.getElementById('loading');
const menu = document.getElementById('tool-menu');
const pages = document.getElementById('pages');
const pdflist = document.getElementById('pdflist');
const settings = document.getElementById('settings');

let files = [];
let doc = null;
let editing = false;

async function refreshFileList() {
  files = await listFiles();
  renderMenu();
}

async function openDocument(file) {
  loading.classList.remove('hide');

  pages.innerHTML = '';

  try {
    const data = await openFile(file);
    doc = await Document.fromSaveData(data, pages, file);

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

// Bind various buttons
addempty.addEventListener('click', () => {
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
  doc = Document.fromEmpty(pages, file);

  loading.classList.add('hide');
  pdflist.classList.add('hide');
});

settings.addEventListener('click', () => {
  editing = !editing;
  renderMenu();
});

loadfile.addEventListener('change', async () => {
  if (loadfile.files.length === 0)
    return;

  const file = loadfile.files[0].name.replace(/[^a-z0-9_-]+/gi, '_');

  var reader = new FileReader();
  reader.onload = async function(event) {
    loading.classList.remove('hide');

    pages.innerHTML = '';
    const data = event.target.result;

    try {
      doc = await Document.fromPdfData(data, pages, file);

      loading.classList.add('hide');
      pdflist.classList.add('hide');
    } catch(e) {
      console.error(e);
      alert('Could not load PDF: ' + e.toString());
      loading.classList.add('hide');
    }
  };

  reader.readAsBinaryString(loadfile.files[0]);
});

menu.addEventListener('click', () => {
  if (doc) {
    loading.classList.remove('hide');

    doc.onSaved(async (needsRerun) => {
      if (needsRerun)
        return;

      pages.innerHTML = '';
      doc = null;

      showMenu();
    });
    doc.save();
  }
});

// Auto-resize the canvas
const resizeJob = new DelayJob(() => { if (doc) doc.refresh(); });
window.addEventListener('resize', () => void resizeJob.run());

// Initialize the app
showMenu();