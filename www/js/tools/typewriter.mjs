import { TextElement } from '../elements/text.mjs';
import { BBoxElement } from '../elements/bbox.mjs';
import { saveCurrentDoc } from '../main.mjs';
import { pickColor } from '../color_picker.mjs';
import { historyAction } from '../history_manager.mjs';

/**
 * A typewriter, creating and editing text elements.
 */
export class TypewriterTool {
  /* TextElement? */ currentText = null;
  /* BBoxElement? */ currentTextBBox = null;
  /* timeout id? */ selectTimeout = null;
  /* { x, y }? */ selectOrigin = null;
  /* HTMLElement? */ lastContainer = null;
  /* HTMLTextAreaElement? */ textArea = null;

  font = 'serif';
  color = 'black';
  size = 24;
  lineHeight = 1.5;

  beginEdit() {
    if (this.textArea || !this.currentText)
      return;

    this.textArea = document.createElement('textarea');
    this.textArea.classList.add('text-edit');

    const page = this.currentText.getPage();
    const canvas = page.getCanvas();
    const dims = page.getDims();

    const left = canvas.offsetLeft + page.getDims().width * this.currentText.x / window.devicePixelRatio;
    const top = canvas.offsetTop + page.getDims().height * this.currentText.y / window.devicePixelRatio;
    const width = page.getDims().width * this.currentText.width / window.devicePixelRatio;
    const height = page.getDims().height * this.currentText.height / window.devicePixelRatio;

    this.textArea.style.left = left + 'px';
    this.textArea.style.top = top + 'px';
    this.textArea.style.width = width + 'px';
    this.textArea.style.height = height + 'px';

    this.textArea.value = this.currentText.text;

    document.getElementById('pages').appendChild(this.textArea);
  }

  endEdit() {
    window.onscroll = null;
    if (!this.textArea)
      return;

    if (this.currentText) {
      const txtElem = this.currentText;
      const oldtxt = this.currentText.text;
      const newtxt = this.textArea.value;
      if (oldtxt !== newtxt) {
        historyAction(() => {
          txtElem.text = oldtxt;
        }, () => {
          txtElem.text = newtxt;
        }, [this.currentText.getPage()]);
      }

      this.currentText.text = this.textArea.value;
      this.currentText.getPage().draw();
    }

    this.textArea.remove();
    this.textArea = null;
  }

  refreshPanel() {
    if (!this.lastContainer)
      return;

    const container = this.lastContainer;
    container.innerHTML = '';

    if (this.currentText) {
      // This allows keeping the object itself in "cache" if a callback is
      // invoked after this.currentText changes (which may happen on
      // deselection).
      const currentText = this.currentText;

      const colorPanel = document.createElement('div');
      colorPanel.classList.add('toolbar-panel');

      {
        const colorPicker = document.createElement('div');
        colorPicker.classList.add('color-button');
        colorPicker.style.backgroundColor = currentText.color;
        colorPicker.addEventListener('click', async () => {
          const oldCol = this.currentText.color;
          const newCol = await pickColor(this.currentText.color);

          if (!newCol)
            return;

          historyAction(() => {
            currentText.color = oldCol;
            colorPicker.style.backgroundColor = currentText.color;
          }, () => {
            currentText.color = newCol;
            colorPicker.style.backgroundColor = currentText.color;
          }, [this.currentText.getPage()]);

          currentText.color = newCol;
          colorPicker.style.backgroundColor = currentText.color;
        });

        const colorLabel = document.createElement('span');
        colorLabel.innerText = 'Color';
        colorLabel.classList.add('toolbar-label');

        colorPanel.appendChild(colorPicker);
        colorPanel.appendChild(colorLabel);
      }

      const sizePanel = document.createElement('div');
      sizePanel.classList.add('toolbar-panel');

      {
        const sizeInput = document.createElement('input');
        sizeInput.classList.add('toolbar-number-wheel');
        sizeInput.type = 'number';
        sizeInput.value = currentText.size;
        sizeInput.addEventListener('blur', () => {
          const oldSize = currentText.size;
          const newSize = parseInt(sizeInput.value);

          historyAction(() => {
            currentText.size = oldSize;
            sizeInput.value = oldSize;
          }, () => {
            currentText.size = newSize;
            sizeInput.value = newSize;
          }, [this.currentText.getPage()]);

          currentText.size = newSize;
        });

        sizeInput.addEventListener('click', () => {
          sizeInput.value = '';
        });

        sizeInput.addEventListener('keypress', (e) => {
          if (e.keyCode == 10 || e.keyCode == 13) {
            sizeInput.blur();
          }
        });

        const sizeLabel = document.createElement('span');
        sizeLabel.innerText = 'Size';
        sizeLabel.classList.add('toolbar-label');

        sizePanel.appendChild(sizeInput);
        sizePanel.appendChild(sizeLabel);
      }

      const lineHeightPanel = document.createElement('div');
      lineHeightPanel.classList.add('toolbar-panel');

      {
        const lhInput = document.createElement('input');
        lhInput.classList.add('toolbar-number-wheel');
        lhInput.type = 'number';
        lhInput.value = currentText.lineHeight;
        lhInput.step = 'any';
        lhInput.addEventListener('blur', () => {
          const oldHeight = currentText.lineHeight;
          const newHeight = parseFloat(lhInput.value);

          historyAction(() => {
            currentText.lineHeight = oldHeight;
            lhInput.value = oldHeight;
          }, () => {
            currentText.lineHeight = newHeight;
            lhInput.value = newHeight;
          }, [this.currentText.getPage()]);

          currentText.lineHeight = newHeight;
        });

        lhInput.addEventListener('click', () => {
          lhInput.value = '';
        });

        lhInput.addEventListener('keypress', (e) => {
          if (e.keyCode == 10 || e.keyCode == 13) {
            lhInput.blur();
          }
        });

        const lhLabel = document.createElement('span');
        lhLabel.innerText = 'Line';
        lhLabel.classList.add('toolbar-label');

        lineHeightPanel.appendChild(lhInput);
        lineHeightPanel.appendChild(lhLabel);
      }

      const editPanel = document.createElement('div');
      editPanel.classList.add('toolbar-panel');

      {
        const editInput = document.createElement('button');
        editInput.classList.add('toolbar-button');
        editInput.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L444.3 197.7L314.3 67.72L362.7 19.32zM421.7 220.3L188.5 453.4C178.1 463.8 165.2 471.5 151.1 475.6L30.77 511C22.35 513.5 13.24 511.2 7.03 504.1C.8198 498.8-1.502 489.7 .976 481.2L36.37 360.9C40.53 346.8 48.16 333.9 58.57 323.5L291.7 90.34L421.7 220.3z"/></svg>';

        editInput.addEventListener('click', () => {
          if (this.textArea) {
            this.endEdit();
            editInput.classList.remove('button-like-active');
          } else {
            this.beginEdit();
            editInput.classList.add('button-like-active');
          }
        });

        const editLabel = document.createElement('span');
        editLabel.innerText = 'Edit';
        editLabel.classList.add('toolbar-label');

        editPanel.appendChild(editInput);
        editPanel.appendChild(editLabel);
      }

      const deletePanel = document.createElement('div');
      deletePanel.classList.add('toolbar-panel');

      {
        const deleteInput = document.createElement('button');
        deleteInput.classList.add('toolbar-button');
        deleteInput.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M135.2 17.69C140.6 6.848 151.7 0 163.8 0H284.2C296.3 0 307.4 6.848 312.8 17.69L320 32H416C433.7 32 448 46.33 448 64C448 81.67 433.7 96 416 96H32C14.33 96 0 81.67 0 64C0 46.33 14.33 32 32 32H128L135.2 17.69zM31.1 128H416V448C416 483.3 387.3 512 352 512H95.1C60.65 512 31.1 483.3 31.1 448V128zM111.1 208V432C111.1 440.8 119.2 448 127.1 448C136.8 448 143.1 440.8 143.1 432V208C143.1 199.2 136.8 192 127.1 192C119.2 192 111.1 199.2 111.1 208zM207.1 208V432C207.1 440.8 215.2 448 223.1 448C232.8 448 240 440.8 240 432V208C240 199.2 232.8 192 223.1 192C215.2 192 207.1 199.2 207.1 208zM304 208V432C304 440.8 311.2 448 320 448C328.8 448 336 440.8 336 432V208C336 199.2 328.8 192 320 192C311.2 192 304 199.2 304 208z"/></svg>';

        deleteInput.addEventListener('click', () => {
          if (!confirm('Delete selected text element?'))
            return;

          const page = currentText.getPage();

          historyAction(() => {
            page.addElement(currentText);
          }, () => {
            page.elements = page.elements.filter(e => e !== currentText);
          }, [this.currentText.getPage()]);

          page.elements = page.elements.filter(e => e !== currentText);
          page.setTempElement(null);
          this.select(page, null);
        });

        const deleteLabel = document.createElement('span');
        deleteLabel.innerText = 'Delete';
        deleteLabel.classList.add('toolbar-label');

        deletePanel.appendChild(deleteInput);
        deletePanel.appendChild(deleteLabel);
      }

      container.appendChild(colorPanel);
      container.appendChild(sizePanel);
      container.appendChild(lineHeightPanel);
      container.appendChild(editPanel);
      container.appendChild(deletePanel);
    } else {
      const colorPanel = document.createElement('div');
      colorPanel.classList.add('toolbar-panel');

      {
        const colorPicker = document.createElement('div');
        colorPicker.classList.add('color-button');
        colorPicker.style.backgroundColor = this.color;
        colorPicker.addEventListener('click', async () => {
          const newCol = await pickColor(this.color);

          if (!newCol)
            return;

          this.color = newCol;
          colorPicker.style.backgroundColor = this.color;
        });

        const colorLabel = document.createElement('span');
        colorLabel.innerText = 'Color';
        colorLabel.classList.add('toolbar-label');

        colorPanel.appendChild(colorPicker);
        colorPanel.appendChild(colorLabel);
      }

      const sizePanel = document.createElement('div');
      sizePanel.classList.add('toolbar-panel');

      {
        const sizeInput = document.createElement('input');
        sizeInput.classList.add('toolbar-number-wheel');
        sizeInput.type = 'number';
        sizeInput.value = this.size;
        sizeInput.addEventListener('blur', () => {
          this.size = parseInt(sizeInput.value);
        });

        sizeInput.addEventListener('click', () => {
          sizeInput.value = '';
        });

        sizeInput.addEventListener('keypress', (e) => {
          if (e.keyCode == 10 || e.keyCode == 13) {
            sizeInput.blur();
          }
        });

        const sizeLabel = document.createElement('span');
        sizeLabel.innerText = 'Size';
        sizeLabel.classList.add('toolbar-label');

        sizePanel.appendChild(sizeInput);
        sizePanel.appendChild(sizeLabel);
      }

      const lineHeightPanel = document.createElement('div');
      lineHeightPanel.classList.add('toolbar-panel');

      {
        const lhInput = document.createElement('input');
        lhInput.classList.add('toolbar-number-wheel');
        lhInput.type = 'number';
        lhInput.value = this.lineHeight;
        lhInput.step = 'any';
        lhInput.addEventListener('blur', () => {
          this.lineHeight = parseFloat(lhInput.value);
        });

        lhInput.addEventListener('click', () => {
          lhInput.value = '';
        });

        lhInput.addEventListener('keypress', (e) => {
          if (e.keyCode == 10 || e.keyCode == 13) {
            lhInput.blur();
          }
        });

        const lhLabel = document.createElement('span');
        lhLabel.innerText = 'Line';
        lhLabel.classList.add('toolbar-label');

        lineHeightPanel.appendChild(lhInput);
        lineHeightPanel.appendChild(lhLabel);
      }

      container.appendChild(colorPanel);
      container.appendChild(sizePanel);
      container.appendChild(lineHeightPanel);
    }
  }

  // x, y and page are optional if elem is null
  select(page, elem, x, y) {
    this.endEdit();

    if (!elem) {
      if (this.currentTextBBox) {
        const page2 = this.currentTextBBox.getPage();
        page2.setTempElement(null);
      }

      if (page) {
        page.setTempElement(null);
      }

      this.currentTextBBox = null;
      this.selectTimeout = null;
      this.currentText = null;
    } else {
      this.currentText = elem;
      this.currentTextBBox = new BBoxElement(page, ...elem.getBounds(),
                                            'text');
      page.setTempElement(this.currentTextBBox);
    }

    this.refreshPanel();
  }

  createConfigPanel(container) {
    this.lastContainer = container;
    this.refreshPanel();
  }

  begin(page, x, y) {
    let selectNext = !this.currentText;
    let thereHasBeenAtLeastOneText = false;

    for (const element of page.getElements()) {
      if (element instanceof TextElement && element.hitsPt(x, y)) {
        thereHasBeenAtLeastOneText = true;

        if (selectNext) {
          this.select(page, element, x, y);
          return;
        } else if (element === this.currentText) {
          selectNext = true;
        }
      }
    }

    if (thereHasBeenAtLeastOneText) {
      // Loop back to the top of the stack
      this.select(page, null);
      this.begin(page, x, y);
      return;
    }

    // Allow the user to deselect the text element before creating another
    if (this.currentText) {
      this.select(page, null);
      return;
    }

    const elem = new TextElement(page);

    elem.font = this.font;
    elem.color = this.color;
    elem.size = this.size;
    elem.lineHeight = this.lineHeight;
    elem.x = x;
    elem.y = y;

    page.addElement(elem);

    // FIXME: If a text element is already selected but is on another page, the
    // bbox on that page will remain.
    this.select(page, elem);

    historyAction(() => {
      page.elements = page.elements.filter(e => e !== elem);
    }, () => {
      page.addElement(elem);
    }, [page]);

    return true;
  }

  move(page, x, y) {
    // TODO
  }

  end(page) {
    // TODO
  }

  cancel(page) {
    // TODO
  }

  reset() {
    this.select(null, null);
  }
}
