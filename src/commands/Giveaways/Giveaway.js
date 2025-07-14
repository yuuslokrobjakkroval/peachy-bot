const { Command } = require("../../structures/index.js");
const GiveawaySchema = require("../../schemas/giveaway.js");

module.exports = class Giveaway extends Command {
  constructor(client) {
    super(client, {
      name: "gstart",
      description: {
        content:
          "Start a giveaway with a specified duration, number of winners, and prize.",
        examples: [
          'giveaway "Win amazing coins!" 1000 1h 2',
          'giveaway "Weekly giveaway" 10000 12h 5',
        ],
        usage:
          "giveaway <description> <prize> <duration> <winners> [image] [thumbnail] [autopay]",
      },
      category: "giveaway",
      aliases: ["gc"],
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "description",
          description: "Custom description for the giveaway.",
          type: 3,
          required: true,
        },
        {
          name: "prize",
          description: "The prize amount in coins.",
          type: 3,
          required: true,
        },
        {
          name: "duration",
          description: "The duration of the giveaway (e.g. 1h, 1d, 1w).",
          type: 3,
          required: true,
        },
        {
          name: "winners",
          description: "The number of winners for the giveaway (1-20).",
          type: 4,
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
            "Automatically pay the winners after the giveaway ends. (Owner Only)",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.deferReply();
    } else {
      await ctx.sendDeferMessage(`${client.user.username} is thinking...`);
    }

    // Parse command arguments in the new order
    const description = ctx.isInteraction
      ? ctx.interaction.options.getString("description")
      : args[0];
    let prize = ctx.isInteraction
      ? ctx.interaction.options.getString("prize")
      : args[1];
    const durationStr = ctx.isInteraction
      ? ctx.interaction.options.getString("duration")
      : args[2];
    const winnersStr = ctx.isInteraction
      ? ctx.interaction.options.getInteger("winners")
      : args[3];
    const image = ctx.isInteraction
      ? ctx.interaction.options.getAttachment("image")
      : null;
    const thumbnail = ctx.isInteraction
      ? ctx.interaction.options.getAttachment("thumbnail")
      : null;
    const autoPay = ctx.isInteraction
      ? ctx.interaction.options.getString("autopay")
      : args[6];

    // Validate common parameters
    const winners = Number.parseInt(winnersStr, 10);
    const validationResult = await client.utils.validateCommonParams(
      ctx,
      client,
      color,
      durationStr,
      winners,
    );
   if (!validationResult.success) {
      const errorMessage = "⚠️ Invalid parameters provided. Please check your input and try again.";
    
      return ctx.isInteraction
        ? await ctx.interaction.editReply({
            content: errorMessage,
            fetchReply: true,
          })
        : await ctx.editMessage({
            content: errorMessage,
            fetchReply: true,
          });
    }

    // Extract validated data
    const { duration, endTime, formattedDuration } = validationResult.data;

    // Check autopay permission
    if (autoPay && !(await client.utils.hasSpecialPermission(ctx.author.id))) {
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

    // Validate prize
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

    // Process prize amount with multipliers
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
        const number = Number.parseInt(prize);
        prize = number * (multipliers[unit] || 1);
      } else if (
        prize.toString().includes(".") ||
        prize.toString().includes(",")
      ) {
        prize = Number.parseInt(prize.replace(/,/g, ""));
      }
    }

    // Create giveaway embed
    const giveawayEmbed = client
      .embed()
      .setColor(color.main)
      .setTitle(
        `${
          description
            ? `${description}`
            : `**${client.utils.formatNumber(prize)}** ${emoji.coin}`
        }`,
      )
      .setDescription(
        `Click ${
          emoji.main
        } button to enter!\nWinners: ${winners} with **${client.utils.formatNumber(
          prize,
        )}** ${emoji.coin}\nHosted by: ${
          ctx.author.displayName
        }\nEnds: <t:${formattedDuration}:R>`,
      );

    // Add optional image and thumbnail
    if (image) giveawayEmbed.setImage(image.url);
    if (thumbnail) giveawayEmbed.setThumbnail(thumbnail.url);

    // Create buttons
    const joinButton = client.utils.fullOptionButton(
      "giveaway-join",
      emoji.main,
      "0",
      1,
      false,
    );
    const participantsButton = client.utils.fullOptionButton(
      "giveaway-participants",
      "",
      "Participants",
      2,
      false,
    );
    const buttonRow = client.utils.createButtonRow(
      joinButton,
      participantsButton,
    );

    // Send giveaway message
    const messageResult = await client.utils.createGiveawayMessage(ctx, {
      client,
      color,
      emoji,
      embed: giveawayEmbed,
      buttonRow,
    });

    if (!messageResult.success) {
      const errorMessage = "❌ Failed to send the giveaway message. Please try again later.";
    
      return ctx.isInteraction
        ? await ctx.interaction.editReply({
            content: errorMessage,
            fetchReply: true,
          })
        : await ctx.editMessage({
            content: errorMessage,
            fetchReply: true,
          });
    }
    // Save giveaway to database
    try {
      await GiveawaySchema.create({
        guildId: ctx.guild.id,
        channelId: ctx.channel.id,
        messageId: messageResult.message.id,
        hostedBy: ctx.author.id,
        winners: winners,
        prize: Number.parseInt(prize),
        endTime: endTime,
        paused: false,
        ended: false,
        entered: [],
        autopay: !!autoPay,
        retryAutopay: false,
        winnerId: [],
        rerollOptions: [],
        description: description || "",
      });
    } catch (error) {
      console.error("Error creating giveaway:", error);
      await ctx.channel.send({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              "There was an error saving the giveaway. Please try again.",
            ),
        ],
      });
    }
  }
};
