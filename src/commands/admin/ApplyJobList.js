const { Command } = require("../../structures/index.js");
const User = require("../../schemas/user");

module.exports = class ApplyJobList extends Command {
  constructor(client) {
    super(client, {
      name: "applyjoblist",
      description: {
        content:
          "List all users with pending job applications grouped by position.",
        examples: ["applyjoblist", "ajl"],
        usage: "applyjoblist",
      },
      category: "work",
      aliases: ["ajl"],
      cooldown: 3,
      args: false,
      permissions: {
        dev: true,
        staff: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    try {
      // Fetch users with pending job applications
      const users = await User.find({ "work.status": "awaiting" });

      if (users.length === 0) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          "No users with pending job applications.",
          color
        );
      }

      // Group users by their job position
      const groupedByPosition = users.reduce((acc, user) => {
        const position = user.work.position || "Unspecified";
        if (!acc[position]) acc[position] = [];
        acc[position].push(
          `****ID:**** ${user.userId}\n****Name:**** ${
            user.username || "Unknown"
          }\n****Applied Date:**** ${new Date(
            user.work.applyDate
          ).toLocaleDateString()}\n`
        );
        return acc;
      }, {});

      const pages = [];
      for (const [position, userList] of Object.entries(groupedByPosition)) {
        const chunks = client.utils.chunk(userList, 10);

        chunks.forEach((chunk, index) => {
          const embed = client
            .embed()
            .setColor(color.main)
            .setTitle(
              `Apply For: ${
                position === "it"
                  ? "IT"
                  : client.utils.formatCapitalize(position)
              }`
            )
            .setDescription(chunk.join("\n\n"))
            .setFooter({
              text: `Page ${index + 1} of ${chunks.length}`,
            });
          pages.push(embed);
        });
      }
      return await client.utils.reactionPaginate(ctx, pages);
    } catch (error) {
      console.error("Error fetching apply job list:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while fetching the job applications. Please try again later.",
        color
      );
    }
  }
};
