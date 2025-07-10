const { Command } = require("../../structures");
const Tree = require("../../schemas/tree");

module.exports = class TreeLeaderboard extends Command {
  constructor(client) {
    super(client, {
      name: "treeleaderboard",
      description: {
        content: "Show the leaderboard of top tree growers.",
        examples: ["treeleaderboard"],
        usage: "treeleaderboard",
      },
      category: "games",
      aliases: ["treeboard", "treelead", "tree-top"],
      cooldown: 10,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "EmbedLinks", "ViewChannel"],
        user: [],
      },
      slashCommand: true,
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    try {
      const topTrees = await Tree.find({})
        .sort({ "tree.level": -1, "tree.xp": -1 })
        .limit(10);

      if (!topTrees.length) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.warning)
              .setDescription(
                "🌱 No trees have grown yet! Be the first using `/starttree`."
              ),
          ],
        });
      }

      const leaderboard = await Promise.all(
        topTrees.map(async (user, index) => {
          const member = await client.users
            .fetch(user.userId)
            .catch(() => null);
          const username =
            member?.username || `User#${user.userId.slice(0, 5)}`;
          const level = user.tree.level;
          const xp = user.tree.xp;
          const stage = user.tree.stage;
          return `**${
            index + 1
          }.** ${username} — 🌿 Level ${level} (${xp} XP, ${stage})`;
        })
      );

      const embed = client
        .embed()
        .setColor(color.main)
        .setTitle("🌳 Tree Leaderboard")
        .setDescription(leaderboard.join("\n"))
        .setFooter({
          text:
            language.locales
              .get(language.defaultLocale)
              ?.generalMessages?.requestedBy.replace(
                "%{username}",
                ctx.author.displayName
              ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      return ctx.sendMessage({ embeds: [embed] });
    } catch (err) {
      console.error("TreeLeaderboard error:", err);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Failed to load leaderboard.",
        color
      );
    }
  }
};
