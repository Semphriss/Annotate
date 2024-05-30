const picker = document.getElementById('color-picker');
const pickerframe = document.getElementById('color-picker-frame');
const pickertab = document.getElementById('color-picker-table');
const pickerok = document.getElementById('color-picker-ok');
const pickercurrent = document.getElementById('color-picker-current');

let curCol = null;
let curRes = null;

/* To be treated like an async function */
export function pickColor(col) {
  return new Promise((res, rej) => {
    selectCol(col);
    curRes = res;
    picker.classList.remove('color-picker-hidden');
  });
}

function selectCol(col) {
  curCol = col;
  pickercurrent.style.backgroundColor = col;
}

pickerok.addEventListener('click', () => {
  if (curRes) {
    curRes(curCol);
  }
  curRes = null;
  curCol = null;
  picker.classList.add('color-picker-hidden');
});

// Tapping outside the frame cancels
picker.addEventListener('click', () => {
  if (curRes) {
    curRes(null);
  }
  curRes = null;
  curCol = null;
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
      selectCol(col);
    });
    pickertab.appendChild(td);
  }
  pickertab.appendChild(tr);
}
