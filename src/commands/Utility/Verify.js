const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const Users = require("../../schemas/user.js");
const gif = require("../../utils/Gif.js");
const emojiImage = require("../../utils/Emoji.js");

module.exports = class Verify extends Command {
    constructor(client) {
        super(client, {
            name: "verify",
            description: {
                content: "Verify your account for $0.99/month.",
                examples: ["verify"],
                usage: "verify",
            },
            category: "utility",
            aliases: ["verification"],
            cooldown: 3,
            permissions: {
                dev: false,
                client: ["SendMessages"],
                user: ["SendMessages"],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const user = await Users.findOne({ userId: ctx.author.id });

        if (!user) {
            return await client.utils.sendErrorMessage(client, ctx, "You do not have an account. Please register first.", color);
        }

        if (user.verification.verify.status === 'verified') {
            return await client.utils.sendErrorMessage(client, ctx, "You are already verified.", color);
        }

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const confirmEmbed = client.embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Verify Account ${emoji.mainRight}`)
            .setDescription("Are you sure you want to verify with PEACHY?\nTo verify, you need to pay **$0.99/month**.");

        await ctx.sendMessage({ embeds: [confirmEmbed], components: [row], ephemeral: true });

        // Step 3: Create collector to handle button interactions
        const filter = i => i.user.id === (ctx.isInteraction ? ctx.interaction.user.id : ctx.author.id);
        const collector = ctx.channel.createMessageComponentCollector({ filter, time: 300000 });

        collector.on('collect', async i => {
            const userPaymentStatus = user.verification.verify.payment;
            if (i.customId === 'confirm') {
                const codeNumber = client.utils.generateVerificationCode();
                const qrCodeUrl = gif.qrUSD;

                const verificationEmbed = client.embed()
                    .setColor(color.main)
                    .setTitle(`${emoji.mainLeft} Verification Request ${emoji.mainRight}`)
                    .setDescription(
                        `You have requested to verify with PEACHY.\n\n` +
                        (userPaymentStatus === 'paid'
                            ? `Your code number is: **${codeNumber}**`
                            : `បន្តពីបង់ប្រាក់រួច សុំជួយផ្ញើររូបមកកាន់ខ្ញុំផង\n\n<@966688007493140591>`)
                    )
                    .setImage(qrCodeUrl);

                const submitButton = new ButtonBuilder()
                    .setCustomId(`submit_${codeNumber}`)
                    .setLabel(`Submit Payment Confirmation`)
                    .setStyle(ButtonStyle.Primary);

                const verificationRow = userPaymentStatus === 'paid' && new ActionRowBuilder().addComponents(submitButton);
                await i.update({ embeds: [verificationEmbed], components: userPaymentStatus === 'paid' ? [verificationRow] : [], ephemeral: true });
            } else if (i.customId === 'cancel') {
                await i.update({ content: "Thank you!", embeds: [], components: [], ephemeral: true });
            }

            collector.stop();
        });

        // Payment confirmation collector
        const paymentFilter = i => i.customId.startsWith('submit_') && i.user.id === (ctx.isInteraction ? ctx.interaction.user.id : ctx.author.id);
        const paymentCollector = ctx.channel.createMessageComponentCollector({ filter: paymentFilter, time: 300000 });

        paymentCollector.on('collect', async i => {
            const submittedCode = i.customId.split('_')[1]; // Extract the code from custom ID

            // Display modal for user input
            const modal = new ModalBuilder()
                .setCustomId('inputCodeModal')
                .setTitle('Input Verification Code');

            const inputField = new TextInputBuilder()
                .setCustomId('verificationCodeInput')
                .setLabel('Enter your verification code:')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Your verification code here')
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(inputField);
            modal.addComponents(actionRow);

            await i.showModal(modal);

            // Store the submitted code in a closure to use later
            const verificationCode = submittedCode;

            // Handle modal submission
            client.once('interactionCreate', async (modalInteraction) => {
                if (!modalInteraction.isModalSubmit()) return;

                if (modalInteraction.customId === 'inputCodeModal') {
                    const inputCode = modalInteraction.fields.getTextInputValue('verificationCodeInput');

                    if (inputCode === verificationCode) {
                        await Users.updateOne(
                            { userId: ctx.author.id },
                            {
                                $set: {
                                    "verification.verify.payment": "paid",
                                    "verification.verify.code": verificationCode,
                                    "verification.verify.status": "verified",
                                    "verification.verify.message": "Thank you for supporting and verifying with PEACHY! Your benefit is to all claim +20% and better luck with gambling!"
                                }
                            }
                        );

                        const successEmbed = client.embed()
                            .setColor(color.main)
                            .setTitle(`${emoji.mainLeft} Verification Successful ${emoji.mainRight}`)
                            .setDescription(`Thank you for supporting and verifying with PEACHY!\nYour benefit is to all claim +20% and better luck with gambling! ${emojiImage.congratulation}`)
                            .setThumbnail(client.utils.emojiToImage(emojiImage.normal));

                        // Use reply based on interaction state
                        if (modalInteraction.replied || modalInteraction.deferred) {
                            await modalInteraction.followUp({ embeds: [successEmbed] });
                        } else {
                            await modalInteraction.reply({ embeds: [successEmbed] });
                        }

                        // Update the original verification embed to remove components and embed
                        const messageToUpdate = await modalInteraction.channel.messages.fetch(i.message.id);
                        await messageToUpdate.edit({ content: 'Verification complete.', embeds: [], components: [] });
                    } else {
                        await modalInteraction.reply({ content: "Payment verification failed or the code is incorrect. Please try again.", ephemeral: true });
                    }
                }
            });
        });

        paymentCollector.on('end', collected => {
            if (collected.size === 0) {
                ctx.sendMessage({ content: "No response received. Please try again.", ephemeral: true });
            }
        });
    }
};
