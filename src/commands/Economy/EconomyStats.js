const { Command } = require("../../structures");
const Users = require("../../schemas/user");

module.exports = class EconomyStats extends Command {
  constructor(client) {
    super(client, {
      name: "economystats",
      description: {
        content: "View server economy statistics",
        examples: ["economystats"],
        usage: "economystats",
      },
      category: "economy",
      aliases: ["ecostats", "economy"],
      cooldown: 10,
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
    try {
      const generalMessages = language.locales.get(
        language.defaultLocale
      )?.generalMessages;

      // Get economy stats
      const economyStats = client.economyManager.getEconomyStats();

      // Get top 5 richest users
      const richestUsers = await Users.find({})
        .sort({ "balance.coin": -1, "balance.bank": -1 })
        .limit(5);

      // Format richest users list
      let richestList = "";
      for (let i = 0; i < richestUsers.length; i++) {
        const user = richestUsers[i];
        const netWorth = user.balance.coin + user.balance.bank;
        const userObj = await client.users.fetch(user.userId).catch(() => null);
        const username = userObj ? userObj.displayName : `User ${user.userId}`;

        richestList += `**${i + 1}.** ${username}: ${client.utils.formatNumber(
          netWorth
        )} coins\n`;
      }

      if (!richestList) {
        richestList = "No users found.";
      }

      // Create the embed
      const embed = client
        .embed()
        .setColor(color.main)
        .setTitle("Economy Statistics")
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", "ECONOMY STATS")
            .replace("%{mainRight}", emoji.mainRight)
        )
        .addFields([
          {
            name: "💰 Total Coins in Circulation",
            value: client.utils.formatNumber(economyStats.totalCoins) || "0",
            inline: true,
          },
          {
            name: "🔄 Total Transactions",
            value:
              client.utils.formatNumber(economyStats.totalTransactions) || "0",
            inline: true,
          },
          {
            name: "💸 Largest Transaction",
            value:
              client.utils.formatNumber(economyStats.largestTransaction) || "0",
            inline: true,
          },
          {
            name: "🏆 Richest Users",
            value: richestList,
          },
        ])
        .setFooter({
          text: `Last Updated: ${economyStats.lastUpdated.toLocaleString()}`,
          iconURL: client.user.displayAvatarURL(),
        });

      return ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Error in economy stats command:", error);
      return ctx.sendMessage({
        content: "An error occurred while processing your request.",
      });
    }
  }
};
