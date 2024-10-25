const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const ms = require('ms');
const GiveawaySchema = require('../../schemas/giveaway.js');

module.exports = class Start extends Command {
    constructor(client) {
        super(client, {
            name: 'giveaway',
            description: {
                content: 'Start a giveaway with a specified duration, number of winners, and prize.',
                examples: ['giveaway 1h 2 1000 true'],
                usage: 'giveaway <duration> <winners> <prize> <autopay> <image> <thumbnail>',
            },
            category: 'giveaway',
            aliases: [],
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'duration',
                    description: 'The duration of the giveaway.',
                    type: 3,
                    required: true,
                },
                {
                    name: 'winners',
                    description: 'The number of winners for the giveaway.',
                    type: 4,
                    required: true,
                },
                {
                    name: 'prize',
                    description: 'The prize of the giveaway.',
                    type: 3,
                    required: true,
                },
                {
                    name: 'autopay',
                    description: 'Automatically pay the winners after the giveaway ends. (Owner/Staff Only)',
                    type: 3,
                    required: false,
                },
                {
                    name: 'image',
                    description: 'Attach an image for the giveaway.',
                    type: 11,
                    required: false,
                },
                {
                    name: 'thumbnail',
                    description: 'Attach a thumbnail for the giveaway.',
                    type: 11,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        if (ctx.replied || ctx.deferred) return;

        // Check if user is an owner for autopay
        const isOwner = this.client.config.owners.includes(ctx.author.id);
        const isServerOwner = this.client.config.serverOwner.includes(ctx.author.id);

        if (!isOwner || !isServerOwner) {
            return await ctx.reply({ content: 'Only the bot owner and server owner can enable autopay for giveaways.', ephemeral: true });
        }

        // Get command parameters
        const durationStr = ctx.isInteraction ? ctx.interaction.options.getString('duration') : args[0];
        const winnersStr = ctx.isInteraction ? ctx.interaction.options.getInteger('winners') : args[1];
        const prize = ctx.isInteraction ? ctx.interaction.options.getString('prize') : args[2];
        const autoPay = ctx.isInteraction ? ctx.interaction.options.getString('autopay') : args[3];

        if (autoPay && !isOwner) {
            return await ctx.reply({ content: 'Only the bot owner can enable autopay for giveaways.', ephemeral: true });
        }

        const image = ctx.isInteraction ? ctx.interaction.options.getAttachment('image') : args[4];
        const thumbnail = ctx.isInteraction ? ctx.interaction.options.getAttachment('thumbnail') : args[5];

        const duration = ms(durationStr); // Converts '1h', '1day', '7week' to milliseconds
        const winners = parseInt(winnersStr, 10); // Parse winners as an integer

        // Check if inputs are valid
        if (!duration || isNaN(winners) || winners <= 0 || !prize) {
            const replyMessage = {
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: client.user.displayName, iconURL: client.user.displayAvatarURL() })
                        .setColor(color.red)
                        .setDescription('Invalid input. Please ensure the duration, number of winners, and prize are correctly provided.'),
                ],
            };
            if (ctx.isInteraction) {
                await ctx.interaction.reply(replyMessage);
            } else {
                await ctx.sendMessage(replyMessage);
            }
            return;
        }

        // Calculate the end time in Unix timestamp
        const endTime = Date.now() + duration; // End time in milliseconds
        const formattedDuration = parseInt(endTime / 1000, 10);

        // Build the giveaway embed
        const giveawayEmbed = new EmbedBuilder()
            .setColor(color.main)
            .setTitle(`${client.utils.formatNumber(prize)} ${emoji.coin}`)
            .setDescription(
                `Click ${emoji.main} button to enter!\nWinners: ${winners}\nHosted by: ${ctx.author.displayName}\nEnds: <t:${formattedDuration}:R>`
            );

        if (image) giveawayEmbed.setImage(image.url);
        if (thumbnail) giveawayEmbed.setThumbnail(thumbnail.url);

        // Giveaway buttons (Join and Participants)
        const joinButton = new ButtonBuilder()
            .setCustomId('giveaway-join')
            .setEmoji(`${emoji.main}`)
            .setLabel('0')
            .setStyle(1)
            .setDisabled(false);

        const participantsButton = new ButtonBuilder()
            .setCustomId('giveaway-participants')
            .setLabel('Participants')
            .setStyle(2)
            .setDisabled(false);

        const buttonRow = new ActionRowBuilder().addComponents(joinButton, participantsButton);

        // Send giveaway message
        let giveawayMessage;
        try {
            giveawayMessage = await ctx.sendMessage({ embeds: [giveawayEmbed], components: [buttonRow], fetchReply: true });
        } catch (err) {
            if (!ctx.replied && !ctx.deferred) {
                await ctx.interaction.reply({ content: 'There was an error sending the giveaway message.' });
            }
            console.error(err);
            return;
        }

        // Handle prize parsing and potential multipliers (k, m, b, etc.)
        let cleanedPrize = prize.replace(/[^0-9,]/g, ''); // Remove non-numeric chars
        let prizeAmountStr = cleanedPrize.replace(/,/g, ''); // Remove commas
        let prizeAmount = parseFloat(prizeAmountStr) || 0; // Default to 0 if parsing fails
        if (prize.match(/[kmbtq]/i)) {
            const multipliers = { k: 1000, m: 1000000, b: 1000000000, t: 1000000000000, q: 1000000000000000 };
            const unit = prize.slice(-1).toLowerCase(); // Get the unit (k, m, etc.)
            prizeAmount *= multipliers[unit];
        }

        // Save giveaway to database
        await GiveawaySchema.create({
            guildId: ctx.guild.id,
            channelId: ctx.channel.id,
            messageId: giveawayMessage.id,
            hostedBy: ctx.author.id,
            winners: winners,
            prize: prizeAmount,
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
