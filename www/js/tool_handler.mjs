function offset(e) {
  if (!e) {
    return [];
  }

  const pt = [
    (e.pageX - e.target.offsetLeft) / e.target.offsetWidth,
    (e.pageY - e.target.offsetTop) / e.target.offsetHeight,
  ];

  return pt;
}

/**
 * Manages bindings to tools
 */
export class ToolHandler {
  /* Tool */ static currentTool = null;

  static setTool(tool) {
    ToolHandler.currentTool = tool;
  }

  // FIXME: If mouse goes outside the canvas, the events are not sent
  static handleMouse(page, event, fn) {
    page.getCanvas().addEventListener(event, e => {
      if (!ToolHandler.currentTool) {
        return;
      }

      e.preventDefault();
      if (ToolHandler.currentTool[fn](page, ...offset(e)));
        page.draw();
    });
  }

  static handleTouch(page, event, fn) {
    page.getCanvas().addEventListener(event, e => {
      if (!ToolHandler.currentTool) {
        return;
      }

      if (fn !== 'end' && fn !== 'cancel' && e.touches.length != 1) {
        if (ToolHandler.currentTool.cancel(page))
          page.draw();
        return;
      }

      e.preventDefault();
      if (ToolHandler.currentTool[fn](page, ...offset(e.touches[0])));
        page.draw();
    });
  }

  static bindPage(page) {
    ToolHandler.handleMouse(page, 'mousedown', 'begin');
    ToolHandler.handleMouse(page, 'mousemove', 'move');
    ToolHandler.handleMouse(page, 'mouseup', 'end');
    // ToolHandler.handleMouse(page, 'mouseleave', 'cancel');

    ToolHandler.handleTouch(page, 'touchstart', 'begin');
    ToolHandler.handleTouch(page, 'touchmove', 'move');
    ToolHandler.handleTouch(page, 'touchend', 'end');
    ToolHandler.handleTouch(page, 'touchcancel', 'cancel');
  }
}
