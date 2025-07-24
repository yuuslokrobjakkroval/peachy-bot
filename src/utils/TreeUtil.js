const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Tree = require("../schemas/tree");
const moment = require("moment");

// Get dynamic cooldown time based on tree level
function getWaterCooldown(level = 0) {
  return (level + 1) * 5 * 60 * 1000; // (level + 1) * 5 minutes
}

// Get how much XP needed for next level
function getXpNeeded(level) {
  return 50 + level * 25;
}

// Check if cooldown for watering has passed
function checkWaterCooldown(lastWatered, level) {
  if (!lastWatered) return true;
  const now = Date.now();
  const last = new Date(lastWatered).getTime();
  const cooldown = getWaterCooldown(level);
  return now - last >= cooldown;
}

// Get remaining cooldown time in readable format
function getCooldownTime(lastWatered, level) {
  const cooldown = getWaterCooldown(level);
  const remaining = moment.duration(
    cooldown - (Date.now() - new Date(lastWatered).getTime()),
  );
  return `${remaining.minutes()}m ${remaining.seconds()}s`;
}

// Fetch user's tree
async function getUserTree(userId) {
  return await Tree.findOne({ userId });
}

// Button builder for water or cooldown
function buildWaterButton(lastWatered, level, canWater) {
  const row = new ActionRowBuilder();

  if (canWater) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("tree_water")
        .setLabel("💧 Water")
        .setStyle(ButtonStyle.Primary),
    );
  } else {
    const cooldownText = getCooldownTime(lastWatered, level);
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("cooldown_disabled")
        .setLabel(`💧 ${cooldownText}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    );
  }

  return row;
}

function getTreeSellValue(tree) {
  return tree.level * 25 + Math.floor(tree.xp / 2);
}

// Build embed (header only)
function buildTreeEmbed(client, ctx, color, language) {
  return client
    .embed()
    .setColor(color.main)
    .setTitle("🌳 Your Tree Progress")
    .setFooter({
      text:
        language.locales
          .get(language.defaultLocale)
          ?.generalMessages?.requestedBy.replace(
            "%{username}",
            ctx.author.displayName,
          ) || `Requested by ${ctx.author.displayName}`,
      iconURL: ctx.author.displayAvatarURL(),
    });
}

// Embed if user hasn't planted a tree
function sendNotStartedEmbed(client, ctx, color) {
  return ctx.sendMessage({
    embeds: [
      client
        .embed()
        .setColor(color.danger)
        .setDescription(
          "🌱 You haven't planted your tree yet. Use `/starttree`.",
        ),
    ],
  });
}

module.exports = {
  getWaterCooldown,
  getXpNeeded,
  checkWaterCooldown,
  getCooldownTime,
  getUserTree,
  buildWaterButton,
  buildTreeEmbed,
  sendNotStartedEmbed,
  getTreeSellValue,
};
