const { Command } = require("../../structures");
const Tree = require("../../schemas/tree");
const {
  getXpNeeded,
  checkWaterCooldown,
  getWaterCooldown,
} = require("../../utils/TreeUtil");

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
                "🌱 You haven’t planted a tree yet. Use `/starttree`."
              ),
          ],
        });
      }

      const level = treeUser.tree.level;
      const canWater = checkWaterCooldown(treeUser.tree.lastWatered, level);

      if (!canWater) {
        const cooldown = getWaterCooldown(level);
        const next = new Date(treeUser.tree.lastWatered).getTime() + cooldown;
        const remaining = Math.ceil((next - Date.now()) / 1000);
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

      // XP logic
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

      // Update tree stage
      const newStage =
        currentLevel >= 10
          ? "Great Tree"
          : currentLevel >= 7
          ? "Tree"
          : currentLevel >= 4
          ? "Sapling"
          : currentLevel >= 1
          ? "Sprout"
          : "Seed";

      await Tree.findOneAndUpdate(
        { userId: ctx.author.id },
        {
          $set: {
            "tree.xp": xp,
            "tree.level": currentLevel,
            "tree.stage": newStage,
            "tree.lastWatered": new Date(),
          },
        },
        { new: true }
      );

      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.success)
            .setDescription(
              `💧 You watered your tree and gained **${gainedXP} XP**!\nIt's now level **${currentLevel}** (${xp}/${getXpNeeded(
                currentLevel
              )} XP).`
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
