/**
 * A selection bounding box.
 *
 * This will never be fixed on a canvas, only used as a temporary element.
 */
export class BBoxElement {
  /* [ minx, miny, maxx, maxy ] */ boundsBox = [];

  constructor(minx, miny, maxx, maxy) {
    this.boundsBox = [minx, miny, maxx, maxy];
  }

  draw(ctx, page) {
    const scaleX = ctx.canvas.width;
    const scaleY = ctx.canvas.height;
    const scaleW = ctx.canvas.width / page.getBaseDims().width;

    const minx = this.boundsBox[0];
    const miny = this.boundsBox[1];
    const maxx = this.boundsBox[2];
    const maxy = this.boundsBox[3];

    ctx.save();
    ctx.globalAlpha *= 0.5;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = scaleW * 2;
    ctx.strokeStyle = 'black';
    ctx.setLineDash([scaleW * 16]);
    ctx.fillStyle = '#0002';

    ctx.beginPath();
    ctx.moveTo(minx * scaleX, miny * scaleY);
    ctx.lineTo(minx * scaleX, maxy * scaleY);
    ctx.lineTo(maxx * scaleX, maxy * scaleY);
    ctx.lineTo(maxx * scaleX, miny * scaleY);
    ctx.closePath();

    ctx.stroke();
    ctx.fill();

    ctx.restore();
  }

  touches(page, point, lastPoint, range) {
    throw "BBoxElement.touches should never be called";
  }

  isContained(page, lasso) {
    throw "BBoxElement.isContained should never be called";
  }

  offset(x, y) {
    this.boundsBox[0] += x;
    this.boundsBox[1] += y;
    this.boundsBox[2] += x;
    this.boundsBox[3] += y;
  }

  getBounds() {
    throw "BBoxElement.getBounds should never be called";
  }

  save() {
    throw "BBoxElement.save should never be called";
  }

  async exportPdf(page) {
    throw "BBoxElement.exportPdf should never be called";
  }
}
