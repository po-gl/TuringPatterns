function generatePalette(
  size,
  a = [0.458, 0.288, 0.288], // offset
  b = [0.328, 0.208, 0.268], // amplitude
  c = [1.8, 1.8, 1.8], // frequency
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
  return lut[Math.floor((lut.length - 1) * t + frameCount * 0.2) % lut.length];
}
