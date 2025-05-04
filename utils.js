function generatePalette(
  size,
  a = [0.458, 0.288, 0.288], // offset
  b = [0.328, 0.208, 0.268], // amplitude
  c = [2.0, 2.0, 2.0], // frequency
  d = [1.468, 0.788, 0.958] // phase shift
) {
  const lut = [];
  for (let i = 0; i < size; i++) {
    const t = i / (size - 1); // normalized
    const r = Math.round(
      (a[0] + b[0] * Math.cos(2 * Math.PI * (c[0] * t + d[0]))) * 255
    );
    const g = Math.round(
      (a[1] + b[1] * Math.cos(2 * Math.PI * (c[1] * t + d[1]))) * 255
    );
    const bC = Math.round(
      (a[2] + b[2] * Math.cos(2 * Math.PI * (c[2] * t + d[2]))) * 255
    );
    lut.push({ r, g, b: bC });
  }
  return lut;
}

function lookupLUT(lut, t) {
  return lut[Math.floor((lut.length - 1) * t + frameCount * 0.18) % lut.length];
}

function stopSim() {
  clearTimeout(simUpdateHandle);
}

function startSim() {
  stopSim();
  simUpdateHandle = setInterval(simUpdate, 0);
}

function newGrid() {
  g = [];
  for (let x = 0; x < width; x++) {
    g[x] = [];
    for (let y = 0; y < height; y++) {
      g[x][y] = { a: 1, b: 0 };
    }
  }
  return g;
}

function swapGrids() {
  var temp = grid;
  grid = next;
  next = temp;
}

function resizeGrids() {
  const resizedGrid = newGrid();
  const resizedNext = newGrid();
  const minWidth = min(grid.length, width);
  const minHeight = min(grid[0].length, height);
  for (let x = 0; x < minWidth; x++) {
    for (let y = 0; y < minHeight; y++) {
      resizedGrid[x][y] = grid[x][y];
      resizedNext[x][y] = next[x][y];
    }
  }
  grid = resizedGrid;
  next = resizedNext;
}

function changeMouseRadius(event) {
  if (event.deltaY > 0) {
    mouseRadius += 1;
    mouseRadius = min(mouseRadius, 100);
  } else if (event.deltaY < 0) {
    mouseRadius -= 1;
    mouseRadius = max(mouseRadius, 8);
  }
  triggerMouseMoved();
}

function triggerMouseMoved() {
  mouseMoved = true;
  clearTimeout(mouseMovedDebounce);
  mouseMovedDebounce = setTimeout(() => {
    mouseMoved = false;
  }, 700);
}
