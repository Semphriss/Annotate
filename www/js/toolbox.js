const toolbox = document.getElementById('toolbox');

// Toolbox height when open
const tbH = 200;

function switchSelectedTool(tool) {
  const selecteds = document.getElementsByClassName("selected");
  while (selecteds.length) {
    selecteds[0].classList.remove("selected");
  }
  document.getElementById(tool).classList.add("selected");
}

document.getElementById("tool-menu").addEventListener('click', (e) => {
  showMenu();
});

document.getElementById("tool-share").addEventListener('click', (e) => {
  alert("Sharing is currently unsupported!");
});

document.getElementById("tool-pencil").addEventListener('click', (e) => {
  switchSelectedTool("tool-pencil");
  currentTool = new PenTool('#000', 3, false);
});

document.getElementById("tool-highlighter").addEventListener('click',
                                                             (e) => {
  switchSelectedTool("tool-highlighter");
  currentTool = new PenTool('#ff07', 30, false);
});

document.getElementById("tool-eraser").addEventListener('click', (e) => {
  switchSelectedTool("tool-eraser");
  currentTool = new EraserTool(20, false);
});

document.getElementById("tool-hand").addEventListener('click', (e) => {
  switchSelectedTool("tool-hand");
  currentTool = null;
});

var toolboxExpanded = false;
var toolboxMoving = false;
var toolboxOrigin = NaN;
var toolboxLastY = NaN;
var toolboxLastMovement = NaN;
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
