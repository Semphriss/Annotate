const settings = document.getElementById('settings');
const addempty = document.getElementById('addempty');
const filelist = document.getElementById('filelist');
const pdflist = document.getElementById('pdflist');

var editingFiles = false;

function showMenu() {
  pdflist.classList.remove('hide');
  loader.classList.remove('hide');
  fetch('/cgi-bin/list.sh?key=' + key).then(async (e) => {
    filenames = (await e.text()).split('\n').filter(s => s !== '');
    editingFiles = false;
    refreshFileList();
    loader.classList.add('hide');
  });
}

function hideMenu() {
  pdflist.classList.add('hide');
}

function refreshFileList() {
  filelist.innerHTML = '';
  if (editingFiles) {
    for (const file of filenames) {
      const elem = document.createElement('li');
      const delBtn = document.createElement('button');
      delBtn.classList.add('tool');
      delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path fill="#FF0000" d="M135.2 17.69C140.6 6.848 151.7 0 163.8 0H284.2C296.3 0 307.4 6.848 312.8 17.69L320 32H416C433.7 32 448 46.33 448 64C448 81.67 433.7 96 416 96H32C14.33 96 0 81.67 0 64C0 46.33 14.33 32 32 32H128L135.2 17.69zM31.1 128H416V448C416 483.3 387.3 512 352 512H95.1C60.65 512 31.1 483.3 31.1 448V128zM111.1 208V432C111.1 440.8 119.2 448 127.1 448C136.8 448 143.1 440.8 143.1 432V208C143.1 199.2 136.8 192 127.1 192C119.2 192 111.1 199.2 111.1 208zM207.1 208V432C207.1 440.8 215.2 448 223.1 448C232.8 448 240 440.8 240 432V208C240 199.2 232.8 192 223.1 192C215.2 192 207.1 199.2 207.1 208zM304 208V432C304 440.8 311.2 448 320 448C328.8 448 336 440.8 336 432V208C336 199.2 328.8 192 320 192C311.2 192 304 199.2 304 208z"/></svg>';
      delBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete ' + file + '?'))
          return;
        loading.classList.remove('hide');
        await fetch('/cgi-bin/delete.sh?file=' + file + '&key=' + key);
        filenames = filenames.filter(f => f !== file);
        refreshFileList();
        loading.classList.add('hide');
      });
      elem.appendChild(delBtn);
      const pElem = document.createElement('input');
      pElem.value = file;
      pElem.addEventListener('blur', async () => {
        const newname = pElem.value.replace(/[^a-z0-9_-]/gi, '_')
                                   .replace(/_+/gi, '_');
        await fetch('/cgi-bin/rename.sh?file=' + file + '&newname=' + newname + '&key=' + key);
        fetch('/cgi-bin/list.sh?key=' + key).then(async (e) => {
          filenames = (await e.text()).split('\n').filter(s => s !== '');
        });
      });
      elem.appendChild(pElem);
      filelist.appendChild(elem);
    }

    if (!settings.classList.contains('selected'))
      settings.classList.add('selected');
  } else {
    for (const file of filenames) {
      const elem = document.createElement('li');
      const pElem = document.createElement('span');
      pElem.appendChild(document.createTextNode(file));
      elem.appendChild(pElem);

      elem.addEventListener('touchstart', (e) => {
        elem.isTouching = true;
      });

      elem.addEventListener('touchmove', (e) => {
        elem.isTouching = false;
      });

      elem.addEventListener('touchcancel', (e) => {
        elem.isTouching = false;
      });

      elem.addEventListener('touchend', async (e) => {
        if (!elem.isTouching) return;
        elem.isTouching = false;
        loader.classList.remove('hide');
        const response = await fetch('/cgi-bin/get.sh?file=' + file + '&key=' + key);
        const data = await response.text();
        currentFile = file;
        if (await parseAll(data)) {
          hideMenu();
          saveFile();
        }
        loader.classList.add('hide');
      });

      elem.addEventListener('click', async (e) => {
        elem.isTouching = false;
        loader.classList.remove('hide');
        const response = await fetch('/cgi-bin/get.sh?file=' + file + '&key=' + key);
        const data = await response.text();
        currentFile = file;
        if (await parseAll(data)) {
          hideMenu();
          saveFile();
        }
        loader.classList.add('hide');
      });

      filelist.appendChild(elem);
    }
    settings.classList.remove('selected');
  }
};

settings.addEventListener('click', () => {
  editingFiles = !editingFiles;
  refreshFileList();
});

addempty.addEventListener('click', () => {
  loader.classList.remove('hide');

  const origFilename = new Date().toISOString()
                        .replace(/[^a-z0-9_-]/gi, '_')
                        .replace(/_+/gi, '_');

  currentFile = origFilename;
  var i = 0;
  while (filenames.includes(currentFile)) {
    i++;
    currentFile = origFilename + i;
  }
  filenames.unshift(currentFile);

  docPages = [];
  pagesContainer.innerHTML = '';

  addPage();

  saveFile();
  hideMenu();
  loader.classList.add('hide');
});
