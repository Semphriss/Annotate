/**
 * A lasso, to select other elements in an area.
 *
 * This will never be fixed on a canvas, only used as a temporary element.
 */
export class LassoElement {
  /* DocumentPage */ page;
  points = [];

  constructor(page) {
    this.page = page;
  }

  getPage() {
    return this.page;
  }

  draw(ctx, page) {
    if (this.points.length === 0)
      return;

    const scaleX = ctx.canvas.width;
    const scaleY = ctx.canvas.height;
    const scaleW = ctx.canvas.width / page.getBaseDims().width;

    ctx.save();
    ctx.globalAlpha *= 0.5;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = scaleW * 2;
    ctx.strokeStyle = 'black';
    ctx.setLineDash([scaleW * 8]);
    ctx.fillStyle = '#0007';

    ctx.beginPath();
    ctx.moveTo(this.points[0].x * scaleX, this.points[0].y * scaleY);

    for (const point of this.points) {
      ctx.lineTo(point.x * scaleX, point.y * scaleY);
    }

    ctx.stroke();

    ctx.closePath();
    ctx.fill('evenodd');

    ctx.restore();
  }

  addPoint(x, y) {
    this.points.push({ x, y });
  }

  touches(page, point, lastPoint, range) {
    throw "LassoElement.touches should never be called";
  }

  isContained(page, lasso) {
    throw "LassoElement.isContained should never be called";
  }

  offset(x, y) {
    throw "LassoElement.offset should never be called";
  }

  getBounds() {
    throw "LassoElement.getBounds should never be called";
  }

  save() {
    throw "LassoElement.save should never be called";
  }

  async exportPdf(page) {
    throw "LassoElement.exportPdf should never be called";
  }
}
