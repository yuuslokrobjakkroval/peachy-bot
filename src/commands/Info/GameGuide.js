const Command = require("../../structures/Command.js");

module.exports = class GameGuide extends Command {
  constructor(client) {
    super(client, {
      name: "gameguide",
      description: {
        content: "Complete guide to play the Pet Adventure and Quest systems!",
        examples: ["gameguide", "gameguide pet", "gameguide quest"],
        usage: "gameguide [system]",
      },
      category: "info",
      aliases: ["guide", "howtoplay"],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "system",
          description: "Which game system to learn about (pet or quest)",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color) {
    try {
      const system = ctx.isInteraction
        ? ctx.interaction.options.getString("system")
        : args[0];
      const embedColor = color && color.info ? color.info : "#FFCFCF";

      if (system === "pet") {
        const embed = client
          .embed()
          .setColor(embedColor)
          .setTitle("🐾 Pet Adventure Game Guide")
          .setDescription(
            "**Welcome to the Pet Adventure Game!** 🎮\n" +
              "Collect, train, and send your pet on exciting quests!\n\n" +
              "**📋 Commands:**\n" +
              "`pet collect` - Get your first pet (random type)\n" +
              "`pet stats` - View your pet's information\n" +
              "`pet train <stat>` - Train strength/agility/intelligence\n" +
              "`pet quest [type]` - Send pet on adventure (forest/mountain/lake)\n" +
              "`pet evolve` - Evolve your pet at level 10\n\n" +
              "**🎯 How to Play:**\n" +
              "1️⃣ Use `pet collect` to get your first pet\n" +
              "2️⃣ Train your pet to improve stats\n" +
              "3️⃣ Send it on quests to gain EXP and items\n" +
              "4️⃣ Level up to 10 and evolve for bonus stats!\n\n" +
              "**💡 Tips:**\n" +
              "• Different quest types use different stats\n" +
              "• Higher stats = better quest success rate\n" +
              "• Evolution gives +5 to all stats\n" +
              "• Items are stored in your pet's inventory"
          );

        return ctx.isInteraction
          ? await ctx.interaction.reply({ embeds: [embed] })
          : await ctx.sendMessage({ embeds: [embed] });
      }

      if (system === "quest") {
        const embed = client
          .embed()
          .setColor(embedColor)
          .setTitle("📅 Daily & Weekly Quest Guide")
          .setDescription(
            "**Complete Daily & Weekly Challenges!** 🏆\n" +
              "Earn rewards by completing various tasks!\n\n" +
              "**📋 Commands:**\n" +
              "`quest` - View your current quests\n" +
              "`quest claim daily` - Claim daily quest reward\n" +
              "`quest claim weekly` - Claim weekly quest reward\n" +
              "`quest check` - Manually update quest progress\n\n" +
              "**🎯 How It Works:**\n" +
              "1️⃣ Get new daily quest every day\n" +
              "2️⃣ Get new weekly quest every week\n" +
              "3️⃣ Complete objectives through normal bot usage\n" +
              "4️⃣ Claim rewards when completed\n\n" +
              "**📈 Quest Types:**\n" +
              "**Daily:** Send messages, train pets, react to messages\n" +
              "**Weekly:** Win pet quests, collect items, reach levels\n\n" +
              "**💰 Rewards:**\n" +
              "• Daily: Coins, XP, small rewards\n" +
              "• Weekly: Better rewards, special items\n" +
              "• Complete quests to progress!"
          );

        return ctx.isInteraction
          ? await ctx.interaction.reply({ embeds: [embed] })
          : await ctx.sendMessage({ embeds: [embed] });
      }

      // General guide
      const embed = client
        .embed()
        .setColor(embedColor)
        .setTitle("🎮 Game Systems Guide")
        .setDescription(
          "**Welcome to PEACHY Bot Games!** 🎉\n" +
            "Multiple fun systems to explore and play!\n\n" +
            "**🐾 Pet Adventure Game**\n" +
            "Collect and train virtual pets, send them on quests!\n" +
            "`gameguide pet` - Learn more about pets\n\n" +
            "**📅 Daily & Weekly Quests**\n" +
            "Complete challenges and earn rewards!\n" +
            "`gameguide quest` - Learn about quest system\n\n" +
            "**🚀 Quick Start:**\n" +
            "1️⃣ `pet collect` - Get your first pet\n" +
            "2️⃣ `quest` - Check your daily quest\n" +
            "3️⃣ Start playing and having fun!\n\n" +
            "**💡 Pro Tips:**\n" +
            "• Pet actions count toward quest progress\n" +
            "• Train pets to improve quest success\n" +
            "• Check quests daily for new challenges\n" +
            "• Use `quest check` if progress seems stuck\n\n" +
            "**🎯 Goals:**\n" +
            "• Evolve your pet to maximum level\n" +
            "• Complete daily quest streaks\n" +
            "• Collect rare items from quests\n" +
            "• Become the ultimate pet trainer!"
        )
        .setFooter({
          text: "Use 'gameguide pet' or 'gameguide quest' for detailed guides!",
        });

      return ctx.isInteraction
        ? await ctx.interaction.reply({ embeds: [embed] })
        : await ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      const errorMessage =
        "An error occurred while showing the game guide. Please try again later.";
      if (ctx.isInteraction) {
        await ctx.interaction.reply(errorMessage);
      } else {
        await ctx.sendMessage(errorMessage);
      }
      console.error(error);
    }
  }
};
