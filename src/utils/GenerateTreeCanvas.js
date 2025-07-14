const { createCanvas, loadImage } = require("@napi-rs/canvas");

module.exports = async function generateTreeCanvas({ height }) {
  const canvasWidth = 512;
  const canvasHeight = 768;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  // Draw background
  const background = await loadImage("https://i.imgur.com/myURtVX.png");
  ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

  // // Limit height scaling
  // const maxHeightFt = 50;
  // const clampedHeight = Math.min(height, maxHeightFt);

  // // Scale visual size
  // const baseTreeHeight = 140;
  // const scale = clampedHeight / maxHeightFt;
  // const treeHeight = baseTreeHeight + scale * 180;
  // const treeWidth = treeHeight * 0.65;

  // const trunkHeight = treeHeight * 0.35;
  // const trunkWidth = treeWidth * 0.25;
  // const foliageRadius = treeHeight * 0.45;

  // const x = canvasWidth / 2;
  // const y = canvasHeight - 60; // ground

  // // Draw subtle shadow
  // ctx.beginPath();
  // ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  // ctx.ellipse(
  //   x + 20,
  //   y,
  //   foliageRadius * 0.8,
  //   foliageRadius * 0.3,
  //   0,
  //   0,
  //   Math.PI * 2
  // );
  // ctx.fill();

  // // Draw trunk with texture
  // ctx.fillStyle = "#654321";
  // ctx.fillRect(x - trunkWidth / 2, y - trunkHeight, trunkWidth, trunkHeight);

  // // Add trunk texture lines
  // ctx.strokeStyle = "#4A3721";
  // ctx.lineWidth = 2;
  // for (let i = 0; i < 6; i++) {
  //   ctx.beginPath();
  //   ctx.moveTo(x - trunkWidth / 2 + 5, y - trunkHeight + (i * trunkHeight) / 6);
  //   ctx.lineTo(x + trunkWidth / 2 - 5, y - trunkHeight + (i * trunkHeight) / 6);
  //   ctx.stroke();
  // }

  // // Create gradient for foliage
  // const gradient = ctx.createRadialGradient(
  //   x,
  //   y - trunkHeight,
  //   foliageRadius * 0.3,
  //   x,
  //   y - trunkHeight,
  //   foliageRadius * 1.2
  // );
  // gradient.addColorStop(0, "#32CD32");
  // gradient.addColorStop(1, "#228B22");

  // // Draw layered foliage for fuller canopy
  // const layers = [
  //   { offsetY: 0, radius: foliageRadius },
  //   { offsetY: -foliageRadius * 0.5, radius: foliageRadius * 0.95 },
  //   { offsetY: -foliageRadius * 0.9, radius: foliageRadius * 0.85 },
  //   {
  //     offsetY: -foliageRadius * 0.3,
  //     radius: foliageRadius * 0.9,
  //     offsetX: -foliageRadius * 0.4,
  //   },
  //   {
  //     offsetY: -foliageRadius * 0.3,
  //     radius: foliageRadius * 0.9,
  //     offsetX: foliageRadius * 0.4,
  //   },
  // ];

  // ctx.fillStyle = gradient;
  // layers.forEach((layer) => {
  //   ctx.beginPath();
  //   ctx.arc(
  //     x + (layer.offsetX || 0),
  //     y - trunkHeight + layer.offsetY,
  //     layer.radius,
  //     0,
  //     Math.PI * 2
  //   );
  //   ctx.fill();
  // });

  // // Add highlight for depth
  // ctx.beginPath();
  // ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  // ctx.arc(
  //   x - foliageRadius * 0.3,
  //   y - trunkHeight - foliageRadius * 0.4,
  //   foliageRadius * 0.5,
  //   0,
  //   Math.PI * 2
  // );
  // ctx.fill();

  return await canvas.encode("png");
};
