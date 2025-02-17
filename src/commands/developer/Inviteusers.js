const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class InviteUsers extends Command {
  constructor(client) {
    super(client, {
      name: "inviteusers",
      description: {
        content: "Send an invite message to eligible users.",
        examples: ["inviteusers"],
        usage: "inviteusers",
      },
      category: "utility",
      aliases: ["iu"],
      args: false,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: ["Administrator"],
      },
      slashCommand: false,
    });
  }

  async run(client, ctx) {
    try {
      const users = await Users.find({});
      const inviteLink = "https://discord.gg/BJT4h55hbg"; // Replace with your actual invite link
      let sentCount = 0;
      let failedCount = 0;
      
      for (const user of users) {
        if (!user.verification || user.verification.isBanned) continue;
        
        try {
          const member = await client.users.fetch(user.userId);
          if (member) {
            await member.send(
              `Sorry ${member.username} for our mistake! 🎉 We’d love to have you in our server! Join us using this invite link: ${inviteLink}`
            );
            sentCount++;
          }
        } catch (error) {
          console.error(`Failed to send invite to ${user.userId}:`, error);
          failedCount++;
        }
      }
      
      return ctx.sendMessage(`Successfully sent invites to **${sentCount}** users. Failed to send **${failedCount}** messages.`);
    } catch (error) {
      console.error("Error fetching users or sending invites:", error);
      return ctx.sendMessage(
        `${globalEmoji.error} An error occurred while sending invites.`
      );
    }
  }
};