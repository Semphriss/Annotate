function addPage(pos, pdfPage, size) {
  if (pos == null || pos == undefined) pos = docPages.length;
  if (pos > docPages.length) pos = docPages.length;
  if (pos < 0) pos = 0;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const newDocPage = {
    canvas: canvas,
    ctx: ctx,
    pdfPage: pdfPage || 0,
    elements: [],
    size: {
      w: size && size.w ||
          (pdfPage ? pdfCanvases[pdfPage - 1].width : 1080),
      h: size && size.h ||
          (pdfPage ? pdfCanvases[pdfPage - 1].height : 1920)
    },
    resize() {
      const targetWidth = window.innerWidth - 30;
      const factor = targetWidth / this.size.w;
      this.canvas.width = this.size.w * factor * window.devicePixelRatio;
      this.canvas.height = this.size.h * factor * window.devicePixelRatio;
    },
    redraw() {
      if (this.pdfPage > 0) {
        this.ctx.drawImage(pdfCanvases[pdfPage - 1], 0, 0,
                           this.canvas.width, this.canvas.height);
      } else {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      for (const element of this.elements) {
        element.draw(this);
      }
    },
    serialize() {
      var s = this.pdfPage + ":" + this.size.w + ":" + this.size.h + ":";
      for (const element of this.elements.filter(e => !!e)) {
        s += element.serialize() + ";";
      }
      return s;
    }
  }

  canvas.addEventListener('mousedown', (e) => {
    if (currentTool)
      currentTool.ondown(e, newDocPage);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (currentTool)
      currentTool.onmove(e, newDocPage);
  });

  canvas.addEventListener('mouseup', (e) => {
    if (currentTool)
      currentTool.onup(e, newDocPage);
  });

  var lastAveragePt = null;
  var lastMaxDist = null;
  canvas.addEventListener('touchstart', (e) => {
    // TODO: Calculate average touch point and set it

    if (currentTool)
      currentTool.ondown(e, newDocPage);
  });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length >= 2 || !currentTool) {
      e.preventDefault();

      if (currentTool && typeof currentTool.cancel === 'function')
        currentTool.cancel();

      const averagePt = { x: 0, y: 0 };
      for (const touch of e.touches) {
        averagePt.x += touch.clientX;
        averagePt.y += touch.clientY;
      }
      averagePt.x /= e.touches.length;
      averagePt.y /= e.touches.length;

      var maxDist = 0;
      for (const touch of e.touches) {
        for (const touch2 of e.touches) {
          const dist = Math.sqrt(Math.pow(touch.clientX - touch2.clientX,
                        2) + Math.pow(touch.clientY - touch2.clientY, 2));
          if (maxDist < dist)
            maxDist = dist;
        }
      }

      if (lastAveragePt) {
        window.scrollBy(lastAveragePt.x - averagePt.x,
                        lastAveragePt.y - averagePt.y);
      }

      if (lastMaxDist) {
        zoom *= maxDist / lastMaxDist;
        zoom = Math.max(1, Math.min(10, zoom));
        const pages = document.getElementById("pages");
        pages.style.width = (zoom * 100) + "%";
      }

      lastAveragePt = averagePt;
      lastMaxDist = maxDist;
      return;
    }

    lastAveragePt = null;
    lastMaxDist = null;

    if (currentTool)
      currentTool.onmove(e, newDocPage);
  });

  canvas.addEventListener('touchend', (e) => {
    lastAveragePt = null;
    lastMaxDist = null;

    if (currentTool)
      currentTool.onup(e, newDocPage);

    saveFile();
  });

  newDocPage.resize();
  newDocPage.redraw();

  docPages.splice(pos, 0, newDocPage);

  if (pos >= docPages.length - 1)
    pagesContainer.append(canvas);
  else
    pagesContainer.insertBefore(canvas, docPages[pos].canvas);

  return newDocPage;
}

var currentWidth = 0;
window.addEventListener('resize', function(event) {
  for (const page of docPages) {
    page.resize();
    page.redraw();
  }

  if (!currentPdf)
    return;

  if (currentWidth == window.innerWidth)
    return;

  const startWidth = window.innerWidth;
  setTimeout(() => {
    // If we're back where we started, or if the window is still changing
    // size (the user is still resizing the window), don't redraw
    if (currentWidth == window.innerWidth
        || window.innerWidth != startWidth)
      return;

    currentWidth = window.innerWidth;

    loadPdf(true);
  }, 250)
}, true);
