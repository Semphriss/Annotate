function StrokeElement(startX, startY, color, lineWidth, relative) {
  this.color = color;
  this.lineWidth = lineWidth;
  this.relative = relative;
  this.points = [{
    x: startX,
    y: startY
  }];
  this.erased = false;
  this.draw = (page) => {
    page.ctx.save()

    if (this.erased) {
      page.ctx.globalAlpha = 0.5;
    }

    page.ctx.strokeStyle = this.color;
    page.ctx.lineWidth = this.lineWidth *
                         (this.relative ? page.canvas.width : 1);
    page.ctx.lineCap = "round";
    page.ctx.lineJoin = "round";
    page.ctx.beginPath();
    page.ctx.moveTo(this.points[0].x * page.canvas.width,
                    this.points[0].y * page.canvas.height);

    for (const point of this.points) {
      page.ctx.lineTo(point.x * page.canvas.width,
                      point.y * page.canvas.height);
    }

    page.ctx.stroke();
    page.ctx.restore();
  };
  this.touches = (page, point, lastPoint, range) => {
    for (var i = 0; i < this.points.length; i++) {
      const myPoint = this.points[i];
      const lineWidth = this.lineWidth
                          * (this.relative ? page.canvas.width : 1);
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
  };
  this.serialize = () => {
    return 'stroke,' + btoa(JSON.stringify({
      color: this.color,
      lineWidth: this.lineWidth,
      relative: this.relative,
      points: this.points,
      erased: this.erased
    }));
  }
}

function parseStrokeElement(data) {
  return Object.assign(new StrokeElement(), JSON.parse(atob(data)));
}
