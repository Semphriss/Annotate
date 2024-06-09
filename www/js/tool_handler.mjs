//  Annotate - View and annotate your PDF files
//  Copyright 2022-2024 Semphris <semphris@semphris.com>
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

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
  /* timestamp */ static timeBegin = null;

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

      if (fn === 'begin' && e.touches.length === 1) {
        ToolHandler.timeBegin = +new Date();
      }

      if (fn !== 'end' && fn !== 'cancel' && e.touches.length !== 1) {
        // if ToolHandler.timeBegin is still null, this evaluates to false
        if (ToolHandler.timeBegin && +new Date() - ToolHandler.timeBegin < 1000) {
          ToolHandler.timeBegin = null;

          if (ToolHandler.currentTool.cancel(page)) {
            page.draw();
          }

          return;
        } else {
          // e.touches[>0] won't be used anyways
          //e.touches.length = 1;
        }
      }

      if (e.touches.length === 0) {
        ToolHandler.timeBegin = null;
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
