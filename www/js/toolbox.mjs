import { ToolHandler } from './tool_handler.mjs';
import { HighlighterTool } from './tools/highlighter.mjs';
import { PencilTool } from './tools/pencil.mjs';
import { EraserTool } from './tools/eraser.mjs';

const toolPencil = document.getElementById('tool-pencil');
const toolHighlighter = document.getElementById('tool-highlighter');
const toolEraser = document.getElementById('tool-eraser');
const toolNone = document.getElementById('tool-hand');
const configPanel = document.getElementById('toolbar-extended');
const toolbox = document.getElementById('toolbox');

/**
 * Sets the currently selected tool.
 *
 * TODO: Remember the tool settings. (Don't create a new one each time)
 */
export function setTool(button, tool) {
  ToolHandler.setTool(tool);

  configPanel.innerHTML = '';

  if (ToolHandler.currentTool) {
    ToolHandler.currentTool.createConfigPanel(configPanel);
  }

  const btns = [
    toolPencil, toolHighlighter, toolEraser, toolNone
  ];

  for (const btn of btns) {
    if (btn !== button) {
      btn.classList.remove("selected");
    }
  }

  button.classList.add("selected");
}

toolPencil.addEventListener('click', e => {
  setTool(toolPencil, new PencilTool());
});

toolHighlighter.addEventListener('click', e => {
  setTool(toolHighlighter, new HighlighterTool());
});

toolEraser.addEventListener('click', e => {
  setTool(toolEraser, new EraserTool());
});

toolNone.addEventListener('click', e => {
  setTool(toolNone, null);
});

// ===========================
//   Toolbox opening/closing
// ---------------------------

var toolboxExpanded = false;
var toolboxMoving = false;
var toolboxOrigin = NaN;
var toolboxLastY = NaN;
var toolboxLastMovement = NaN;

// Toolbox height when open
const tbH = 200;

// TODO refactor to avoid code duplication
toolbox.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1)
    return;

  // No e.preventDefault(), to allow tapping on tools

  toolboxOrigin = e.touches[0].pageY;
  toolboxLastY = toolboxExpanded ? -tbH : 0;
});

toolbox.addEventListener('touchmove', (e) => {
  if (e.touches.length !== 1 || isNaN(toolboxOrigin))
    return;

  e.preventDefault();

  const start = toolboxExpanded ? -tbH : 0;
  var offset = e.touches[0].pageY - toolboxOrigin;
  if (Math.abs(offset) > 10 || toolboxMoving) {
    toolboxMoving = true;
    if (offset + start < -tbH) {
      offset = -Math.sqrt(-offset - tbH - start) - tbH - start;
    } else if (offset + start > 0) {
      offset = -start;
    }
    toolbox.style.transform = 'translateY(' + (offset + start) + 'px)';
  } else {
    toolbox.style.transform = 'translateY(' + start + 'px)';
  }

  var newY = offset + start;
  var newMov = newY - toolboxLastY;
  toolboxLastY = newY;
  toolboxLastMovement = newMov;
});

toolbox.addEventListener('touchend', (e) => {
  if (isNaN(toolboxOrigin))
    return;

  // Don't prevent tapping on tools
  if (toolboxMoving)
    e.preventDefault();

  if (Math.abs(toolboxLastMovement) > 10) {
    toolboxExpanded = toolboxLastMovement < 0;
  } else {
    toolboxExpanded = toolboxLastY < -tbH / 2;
  }
  toolboxOrigin = NaN;
  toolboxLastY = NaN;
  toolboxLastMovement = NaN;
  toolboxMoving = false;

  toolbox.style.transform = toolboxExpanded ? 'translateY(-' + tbH + 'px)'
                                            : '';
});

toolbox.addEventListener('mousedown', (e) => {
  toolboxOrigin = e.pageY;
  toolboxLastY = toolboxExpanded ? -tbH : 0;
});

// 'document' to detect mousemove outside the toolbox
document.addEventListener('mousemove', (e) => {
  if (isNaN(toolboxOrigin))
    return;

  e.preventDefault();

  const start = toolboxExpanded ? -tbH : 0;
  var offset = e.pageY - toolboxOrigin;
  if (Math.abs(offset) > 10 || toolboxMoving) {
    toolboxMoving = true;
    if (offset + start < -tbH) {
      offset = -Math.sqrt(-offset - tbH - start) - tbH - start;
    } else if (offset + start > 0) {
      offset = -start;
    }
    toolbox.style.transform = 'translateY(' + (offset + start) + 'px)';
  } else {
    toolbox.style.transform = 'translateY(' + start + 'px)';
  }

  var newY = offset + start;
  var newMov = newY - toolboxLastY;
  toolboxLastY = newY;
  toolboxLastMovement = newMov;
});

// 'document' to detect mouseup outside the toolbox
document.addEventListener('mouseup', (e) => {
  if (isNaN(toolboxOrigin))
    return;

  // Don't prevent tapping on tools
  if (toolboxMoving)
    e.preventDefault();

  if (Math.abs(toolboxLastMovement) > 10) {
    toolboxExpanded = toolboxLastMovement < 0;
  } else {
    toolboxExpanded = toolboxLastY < -tbH / 2;
  }
  toolboxOrigin = NaN;
  toolboxLastY = NaN;
  toolboxLastMovement = NaN;
  toolboxMoving = false;

  toolbox.style.transform = toolboxExpanded ? 'translateY(-' + tbH + 'px)'
                                            : '';
});
