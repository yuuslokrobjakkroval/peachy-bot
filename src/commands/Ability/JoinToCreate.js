const { Command } = require("../../structures/index.js");
const { ChannelType } = require("discord.js");
const JoinToCreateSchema = require("../../schemas/joinToCreate");

module.exports = class Avatar extends Command {
  constructor(client) {
    super(client, {
      name: "jointocreate",
      description: {
        content: "Manage the join to create voice channel system",
        examples: ["jointocreate <channel> <category>"],
        usage: "jointocreate <channel> <category>",
      },
      category: "ability",
      aliases: [],
      cooldown: 3,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "setup",
          description: "Setup the join to create system.",
          type: 1, // Subcommand type
          options: [ // Nested options inside the setup subcommand
            {
              name: "channel",
              description: "The voice channel users will join to create their own channel.",
              type: 7, // Channel type
              required: true,
            },
            {
              name: "category",
              description: "The category where temporary channels will be created.",
              type: 7, // Channel type
              required: true,
            },
          ],
        },
        {
          name: "disable",
          description: "Disable the join to create system.",
          type: 1, // Subcommand type
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    if (ctx.isInteraction) {
      await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.searching));
    } else {
      await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.searching));
    }

    const subCommand = ctx.interaction.options.getSubcommand();

    switch (subCommand) {
      case "setup": {
        const channel = await ctx.interaction.options.getChannel('channel');
        const category = await ctx.interaction.options.getChannel('category');

        if (channel && channel.type !== ChannelType.GuildVoice) {
          return ctx.isInteraction
              ? await ctx.interaction.editReply({ content: "Please select a valid voice channel." })
              : await ctx.editMessage({ content: "Please select a valid voice channel." });
        }

        if (category && category.type !== ChannelType.GuildCategory) {
          return ctx.isInteraction
              ? await ctx.interaction.editReply({ content: "Please select a valid category." })
              : await ctx.editMessage({ content: "Please select a valid category." });
        }

        // Update the database with channel and category details
        await JoinToCreateSchema.findOneAndUpdate(
            { guildId: ctx.guild.id },
            {
              guildId: ctx.guild.id,
              enabled: true,
              channelId: channel.id,
              categoryId: category.id, // Ensure category is passed correctly
            },
            { upsert: true, new: true }
        );

        const embed = client.embed()
            .setColor(color.main)
            .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true }))
            .setTitle("Join To Create System Setup")
            .setDescription(`Successfully set up the join to create system!\n\nJoin Channel: ${channel.name}\nCategory: ${category ? category.name : 'No category'}`)
            .setFooter({
              text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
              iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        await ctx.isInteraction
            ? ctx.interaction.editReply({ embeds: [embed] })
            : await ctx.editMessage({ embeds: [embed] });
        break;
      }
      case 'disable' : {
        const config = await JoinToCreateSchema.findOne({ guildId: ctx.guild.id })

        if (!config?.enabled) {
          const embed = client.embed()
              .setColor(color.main)
              .setDescription('The Join to create system is not enabled in this server.');
          return ctx.isInteraction
              ? ctx.interaction.editReply({ embeds: [embed], ephemeral: true })
              : await ctx.editMessage({ embeds: [embed] });
        }

        await JoinToCreateSchema.findOneAndUpdate({ guildId: ctx.guild.id }, { enabled: false });
        const embed = client.embed()
            .setColor(color.main)
            .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true }))
            .setTitle("Join To Create System Disabled")
            .setDescription("The Join to create system has been disabled.")
            .setFooter({
              text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
              iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();
        await ctx.isInteraction
            ? ctx.interaction.editReply({ embeds: [embed] })
            : await ctx.editMessage({ embeds: [embed] });
        break;
      }
    }
  }
};
