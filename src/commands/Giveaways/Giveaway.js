const { Command } = require("../../structures/index.js");
const { MessageFlags } = require("discord.js");
const GiveawaySchema = require("../../schemas/giveaway.js");

module.exports = class Giveaway extends Command {
  constructor(client) {
    super(client, {
      name: "gstart",
      description: {
        content:
          "Start a giveaway with a specified duration, number of winners, and prize.",
        examples: [
          'gstart "Win amazing coins!" 1000 1h 2',
          'gstart "Weekly giveaway" 10000 12h 5',
        ],
        usage:
          "gstart <description> <prize> <duration> <winners> [image] [thumbnail] [autopay]",
      },
      category: "giveaway",
      aliases: ["gs"],
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
          description: "Automatically pay the winners after the giveaway ends.",
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

    // Defer reply
    try {
      if (ctx.isInteraction) {
        await ctx.interaction.deferReply();
      } else {
        await ctx.sendDeferMessage(`${client.user.username} is thinking...`);
      }
    } catch (error) {
      console.error("Error deferring reply:", error);
      return;
    }

    // Parse command arguments
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
      const errorMessage =
        "⚠️ Invalid parameters provided. Please check your input and try again.";
      return ctx.isInteraction
        ? await ctx.interaction.editReply({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
          })
        : await ctx.editMessage({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
          });
    }

    // Extract validated data
    const { endTime, formattedDuration } = validationResult.data;

    // Validate and parse prize
    if (prize.toString().startsWith("-")) {
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(generalMessages.invalidAmount),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const multipliers = {
      k: 1000,
      m: 1000000,
      b: 1000000000,
      t: 1000000000000,
      q: 1000000000000000,
    };
    if (typeof prize === "string" && prize.match(/\d+[kmbtq]/i)) {
      const unit = prize.slice(-1).toLowerCase();
      const number = Number.parseInt(prize);
      if (isNaN(number)) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                "Invalid prize format. Please provide a valid number or multiplier (e.g., 1k, 1m).",
              ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
      prize = number * (multipliers[unit] || 1);
    } else {
      prize = Number.parseInt(prize.replace(/,/g, ""));
      if (isNaN(prize) || prize <= 0) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription("Prize must be a positive integer."),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Check autopay and balance if enabled
    let isAutopayEnabled = false;
    if (autoPay) {
      isAutopayEnabled = true;
      // Skip balance check and deduction for users with special permissions
      if (!(await client.utils.hasSpecialPermission(ctx.author.id))) {
        const totalPrize = prize * winners;
        const getUser = await client.utils.getUser(ctx.author.id);
        console.log(
          `Checking balance for user ${ctx.author.id}:`,
          getUser.balance.coin,
        );

        if (!getUser || getUser.balance.coin < totalPrize) {
          const errorMessage = `❌ Insufficient coin balance. You need ${client.utils.formatNumber(totalPrize)} coins, but you have ${client.utils.formatNumber(getUser?.balance.coin || 0)} coins.`;
          return ctx.isInteraction
            ? await ctx.interaction.editReply({
                content: errorMessage,
                flags: MessageFlags.Ephemeral,
              })
            : await ctx.editMessage({
                content: errorMessage,
                flags: MessageFlags.Ephemeral,
              });
        }

        // Deduct coins from user's balance
        try {
          getUser.balance.coin -= totalPrize;
          await getUser.save();
        } catch (error) {
          console.error(
            `Error updating user balance for ${ctx.author.id}:`,
            error,
          );
          return ctx.isInteraction
            ? await ctx.interaction.editReply({
                content:
                  "❌ Error updating your balance. Please try again later.",
                flags: MessageFlags.Ephemeral,
              })
            : await ctx.editMessage({
                content:
                  "❌ Error updating your balance. Please try again later.",
                flags: MessageFlags.Ephemeral,
              });
        }
      }
    }

    // Create giveaway embed
    const giveawayEmbed = client
      .embed()
      .setColor(color.main)
      .setTitle(
        description
          ? `${description}`
          : `**${client.utils.formatNumber(prize)}** ${emoji.coin}`,
      )
      .setDescription(
        `Click ${
          emoji.main
        } button to enter!\nWinners: ${winners} with **${client.utils.formatNumber(
          prize,
        )}** ${emoji.coin}\nHosted by: ${
          ctx.author.displayName
        }\nEnds: <t:${formattedDuration}:R>` +
          (isAutopayEnabled ? `\nAutopay: Enabled` : ""),
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
      // Refund coins if message creation fails and autopay was used (for non-special users)
      if (
        isAutopayEnabled &&
        !(await client.utils.hasSpecialPermission(ctx.author.id))
      ) {
        try {
          const getUser = await client.utils.getUser({ userId: ctx.author.id });
          getUser.balance.coin += prize * winners;
          await getUser.save();
        } catch (error) {
          console.error(
            `Error refunding user balance for ${ctx.author.id}:`,
            error,
          );
        }
      }
      const errorMessage =
        "❌ Failed to send the giveaway message. Please try again later.";
      return ctx.isInteraction
        ? await ctx.interaction.editReply({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
          })
        : await ctx.editMessage({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
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
        prize: prize,
        endTime: endTime,
        paused: false,
        ended: false,
        entered: [],
        autopay: isAutopayEnabled,
        retryAutopay: false,
        winnerId: [],
        rerollOptions: [],
        description: description || "",
      });
    } catch (error) {
      // Refund coins if database save fails and autopay was used (for non-special users)
      if (
        isAutopayEnabled &&
        !(await client.utils.hasSpecialPermission(ctx.author.id))
      ) {
        try {
          const getUser = await client.utils.getUser({ userId: ctx.author.id });
          getUser.balance.coin += prize * winners;
          await getUser.save();
        } catch (error) {
          console.error(
            `Error refunding user balance for ${ctx.author.id}:`,
            error,
          );
        }
      }
      console.error(`Error creating giveaway in guild ${ctx.guild.id}:`, error);
      return ctx.channel.send({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              "There was an error saving the giveaway. Please try again.",
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
};
