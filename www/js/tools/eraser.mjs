import { StrokeElement } from '../elements/stroke.mjs';

/**
 * An eraser, to erase elements.
 */
export class EraserTool {
  /* StrokeElement */ currentStroke = null;

  size = 16;

  createConfigPanel(container) {
    const sizeInput = document.createElement('input');
    sizeInput.type = 'number';
    sizeInput.value = this.size;
    sizeInput.addEventListener('blur', () => {
      this.size = sizeInput.value;
    });

    container.appendChild(sizeInput);
  }

  begin(page, x, y) {
    if (this.currentStroke)
      return false;

    this.currentStroke = new StrokeElement();
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

    page.elements = page.elements.filter(e => !e.erasing);

    page.setTempElement(null);
    this.currentStroke = null;
    return true;
  }

  cancel(page) {
    if (!this.currentStroke)
      return false;

    page.setTempElement(null);
    this.currentStroke = null;
    return true;
  }
}
