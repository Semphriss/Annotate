function PenTool(color, size, relativeToScreen) {
  this.currentStroke = null;
  this.oldX = 0;
  this.oldY = 0;
  this.color = color || 'black';
  this.size = size || 1;
  this.sizeRelativeToScreen = relativeToScreen;

  this.ondown = (e, page) => {
    if (this.currentStroke)
      return;

    var x = e.layerX, y = e.layerY;
    if (e.touches) {
      if (e.touches.length != 1)
        return;

      x = e.touches[0].pageX;
      y = e.touches[0].pageY;
    }

    e.preventDefault();

    this.oldX = x - page.canvas.offsetLeft;
    this.oldY = y - page.canvas.offsetTop;

    const point = {
      x: this.oldX / page.canvas.width * window.devicePixelRatio / zoom,
      y: this.oldY / page.canvas.height * window.devicePixelRatio / zoom
    };

    var size = this.size;
    if (this.sizeRelativeToScreen) {
      size /= page.canvas.width;
    } else {
      size /= 1920;
    }

    this.currentStroke = new StrokeElement(point.x, point.y, this.color,
                                           size, true);
    this.currentStroke.page = page;
    page.elements.push(this.currentStroke);
    page.redraw();
  };

  this.onmove = (e, page) => {
    if (!this.currentStroke)
      return;

    var x = e.layerX, y = e.layerY;
    if (e.touches) {
      if (e.touches.length != 1)
        return;

      x = e.touches[0].pageX;
      y = e.touches[0].pageY;
    }

    e.preventDefault();

    this.oldX = x - page.canvas.offsetLeft;
    this.oldY = y - page.canvas.offsetTop;

    page.elements[page.elements.length - 1].points.push({
      x: this.oldX / page.canvas.width * window.devicePixelRatio / zoom,
      y: this.oldY / page.canvas.height * window.devicePixelRatio / zoom
    });

    page.redraw();
  };

  this.onup = (e, page) => {
    e.preventDefault();
    this.currentStroke = null;
  };

  this.cancel = () => {
    if (this.currentStroke) {
      for (var i = 0; i < this.currentStroke.page.elements.length; i++) {
        if (this.currentStroke.page.elements[i] == this.currentStroke) {
          this.currentStroke.page.elements.splice(i);
          this.currentStroke.page.redraw();
          this.currentStroke = null;
          return;
        }
      }
    }
  }
}
