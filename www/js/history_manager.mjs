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

import { saveCurrentDoc } from './main.mjs';

const undoButton = document.getElementById('tool-undo');
const redoButton = document.getElementById('tool-redo');

const undoHistory = [];
const redoHistory = [];

export function historyAction(undo, redo, pages) {
  undoHistory.push({ undo, redo, pages });
  redoHistory.length = 0;

  historyRefreshButtons();
}

export function historyUndo() {
  if (undoHistory.length < 1)
    return;

  const action = undoHistory.pop();
  action.undo();
  redoHistory.push(action);

  saveCurrentDoc();
  for (const page of action.pages) {
    page.draw();
  }

  historyRefreshButtons();
}

export function historyRedo() {
  if (redoHistory.length < 1)
    return;

  const action = redoHistory.pop();
  action.redo();
  undoHistory.push(action);

  saveCurrentDoc();
  for (const page of action.pages) {
    page.draw();
  }

  historyRefreshButtons();
}

export function historyClear() {
  undoHistory.length = 0;
  redoHistory.length = 0;
  historyRefreshButtons();
}

export function historyCanUndo() {
  return undoHistory.length !== 0;
}

export function historyCanRedo() {
  return redoHistory.length !== 0;
}

export function historyRefreshButtons() {
  undoButton.style.fill = historyCanUndo() ? '' : '#777';
  redoButton.style.fill = historyCanRedo() ? '' : '#777';
}

undoButton.addEventListener('click', historyUndo);
redoButton.addEventListener('click', historyRedo);

