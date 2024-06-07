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

const picker = document.getElementById('color-picker');
const pickerframe = document.getElementById('color-picker-frame');
const pickertab = document.getElementById('color-picker-table');

let curRes = null;

/* To be treated like an async function */
export function pickColor(col) {
  return new Promise((res, rej) => {
    curRes = res;
    picker.classList.remove('color-picker-hidden');
  });
}

// Tapping outside the frame cancels
picker.addEventListener('click', () => {
  if (curRes) {
    curRes(null);
  }
  curRes = null;
  picker.classList.add('color-picker-hidden');
});

// Prevent tapping inside the frame from closing the box
pickerframe.addEventListener('click', (e) => {
  e.stopPropagation();
});

// Generate the default colors
const colors = [
  [
    'hsl(0 0% 0%)',
    'hsl(0 0% 25%)',
    'hsl(0 0% 50%)',
    'hsl(0 0% 75%)',
    'hsl(0 0% 100%)'
  ],
  [
    'hsl(0 80% 13%)',
    'hsl(0 80% 26%)',
    'hsl(0 80% 50%)',
    'hsl(0 80% 73%)',
    'hsl(0 80% 86%)'
  ],
  /*[
    'hsl(30 80% 13%)',
    'hsl(30 80% 26%)',
    'hsl(30 80% 50%)',
    'hsl(30 80% 73%)',
    'hsl(30 80% 86%)'
  ],*/
  [
    'hsl(60 80% 13%)',
    'hsl(60 80% 26%)',
    'hsl(60 80% 50%)',
    'hsl(60 80% 73%)',
    'hsl(60 80% 86%)'
  ],
  /*[
    'hsl(90 80% 13%)',
    'hsl(90 80% 26%)',
    'hsl(90 80% 50%)',
    'hsl(90 80% 73%)',
    'hsl(90 80% 86%)'
  ],*/
  [
    'hsl(120 80% 13%)',
    'hsl(120 80% 26%)',
    'hsl(120 80% 50%)',
    'hsl(120 80% 73%)',
    'hsl(120 80% 86%)'
  ],
  /*[
    'hsl(150 80% 13%)',
    'hsl(150 80% 26%)',
    'hsl(150 80% 50%)',
    'hsl(150 80% 73%)',
    'hsl(150 80% 86%)'
  ],*/
  [
    'hsl(180 80% 13%)',
    'hsl(180 80% 26%)',
    'hsl(180 80% 50%)',
    'hsl(180 80% 73%)',
    'hsl(180 80% 86%)'
  ],
  /*[
    'hsl(210 80% 13%)',
    'hsl(210 80% 26%)',
    'hsl(210 80% 50%)',
    'hsl(210 80% 73%)',
    'hsl(210 80% 86%)'
  ],*/
  [
    'hsl(240 80% 13%)',
    'hsl(240 80% 26%)',
    'hsl(240 80% 50%)',
    'hsl(240 80% 73%)',
    'hsl(240 80% 86%)'
  ],
  /*[
    'hsl(270 80% 13%)',
    'hsl(270 80% 26%)',
    'hsl(270 80% 50%)',
    'hsl(270 80% 73%)',
    'hsl(270 80% 86%)'
  ],*/
  [
    'hsl(300 80% 13%)',
    'hsl(300 80% 26%)',
    'hsl(300 80% 50%)',
    'hsl(300 80% 73%)',
    'hsl(300 80% 86%)'
  ],
  /*[
    'hsl(330 80% 13%)',
    'hsl(330 80% 26%)',
    'hsl(330 80% 50%)',
    'hsl(330 80% 73%)',
    'hsl(330 80% 86%)'
  ],*/
];

for (const row of colors) {
  const tr = document.createElement('tr');
  for (const col of row) {
    const td = document.createElement('td');
    td.style.backgroundColor = col;
    td.addEventListener('click', () => {
      if (curRes) {
        curRes(col);
      }
      curRes = null;
      picker.classList.add('color-picker-hidden');
    });
    pickertab.appendChild(td);
  }
  pickertab.appendChild(tr);
}
