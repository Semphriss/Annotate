import { StrokeElement } from '../elements/stroke.mjs';
import { pickColor } from '../color_picker.mjs';

/**
 * A highlighter, drawing transparent strokes.
 */
export class HighlighterTool {
  /* StrokeElement */ currentStroke = null;

  color = 'hsl(60 80% 50%)';
  size = 24;

  createConfigPanel(container) {
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

    const sizeInput = document.createElement('input');
    sizeInput.type = 'number';
    sizeInput.value = this.size;
    sizeInput.addEventListener('blur', () => {
      this.size = sizeInput.value;
    });

    container.appendChild(colorPicker);
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
