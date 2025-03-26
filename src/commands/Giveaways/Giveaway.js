const { Command } = require("../../structures/index.js");
const globalConfig = require("../../utils/Config");
const GiveawaySchema = require("../../schemas/giveaway.js");
const ms = require("ms");

module.exports = class Start extends Command {
  constructor(client) {
    super(client, {
      name: "giveaway",
      description: {
        content:
            "Start a giveaway with a specified duration, number of winners, and prize.",
        examples: ["giveaway 1h 2 1000 true"],
        usage:
            "giveaway <duration> <winners> <prize> <autopay> <image> <thumbnail>",
      },
      category: "giveaway",
      aliases: [],
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "duration",
          description: "The duration of the giveaway.",
          type: 3,
          required: true,
        },
        {
          name: "winners",
          description: "The number of winners for the giveaway.",
          type: 4,
          required: true,
        },
        {
          name: "prize",
          description: "The prize of the giveaway.",
          type: 3,
          required: true,
        },
        {
          name: "image",
          description: "Attach an image for the giveaway.",
          type: 11,
          required: false,
        },
        {
          name: "thumbnail",
          description: "Attach a thumbnail for the giveaway.",
          type: 11,
          required: false,
        },
        {
          name: "autopay",
          description:
              "Automatically pay the winners after the giveaway ends. (Owner/Staff Only)",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    if (ctx.isInteraction) {
      await ctx.interaction.deferReply();
    } else {
      await ctx.sendDeferMessage(`${client.user.username} is Thinking...`);
    }

    // Owner and Admin checks
    const isOwner = globalConfig.owners.includes(ctx.author.id);
    // const isAdmin = client.utils.getCheckPermission(ctx, ctx.author.id, 'Administrator');
    //
    // if (!isOwner || !isAdmin) {
    //     const response = {
    //         content: 'Only the bot owner, server owner, and administrators can use this giveaway.',
    //         flags: 64,
    //     };
    //     return ctx.isInteraction
    //         ? ctx.interaction.editReply(response)
    //         : ctx.editMessage(response);
    // }

    // Fetch arguments for giveaway
    const durationStr = ctx.isInteraction
        ? ctx.interaction.options.getString("duration")
        : args[0];
    const winnersStr = ctx.isInteraction
        ? ctx.interaction.options.getInteger("winners")
        : args[1];
    let prize = ctx.isInteraction
        ? ctx.interaction.options.getString("prize")
        : args[2];
    const image = ctx.isInteraction
        ? ctx.interaction.options.getAttachment("image")
        : args[3];
    const thumbnail = ctx.isInteraction
        ? ctx.interaction.options.getAttachment("thumbnail")
        : args[4];
    const autoPay = ctx.isInteraction
        ? ctx.interaction.options.getString("autopay")
        : args[5];

    if (autoPay && !isOwner) {
      return ctx.isInteraction
          ? ctx.interaction.editReply({
            content: "Only the bot owner can enable autopay for giveaways.",
            flags: 64,
          })
          : ctx.editMessage({
            content: "Only the bot owner can enable autopay for giveaways.",
            flags: 64,
          });
    }

    const duration = ms(durationStr);
    const winners = parseInt(winnersStr, 10);
    if (!duration || isNaN(winners) || winners <= 0 || !prize) {
      const replyMessage = {
        embeds: [
          client
              .embed()
              .setAuthor({
                name: client.user.displayName,
                iconURL: client.user.displayAvatarURL(),
              })
              .setColor(color.danger)
              .setDescription(
                  "Invalid input. Please ensure the duration, number of winners, and prize are correctly provided."
              ),
        ],
      };
      if (ctx.isInteraction) {
        await ctx.interaction.editReply(replyMessage);
      } else {
        await ctx.editMessage(replyMessage);
      }
      return;
    }

    const endTime = Date.now() + duration;
    const formattedDuration = parseInt(endTime / 1000, 10);

    if (prize.toString().startsWith("-")) {
      return ctx.sendMessage({
        embeds: [
          client
              .embed()
              .setColor(color.danger)
              .setDescription(generalMessages.invalidAmount),
        ],
      });
    }

    if (
        isNaN(prize) ||
        prize <= 0 ||
        prize.toString().includes(".") ||
        prize.toString().includes(",")
    ) {
      const multipliers = {
        k: 1000,
        m: 1000000,
        b: 1000000000,
        t: 1000000000000,
        q: 1000000000000000,
      };
      if (prize.match(/\d+[kmbtq]/i)) {
        const unit = prize.slice(-1).toLowerCase();
        const number = parseInt(prize);
        prize = number * (multipliers[unit] || 1);
      } else if (
          prize.toString().includes(".") ||
          prize.toString().includes(",")
      ) {
        prize = parseInt(prize.replace(/,/g, ""));
      }
    }

    const giveawayEmbed = client
        .embed()
        .setColor(color.main)
        .setTitle(`**${client.utils.formatNumber(prize)}** ${emoji.coin}`)
        .setDescription(
            `Click ${emoji.main} button to enter!\nWinners: ${winners}\nHosted by: ${ctx.author.displayName}\nEnds: <t:${formattedDuration}:R>`
        );

    if (image) giveawayEmbed.setImage(image.url);
    if (thumbnail) giveawayEmbed.setThumbnail(thumbnail.url);

    const joinButton = client.utils.fullOptionButton(
        "giveaway-join",
        emoji.main,
        "0",
        1,
        false
    );
    const participantsButton = client.utils.fullOptionButton(
        "giveaway-participants",
        "",
        "Participants",
        2,
        false
    );
    const buttonRow = client.utils.createButtonRow(
        joinButton,
        participantsButton
    );

    let giveawayMessage;
    try {
      giveawayMessage = ctx.isInteraction
          ? await ctx.interaction.editReply({
            content: "",
            embeds: [giveawayEmbed],
            components: [buttonRow],
            fetchReply: true,
          })
          : await ctx.editMessage({
            content: "",
            embeds: [giveawayEmbed],
            components: [buttonRow],
            fetchReply: true,
          });
    } catch (err) {
      console.error(err);
      const response = "There was an error sending the giveaway message.";
      return ctx.isInteraction
          ? await ctx.interaction.editReply({ content: response })
          : await ctx.editMessage({ content: response });
    }

    await GiveawaySchema.create({
      guildId: ctx.guild.id,
      channelId: ctx.channel.id,
      messageId: giveawayMessage.id,
      hostedBy: ctx.author.id,
      winners: winners,
      prize: parseInt(prize),
      endTime: Date.now() + duration,
      paused: false,
      ended: false,
      entered: [],
      autopay: !!autoPay,
      retryAutopay: false,
      winnerId: [],
      rerollOptions: [],
    });
  }
};