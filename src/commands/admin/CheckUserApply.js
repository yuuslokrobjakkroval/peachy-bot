const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class CheckUserApply extends Command {
  constructor(client) {
    super(client, {
      name: "checkuserapply",
      description: {
        content: "List all users who have applied for a job.",
        examples: ["checkuserapply"],
        usage: "checkuserapply",
      },
      category: "developer",
      aliases: ["checkapply", "ca"],
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
    // Fetch all users from the database who have applied for a job (status is 'pending' or 'approved')
    const users = await Users.find({
      "work.status": { $in: ["pending", "approved"] },
    });

    if (users.length === 0) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "No users have applied for a job yet.",
        color
      );
    }

    // Prepare a list of users and the job positions they applied for
    const userList = users.map((user) => {
      const job = user.work.position || "Not Assigned";
      return `****${user.username}**** (${user.userId}) - Job: ****${job}**** - Status: ****${user.work.status}****`;
    });

    // Split the list into chunks for pagination (max 10 users per page)
    let chunks = client.utils.chunk(userList, 10);
    if (chunks.length === 0) chunks = 1;
    const pages = [];

    // Create embed pages for the paginated list
    for (let i = 0; i < chunks.length; i++) {
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(chunks[i].join("\n\n"))
        .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
      pages.push(embed);
    }

    // Use reaction pagination to display the list of users
    return await client.utils.reactionPaginate(ctx, pages);
  }
};
