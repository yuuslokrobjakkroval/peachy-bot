const { Command } = require("../../structures/index.js");
const { ChannelType } = require("discord.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Announce extends Command {
  constructor(client) {
    super(client, {
      name: "announce",
      description: {
        content: "Send an announcement or text message to a specified channel.",
        examples: [
          "announce #general announce Server maintenance at 8 PM!",
          "announce #updates text New feature released!",
        ],
        usage: "announce [channel] <type> <message>",
      },
      category: "admin",
      aliases: ["an", "broadcast"],
      cooldown: 1,
      args: true,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "type",
          description: "The type of message (announce or text).",
          type: 3,
          required: true,
          choices: [
            { name: "Announce (Embed)", value: "announce" },
            { name: "Text (Plain)", value: "text" },
          ],
        },
        {
          name: "channel",
          description: "The channel to send the message to.",
          type: 7,
          required: true,
          channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        },
        {
          name: "message",
          description: "The message content to send.",
          type: 3,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;

    // Parse command arguments
    let channel, type, messageContent;

    if (ctx.isInteraction) {
      type = ctx.interaction.options.getString("type");
      channel = ctx.interaction.options.getChannel("channel");
      messageContent = ctx.interaction.options.getString("message");
    } else {
      channel =
        ctx.message.mentions.channels.first() ||
        ctx.guild.channels.cache.get(args[0]) ||
        ctx.channel;
      if (
        ctx.message.mentions.channels.first() ||
        ctx.guild.channels.cache.get(args[0])
      ) {
        args.shift(); // Remove channel from args
      }
      type = args[0]?.toLowerCase();
      args.shift(); // Remove type from args
      messageContent = args.join(" ");
    }

    // Validate type
    if (!["announce", "text"].includes(type)) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.invalidType ||
          "Invalid type. Please specify 'announce' or 'text'.",
        color
      );
    }

    // Validate channel
    try {
      channel = await client.channels.fetch(channel.id || channel, {
        cache: true,
      });
    } catch (error) {
      console.error("Error fetching channel:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.invalidChannel ||
          "Could not find the specified channel.",
        color
      );
    }

    // Ensure the channel is a text-based channel
    if (
      ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(
        channel.type
      )
    ) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.invalidChannelType ||
          "The specified channel must be a text or announcement channel.",
        color
      );
    }

    // Validate message content
    if (!messageContent || messageContent.trim() === "") {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.invalidMessage || "Please provide a message to send.",
        color
      );
    }

    // Prepare and send the message based on type
    try {
      if (type === "announce") {
        const embed = client
          .embed()
          .setColor(color.main)
          .setTitle("📢 Announcement")
          .setDescription(messageContent)
          .setTimestamp()
          .setFooter({
            text: `Announced by ${ctx.author.tag}`,
            iconURL: ctx.author.displayAvatarURL(),
          });
        await channel.send({ embeds: [embed] });
      } else {
        await channel.send(messageContent);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.sendError ||
          "An error occurred while sending the message. Please try again.",
        color
      );
    }

    // Send confirmation to the command issuer
    const confirmationEmbed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `${globalEmoji.result.tick} ${type.charAt(0).toUpperCase() + type.slice(1)} sent to ${channel.toString()} successfully!`
      );

    return await ctx.sendMessage({ embeds: [confirmationEmbed] });
  }
};
