import { LineCapStyle, rgb } from '../../pdf-lib.esm.min.js';

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
 * A stroke element, drawn by a pencil, highlighter, or similar.
 */
export class StrokeElement {
  static ID = 'stroke';

  points = [];
  size = 3;
  color = 'hsl(0 0% 0%)';
  opacity = 1;

  erasing = false;

  draw(ctx, page) {
    if (this.points.length === 0)
      return;

    const scaleX = ctx.canvas.width;
    const scaleY = ctx.canvas.height;
    const scaleW = ctx.canvas.width / page.getBaseDims().width;

    ctx.save();
    ctx.globalAlpha *= this.opacity / (this.erasing ? 2 : 1);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = scaleW * this.size;
    ctx.strokeStyle = this.color;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x * scaleX, this.points[0].y * scaleY);

    for (const point of this.points) {
      ctx.lineTo(point.x * scaleX, point.y * scaleY);
    }

    ctx.stroke();

    ctx.restore();
  }

  /**
   * @returns true if a segment from `lastPoint` to `point` with thickness
   * `range` intersects with this element.
   */
  touches(page, point, lastPoint, range) {
    const scaleX = page.getCanvas().width;
    const scaleY = page.getCanvas().height;
    const scaleW = page.getCanvas().width / page.getBaseDims().width;

    for (var i = 0; i < this.points.length; i++) {
      // Test point collision (if circles with middle <point> and radius
      // <thickness> collide) with both points

      for (const pt of [point, lastPoint]) {

        const ptx = pt.x * scaleX;
        const pty = pt.y * scaleY;
        const x = this.points[i].x * scaleX;
        const y = this.points[i].y * scaleY;

        const len = (range + this.size) * scaleW / 2;

        if (Math.sqrt(Math.pow(ptx - x, 2) + Math.pow(pty - y, 2)) < len) {
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
      const x1 = this.points[i].x * scaleX;
      const y1 = this.points[i].y * scaleY;
      const x2 = this.points[i - 1].x * scaleX;
      const y2 = this.points[i - 1].y * scaleY;

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
    const scaleW = page.getCanvas().width / page.getBaseDims().width;

    // Strategy: A stroke is within a lasso if either:
    // 1. A line from the lasso intersects (touches()) a line from the stroke,
    // 2. ALL the points are within the lasso.

    for (var i = 1; i < lasso.points.length; i++) {
      if (this.touches(page, lasso.points[i], lasso.points[i - 1], 0)) {
        return true;
      }
    }

    if (this.points.length <= 0) {
      // Shouldn't happen, but just in case (code below needs one point)
      return false;
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

    return inside(this.points[0], lasso.points);
  }

  /**
   * Move the stroke by this amount.
   */
  offset(x, y) {
    for (const pt of this.points) {
      pt.x += x;
      pt.y += y;
    }
  }

  /**
   * @returns the bounding box for that element.
   */
  getBounds() {
    let minx = 1.0, miny = 1.0, maxx = 0.0, maxy = 0.0;

    for (const pt of this.points) {
      if (minx > pt.x) minx = pt.x;
      if (miny > pt.y) miny = pt.y;
      if (maxx < pt.x) maxx = pt.x;
      if (maxy < pt.y) maxy = pt.y;
    }

    return [ minx, miny, maxx, maxy ];
  }

  addPoint(x, y) {
    this.points.push({ x, y });
  }

  static load(data) {
    const elemData = data.substring(StrokeElement.ID.length + 1);
    return Object.assign(new StrokeElement(), JSON.parse(atob(elemData)));
  }

  save() {
    // FIXME: This saves things it shouldn't, like this.erasing
    return StrokeElement.ID + ',' + btoa(JSON.stringify(this));
  }

  async exportPdf(page) {
    if (this.points.length === 0)
      return;

    const scale = page.getSize();
    const scaleX = scale.width;
    const scaleY = scale.height;

    for (let i = 1; i < this.points.length; i++) {
      const p1 = this.points[i - 1];
      const p2 = this.points[i];

      const P1 = { x: p1.x * scaleX, y: (1 - p1.y) * scaleY };
      const P2 = { x: p2.x * scaleX, y: (1 - p2.y) * scaleY };

      page.drawLine({
        start: P1,
        end: P2,
        thickness: parseFloat(this.size),
        lineCap: LineCapStyle.Round,
        opacity: parseFloat(this.opacity),
        color: colorToRGB(this.color)
      });
    }
  }
}
