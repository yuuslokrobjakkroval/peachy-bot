const { Command } = require("../../structures");
const { SlashCommandBuilder, ChannelType } = require("discord.js");
const JoinToCreateModel = require("../../schemas/joinToCreate");

module.exports = class JoinToCreate extends Command {
  constructor(client) {
    super(client, {
      name: "join-to-create",
      description: {
        content: "Manage the Join-to-Create voice channel system.",
        examples: ["join-to-create setup", "join-to-create delete"],
        usage: "join-to-create <setup|delete>",
      },
      category: "developer",
      aliases: ["jtc"],
      args: false,
      permissions: {
        dev: false,
        client: [
          "SendMessages",
          "ViewChannel",
          "ManageChannels",
          "Connect",
          "MoveMembers",
        ],
        user: ["ManageChannels", "Administrator"],
      },
      slashCommand: true,
      options: [
        {
          name: "setup",
          description: "Setup the Join-to-Create voice channel system",
          type: 1, // Subcommand
          options: [
            {
              name: "channel",
              description:
                "The voice channel that will trigger new private voice channels",
              type: 7, // Channel type
              required: true,
              channel_types: [ChannelType.GuildVoice], // Restrict to voice channels
            },
            {
              name: "category",
              description:
                "The category where the new voice channels will be created",
              type: 7, // Channel type
              required: true,
              channel_types: [ChannelType.GuildCategory], // Restrict to categories
            },
            {
              name: "voicelimit",
              description:
                "The maximum number of users in each new voice channel",
              type: 4, // Integer type
              required: true,
              min_value: 1,
            },
          ],
        },
        {
          name: "delete",
          description: "Delete the Join-to-Create setup for this guild",
          type: 1, // Subcommand
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;
    if (ctx.isInteraction) {
      await ctx.interaction.reply(
        generalMessages.search.replace("%{loading}", emoji.searching),
      );
    } else {
      await ctx.sendDeferMessage(
        generalMessages.search.replace("%{loading}", emoji.searching),
      );
    }

    try {
      if (!ctx.guild) {
        return await this.reply(
          ctx,
          "This command can only be used in a server.",
        );
      }
      const guildId = ctx.guild.id;
      let subcommand = ctx.isInteraction
        ? ctx.interaction.options.getSubcommand()
        : args[0]?.toLowerCase();

      if (!subcommand) {
        return await this.reply(
          ctx,
          "Please specify a subcommand: setup or delete.",
        );
      }

      if (subcommand === "setup") {
        const channel = ctx.isInteraction
          ? ctx.interaction.options.getChannel("channel")
          : ctx.guild.channels.cache.get(args[1]);
        const category = ctx.isInteraction
          ? ctx.interaction.options.getChannel("category")
          : ctx.guild.channels.cache.get(args[2]);
        const voiceLimit = ctx.isInteraction
          ? ctx.interaction.options.getInteger("voicelimit")
          : parseInt(args[3]);

        // Validate inputs
        if (ctx.isInteraction) {
          if (channel.type !== ChannelType.GuildVoice) {
            return await this.reply(
              ctx,
              'The "channel" option must be a voice channel.',
            );
          }
          if (category.type !== ChannelType.GuildCategory) {
            return await this.reply(
              ctx,
              'The "category" option must be a category channel.',
            );
          }
        } else {
          if (!channel || channel.type !== ChannelType.GuildVoice) {
            return await this.reply(
              ctx,
              "Please provide a valid voice channel ID.",
            );
          }
          if (!category || category.type !== ChannelType.GuildCategory) {
            return await this.reply(
              ctx,
              "Please provide a valid category channel ID.",
            );
          }
          if (isNaN(voiceLimit) || voiceLimit < 1) {
            return await this.reply(
              ctx,
              "Please provide a valid voice limit (minimum 1).",
            );
          }
        }

        // Check for existing setup
        const existingSetup = await JoinToCreateModel.findOne({ guildId });
        if (existingSetup) {
          return await this.reply(
            ctx,
            "Join-to-Create is already set up for this guild. Use `/join-to-create delete` to reset.",
          );
        }

        const newSetup = new JoinToCreateModel({
          guildId,
          channelId: channel.id,
          categoryId: category.id,
          voiceLimit,
        });

        await newSetup.save();
        return await this.reply(
          ctx,
          `Join-to-Create system successfully set up! Users who join ${channel.name} will have private voice channels created under ${category.name} with a limit of ${voiceLimit} users.`,
        );
      } else if (subcommand === "delete") {
        const existingSetup = await JoinToCreateModel.findOne({ guildId });
        if (!existingSetup) {
          return await this.reply(
            ctx,
            "No Join-to-Create system found for this guild.",
          );
        }

        await JoinToCreateModel.deleteOne({ guildId });
        return await this.reply(
          ctx,
          "Join-to-Create system successfully deleted for this guild.",
        );
      } else {
        return await this.reply(
          ctx,
          "Invalid subcommand. Use: setup or delete.",
        );
      }
    } catch (error) {
      console.error(
        `Error in JoinToCreate command for guild ${ctx.guild?.id}:`,
        error,
      );
      return await this.reply(
        ctx,
        "An error occurred while processing your request.",
      );
    }
  }

  async reply(ctx, content) {
    if (ctx.isInteraction) {
      await ctx.interaction.editReply({ content });
    } else {
      await ctx.editMessage({ content });
    }
  }
};
