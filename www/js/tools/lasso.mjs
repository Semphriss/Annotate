import { LassoElement } from '../elements/lasso.mjs';
import { BBoxElement } from '../elements/bbox.mjs';
import { saveCurrentDoc } from '../main.mjs';

/**
 * If the drag lasted less than this many milliseconds, consider that the user
 * was just tapping to deselect the elements instead of dragging them.
 */
const MINIMUM_DRAG_TIME = 100;

/**
 * A lasso, to select elements in an area.
 */
export class LassoTool {
  /* LassoElement? */ currentLasso = null;
  /* Element[] */ currentSelection = [];
  /* Date? */ dragBeginTime = null;
  /* { x, y }? */ lastPoint = null;
  /* { x, y }? */ initialPoint = null;
  /* BBoxElement? */ currentBBox = null;

  createConfigPanel(container) {
    // Nothing.
  }

  begin(page, x, y) {
    if (this.currentLasso)
      return false;

    if (this.currentSelection.length !== 0) {
      this.lastPoint = { x, y };
      this.initialPoint = { x, y };
      this.dragBeginTime = +new Date();
    } else {
      this.currentLasso = new LassoElement();

      this.currentLasso.addPoint(x, y);
      page.setTempElement(this.currentLasso);
    }

    return true;
  }

  move(page, x, y) {
    if (this.currentLasso) {
      this.currentLasso.addPoint(x, y);
      return true;
    } else if (this.currentSelection.length !== 0 && this.lastPoint) {
      for (const elem of this.currentSelection) {
        elem.offset(x - this.lastPoint.x, y - this.lastPoint.y);
      }

      this.currentBBox.offset(x - this.lastPoint.x, y - this.lastPoint.y);

      this.lastPoint = { x, y };
      return true;
    }
  }

  end(page) {
    if (this.currentLasso) {
      this.currentSelection = page.elements.filter(e =>
                                e.isContained(page, this.currentLasso));
      this.currentLasso = null;

      if (this.currentSelection.length === 0) {
        page.setTempElement(null);
        return true;
      }

      let minx = 1.0, miny = 1.0, maxx = 0.0, maxy = 0.0;

      for (const elem of this.currentSelection) {
        const bbox = elem.getBounds();

        if (minx > bbox[0]) minx = bbox[0];
        if (miny > bbox[1]) miny = bbox[1];
        if (maxx < bbox[2]) maxx = bbox[2];
        if (maxy < bbox[3]) maxy = bbox[3];
      }

      this.currentBBox = new BBoxElement(minx, miny, maxx, maxy);
      page.setTempElement(this.currentBBox);
      return true;
    } else {
      if (new Date() - this.dragBeginTime < MINIMUM_DRAG_TIME) {
        for (const elem of this.currentSelection) {
          elem.offset(this.initialPoint.x - this.lastPoint.x,
                      this.initialPoint.y - this.lastPoint.y);
        }

        page.setTempElement(null);
        this.currentSelection = [];
        this.currentBBox = null;
      }

      this.initialPoint = null;
      this.lastPoint = null;
      saveCurrentDoc();
      return false;
    }
  }

  cancel(page) {
    if (this.currentLasso) {
      page.setTempElement(null);
      this.currentLasso = null;
      return true;
    } else {
      for (const elem of this.currentSelection) {
        elem.offset(this.initialPoint.x - this.lastPoint.x,
                    this.initialPoint.y - this.lastPoint.y);
      }

      this.initialPoint = null;
      this.lastPoint = null;
      return false;
    }
  }

  reset() {
    this.currentLasso = null;
    this.currentSelection = [];
    this.dragBeginTime = null;
    this.lastPoint = null;
    this.initialPoint = null;
    this.currentBBox = null;
  }
}
