const { Command } = require("../../structures/index.js");
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	SectionBuilder,
	SeparatorBuilder,
	MediaGalleryBuilder,
	MessageFlags,
} = require("discord.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Punch extends Command {
	constructor(client) {
		super(client, {
			name: "punch",
			description: {
				content: "Throws a playful punch at the mentioned user.",
				examples: ["punch @User"],
				usage: "punch @User",
			},
			category: "actions",
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
					name: "user",
					description: "Mention the user you want to punch.",
					type: 6, // USER type
					required: true,
				},
			],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		try {
			// Default messages for all required properties
			const defaultMessages = {
				generalMessages: {
					title: "%{mainLeft} %{title} %{mainRight}",
					requestedBy: "Requested by %{username}",
				},
				actionMessages: {
					punchMessages: {
						description: "%{displayName} punches %{target}!",
						errors: {
							noUser: "You need to mention a user to punch.",
							selfPunch: "You cannot punch yourself.",
						},
						reactions: {
							punch_back: "Punch back",
							dodge: "Dodge",
							block: "Block",
						},
						punchBack: "%{displayName} punches %{target} back! It's a brawl!",
						dodgeReaction: "%{displayName} swiftly dodges %{target}'s punch!",
						blockReaction:
							"%{displayName} blocks %{target}'s punch with perfect timing!",
					},
				},
			};

			// Get messages from language file with fallbacks
			const generalMessages =
				language.locales.get(language.defaultLocale)?.generalMessages ||
				defaultMessages.generalMessages;

			// Get punch messages with complete fallbacks
			let punchMessages = language.locales.get(language.defaultLocale)
				?.actionMessages?.punchMessages;

			// If punchMessages is completely undefined, use the default
			if (!punchMessages) {
				punchMessages = defaultMessages.actionMessages.punchMessages;
			} else {
				// Ensure all required properties exist
				punchMessages.description =
					punchMessages.description ||
					defaultMessages.actionMessages.punchMessages.description;
				punchMessages.errors =
					punchMessages.errors ||
					defaultMessages.actionMessages.punchMessages.errors;

				// Add reaction messages if they don't exist
				if (!punchMessages.reactions) {
					punchMessages.reactions =
						defaultMessages.actionMessages.punchMessages.reactions;
				}

				punchMessages.punchBack =
					punchMessages.punchBack ||
					defaultMessages.actionMessages.punchMessages.punchBack;
				punchMessages.dodgeReaction =
					punchMessages.dodgeReaction ||
					defaultMessages.actionMessages.punchMessages.dodgeReaction;
				punchMessages.blockReaction =
					punchMessages.blockReaction ||
					defaultMessages.actionMessages.punchMessages.blockReaction;
			}

			const errorMessages = punchMessages.errors;

			// Get target user
			const target = ctx.isInteraction
				? ctx.interaction.options.getUser("user")
				: ctx.message.mentions.users.first() ||
					(await client.users.fetch(args[0]).catch(() => null));

			// Error handling if no user is mentioned or the user punches themselves
			if (!target) {
				return await client.utils.sendErrorMessage(
					client,
					ctx,
					errorMessages.noUser,
					color,
				);
			}

			if (target.id === ctx.author.id) {
				return await client.utils.sendErrorMessage(
					client,
					ctx,
					errorMessages.selfPunch,
					color,
				);
			}

			// Get random emoji
			const randomEmoji = client.utils.getRandomElement(
				emoji.actions?.punches ||
					globalEmoji.actions?.punches || ["👊", "🥊", "💥"],
			);

			// Create the container with Components v2
			const punchContainer = new ContainerBuilder()
				.setAccentColor(color.main)
				.addTextDisplayComponents((text) =>
					text.setContent(
						generalMessages.title
							.replace("%{mainLeft}", emoji.mainLeft || "👊")
							.replace("%{title}", "PUNCH")
							.replace("%{mainRight}", emoji.mainRight || "👊"),
					),
				)
				.addSeparatorComponents((sep) => sep)
				.addSectionComponents((section) =>
					section
						.addTextDisplayComponents((text) =>
							text.setContent(
								punchMessages.description
									.replace("%{displayName}", `**${ctx.author.displayName}**`)
									.replace("%{target}", `**${target.displayName}**`),
							),
						)
						.setThumbnailAccessory((thumb) =>
							thumb
								.setURL(target.displayAvatarURL({ dynamic: true, size: 256 }))
								.setDescription(target.displayName),
						),
				)
				.addSeparatorComponents((sep) => sep.setDivider(false))
				.addMediaGalleryComponents((gallery) =>
					gallery.addItems((item) =>
						item
							.setURL(client.utils.emojiToImage(randomEmoji))
							.setDescription("Punch animation"),
					),
				)
				.addSeparatorComponents((sep) => sep)
				.addTextDisplayComponents((text) =>
					text.setContent(
						`*${generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`}*`,
					),
				);

			// Create reaction buttons (only for the target to use)
			const punchBackButton = new ButtonBuilder()
				.setCustomId(`punch_back_${ctx.author.id}_${target.id}`)
				.setLabel(punchMessages.reactions.punch_back || "Punch back")
				.setStyle(ButtonStyle.Danger)
				.setEmoji("👊");

			const dodgeButton = new ButtonBuilder()
				.setCustomId(`dodge_${ctx.author.id}_${target.id}`)
				.setLabel(punchMessages.reactions.dodge || "Dodge")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("💨");

			const blockButton = new ButtonBuilder()
				.setCustomId(`block_${ctx.author.id}_${target.id}`)
				.setLabel(punchMessages.reactions.block || "Block")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("🛡️");

			const row = new ActionRowBuilder().addComponents(
				punchBackButton,
				dodgeButton,
				blockButton,
			);

			// Send the message with Components v2 and buttons
			const message = await ctx.sendMessage({
				components: [punchContainer, row],
				flags: MessageFlags.IsComponentsV2,
			});

			// Create collector for button interactions
			const collector = message.createMessageComponentCollector({
				filter: (i) => {
					// Only the target can interact with the buttons
					if (i.user.id !== target.id) {
						i.reply({
							content: "Only the person who was punched can use these buttons!",
							flags: 64,
						});
						return false;
					}
					return true;
				},
				time: 60000, // 1 minute timeout
			});

			collector.on("collect", async (interaction) => {
				const [action, authorId, targetId] = interaction.customId.split("_");

				// Determine response details based on action
				let responseDescription = "";
				let responseEmoji = "";
				let responseColor = color.main;

				switch (action) {
					case "punch":
						responseDescription = punchMessages.punchBack
							.replace("%{displayName}", `**${target.displayName}**`)
							.replace("%{target}", `**${ctx.author.displayName}**`);
						responseEmoji = client.utils.getRandomElement(
							emoji.actions?.punches ||
								globalEmoji.actions?.punches || ["👊", "🥊", "💥"],
						);
						responseColor = color.danger;
						break;

					case "dodge":
						responseDescription = punchMessages.dodgeReaction
							.replace("%{displayName}", `**${target.displayName}**`)
							.replace("%{target}", `**${ctx.author.displayName}**`);
						responseEmoji = emoji.dodge || "💨";
						responseColor = color.success;
						break;

					case "block":
						responseDescription = punchMessages.blockReaction
							.replace("%{displayName}", `**${target.displayName}**`)
							.replace("%{target}", `**${ctx.author.displayName}**`);
						responseEmoji = emoji.block || "🛡️";
						responseColor = color.main;
						break;
				}

				// Create response container with Components v2
				const responseContainer = new ContainerBuilder()
					.setAccentColor(responseColor)
					.addSectionComponents((section) =>
						section
							.addTextDisplayComponents(
								(text) =>
									text.setContent(
										`**${target.displayName}** → **${ctx.author.displayName}**`,
									),
								(text) => text.setContent(responseDescription),
							)
							.setThumbnailAccessory((thumb) =>
								thumb
									.setURL(
										ctx.author.displayAvatarURL({ dynamic: true, size: 256 }),
									)
									.setDescription(ctx.author.displayName),
							),
					)
					.addSeparatorComponents((sep) => sep.setDivider(false));

				// Only add media gallery if emoji is a custom Discord emoji
				const emojiImageURL = client.utils.emojiToImage(responseEmoji);
				if (emojiImageURL) {
					responseContainer.addMediaGalleryComponents((gallery) =>
						gallery.addItems((item) =>
							item.setURL(emojiImageURL).setDescription("Response animation"),
						),
					);
				}

				// Disable all buttons
				const disabledRow = new ActionRowBuilder().addComponents(
					ButtonBuilder.from(punchBackButton).setDisabled(true),
					ButtonBuilder.from(dodgeButton).setDisabled(true),
					ButtonBuilder.from(blockButton).setDisabled(true),
				);

				// Update the message with the response and disabled buttons
				await interaction.update({
					components: [responseContainer, disabledRow],
					flags: MessageFlags.IsComponentsV2,
				});

				// Stop the collector since an action was taken
				collector.stop();
			});

			collector.on("end", async (collected, reason) => {
				if (reason === "time" && message.editable) {
					// If no button was pressed, disable all buttons
					try {
						const disabledRow = new ActionRowBuilder().addComponents(
							ButtonBuilder.from(punchBackButton).setDisabled(true),
							ButtonBuilder.from(dodgeButton).setDisabled(true),
							ButtonBuilder.from(blockButton).setDisabled(true),
						);

						await message.edit({
							components: [punchContainer, disabledRow],
							flags: MessageFlags.IsComponentsV2,
						});
					} catch (error) {
						console.error("Error disabling buttons:", error);
					}
				}
			});
		} catch (error) {
			console.error("Failed to send punch message:", error);
			await client.utils.sendErrorMessage(
				client,
				ctx,
				"An error occurred while executing the command.",
				color,
			);
		}
	}
};
