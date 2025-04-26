/**
 * Basically, I'll be implementing the Reaction-Diffusion simulation
 * using the Gray-Scott model like in this video:
 * https://www.youtube.com/watch?v=BV9ny785UNc
 *
 * Which is using this excellent tutorial by Karl Sims:
 * https://karlsims.com/rd.html
 *
 * - simulating a chemaical reaction
 * - applying a convolution (kernel loop practice)
 * - 2D Laplacian functions
 * - in javascript lol ~ later I'll do a shader
 */

let grid;
let next;

let dA = 1.0;
let dB = 0.5;
let ratesA = { feed: 0.055, kill: 0.062 };
let ratesB = { feed: 0.0367, kill: 0.0649 };

let paletteLUT;

let mouseRadius = 16;
let mouseMoved = false;
let mouseMovedDebounce;

function setup() {
  let cnv = createCanvas(500, 500);
  pixelDensity(1);
  cnv.mouseWheel(changeMouseRadius);
  paletteLUT = generatePalette(255);

  grid = newGrid();
  next = newGrid();
  seedChemical();
}

function addChemical(x, y, size) {
  let hSize = floor(size / 2);
  for (let i = x - hSize; i < x + hSize; i++) {
    for (let j = y - hSize; j < y + hSize; j++) {
      grid[i][j].b = 1;
      grid[i][j].a = 0;
    }
  }
}

function seedChemical() {
  let threshold = 0.55;
  let scale = 0.04;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (noise(x * scale, y * scale) > threshold) {
        grid[x][y].b = 1;
        grid[x][y].a = 0;
      }
    }
  }
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

// Use kernels for this?
function laplaceA(x, y) {
  var res = 0;
  var adj = 0.2;
  var diag = 0.05;
  // convolution
  res += grid[x][y].a * -1;
  res += grid[x - 1][y].a * adj;
  res += grid[x + 1][y].a * adj;
  res += grid[x][y + 1].a * adj;
  res += grid[x][y - 1].a * adj;
  res += grid[x - 1][y - 1].a * diag;
  res += grid[x + 1][y - 1].a * diag;
  res += grid[x + 1][y + 1].a * diag;
  res += grid[x - 1][y + 1].a * diag;
  return res;
}

function laplaceB(x, y) {
  var res = 0;
  var adj = 0.2;
  var diag = 0.05;
  res += grid[x][y].b * -1;
  res += grid[x - 1][y].b * adj;
  res += grid[x + 1][y].b * adj;
  res += grid[x][y + 1].b * adj;
  res += grid[x][y - 1].b * adj;
  res += grid[x - 1][y - 1].b * diag;
  res += grid[x + 1][y - 1].b * diag;
  res += grid[x + 1][y + 1].b * diag;
  res += grid[x - 1][y + 1].b * diag;
  return res;
}

function mouseUpdate() {
  if (movedX === 0 && movedY === 0 && !mouseMoved) return;
  noFill();
  noStroke();
  stroke(0, 0, 0, 160);
  strokeWeight(2);
  circle(mouseX, mouseY, mouseRadius);

  if (movedX !== 0 || movedY !== 0) {
    triggerMouseMoved();
  }
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

function draw() {
  background(50);
  loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let p = (x + y * width) * 4;
      let c = lookupLUT(paletteLUT, next[x][y].b);
      pixels[p + 0] = c.r;
      pixels[p + 1] = c.g;
      pixels[p + 2] = c.b;
      pixels[p + 3] = 255;
    }
  }
  updatePixels();
  mouseUpdate();
  swapGrids();
}

function simUpdate() {
  if (mouseIsPressed) {
    addChemical(mouseX, mouseY, mouseRadius * 0.6);
  }
  for (let x = 1; x < width - 1; x++) {
    for (let y = 1; y < height - 1; y++) {
      let a = grid[x][y].a;
      let b = grid[x][y].b;
      // modified rates
      let f = lerp(ratesA.feed, ratesB.feed, y / height);
      let k = lerp(ratesA.kill, ratesB.kill, y / height);
      next[x][y].a = a + (dA * laplaceA(x, y) - a * b * b + f * (1 - a));
      next[x][y].b = b + (dB * laplaceB(x, y) + a * b * b - (k + f) * b);
    }
  }
}

setInterval(simUpdate, 0);
