import { rgb } from '../../pdf-lib.esm.min.js';

const colorToRGB = (colorKeyword) => {
  const div = document.createElement('div');
  div.style.color = colorKeyword;
  document.body.appendChild(div);
  const rgbStr = window.getComputedStyle(div).color;
  document.body.removeChild(div);

  // Is the computed style always like 'rgb(<R>, <G>, <B>)'?
  return rgb(...rgbStr.match(/[0-9]+/gi).map(i => parseInt(i) / 255));
}

/**
 * A text element, rendering text.
 */
export class TextElement {
  static ID = 'text';

  /* DocumentPage */ page;
  text = '';
  font = 'serif';
  size = 24;
  lineHeight = 1.5;
  color = 'black';
  x = 0;
  y = 0;
  width = 0.2;
  height = 0.2;

  erasing = false;

  constructor(page) {
    this.page = page;
  }

  getPage() {
    return this.page;
  }

  draw(ctx, page) {
    const scaleX = ctx.canvas.width;
    const scaleY = ctx.canvas.height;
    const scaleW = ctx.canvas.width / page.getBaseDims().width;

    ctx.save();

    ctx.globalAlpha *= this.erasing ? 0.5 : 1;
    ctx.font = `${this.size * scaleW}px ${this.font}`;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.rect(this.x * scaleX, this.y * scaleY, this.width * scaleX,
             this.height * scaleY);
    ctx.clip();

    let nDrawn = 0, nToBeDrawn = 0, vertOffset = this.size * scaleW;
    while (nDrawn < this.text.length) {
      let line = '';

      while (ctx.measureText(line).width <= this.width * scaleX
          && nToBeDrawn < this.text.length) {
        nToBeDrawn++;
        line = this.text.substring(nDrawn, nToBeDrawn);
      }

      ctx.fillText(line, this.x * scaleX, this.y * scaleY + vertOffset);
      vertOffset += this.size * this.lineHeight * scaleW;
      nDrawn = nToBeDrawn;
    }

    ctx.restore();
  }

  /**
   * @returns true if a segment from `lastPoint` to `point` with thickness
   * `range` intersects with this element.
   */
  touches(page, point, lastPoint, range) {
    const scaleX = page.getCanvas().width;
    const scaleY = page.getCanvas().height;

    const xa = this.x * scaleX;
    const ya = this.y * scaleY;
    const xb = (this.x + this.width) * scaleX;
    const yb = (this.y + this.height) * scaleY;

    // Strategy: Copy the stroke.mjs implementation with the bounds as a path
    const points = [
      { x: xa, y: ya },
      { x: xa, y: yb },
      { x: xb, y: yb },
      { x: xb, y: ya },
      { x: xa, y: ya }
    ];

    for (var i = 0; i < points.length; i++) {
      // Test either point being inside the area

      for (const pt of [point, lastPoint]) {

        const ptx = pt.x * scaleX;
        const pty = pt.y * scaleY;

        if (ptx > xa && pty > ya && ptx < xb && pty < yb) {
          return true;
        }
      }

      // Test segment collision (does not account for thickness)

      // Segment is point[i] -> point[i - 1], skip if no point[i - 1]
      if (i === 0)
        continue;

      // Taken from https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
      function intersects(a,b,c,d,p,q,r,s){
        var γ,λ,𝐴=(c-a)*(s-q)-(r-p)*(d-b);
        return 0!==𝐴&&(γ=((b-d)*(r-a)+(c-a)*(s-b))/𝐴,
                0<(λ=((s-q)*(r-a)+(p-r)*(s-b))/𝐴)&&λ<1&&0<γ&&γ<1)
      }

      const ptx1 = point.x * scaleX;
      const pty1 = point.y * scaleY;
      const ptx2 = lastPoint.x * scaleX;
      const pty2 = lastPoint.y * scaleY;
      const x1 = points[i].x * scaleX;
      const y1 = points[i].y * scaleY;
      const x2 = points[i - 1].x * scaleX;
      const y2 = points[i - 1].y * scaleY;

      if (intersects(ptx1, pty1, ptx2, pty2, x1, y1, x2, y2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * @returns true if this element is at least in part selected by the lasso.
   */
  isContained(page, lasso) {
    const scaleX = page.getCanvas().width;
    const scaleY = page.getCanvas().height;

    // Strategy: Copy the stroke.mjs implementation with the bounds as a path
    const x1 = this.x * scaleX;
    const y1 = this.y * scaleY;
    const x2 = (this.x + this.width) * scaleX;
    const y2 = (this.y + this.height) * scaleY;
    const points = [
      { x: x1, y: y1 },
      { x: x1, y: y2 },
      { x: x2, y: y2 },
      { x: x2, y: y1 },
      { x: x1, y: y1 }
    ];

    for (var i = 1; i < lasso.points.length; i++) {
      if (this.touches(page, lasso.points[i], lasso.points[i - 1], 0)) {
        return true;
      }
    }

    // Taken from https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon
    // and adapted to work with Annotate data.
    function inside(point, vs) {
      // ray-casting algorithm based on
      // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

      var x = point.x, y = point.y;

      var inside = false;
      for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }

      return inside;
    };

    return inside({ x: this.x, y: this.y }, lasso.points);
  }

  /**
   * Move the text by this amount.
   */
  offset(x, y) {
    this.x += x;
    this.y += y;
  }

  /**
   * @returns the bounding box for that element.
   */
  getBounds() {
    return [ this.x, this.y, this.x + this.width, this.y + this.height ];
  }

  /**
   * @returns true if the given points is within the bbox, false otherwise.
   */
  hitsPt(x, y) {
    const b = this.getBounds();
    return b[0] < x && b[1] < y && b[2] > x && b[3] > y;
  }

  static load(data, page) {
    const elemData = data.substring(TextElement.ID.length + 1);
    return Object.assign(new TextElement(page), JSON.parse(atob(elemData)));
  }

  save() {
    return TextElement.ID + ',' + btoa(JSON.stringify({
      text: this.text,
      font: this.font,
      size: this.size,
      lineHeight: this.lineHeight,
      color: this.color,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }));
  }

  async exportPdf(page) {
    const { width, height } = page.getSize();

    page.drawText(this.text, {
      x: this.x * width,
      y: (1 - this.y) * height,
      size: this.size,
      color: colorToRGB(this.color),
    });
  }
}
