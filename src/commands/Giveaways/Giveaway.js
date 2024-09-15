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
                dev: true,
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
                    description: 'Automatically pay the winners after the giveaway ends.',
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

    async run(client, ctx, args) {
        if (ctx.replied || ctx.deferred) return;

        const durationStr = ctx.isInteraction ? ctx.interaction.options.getString('duration') : args[0];
        const winnersStr = ctx.isInteraction ? ctx.interaction.options.getInteger('winners') : args[1];
        const prize = ctx.isInteraction ? ctx.interaction.options.getString('prize') : args[2];
        const autoPay = ctx.isInteraction ? ctx.interaction.options.getString('autopay') : args[3];
        const image = ctx.isInteraction ? ctx.interaction.options.getAttachment('image') : args[4];
        const thumbnail = ctx.isInteraction ? ctx.interaction.options.getAttachment('thumbnail') : args[5];

        const duration = ms(durationStr);
        const winners = parseInt(winnersStr, 10);

        if (!duration || isNaN(winners) || winners <= 0 || !prize) {
            await ctx.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: client.user.displayName, iconURL: client.user.displayAvatarURL() })
                        .setColor(client.color.red)
                        .setDescription('Invalid input. Please ensure the duration, number of winners, and prize are correctly provided.'),
                ],
            });
            return;
        }

        const endTime = Date.now() + duration;
        const formattedDuration = parseInt(endTime / 1000, 10);

        const giveawayEmbed = new EmbedBuilder()
            .setColor(client.color.main)
            .setTitle(`${client.utils.formatNumber(prize)} ${client.emoji.coin}`)
            .setDescription(
                `Click ${client.emoji.main} button to enter!
Winners: ${winners}
Hosted by: ${ctx.author.displayName}
Ends: <t:${formattedDuration}:R>`
            );

        if (image) {
            giveawayEmbed.setImage(image.url);
        }

        if (thumbnail) {
            giveawayEmbed.setThumbnail(thumbnail.url);
        }

        const joinButton = new ButtonBuilder()
            .setCustomId('giveaway-join')
            .setEmoji(`${client.emoji.main}`)
            .setLabel('0')
            .setStyle(1)
            .setDisabled(false);

        const participantsButton = new ButtonBuilder()
            .setCustomId('giveaway-participants')
            .setLabel('Participants')
            .setStyle(2)
            .setDisabled(false);

        const buttonRow = new ActionRowBuilder().addComponents(joinButton, participantsButton);

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

        let cleanedPrize = prize.replace(/[^0-9,]/g, '');
        let prizeAmountStr = cleanedPrize.replace(/,/g, '');
        let prizeAmount = parseFloat(prizeAmountStr) || 0;
        if (prize.match(/[kmbtq]/i)) {
            const multipliers = { k: 1000, m: 1000000, b: 1000000000 };
            const unit = prize.slice(-1).toLowerCase();
            prizeAmount = prizeAmount * multipliers[unit];
        }

        await GiveawaySchema.create({
            guildId: ctx.guild.id,
            channelId: ctx.channel.id,
            messageId: giveawayMessage.id,
            hostedBy: ctx.author.id,
            winners: winners,
            prize: prizeAmount,
            endTime: formattedDuration,
            paused: false,
            ended: false,
            entered: [],
            autopay: !!autoPay,
            rerollOptions: [],
        }).then(async data => {
            // Wrap the setTimeout in an async function for better error handling
            setTimeout(async () => {
                try {
                    // Re-fetch the giveaway to ensure the most up-to-date status
                    const giveawayData = await GiveawaySchema.findById(data?._id);
                    if (giveawayData && !giveawayData.ended) {
                        await client.utils.endGiveaway(client, giveawayMessage, giveawayData.autopay);
                    }
                } catch (err) {
                    console.error(`Error ending giveaway: ${err.message}`);
                }
            }, duration);
        });
    }
};
