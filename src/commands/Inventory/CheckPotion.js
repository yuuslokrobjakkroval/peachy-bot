const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class CheckPotion extends Command {
  constructor(client) {
    super(client, {
      name: "potion",
      description: {
        content: "Check the remaining duration of your active potion effect.",
        examples: ["potion"],
        usage: "potion",
      },
      cooldown: 5,
      category: "inventory",
      aliases: ["ps", "pc"],
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const useMessages = language.locales.get(language.defaultLocale)
      ?.inventoryMessages?.useMessages;
    const userId = ctx.author.id;

    try {
      const user = await client.utils.getUser(userId);
      if (!client.luckBuffs) {
        console.log("luckBuffs Map not initialized.");
        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            "No potion effects are being tracked. Please try using a potion again. 🍀"
          );
        return await ctx.sendMessage({ embeds: [embed] });
      }

      const luckBuff = client.luckBuffs.get(userId);
      if (!luckBuff) {
        console.log(`No active potion effect found for user ${userId}.`);
        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            "You don't have any active potion effects at the moment. 🍀"
          );
        return await ctx.sendMessage({ embeds: [embed] });
      }

      if (luckBuff.expires <= Date.now()) {
        console.log(`Potion effect for user ${userId} has expired.`);
        client.luckBuffs.delete(userId); // Clean up expired effect
        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription("Your potion effect has expired. 🍀");
        return await ctx.sendMessage({ embeds: [embed] });
      }

      const now = Date.now();
      const remainingTime = luckBuff.expires - now;
      const minutes = Math.floor(remainingTime / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
      const timeLeft = Math.ceil((seconds - now) / 1000);
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          `You have an active **${luckBuff.potionName}** ${luckBuff.potionEmoji} effect! 🍀\n` +
            `Luck Boost: ${(luckBuff.boost * 100).toFixed(0)}%\n` +
            `Expires in: **${minutes} minute(s) and <t:${
              Math.round(Date.now() / 1000) + timeLeft
            }:R> second(s)**.`
        );

      return await ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Error in the 'checkpotion' command:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while processing your request.",
        color
      );
    }
  }
};
