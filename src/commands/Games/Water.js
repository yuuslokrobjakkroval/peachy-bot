const { Command } = require("../../structures");
const Tree = require("../../schemas/tree");
const {
  getXpNeeded,
  checkWaterCooldown,
  getWaterCooldown,
} = require("../../utils/TreeUtil");
const { growTree } = require("../../utils/Emoji");

module.exports = class WaterTree extends Command {
  constructor(client) {
    super(client, {
      name: "water",
      description: {
        content: "Water your tree to help it grow.",
        examples: ["water"],
        usage: "water",
      },
      category: "games",
      aliases: [],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "EmbedLinks", "ViewChannel"],
        user: [],
      },
      slashCommand: true,
    });
  }

  async run(client, ctx, args, color) {
    try {
      const treeUser = await Tree.findOne({ userId: ctx.author.id });

      if (!treeUser) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                "🌱 You haven’t planted a tree yet.\nUse `pstarttree` or `/starttree`."
              ),
          ],
        });
      }

      const level = treeUser.tree.level;
      const canWater = checkWaterCooldown(treeUser.tree.lastWatered, level);

      if (!canWater) {
        const cooldown = getWaterCooldown(level);
        const next = new Date(treeUser.tree.lastWatered).getTime() + cooldown;
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.warning)
              .setDescription(
                `💧 You can water your tree again <t:${Math.floor(
                  next / 1000
                )}:R>.`
              ),
          ],
        });
      }

      // Gain XP
      let gainedXP = 10;
      if (treeUser.upgrades.fertilizer) gainedXP += 5;
      if (treeUser.upgrades.rain) gainedXP += 10;

      let { xp, level: currentLevel } = treeUser.tree;
      xp += gainedXP;

      const xpNeeded = getXpNeeded(currentLevel);
      if (xp >= xpNeeded) {
        xp -= xpNeeded;
        currentLevel += 1;
      }

      // Determine new stage
      const newStage =
        currentLevel >= 7 ? "tree" : currentLevel >= 4 ? "sprout" : "seed";

      // Coins
      const gainedCoins = 500 + Math.floor(Math.random() * 6); // 500–1000 coins
      const totalCoins = treeUser.coins + gainedCoins;

      // Save updates
      await Tree.findOneAndUpdate(
        { userId: ctx.author.id },
        {
          $set: {
            "tree.xp": xp,
            "tree.level": currentLevel,
            "tree.stage": newStage,
            "tree.lastWatered": new Date(),
            coins: totalCoins,
          },
        },
        { new: true }
      );

      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.success)
            .setTitle("💧 Tree Watered!")
            .setDescription(
              `You've gained:\n` +
                `• **+${gainedXP} XP**\n` +
                `• **+${gainedCoins} ${growTree.coin}**\n\n` +
                `🌱 Your tree is now **level ${currentLevel}** (${xp}/${getXpNeeded(
                  currentLevel
                )} XP)\n` +
                `Stage: **${client.utils.formatCapitalize(newStage)}**`
            ),
        ],
      });
    } catch (err) {
      console.error("WaterTree Error:", err);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Failed to water your tree.",
        color
      );
    }
  }
};
