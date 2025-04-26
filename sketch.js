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

let dA = 1.0
let dB = 0.5;
let feed = 0.055;
let kill = 0.062;
// let feed = 0.0367;
// let kill = 0.0649;

function setup() {
  createCanvas(400, 400);
  pixelDensity(1);
  grid = newGrid();
  next = newGrid();

  // seed chemical
  for (let i = width / 2 - 20; i < width / 2 + 20; i++) {
    for (let j = height / 2 - 20; j < height / 2 + 20; j++) {
      grid[i][j].b = 1
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
  return g
}

function swapGrids() {
  var temp = grid;
  grid = next;
  next = temp;
}

// Use kernels for this?
function laplaceA(x, y) {
  var res = 0;
  var adj = 0.2
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
  return res
}

function laplaceB(x, y) {
  var res = 0;
  var adj = 0.2
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
  return res
}

function draw() {
  background(50);
  loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let p = (x + y * width) * 4;
      pixels[p + 0] = floor(next[x][y].a * 255);
      pixels[p + 1] = 0;
      pixels[p + 2] = floor(next[x][y].b * 255);
      pixels[p + 3] = 255;
    }
  }
  updatePixels();
  swapGrids();
}

function update() {
  var t = 1.0;
  for (let x = 1; x < width - 1; x++) {
    for (let y = 1; y < height - 1; y++) {
      let a = grid[x][y].a;
      let b = grid[x][y].b;
      next[x][y].a = a + (dA * laplaceA(x, y) - a * b * b + feed * (1 - a)) * t;
      next[x][y].b = b + (dB * laplaceB(x, y) + a * b * b - (kill + feed) * b) * t;
    }
  }
}

setInterval(update, 0)