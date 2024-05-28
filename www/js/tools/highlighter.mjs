import { StrokeElement } from '../elements/stroke.mjs';

/**
 * A highlighter, drawing transparent strokes.
 */
export class HighlighterTool {
  /* StrokeElement */ currentStroke = null;

  color = 'yellow';
  size = 24;

  createConfigPanel(container) {
    const colorInput = document.createElement('input');
    colorInput.type = 'text';
    colorInput.value = this.color;
    colorInput.addEventListener('blur', () => {
      this.color = colorInput.value;
    });

    const sizeInput = document.createElement('input');
    sizeInput.type = 'number';
    sizeInput.value = this.size;
    sizeInput.addEventListener('blur', () => {
      this.size = sizeInput.value;
    });

    container.appendChild(colorInput);
    container.appendChild(sizeInput);
  }

  begin(page, x, y) {
    if (this.currentStroke)
      return false;

    this.currentStroke = new StrokeElement();
    this.currentStroke.color = this.color;
    this.currentStroke.size = this.size;
    this.currentStroke.opacity = 0.5;

    this.currentStroke.addPoint(x, y);
    page.setTempElement(this.currentStroke);

    return true;
  }

  move(page, x, y) {
    if (!this.currentStroke)
      return false;

    this.currentStroke.addPoint(x, y);
    return true;
  }

  end(page) {
    if (!this.currentStroke)
      return false;

    page.addElement(this.currentStroke);
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
