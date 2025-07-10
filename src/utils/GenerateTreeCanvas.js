const { createCanvas, loadImage } = require("@napi-rs/canvas");
const path = require("path");

// Mapping of tree stage to image file name
const STAGE_IMAGES = {
  seed: "seed.png",
  sprout: "sprout.png",
  tree: "tree.png",
};

module.exports = async function generateTreeCanvas({
  client,
  stage,
  level,
  xp,
  xpNeeded,
  coins,
  upgrades,
}) {
  const width = 600;
  const height = 400;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#e9f5db";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#2e4600";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("🌳 My Tree", 220, 40);

  // Load tree stage image
  const imagePath = path.join(
    __dirname,
    "../assets",
    STAGE_IMAGES[stage] || STAGE_IMAGES["Seed"]
  );
  try {
    const treeImage = await loadImage(imagePath);
    ctx.drawImage(treeImage, 230, 60, 140, 140);
  } catch (err) {
    console.warn("Tree image failed to load:", imagePath, err.message);
    ctx.fillStyle = "#555";
    ctx.font = "italic 16px sans-serif";
    ctx.fillText("[Missing Tree Image]", 240, 140);
  }

  // Stats Box
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 2;
  ctx.fillRect(50, 220, 500, 140);
  ctx.strokeRect(50, 220, 500, 140);

  ctx.fillStyle = "#333";
  ctx.font = "18px sans-serif";
  ctx.fillText(`Stage: ${client.utils.formatCapitalize(stage)}`, 70, 250);
  ctx.fillText(`Level: ${level}`, 70, 280);
  ctx.fillText(`XP: ${xp}/${xpNeeded}`, 70, 310);

  ctx.fillText(`Coins: ${coins}`, 320, 250);
  ctx.fillText(
    `Fertilizer: ${upgrades?.fertilizer ? "Used" : "Don't have"}`,
    320,
    280
  );
  ctx.fillText(`Rain: ${upgrades?.rain ? "Used" : "Don't have"}`, 320, 310);

  return canvas.toBuffer("image/png");
};
