/**
 * A stroke element, drawn by a pencil, highlighter, or similar.
 */
export class StrokeElement {
  static ID = 'stroke';

  points = [];
  size = 3;
  color = 'black';
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
   *
   * This function is particularly ugly. I should refactor it when I can.
   */
  touches(page, point, lastPoint, range) {
    for (var i = 0; i < this.points.length; i++) {
      const myPoint = this.points[i];
      const lineWidth = this.size * page.getScale().x;
      const dist = Math.sqrt(Math.pow((myPoint.x - point.x)
                              * page.canvas.width, 2)
                  + Math.pow((myPoint.y - point.y)
                              * page.canvas.height, 2));

      if (dist < (lineWidth + range) / 2)
        return true;

      // Taken from https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
      function intersects(a,b,c,d,p,q,r,s){
        var γ,λ,𝐴=(c-a)*(s-q)-(r-p)*(d-b);
        return 0!==𝐴&&(γ=((b-d)*(r-a)+(c-a)*(s-b))/𝐴,
                0<(λ=((s-q)*(r-a)+(p-r)*(s-b))/𝐴)&&λ<1&&0<γ&&γ<1)
      }

      if (lastPoint && i > 0 && intersects(myPoint.x, myPoint.y,
            this.points[i - 1].x, this.points[i - 1].y, point.x, point.y,
            lastPoint.x, lastPoint.y))
        return true;
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
}
