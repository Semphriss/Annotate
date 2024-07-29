import { StrokeElement } from '../elements/stroke.mjs';
import { saveCurrentDoc } from '../main.mjs';
import { historyAction } from '../history_manager.mjs';

/**
 * An eraser, to erase elements.
 */
export class EraserTool {
  /* StrokeElement */ currentStroke = null;

  size = 16;

  createConfigPanel(container) {
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

    container.appendChild(sizePanel);
  }

  begin(page, x, y) {
    if (this.currentStroke)
      return false;

    this.currentStroke = new StrokeElement(page);
    this.currentStroke.color = 'white';
    this.currentStroke.size = this.size;

    this.currentStroke.addPoint(x, y);
    page.setTempElement(this.currentStroke);

    return true;
  }

  move(page, x, y) {
    if (!this.currentStroke)
      return false;

    this.currentStroke.addPoint(x, y);
    const n = this.currentStroke.points.length;

    for (const element of page.elements) {
      if (element.touches(page,
                          this.currentStroke.points[n - 1],
                          this.currentStroke.points[n - 2],
                          this.currentStroke.size)) {
        element.erasing = true;
      }
    }

    return true;
  }

  end(page) {
    if (!this.currentStroke)
      return false;

    const erasedElements = page.elements.filter(e => e.erasing);

    for (const elem of erasedElements) {
      elem.erasing = false;
    }

    // Don't push a history change if nothing was erased
    if (erasedElements.length > 0) {
      historyAction(() => {
        for (const elem of erasedElements) {
          page.addElement(elem);
        }
      }, () => {
        page.elements = page.elements.filter(e => !erasedElements.includes(e));
      }, [page]);
    }

    page.elements = page.elements.filter(e => !erasedElements.includes(e));

    page.setTempElement(null);
    this.currentStroke = null;
    saveCurrentDoc();
    return true;
  }

  cancel(page) {
    if (!this.currentStroke)
      return false;

    page.setTempElement(null);
    this.currentStroke = null;
    return true;
  }

  reset() {
    this.currentStroke = null;
  }
}
