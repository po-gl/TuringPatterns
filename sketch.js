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
 *
 * Really cool map of parameters: https://mrob.com/pub/comp/xmorphia/
 * with associated page: https://mrob.com/pub/comp/xmorphia/uskate-world.html
 * which is basically a taxonomy of different pattern behaviors
 *
 * The interesting reactions are actually in a pretty narrow band of parameters
 */

const debug = false;

const dA = 1.0;
const dB = 0.5;
const rates = [
  {
    name: "Classic",
    feed: 0.055,
    kill: 0.062,
  },
  {
    name: "Mitosis",
    feed: 0.0367,
    kill: 0.0649,
  },
  {
    name: "Blobby",
    feed: 0.094,
    kill: 0.057,
  },
  {
    name: "Shapeish",
    feed: 0.07,
    kill: 0.061,
  },
];
let selectedRates;
let lerpRatio;

let mouseRadius = 16;
let mouseMoved = false;
let mouseMovedDebounce;

let simUpdateHandle;

let grid;
let next;
let paletteLUT;
let font;

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  cnv.mouseWheel(changeMouseRadius);
  textFont(font);
  textSize(12);
  paletteLUT = generatePalette(255);

  selectedRates = {
    a: rates.find((r) => r.name === "Classic"),
    b: rates.find((r) => r.name === "Blobby"),
  };
  lerpRatio = 0.55;
  initSim();
}

function windowResized() {
  noLoop();
  stopSim();
  resizeCanvas(windowWidth, windowHeight);
  resizeGrids();
  loop();
  startSim();
}

function preload() {
  font = loadFont("assets/Gallient.otf");
}

function initSim() {
  grid = newGrid();
  next = newGrid();
  seedChemical();
  startSim();
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
  const threshold = 0.55;
  const scale = 0.04;
  const size = height / 2;
  const hSize = floor(size / 2);
  const center = { x: floor(width / 2), y: floor(height / 2) };
  for (let x = center.x - hSize; x < center.x + hSize; x++) {
    for (let y = center.y - hSize; y < center.y + hSize; y++) {
      if (noise(x * scale, y * scale) > threshold) {
        grid[x][y].b = 1;
        grid[x][y].a = 0;
      }
    }
  }
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

function draw() {
  if (!isLooping()) return;
  background(50);
  loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let p = (x + y * width) * 4;
      let c = lookupLUT(paletteLUT, next[x][y].b + (y / height) * 0.12);
      pixels[p + 0] = c.r;
      pixels[p + 1] = c.g;
      pixels[p + 2] = c.b;
      pixels[p + 3] = 255;
    }
  }
  updatePixels();
  mouseUpdate();
  if (debug) {
    stroke("black");
    fill("black");
    strokeWeight(0.8);
    text(`FPS: ${(1000 / deltaTime).toFixed(2)}`, width - 60, height - 10);
  }
  swapGrids();
}

function simUpdate() {
  if (!isLooping()) return;
  if (mouseIsPressed) {
    addChemical(mouseX, mouseY, mouseRadius * 0.6);
  }
  for (let x = 1; x < width - 1; x++) {
    for (let y = 1; y < height - 1; y++) {
      let a = grid[x][y].a;
      let b = grid[x][y].b;
      // modified rates
      let f = lerp(
        selectedRates.a.feed,
        selectedRates.b.feed,
        (y / height) * lerpRatio
      );
      let k = lerp(
        selectedRates.a.kill,
        selectedRates.b.kill,
        (y / height) * lerpRatio
      );
      next[x][y].a = a + (dA * laplaceA(x, y) - a * b * b + f * (1 - a));
      next[x][y].b = b + (dB * laplaceB(x, y) + a * b * b - (k + f) * b);
    }
  }
}
