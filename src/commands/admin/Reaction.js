const { Command } = require('../../structures/index.js');
const {
    SlashCommandBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require('discord.js');
const ReactionRole = require('../../schemas/reactionRole.js');

module.exports = class AddBank extends Command {
    constructor(client) {
        super(client, {
            name: 'reaction',
            description: {
                content: 'Manage reaction roles in your server.',
                examples: ['reaction setup'],
                usage: 'reaction setup',
            },
            category: 'admin',
            aliases: ['role', 'rr'],
            cooldown: 1,
            args: false,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        await ReactionRole.deleteMany({ guildId: ctx.guild.id, userId: ctx.author.id });

        await ReactionRole.create({
            guildId: ctx.guild.id,
            userId: ctx.author.id,
            embed: {},
            options: [],
        });

        const embed = new EmbedBuilder().setTitle('Reaction Role Builder').setDescription('Use the menu below to add reaction roles');

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`rr-builder-menu`)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Add React Role')
                    .setDescription('Add a new reaction role option')
                    .setValue('__add__')
            );

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rr-edit-embed').setLabel('Edit Embed').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('rr-send').setLabel('Send').setStyle(ButtonStyle.Success)
        );

        await ctx.sendMessage({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(menu), buttons],
            flags: MessageFlags.Ephemeral,
        });
    }
};
