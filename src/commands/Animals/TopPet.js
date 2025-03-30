const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class TopPet extends Command {
  constructor(client) {
    super(client, {
      name: "toppet",
      description: {
        content: "View the top users for feeding and selling pets.",
        examples: ["toppet"],
        usage: "toppet",
      },
      category: "animals",
      aliases: ["tp"],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const animalMessages = language.locales.get(language.defaultLocale)?.animalMessages;

    try {
      // Fetch top users for feeding
      const topFeeders = await Users.find({ feedCount: { $gt: 0 } })
        .sort({ feedCount: -1 })
        .limit(10);

      // Fetch top users for selling
      const topSellers = await Users.find({ sellPetCount: { $gt: 0 } })
        .sort({ sellPetCount: -1 })
        .limit(10);

      // Format the leaderboard for feeding
      const feedLeaderboard =
        topFeeders.length > 0
          ? topFeeders
              .map((user, index) => {
                const userObj = client.users.cache.get(user.userId);
                const username = userObj ? userObj.username : "Unknown User";
                return `**${index + 1}**. ${username}\n- ${
                  user.feedCount
                } feeds`;
              })
              .join("\n")
          : "No users have fed their pets yet.";

      // Format the leaderboard for selling
      const sellLeaderboard =
        topSellers.length > 0
          ? topSellers
              .map((user, index) => {
                const userObj = client.users.cache.get(user.userId);
                const username = userObj ? userObj.username : "Unknown User";
                return `**${index + 1}**. ${username}\n- ${
                  user.sellPetCount
                } pets sold`;
              })
              .join("\n")
          : "No users have sold their pets yet.";

      // Create an embed to display the leaderboard
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          (generalMessages?.title
            ?.replace("%{mainLeft}", emoji.mainLeft)
            ?.replace("%{title}", "PET LEADERBOARD")
            ?.replace("%{mainRight}", emoji.mainRight) ||
            "✨ **PET LEADERBOARD** ✨") +
            `\n\n**Top Feeders**\n${feedLeaderboard}\n\n**Top Sellers**\n${sellLeaderboard}`
        )
        .setFooter({
          text:
            generalMessages?.requestedBy?.replace(
              "%{username}",
              ctx.author.displayName
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      return ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Error processing TopPet command:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.userFetchError ||
          "An error occurred while fetching user data.",
        color
      );
    }
  }
};
