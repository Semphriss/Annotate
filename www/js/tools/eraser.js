function EraserTool(size, relativeToScreen) {
  this.currentStroke = null;
  this.touchedElements = [];
  this.oldX = 0;
  this.oldY = 0;
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

    this.currentStroke = new StrokeElement(point.x, point.y, '#fff', size,
                                           true);
    this.currentStroke.page = page;
    page.elements.push(this.currentStroke);

    for (var element of page.elements) {
      // FIXME: Doesn't consider this.currentStroke.relative
      const size = this.size * page.canvas.width / 1920;
      if (element != this.currentStroke
            && !this.touchedElements.includes(element)
            && element.touches(page, point, null, size)) {
        element.erased = true;
        this.touchedElements.push(element);
      }
    }

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

    const oldPoint = {
      x: this.oldX / page.canvas.width * window.devicePixelRatio / zoom,
      y: this.oldY / page.canvas.height * window.devicePixelRatio / zoom
    };

    this.oldX = x - page.canvas.offsetLeft;
    this.oldY = y - page.canvas.offsetTop;

    const point = {
      x: this.oldX / page.canvas.width * window.devicePixelRatio / zoom,
      y: this.oldY / page.canvas.height * window.devicePixelRatio / zoom
    };

    page.elements[page.elements.length - 1].points.push(point);

    for (var element of page.elements) {
      // FIXME: Doesn't consider this.currentStroke.relative
      const size = this.size * page.canvas.width / 1920;
      if (element != this.currentStroke
            && !this.touchedElements.includes(element)
            && element.touches(page, point, oldPoint, size)) {
        element.erased = true;
        this.touchedElements.push(element);
      }
    }

    page.redraw();
  };

  this.onup = (e, page) => {
    if (this.currentStroke) {
      e.preventDefault();
      for (var i = 0; i < this.currentStroke.page.elements.length; i++) {
        const element = this.currentStroke.page.elements[i];
        if (element == this.currentStroke) {
          this.currentStroke.page.elements.splice(i, 1);
          i--;
        } else if (this.touchedElements.includes(element)) {
          this.currentStroke.page.elements.splice(i, 1);
          i--;
        }
      }

      this.currentStroke.page.redraw();
      this.currentStroke = null;
    }
  };

  this.cancel = () => {
    if (this.currentStroke) {
      for (var i = 0; i < this.currentStroke.page.elements.length; i++) {
        if (this.currentStroke.page.elements[i] == this.currentStroke) {
          this.currentStroke.page.elements.splice(i);
          break;
        }
      }
    }

    for (var element of this.touchedElements) {
      element.erased = false;
    }
    this.touchedElements = []

    if (this.currentStroke) {
      this.currentStroke.page.redraw();
      this.currentStroke = null;
    }
  }
}
