const { Command } = require("../../structures/index.js");
const { ChannelType } = require("discord.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Announce extends Command {
  constructor(client) {
    super(client, {
      name: "announce",
      description: {
        content:
          "Send an announcement or text message to a specified channel, optionally mentioning a role.",
        examples: [
          "announce #general announce Server maintenance at 8 PM! @everyone",
          "announce #updates text New feature released! @Moderators",
        ],
        usage: "announce [channel] <type> <message> [role]",
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
        {
          name: "role",
          description: "The role to mention in the message.",
          type: 8,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;

    // Parse command arguments
    let channel, type, messageContent, role;

    if (ctx.isInteraction) {
      type = ctx.interaction.options.getString("type");
      channel = ctx.interaction.options.getChannel("channel");
      messageContent = ctx.interaction.options.getString("message");
      role = ctx.interaction.options.getRole("role");
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
      // Check for role mention in args
      role =
        ctx.message.mentions.roles.first() ||
        ctx.guild.roles.cache.get(args[args.length - 1]);
      if (
        ctx.message.mentions.roles.first() ||
        ctx.guild.roles.cache.get(args[args.length - 1])
      ) {
        args.pop(); // Remove role from args
      }
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

    // Validate role
    if (role) {
      try {
        role = await ctx.guild.roles.fetch(role.id || role, { cache: true });
      } catch (error) {
        console.error("Error fetching role:", error);
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages?.invalidRole || "Could not find the specified role.",
          color
        );
      }
    }

    // Prepare message content with role mention if provided
    const finalMessage = role
      ? `${role.toString()} ${messageContent}`
      : messageContent;

    // Send the message based on type
    try {
      if (type === "announce") {
        const embed = client
          .embed()
          .setColor(color.main)
          .setTitle("📢 Announcement")
          .setDescription(messageContent) // Only message content in embed
          .setTimestamp()
          .setFooter({
            text: `Announced by ${ctx.author.tag}`,
            iconURL: ctx.author.displayAvatarURL(),
          });
        await channel.send({
          content: role ? role.toString() : null,
          embeds: [embed],
        });
      } else {
        await channel.send(finalMessage);
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
        `${globalEmoji.result.tick} ${type.charAt(0).toUpperCase() + type.slice(1)} sent to ${channel.toString()} successfully!` +
          (role ? ` Mentioned role: ${role.name}` : "")
      );

    return await ctx.sendMessage({ embeds: [confirmationEmbed] });
  }
};
