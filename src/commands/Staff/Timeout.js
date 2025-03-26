const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const ms = require("ms");

module.exports = class Timeout extends Command {
  constructor(client) {
    super(client, {
      name: "timeout",
      description: {
        content: "Set a timeout for a user.",
        examples: ["timeout @user 5min"],
        usage: "timeout <user> <duration>",
      },
      category: "staff",
      aliases: ["to", "mute"],
      args: true,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [""],
      },
      slashCommand: false,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        args[0];

    if (!mention) {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription("Please mention a user to timeout."),
        ],
      });
    }

    if (mention && mention.user.bot) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages.botTransfer,
        color
      );
    }

    // Get the duration (e.g., 5min or 10min)
    const duration = args[1];
    if (!duration) {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription("Please provide a duration (e.g., 5min, 10min)."),
        ],
      });
    }

    // Parse the duration (convert to milliseconds)
    const time = ms(duration);
    if (!time) {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription("Invalid duration format. Example: 5min, 10min"),
        ],
      });
    }

    const userId = typeof mention === "string" ? mention : mention.id;
    const syncUser = await client.users.fetch(userId);
    let user = await Users.findOne({ userId: syncUser.id });
    if (!user) {
      user = new Users({
        userId: mention.id,
        verification: {
          timeout: {
            expiresAt: null,
            reason: null,
          },
        },
      });
    }

    // Check if user is already in timeout
    const now = new Date();
    if (
      user.verification.timeout.expiresAt &&
      user.verification.timeout.expiresAt > now
    ) {
      const remainingTime = Math.ceil(
        (user.verification.timeout.expiresAt - now) / 1000 / 60
      ); // Convert to minutes
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              `User is already in timeout. Timeout ends in ${remainingTime} minute(s).`
            ),
        ],
      });
    }

    // Set the timeout expiration
    const expiresAt = new Date(now.getTime() + time);

    // Store the timeout information in the database
    user.verification.timeout.expiresAt = expiresAt;
    user.verification.timeout.reason = `Timed out for ${duration}`;
    await user.save();

    // Send confirmation message
    const initialEmbed = await ctx.sendMessage({
      embeds: [
        client
          .embed()
          .setColor(color.main)
          .setDescription(`Timed out **${mention}** for \`${duration}\`.`),
      ],
    });

    // Countdown logic
    const countdownInterval = setInterval(async () => {
      const now = new Date();
      const newRemainingTime = Math.ceil(
        (user.verification.timeout.expiresAt - now) / 1000 / 60
      ); // Recalculate remaining time

      if (newRemainingTime <= 0) {
        clearInterval(countdownInterval); // Clear the interval when the time is up

        await initialEmbed.edit({
          embeds: [
            client
              .embed()
              .setColor(color.success)
              .setDescription(`${mention} is no longer in timeout.`),
          ],
        });

        // Clear the timeout from the database after it expires
        user.verification.timeout.expiresAt = null;
        user.verification.timeout.reason = null;
        await user.save();
      } else {
        // Update the initial message with the new remaining time
        await initialEmbed.edit({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                `User is in timeout. Timeout ends in ${newRemainingTime} minute(s).`
              ),
          ],
        });
      }
    }, 1000); // Update every minute
  }
};
