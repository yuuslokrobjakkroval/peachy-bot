const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const Users = require("../../schemas/user");
const globalGif = require("../../utils/Gif");
const globalEmoji = require("../../utils/Emoji");

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
            aliases: ["verification", "v"],
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
        const verifyMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.verifyMessages;

        const user = await Users.findOne({ userId: ctx.author.id });

        if (!user) {
            return await client.utils.sendErrorMessage(client, ctx, verifyMessages?.noAccount || "You do not have an account. Please register first.", color);
        }

        if (user.verification.verify.status === 'verified') {
            return await client.utils.sendErrorMessage(client, ctx, verifyMessages?.alreadyVerified || "You are already verified.", color);
        }

        const confirmButton = client.utils.labelButton('confirm', verifyMessages?.confirmButtonLabel || 'Confirm', 3);
        const cancelButton = client.utils.labelButton('cancel', verifyMessages?.cancelButtonLabel || 'Cancel', 4);

        const row = client.utils.createButtonRow(confirmButton, cancelButton);

        const confirmEmbed = client.embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} ${verifyMessages?.title || 'Verify Account'} ${emoji.mainRight}`)
            .setDescription(
                `${verifyMessages?.confirmationMessage || "Are you sure you want to verify with **PEACHY**?"}\n\n` +
                `${verifyMessages?.paymentInfo || "To verify, you need to pay **$0.99/month**."}\n\n` +
                `${verifyMessages?.benefitsTitle || "**Benefits**"}\n` +
                `${verifyMessages?.benefits || "• Role verification in our server\n• Get an emoji while playing the bot\n• Add 20% to all rewards when claiming"}`
            )
            .setFooter({
                text: `${verifyMessages?.requestedBy || "Requested By"} ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        ctx.sendMessage({ embeds: [confirmEmbed], components: [row], ephemeral: true });

        // Step 3: Create collector to handle button interactions
        const filter = i => i.user.id === (ctx.isInteraction ? ctx.interaction.user.id : ctx.author.id);
        const collector = ctx.channel.createMessageComponentCollector({ filter, time: 300000 });

        collector.on('collect', async i => {
            if (i.replied || i.deferred) return;
            const userPaymentStatus = user.verification.verify.payment;
            if (i.customId === 'confirm') {
                const codeNumber = client.utils.generateVerificationCode();
                const qrCodeUrl = globalGif.qrUSD;

                const verificationEmbed = client.embed()
                    .setColor(color.main)
                    .setTitle(`${emoji.mainLeft} ${verifyMessages?.verificationRequest || 'Verification Request'} ${emoji.mainRight}`)
                    .setDescription(
                        `${verifyMessages?.verificationMessage || "You have requested to verify with PEACHY."}\n` +
                        (userPaymentStatus === 'paid'
                            ? `${verifyMessages?.submitButtonMessage || "Click the button below to submit your verification code."}`
                            : `${verifyMessages?.waitForPayment || "If you've made a payment, please wait a moment. If not, please send a message to <@966688007493140591>."}`)
                    )
                    .setFooter({
                        text: `${verifyMessages?.requestedBy || "Requested By"} ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });

                userPaymentStatus !== 'paid' && verificationEmbed.setImage(qrCodeUrl);

                const submitButton = client.utils.labelButton(`submit_${codeNumber}`, verifyMessages?.submitButton || 'Submit', 3);

                const verificationRow = userPaymentStatus === 'paid' && client.utils.createButtonRow(submitButton) ;
                await i.update({ embeds: [verificationEmbed], components: userPaymentStatus === 'paid' ? [verificationRow] : [], ephemeral: true });
            } else if (i.customId === 'cancel') {
                await i.update({ content: verifyMessages?.thankYou || "Thank you!", embeds: [], components: [], ephemeral: true });
            }

            collector.stop();
        });

        // Payment confirmation collector
        const paymentFilter = i => i.customId.startsWith('submit_') && i.user.id === (ctx.isInteraction ? ctx.interaction.user.id : ctx.author.id);
        const paymentCollector = ctx.channel.createMessageComponentCollector({ filter: paymentFilter, time: 300000 });

        paymentCollector.on('collect', async i => {
            if (i.replied || i.deferred) return;
            const submittedCode = i.customId.split('_')[1]; // Extract the code from custom ID

            // Display modal for user input
            const modal = new ModalBuilder()
                .setCustomId('inputCodeModal')
                .setTitle(verifyMessages?.modalTitle || 'Input Verification Code');

            const inputField = new TextInputBuilder()
                .setCustomId('verificationCodeInput')
                .setLabel(`${verifyMessages?.verificationCodeLabel || 'Verification Code'}: ${submittedCode}`)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(verifyMessages?.placeholder || 'Enter your verification code here')
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
                                    "verification.verify.message": verifyMessages?.successMessage || "Thank you for supporting and verifying with PEACHY!"
                                }
                            }
                        );

                        const successEmbed = client.embed()
                            .setColor(color.main)
                            .setTitle(`${emoji.mainLeft} ${verifyMessages?.verificationSuccessful || 'Verification Successful'} ${emoji.mainRight}`)
                            .setDescription(`${verifyMessages?.thankYouForVerifying || "Thank you for supporting and verifying!"} ${globalEmoji.verify}\n `)
                            .setImage(globalGif.thanks)
                            .setFooter({
                                text: `${verifyMessages?.requestedBy || "Requested By"} ${ctx.author.displayName}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        // Use reply based on interaction state
                        if (modalInteraction.replied || modalInteraction.deferred) {
                            await modalInteraction.followUp({ embeds: [successEmbed] });
                        } else {
                            await modalInteraction.reply({ embeds: [successEmbed] });
                        }

                        // Update the original verification embed to remove components and embed
                        const messageToUpdate = await modalInteraction.channel.messages.fetch(i.message.id);
                        await messageToUpdate.edit({ content: verifyMessages?.verificationComplete || 'Verification complete.', embeds: [], components: [] });
                    } else {
                        await modalInteraction.reply({ content: verifyMessages?.verificationFailed || "Verification failed or the code is incorrect. Please try again.", ephemeral: true });
                    }
                }
            });
        });

        paymentCollector.on('end', collected => {
            if (collected.size === 0) {
                ctx.sendMessage({ content: verifyMessages?.noResponseReceived || "No response received. Please try again.", ephemeral: true });
            }
        });
    }
};
