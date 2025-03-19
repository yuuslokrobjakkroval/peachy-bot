const { Command } = require("../../structures/index.js");

module.exports = class Invite extends Command {
  constructor(client) {
    super(client, {
      name: "invite",
      description: {
        content: "Sends the bot's invite link",
        examples: ["invite"],
        usage: "invite",
      },
      category: "info",
      aliases: ["inv"],
      cooldown: 3,
      args: false,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
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
    const clientId = process.env.CLIENT_ID;
    if (!clientId) {
      console.error(
          "Client ID not found in environment variables, cannot generate invite link."
      );
      return await ctx.sendMessage(
          "Sorry, my invite link is not available at this time. Please tell the bot developer to check their console."
      );
    }

    const embed = client.embed()
        .setColor(color.main)
        .setDescription(
            `You can invite me by clicking the button below. Any bugs or outages? Join the support server!`
        );

    const inviteButton = client.utils.linkButton(generalMessages.inviteButton, client.config.links.invite)
    const row = client.utils.createButtonRow(inviteButton);

    return await ctx.sendMessage({ embeds: [embed], components: [row] });
  }
}