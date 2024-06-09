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
