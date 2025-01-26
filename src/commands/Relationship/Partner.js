const { Command } = require("../../structures/index.js");
const globalGif = require("../../utils/Gif");

module.exports = class Partner extends Command {
  constructor(client) {
    super(client, {
      name: "partner",
      description: {
        content: "𝑴𝒂𝒏𝒂𝒈𝒆 𝒚𝒐𝒖𝒓 𝒑𝒂𝒓𝒕𝒏𝒆𝒓 𝒓𝒆𝒍𝒂𝒕𝒊𝒐𝒏𝒔𝒉𝒊𝒑.",
        examples: [
          "partner add @user - Adds the mentioned user as your partner.",
          "partner remove @user - Removes the mentioned user from your partner slot.",
        ],
        usage: "partner <add/remove> <user>",
      },
      category: "relationship",
      aliases: [],
      cooldown: 5,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "action",
          description: "Action to perform: add or remove.",
          type: 3,
          required: true,
          choices: [
            { name: "Add", value: "add" },
            { name: "Remove", value: "remove" },
          ],
        },
        {
          name: "user",
          description: "The user you want to add or remove as your partner.",
          type: 6,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const relationshipMessages = language.locales.get(
      language.defaultLocale
    )?.relationshipMessages;
    const action = ctx.isInteraction
      ? ctx.interaction.options.getString("action")
      : args[0];
    const target = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.users.first() || args[1];
    if (!target) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        relationshipMessages.error.userNotMentioned,
        color
      );
    }

    if (target.id === ctx.author.id) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        relationshipMessages.error.selfMentioned,
        color
      );
    }

    const user = await client.utils.getUser(ctx.author.id);
    const mention = await client.utils.getUser(target.id);

    if (!user || !mention) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        relationshipMessages.error.notRegistered,
        color
      );
    }

    // Check for partner relationship
    if (action === "add") {
      // Check for existing partners
      if (user.relationship?.partner?.userId) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `${ctx.author.displayName}, 𝒚𝒐𝒖 𝒂𝒍𝒓𝒆𝒂𝒅𝒚 𝒉𝒂𝒗𝒆 𝒂 𝒑𝒂𝒓𝒕𝒏𝒆𝒓!`,
          color
        );
      }

      if (mention.relationship?.partner?.userId) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `${mention.username} 𝒂𝒍𝒓𝒆𝒂𝒅𝒚 𝒉𝒂𝒔 𝒂 𝒑𝒂𝒓𝒕𝒏𝒆𝒓!`,
          color
        );
      }
      await this.checkAndAddPartner(
        client,
        ctx,
        user,
        target,
        mention,
        color,
        emoji,
        language
      );
    } else if (action === "remove") {
      await this.removePartner(
        client,
        ctx,
        user,
        target,
        mention,
        color,
        emoji,
        language
      );
    } else {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        relationshipMessages.error.invalidAction,
        color
      );
    }
  }

  async checkAndAddPartner(
    client,
    ctx,
    user,
    target,
    mention,
    color,
    emoji,
    language
  ) {
    const badgeIds = { r01: "r02", r02: "r01" };

    // Check inventories
    const userRing = user.inventory.find((inv) =>
      Object.keys(badgeIds).includes(inv.id)
    );
    const mentionRing = mention.inventory.find((inv) =>
      Object.keys(badgeIds).includes(inv.id)
    );

    if (!userRing) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        `${ctx.author.displayName}, 𝒚𝒐𝒖 𝒅𝒐𝒏'𝒕 𝒉𝒂𝒗𝒆 𝒂 𝒓𝒊𝒏𝒈.`,
        color
      );
    }
    if (!mentionRing) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        `${target.displayName}, 𝒅𝒐𝒆𝒔 𝒏𝒐𝒕 𝒉𝒂𝒗𝒆 𝒂 𝒓𝒊𝒏𝒈.`,
        color
      );
    }

    // Check ring pairs
    if (badgeIds[userRing.id] !== mentionRing.id) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        `${ctx.author.displayName} 𝒂𝒏𝒅 ${target.displayName} 𝒎𝒖𝒔𝒕 𝒉𝒂𝒗𝒆 𝒄𝒐𝒎𝒑𝒍𝒆𝒎𝒆𝒏𝒕𝒂𝒓𝒚 *(𝒓01 𝒂𝒏𝒅 𝒓02)*.`,
        color
      );
    }

    // Send confirmation embed to the mentioned user
    const confirmEmbed = client
      .embed()
      .setColor(color.main)
      .setTitle(`💍 Partner Request`)
      .setDescription(
        `${ctx.author.displayName} is asking you to become their partner!\n` +
          `You have the complementary ring ****(${mentionRing.id.toUpperCase()})**** to match theirs.\n` +
          `Do you accept this partnership?`
      )
      .setImage(globalGif.banner.partner)
      .setFooter({ text: "You have 2 minute to respond." });

    const acceptedButton = client.utils.labelButton("accept", "Accept", 3);
    const declineButton = client.utils.labelButton("decline", "Decline", 4);
    const row = client.utils.createButtonRow(acceptedButton, declineButton);

    // Await confirmation response
    const msg = await ctx.channel.send({
      embeds: [confirmEmbed],
      components: [row],
    });

    const collector = msg.createMessageComponentCollector({
      filter: async (int) => {
        if (["accept", "decline"].includes(int.customId)) return true;
      },
      time: 60000,
    });

    collector.on("collect", async (int) => {
      if (int.customId === "accept") {
        if (int.user.id === target.id) {
          // Update partner data
          user.inventory = user.inventory
            .map((item) => {
              if (item.id === userRing.id) {
                item.quantity -= 1;
              }
              return item;
            })
            .filter((item) => item.quantity > 0);
          user.relationship.partner.userId = target.id;
          user.relationship.partner.name = target.displayName;
          user.relationship.partner.date = new Date();
          user.relationship.partner.xp = 0;
          user.relationship.partner.level = 1;

          mention.inventory = mention.inventory
            .map((item) => {
              if (item.id === mentionRing.id) {
                item.quantity -= 1;
              }
              return item;
            })
            .filter((item) => item.quantity > 0);
          mention.relationship.partner.userId = ctx.author.id;
          mention.relationship.partner.name = ctx.author.displayName;
          mention.relationship.partner.date = new Date();
          mention.relationship.partner.xp = 0;
          mention.relationship.partner.level = 1;

          await Promise.all([user.save(), mention.save()]);

          await msg.edit({
            content: `🎉 ****${ctx.author.displayName}**** and ****${target.displayName}**** are now partners! 💍`,
            embeds: [],
            components: [],
          });
          await int.deferUpdate();
        } else {
          await int.reply({
            content: `This button for ****${target.displayName}****!`,
            flags: 64,
          });
        }
      } else {
        if (int.user.id === target.id) {
          await msg.edit({
            content: `❌ ****${target.displayName}**** declined the partnership request.`,
            embeds: [],
            components: [],
          });
          await int.deferUpdate();
        } else if (int.user.id === ctx.author.id) {
          await msg.edit({
            content: `❌ the partnership request have declined by ****${ctx.author.displayName}**** .`,
            embeds: [],
            components: [],
          });
          await int.deferUpdate();
        } else {
          await int.reply({
            content: `This button for ${ctx.author.displayName} and ****${target.displayName}****!`,
            flags: 64,
          });
        }
      }
    });

    collector.on("end", async () => {
      await msg.edit({
        content: `⌛ ****${target.displayName}**** did not respond in time. Request cancelled.`,
        embeds: [],
        components: [],
      });
    });
  }

  async removePartner(
    client,
    ctx,
    user,
    target,
    mention,
    color,
    emoji,
    language
  ) {
    // Check if user and mention are partners
    if (
      user?.relationship?.partner?.userId !== mention.userId ||
      mention?.relationship?.partner?.userId !== user.userId
    ) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        `You are not partners with ${target.displayName}.`,
        color
      );
    }

    // Remove partner relationship
    user.relationship.partner = null;
    mention.relationship.partner = null;

    // Save updated data
    await Promise.all([user.save(), mention.save()]);
    return client.utils.sendSuccessMessage(
      client,
      ctx,
      `${ctx.author.displayName} and ${target.displayName} are no longer partners. 💔`,
      color
    );
  }
};
