const { Command } = require("../../structures");
const Users = require("../../schemas/user");

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
      const users = await Users.find({ "wasKicked": true }); // Only invite users who were mistakenly kicked
      const inviteLink = "https://discord.gg/BJT4h55hbg"; // Replace with your actual invite link
      let sentCount = 0;
      let failedCount = 0;
      let dmDisabledCount = 0;
      
      for (const user of users) {
        if (!user.verification || user.verification.isBanned) continue;
        
        try {
          const member = await client.users.fetch(user.userId);
          if (member) {
            const dmChannel = await member.createDM().catch(() => null);
            if (!dmChannel) {
              console.warn(`User ${user.userId} has DMs disabled.`);
              dmDisabledCount++;
              continue;
            }
            
            await dmChannel.send(
              `Hey ${member.username}, we sincerely apologize for our mistake! 🎉 We’d love to have you back in our server. Join us again using this invite link: ${inviteLink}`
            );
            sentCount++;
          }
        } catch (error) {
          if (error.code === 50007) {
            console.warn(`Cannot send DM to ${user.userId} (DMs disabled or blocked).`);
            dmDisabledCount++;
          } else {
            console.error(`Failed to send invite to ${user.userId}:`, error);
            failedCount++;
          }
        }
      }
      
      return ctx.sendMessage(`Successfully re-invited **${sentCount}** users.\n**${dmDisabledCount}** users have DMs disabled.\nFailed to send **${failedCount}** messages.`);
    } catch (error) {
      return ctx.sendMessage(
        `An error occurred while sending invites.`
      );
    }
  }
};