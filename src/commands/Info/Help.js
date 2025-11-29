const Command = require("../../structures/Command.js");
const {
	StringSelectMenuBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Help extends Command {
	constructor(client) {
		super(client, {
			name: "help",
			description: {
				content: "Displays the commands of the bot",
				examples: ["help"],
				usage: "help",
			},
			category: "info",
			aliases: ["h"],
			cooldown: 3,
			args: false,
			player: {
				voice: false,
				dj: false,
				active: false,
				djPerm: null,
			},
			permissions: {
				dev: false,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: true,
			options: [
				{
					name: "command",
					description: "The command you want to get info on",
					type: 3,
					required: false,
				},
			],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const categoriesMessages = language.locales.get(language.defaultLocale)
			?.informationMessages?.helpMessages?.categoriesMessages;
		const prefix = client.config.prefix;

		const adminCategory = [
			"admin",
			"company",
			"dev",
			"developer",
			"guild",
			"owner",
			"staff",
		];

		// Enhanced categories with emojis and descriptions
		const categories = [
			{
				name: "actions",
				emoji: emoji.help.actions
					? emoji.help.actions
					: globalEmoji.help.actions || "⚡",
				description: "User interaction commands",
			},
			{
				name: "bank",
				emoji: emoji.help.bank
					? emoji.help.bank
					: globalEmoji.help.bank || "🏦",
				description: "Banking and money management",
			},
			{
				name: "building",
				emoji: emoji.help.building
					? emoji.help.building
					: globalEmoji.help.building || "🏗️",
				description: "Building and construction",
			},
			{
				name: "economy",
				emoji: emoji.help.economy
					? emoji.help.economy
					: globalEmoji.help.economy || "💰",
				description: "Economy and trading system",
			},
			{
				name: "emotes",
				emoji: emoji.help.emotes
					? emoji.help.emotes
					: globalEmoji.help.emotes || "😊",
				description: "Fun emoji and reaction commands",
			},
			{
				name: "gambling",
				emoji: emoji.help.gambling
					? emoji.help.gambling
					: globalEmoji.help.gambling || "🎲",
				description: "Risk and reward games",
			},
			{
				name: "games",
				emoji: emoji.help.games
					? emoji.help.games
					: globalEmoji.help.games || "🎮",
				description: "Interactive gaming commands",
			},
			{
				name: "giveaways",
				emoji: emoji.help.giveaways
					? emoji.help.giveaways
					: globalEmoji.help.giveaways || "🎁",
				description: "Giveaway management tools",
			},
			{
				name: "info",
				emoji: emoji.help.info ? emoji.help.info : globalEmoji.help.info || "ℹ️",
				description: "Information and help commands",
			},
			{
				name: "inventory",
				emoji: emoji.help.inventory
					? emoji.help.inventory
					: globalEmoji.help.inventory || "🎒",
				description: "Item and inventory management",
			},
			{
				name: "profile",
				emoji: emoji.help.profile
					? emoji.help.profile
					: globalEmoji.help.profile || "👤",
				description: "User profile customization",
			},
			{
				name: "rank",
				emoji: emoji.help.rank
					? emoji.help.rank
					: globalEmoji.help.rank || "🏆",
				description: "Ranking and leaderboards",
			},
			{
				name: "relationship",
				emoji: emoji.help.relationship
					? emoji.help.relationship
					: globalEmoji.help.relationship || "💕",
				description: "Relationship and dating",
			},
			{
				name: "social",
				emoji: emoji.help.social
					? emoji.help.social
					: globalEmoji.help.social || "👥",
				description: "Social interaction features",
			},
			{
				name: "utility",
				emoji: emoji.help.utility
					? emoji.help.utility
					: globalEmoji.help.utility || "🛠️",
				description: "Helpful utility commands",
			},
		];

		const commands = client.commands.filter(
			(cmd) => !adminCategory.includes(cmd.category),
		);
		let selectedCategories = [];

		// Pagination settings
		const COMMANDS_PER_PAGE = 8;
		const categoryPages = {};

		// Calculate pages for each category
		categories.forEach((category) => {
			const categoryCommands = commands.filter(
				(cmd) => cmd.category.toLowerCase() === category.name.toLowerCase(),
			);
			categoryPages[category.name] =
				Math.ceil(categoryCommands.size / COMMANDS_PER_PAGE) || 1;
		});

		// Message Options
		if (!args[0]) {
			const messageOptions = () => {
				const totalCommands = categories.reduce((sum, category) => {
					const categoryCommands = commands.filter(
						(cmd) => cmd.category.toLowerCase() === category.name.toLowerCase(),
					);
					return sum + categoryCommands.size;
				}, 0);

				// Create modern main help embed with enhanced visual hierarchy
				const helpEmbed = client
					.embed()
					.setColor(color.main)
					.setTitle("🌟 PEACHY 🌟")
					.setDescription(
						`**Welcome to PEACHY's Command Center!**\n` +
							`Discover ${totalCommands}+ powerful commands organized into ${categories.length} categories.\n\n` +
							`╭─ **Quick Start Guide**\n` +
							`├ 📖 \`${prefix}help [command]\` - Get detailed command\n` +
							`╰─ 💡 \`${prefix}help bal\` - Example command lookup\n` +
							`${emoji.main?.signature || "🎨"} *Powered by advanced interactive navigation*`,
					)
					.setThumbnail(
						client.user.displayAvatarURL({ dynamic: true, size: 512 }),
					)
					.setImage(client.config.links.banner)
					.setFooter({
						text: `🚀 ${totalCommands} commands • ${categories.length} categories`,
						iconURL: client.user.displayAvatarURL(),
					})
					.setTimestamp();

				// Group categories in a clean, simple layout
				const entertainmentCategories = categories.filter((cat) =>
					["actions", "emotes", "games", "social", "relationship"].includes(
						cat.name,
					),
				);
				const economyCategories = categories.filter((cat) =>
					["bank", "economy", "gambling", "inventory", "building"].includes(
						cat.name,
					),
				);
				const utilityCategories = categories.filter((cat) =>
					["giveaways", "info", "profile", "rank", "utility"].includes(
						cat.name,
					),
				);

				if (entertainmentCategories.length > 0) {
					helpEmbed.addFields({
						name: "🎮 Entertainment & Social Hub",
						value:
							`╭─ **Interactive & Fun Commands**\n` +
							entertainmentCategories
								.map((category) => {
									return `├ ${category.emoji} **${
										categoriesMessages[category.name.toLowerCase()] ||
										client.utils.formatCapitalize(category.name)
									}**`;
								})
								.join("\n") +
							`\n╰─ *Community engagement & fun activities*`,
						inline: false,
					});
				}

				if (economyCategories.length > 0) {
					helpEmbed.addFields({
						name: "💰 Economy & Trading Center",
						value:
							`╭─ **Financial & Resource Management**\n` +
							economyCategories
								.map((category) => {
									return `├ ${category.emoji} **${
										categoriesMessages[category.name.toLowerCase()] ||
										client.utils.formatCapitalize(category.name)
									}**`;
								})
								.join("\n") +
							`\n╰─ *Build wealth, manage resources & trade items*`,
						inline: false,
					});
				}

				if (utilityCategories.length > 0) {
					helpEmbed.addFields({
						name: "🛠️ Utility & Management Suite",
						value:
							`╭─ **Tools & Administration**\n` +
							utilityCategories
								.map((category) => {
									return `├ ${category.emoji} **${
										categoriesMessages[category.name.toLowerCase()] ||
										client.utils.formatCapitalize(category.name)
									}**`;
								})
								.join("\n") +
							`\n╰─ *Essential tools & personal management*`,
						inline: false,
					});
				}

				// Enhanced multi-select dropdown
				const categoryOptions = categories.map((category) => {
					const categoryCommandCount = commands.filter(
						(cmd) => cmd.category.toLowerCase() === category.name.toLowerCase(),
					).size;
					return {
						emoji: emoji.help[category.name.toLowerCase()]
							? emoji.help[category.name.toLowerCase()]
							: globalEmoji.help[category.name.toLowerCase()],
						label:
							categoriesMessages[category.name.toLowerCase()] ||
							client.utils.formatCapitalize(category.name),
						description: `${categoryCommandCount} commands available`,
						value: category.name.toLowerCase(),
						default: selectedCategories.includes(category.name.toLowerCase()),
					};
				});

				const categorySelectMenu = new StringSelectMenuBuilder()
					.setCustomId("category_select")
					.setPlaceholder(
						`${emoji.decoration?.main || "🎯"} Select categories to explore • ${totalCommands} commands available`,
					)
					.setMinValues(1)
					.setMaxValues(Math.min(categories.length, 25))
					.addOptions(categoryOptions);

				// Enhanced navigation buttons with modern styling
				const homeButton = new ButtonBuilder()
					.setCustomId("home")
					.setLabel("🏠 Command Hub")
					.setStyle(ButtonStyle.Primary);

				const dashboardButton = new ButtonBuilder()
					.setLabel("🌐 Dashboard")
					.setStyle(ButtonStyle.Link)
					.setURL(client.config.links.dashboard || `https://peachyganggg.com`);

				const supportButton = new ButtonBuilder()
					.setLabel("💬 Get Help")
					.setStyle(ButtonStyle.Link)
					.setURL(
						client.config.links.support || "https://discord.gg/peachyganggg",
					);

				const quickTipButton = new ButtonBuilder()
					.setCustomId("quick_tips")
					.setLabel("💡 Quick Tips")
					.setStyle(ButtonStyle.Secondary);

				const selectRow = new ActionRowBuilder().addComponents(
					categorySelectMenu,
				);
				const buttonRow = new ActionRowBuilder().addComponents(
					homeButton,
					quickTipButton,
					dashboardButton,
					supportButton,
				);

				return {
					embeds: [helpEmbed],
					components: [selectRow, buttonRow],
				};
			};

			// Send Help Message
			const replyMessage = await (ctx.isInteraction
				? ctx.interaction.reply({ ...messageOptions(), fetchReply: true })
				: ctx.channel.send({ ...messageOptions(), fetchReply: true }));

			// Track current page for each category
			const currentPages = {};
			categories.forEach((category) => {
				currentPages[category.name] = 1;
			});

			// Enhanced collector with better error handling
			const collector = replyMessage.createMessageComponentCollector({
				filter: (interaction) => interaction.user.id === ctx.author.id,
				time: 600000, // 10 minutes for better user experience
			});

			collector.on("collect", async (interaction) => {
				try {
					if (interaction.customId === "home") {
						selectedCategories = [];
						await interaction.update(messageOptions());
						return;
					}

					if (interaction.customId === "quick_tips") {
						const tipsEmbed = client
							.embed()
							.setColor(color.main)
							.setTitle(
								`${emoji.decoration?.main || "💡"} Quick Tips & Shortcuts`,
							)
							.setDescription(
								`**Master PEACHY like a pro!** Here are some power-user tips:\n\n` +
									`╭─ **Navigation Tips**\n` +
									`├ 🔍 Type command names directly for instant search\n` +
									`├ 📚 Use \`${prefix}help [category]\` to jump to categories\n` +
									`├ ⭐ Select multiple categories for comparison\n` +
									`├ 🔄 Use arrow keys to navigate through pages\n` +
									`╰─ 💾 Bookmark frequently used commands\n\n` +
									`╭─ **Command Shortcuts**\n` +
									`├ ⚡ Commands with lightning bolt = Fast (≤3s cooldown)\n` +
									`├ ⏱️ Commands with clock = Medium (≤10s cooldown)\n` +
									`├ 🕐 Commands with slow clock = Long cooldown\n` +
									`├ +N = Number of command aliases available\n` +
									`╰─ Use aliases for faster typing!\n\n` +
									`${emoji.thankYou || "✨"} *Happy commanding!*`,
							)
							.setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
							.setFooter({
								text: "💡 Pro tip: These tips will make you a PEACHY expert!",
								iconURL: ctx.author.displayAvatarURL(),
							})
							.setTimestamp();

						const backButton = new ButtonBuilder()
							.setCustomId("back_to_main")
							.setLabel("← Back to Hub")
							.setStyle(ButtonStyle.Secondary);

						const tipRow = new ActionRowBuilder().addComponents(backButton);

						await interaction.update({
							embeds: [tipsEmbed],
							components: [tipRow],
						});
						return;
					}

					if (interaction.customId === "back_to_main") {
						await interaction.update(messageOptions());
						return;
					}

					// Handle pagination buttons
					if (
						interaction.customId.startsWith("prev_page_") ||
						interaction.customId.startsWith("next_page_")
					) {
						const parts = interaction.customId.split("_page_");
						const action = parts[0];
						const category = parts[1];

						if (action === "prev" && currentPages[category] > 1) {
							currentPages[category]--;
						} else if (
							action === "next" &&
							currentPages[category] < categoryPages[category]
						) {
							currentPages[category]++;
						}

						await this.showCategoryPage(
							interaction,
							category,
							currentPages[category],
							categoryPages[category],
							commands,
							COMMANDS_PER_PAGE,
							client,
							color,
							emoji,
							categoriesMessages,
							prefix,
							categories,
						);
						return;
					}

					if (interaction.customId === "category_select") {
						selectedCategories = interaction.values;

						// Reset pages for selected categories
						selectedCategories.forEach((cat) => {
							currentPages[cat] = 1;
						});

						await this.showMultiCategoryView(
							interaction,
							selectedCategories,
							currentPages,
							categoryPages,
							commands,
							COMMANDS_PER_PAGE,
							client,
							color,
							emoji,
							categoriesMessages,
							prefix,
							categories,
						);
					}

					// Handle additional button interactions
					if (interaction.customId === "clear_selection") {
						selectedCategories = [];
						await interaction.update(messageOptions());
					}
				} catch (error) {
					console.error("Help command collector error:", error);
					await interaction
						.followUp({
							content:
								"❌ An error occurred while processing your request. Please try again!",
							ephemeral: true,
						})
						.catch(() => {});
				}
			});

			collector.on("end", () => {
				const disabledComponents = replyMessage.components.map((row) => {
					const newRow = new ActionRowBuilder();
					row.components.forEach((component) => {
						if (component.type === 3) {
							newRow.addComponents(
								StringSelectMenuBuilder.from(component).setDisabled(true),
							);
						} else if (
							component.type === 2 &&
							component.style !== ButtonStyle.Link
						) {
							newRow.addComponents(
								ButtonBuilder.from(component).setDisabled(true),
							);
						} else {
							newRow.addComponents(component);
						}
					});
					return newRow;
				});

				replyMessage
					.edit({
						embeds: [
							{
								...replyMessage.embeds[0],
								footer: {
									text: "⏰ This help session has expired. Run the command again to continue browsing!",
									iconURL: client.user.displayAvatarURL(),
								},
							},
						],
						components: disabledComponents,
					})
					.catch(() => {});
			});
		} else {
			// Enhanced individual command help
			const command = client.commands.get(args[0].toLowerCase());
			if (!command) {
				// Try to find similar commands
				const allCommands = Array.from(client.commands.values());
				const similarCommands = allCommands
					.filter(
						(cmd) =>
							cmd.name.toLowerCase().includes(args[0].toLowerCase()) ||
							cmd.aliases.some((alias) =>
								alias.toLowerCase().includes(args[0].toLowerCase()),
							) ||
							args[0].toLowerCase().includes(cmd.name.toLowerCase()),
					)
					.slice(0, 5);

				return ctx.sendMessage({
					embeds: [
						client
							.embed()
							.setColor(color.danger)
							.setTitle(`${emoji.result?.deny || "❌"} Command Not Found`)
							.setDescription(
								`🔍 Could not find command: **\`${args[0]}\`**\n\n` +
									(similarCommands.length > 0
										? `**💡 Did you mean one of these?**\n${similarCommands.map((cmd) => `• \`${prefix}help ${cmd.name}\` - ${cmd.description.content.slice(0, 30)}...`).join("\n")}\n\n`
										: "") +
									`**🎯 Quick Solutions:**\n` +
									`╭─ Check your spelling and try again\n` +
									`├─ Use \`${prefix}help\` to browse all commands\n` +
									`├─ Commands are **case-insensitive** now!\n` +
									`├─ Try searching by category name\n` +
									`╰─ Use the dropdown menu for easier browsing\n\n` +
									`${emoji.decoration?.main || "✨"} **Pro tip:** Use \`${prefix}help\` and select categories!`,
							)
							.setFooter({
								text: `💭 ${similarCommands.length > 0 ? "Found similar commands above" : "No similar commands found"} • Try the interactive help menu!`,
								iconURL: client.user.displayAvatarURL(),
							})
							.setTimestamp(),
					],
				});
			}

			// Find category info for enhanced display
			const categoryInfo = categories.find(
				(cat) => cat.name === command.category.toLowerCase(),
			);
			const categoryEmoji = categoryInfo
				? emoji.help[categoryInfo.name.toLowerCase()]
					? emoji.help[categoryInfo.name.toLowerCase()]
					: globalEmoji.help[categoryInfo.name.toLowerCase()]
				: "📁";
			const categoryDesc = categoryInfo
				? categoryInfo.description
				: "General commands";

			// Create modern command detail embed with enhanced styling
			const cooldownIcon =
				command.cooldown <= 3 ? "⚡" : command.cooldown <= 10 ? "⏱️" : "🕐";
			const difficultyLevel =
				command.cooldown <= 3
					? "Beginner"
					: command.cooldown <= 10
						? "Intermediate"
						: "Advanced";

			const helpEmbed = client
				.embed()
				.setColor(color.main)
				.setTitle(
					`${categoryEmoji} ${client.utils.formatCapitalize(command.name)} Command ${cooldownIcon}`,
				)
				.setDescription(
					`${emoji.decoration?.main || "✨"} **${command.description.content}**\n\n` +
						`╭─ **Command Overview**\n` +
						`├ 📂 Category: **${categoriesMessages[command.category.toLowerCase()] || client.utils.formatCapitalize(command.category)}**\n` +
						`├ ${cooldownIcon} Cooldown: **${client.utils.formatTime(command.cooldown)}**\n` +
						`├ 🎯 Difficulty: **${difficultyLevel}**\n` +
						`├ 🏷️ Aliases: ${command.aliases.length > 0 ? command.aliases.map((alias) => `\`${alias}\``).join(", ") : "*None*"}\n` +
						`╰─ 💡 *${categoryDesc}*`,
				)
				.addFields([
					{
						name: `📖 How to Use`,
						value:
							`\`\`\`yaml\n# Basic Syntax\n${prefix}${command.description.usage}\n\`\`\`\n` +
							`💡 **Need help?** Replace \`[]\` with your values, \`<>\` are required!`,
						inline: false,
					},
					{
						name: `${emoji.decoration?.main || "✨"} Live Examples`,
						value:
							`\`\`\`yaml\n# Try these examples:\n${command.description.examples
								.map((example) => `${prefix}${example}`)
								.join("\n")}\n\`\`\`\n` +
							`🚀 **Copy & paste** these examples to try them out!`,
						inline: false,
					},
					{
						name: `🔐 Permissions & Requirements`,
						value:
							command.permissions.client.length > 0
								? `**Bot needs:** ${command.permissions.client.map((perm) => `\`${perm}\``).join(", ")}\n` +
									`**You need:** ${command.permissions.user.length > 0 ? command.permissions.user.map((perm) => `\`${perm}\``).join(", ") : "No special permissions"}`
								: `${emoji.result?.tick || "✅"} **No special permissions required!** Anyone can use this command.`,
						inline: false,
					},
				])
				.setThumbnail(
					client.user.displayAvatarURL({ dynamic: true, size: 512 }),
				)
				.setFooter({
					text: `� Command Details • Requested by ${ctx.author.username} • ${prefix}help for command hub`,
					iconURL: ctx.author.displayAvatarURL(),
				})
				.setTimestamp();

			// Enhanced navigation buttons
			const backButton = new ButtonBuilder()
				.setCustomId("back_to_help")
				.setLabel("Back to Help")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("◀️");

			const categoryButton = new ButtonBuilder()
				.setCustomId(`view_category_${command.category}`)
				.setLabel(`View ${client.utils.formatCapitalize(command.category)}`)
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(
					emoji.help[command.category.toLowerCase()]
						? emoji.help[command.category.toLowerCase()]
						: globalEmoji.help[command.category.toLowerCase()],
				);

			const row = new ActionRowBuilder().addComponents(
				backButton,
				categoryButton,
			);

			const replyMessage = await ctx.sendMessage({
				embeds: [helpEmbed],
				components: [row],
			});

			// Enhanced collector for command help
			const collector = replyMessage.createMessageComponentCollector({
				filter: (interaction) => interaction.user.id === ctx.author.id,
				time: 120000, // 2 minutes
			});

			collector.on("collect", async (interaction) => {
				if (interaction.customId === "back_to_help") {
					selectedCategories = [];
					const newCtx = { ...ctx, interaction };
					await this.run(client, newCtx, [], color, emoji, language);
				} else if (interaction.customId.startsWith("view_category_")) {
					const category = interaction.customId.replace("view_category_", "");
					selectedCategories = [category];

					await this.showMultiCategoryView(
						interaction,
						[category],
						{ [category]: 1 },
						categoryPages,
						commands,
						COMMANDS_PER_PAGE,
						client,
						color,
						emoji,
						categoriesMessages,
						prefix,
						categories,
					);
				}
			});

			collector.on("end", () => {
				const disabledRow = new ActionRowBuilder().addComponents(
					ButtonBuilder.from(backButton).setDisabled(true),
					ButtonBuilder.from(categoryButton).setDisabled(true),
				);
				replyMessage
					.edit({
						embeds: [
							{
								...helpEmbed,
								footer: {
									text: "⏰ Command help session expired",
									iconURL: client.user.displayAvatarURL(),
								},
							},
						],
						components: [disabledRow],
					})
					.catch(() => {});
			});
		}
	}

	// New method for showing multiple selected categories
	async showMultiCategoryView(
		interaction,
		selectedCategories,
		currentPages,
		categoryPages,
		commands,
		commandsPerPage,
		client,
		color,
		emoji,
		categoriesMessages,
		prefix,
		categories,
	) {
		// let allCommands = [];
		const totalCommands = 0;
		let embedDescription = `🎯 **Selected Categories (${selectedCategories.length})**\n`;

		// Collect commands from all selected categories
		// selectedCategories.forEach((categoryName) => {
		//   const categoryCommands = commands.filter(
		//     (cmd) => cmd.category.toLowerCase() === categoryName.toLowerCase()
		//   );

		//   const categoryInfo = categories.find((cat) => cat.name === categoryName);
		//   const categoryEmoji = categoryInfo
		//     ? emoji.help[categoryInfo.name.toLowerCase()]
		//       ? emoji.help[categoryInfo.name.toLowerCase()]
		//       : globalEmoji.help[categoryInfo.name.toLowerCase()]
		//     : "📁";

		//   if (categoryCommands.size > 0) {
		//     embedDescription += `${categoryEmoji} **${
		//       categoriesMessages[categoryName.toLowerCase()] ||
		//       client.utils.formatCapitalize(categoryName)
		//     }** • \`${categoryCommands.size} commands\`\n`;

		//     allCommands.push(...Array.from(categoryCommands.values()));
		//     totalCommands += categoryCommands.size;
		//   }
		// });

		embedDescription += `\n╭─ **Selection Summary**\n`;
		embedDescription += `├ 📊 **Total Commands:** ${totalCommands}\n`;
		embedDescription += `├ 📂 **Categories:** ${selectedCategories.length}\n`;
		embedDescription += `├ 💡 **Usage:** \`${prefix}help [command]\` for details\n`;

		// Add helpful tip based on number of categories selected
		if (selectedCategories.length <= 2) {
			embedDescription += `╰─ ✨ **Complete view** - All commands shown below!\n\n`;
			embedDescription += `${emoji.decoration?.main || "🎯"} *Perfect! You can see every command in your selected categories.*`;
		} else {
			embedDescription += `╰─ 🔍 **Preview mode** - Select fewer categories for full details\n\n`;
			embedDescription += `${emoji.decoration?.main || "💡"} *Tip: Choose 1-2 categories to see all commands with full descriptions!*`;
		}

		const multiCategoryEmbed = client
			.embed()
			.setColor(color.main)
			.setTitle("🌟 Multi-Category Command Browser 🌟")
			.setDescription(embedDescription)
			.setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
			.setFooter({
				text: `Browsing ${selectedCategories.length} categories • ${totalCommands} total commands 💫`,
				iconURL: client.user.displayAvatarURL(),
			})
			.setTimestamp();

		// Group commands by category for display
		selectedCategories.forEach((categoryName) => {
			const categoryCommands = commands.filter(
				(cmd) => cmd.category.toLowerCase() === categoryName.toLowerCase(),
			);

			if (categoryCommands.size > 0) {
				const categoryInfo = categories.find(
					(cat) => cat.name === categoryName,
				);
				const categoryEmoji = categoryInfo
					? emoji.help[categoryInfo.name.toLowerCase()]
						? emoji.help[categoryInfo.name.toLowerCase()]
						: globalEmoji.help[categoryInfo.name.toLowerCase()]
					: "📁";

				// Determine how many commands to show based on number of selected categories
				const commandsToShow =
					selectedCategories.length <= 2
						? categoryCommands.size // Show all commands for 1-2 categories
						: 5; // Show only 5 commands for 3+ categories

				const commandsList = Array.from(categoryCommands.values())
					.slice(0, commandsToShow)
					.map((cmd, index) => {
						const cooldownIcon =
							cmd.cooldown <= 3 ? "⚡" : cmd.cooldown <= 10 ? "⏱️" : "🕐";
						const aliasCount = cmd.aliases?.length || 0;
						const aliasText = aliasCount > 0 ? ` +${aliasCount}` : "";

						return (
							`${index === commandsToShow - 1 && categoryCommands.size === commandsToShow ? "└" : "├"} **\`${cmd.name}\`**${aliasText} ${cooldownIcon}\n` +
							`${index === commandsToShow - 1 && categoryCommands.size === commandsToShow ? "  " : "│ "} *${cmd.description.content.slice(0, 45)}${cmd.description.content.length > 45 ? "..." : ""}*`
						);
					})
					.join("\n");

				const moreCommands =
					categoryCommands.size > commandsToShow
						? `\n└ ${emoji.main?.right || "📋"} **+${categoryCommands.size - commandsToShow} more commands** - *Select category to view all*`
						: "";

				multiCategoryEmbed.addFields({
					name: `${categoryEmoji} ${categoriesMessages[categoryName.toLowerCase()] || client.utils.formatCapitalize(categoryName)}`,
					value: commandsList + moreCommands,
					inline: false,
				});
			}
		});

		// Enhanced multi-select dropdown with current selection
		const categoryOptions = categories.map((category) => {
			const categoryCommandCount = commands.filter(
				(cmd) => cmd.category.toLowerCase() === category.name.toLowerCase(),
			).size;
			return {
				emoji: emoji.help[category.name.toLowerCase()]
					? emoji.help[category.name.toLowerCase()]
					: globalEmoji.help[category.name.toLowerCase()],
				label:
					categoriesMessages[category.name.toLowerCase()] ||
					client.utils.formatCapitalize(category.name),
				description: `${categoryCommandCount} commands available`,
				value: category.name.toLowerCase(),
				default: selectedCategories.includes(category.name.toLowerCase()),
			};
		});

		const categorySelectMenu = new StringSelectMenuBuilder()
			.setCustomId("category_select")
			.setPlaceholder(
				`🎯 ${selectedCategories.length} selected • Modify selection... ✨`,
			)
			.setMinValues(1)
			.setMaxValues(Math.min(categories.length, 25))
			.addOptions(categoryOptions);

		// Navigation buttons
		const homeButton = new ButtonBuilder()
			.setCustomId("home")
			.setLabel("Home")
			.setStyle(ButtonStyle.Primary)
			.setEmoji("🏠");

		const clearButton = new ButtonBuilder()
			.setCustomId("clear_selection")
			.setLabel("Clear Selection")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("🗑️");

		const selectRow = new ActionRowBuilder().addComponents(categorySelectMenu);
		const buttonRow = new ActionRowBuilder().addComponents(
			homeButton,
			clearButton,
		);

		await interaction.update({
			embeds: [multiCategoryEmbed],
			components: [selectRow, buttonRow],
		});
	}

	// Enhanced method to show a specific page of commands for a category
	async showCategoryPage(
		interaction,
		category,
		currentPage,
		totalPages,
		commands,
		commandsPerPage,
		client,
		color,
		emoji,
		categoriesMessages,
		prefix,
		categories,
	) {
		const categoryCommands = commands.filter(
			(cmd) => cmd.category.toLowerCase() === category.toLowerCase(),
		);

		// Calculate start and end indices for the current page
		const startIdx = (currentPage - 1) * commandsPerPage;
		const endIdx = Math.min(startIdx + commandsPerPage, categoryCommands.size);

		// Get commands for the current page
		const pageCommands = Array.from(categoryCommands.values()).slice(
			startIdx,
			endIdx,
		);

		// Find category info for enhanced display
		const categoryInfo = categories.find((cat) => cat.name === category);
		const categoryEmoji = categoryInfo
			? emoji.help[categoryInfo.name.toLowerCase()]
				? emoji.help[categoryInfo.name.toLowerCase()]
				: globalEmoji.help[categoryInfo.name.toLowerCase()]
			: "📁";
		const categoryDesc = categoryInfo
			? categoryInfo.description
			: "Commands in this category";

		// Create enhanced embed for the current page
		const selectedEmbed = client
			.embed()
			.setColor(color.main)
			.setTitle(
				`${categoryEmoji} ${
					categoriesMessages[category.toLowerCase()] ||
					client.utils.formatCapitalize(category)
				} Commands`,
			)
			.setDescription(
				`✨ **${categoryDesc}**\n\n` +
					`📚 Browse all commands in this category below.\n` +
					`💡 Use \`${prefix}help [command]\` for detailed information.\n` +
					`🎯 *Showing ${pageCommands.length} out of ${categoryCommands.size} total commands*`,
			)
			.setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
			.setFooter({
				text: `Page ${currentPage}/${totalPages} • ${categoryCommands.size} commands in this category 💫`,
				iconURL: client.user.displayAvatarURL(),
			})
			.setTimestamp();

		// Enhanced command display with rich formatting and visual hierarchy
		if (pageCommands.length > 0) {
			// Create a single comprehensive field with better visual structure
			const commandsDisplay = pageCommands
				.map((cmd, index) => {
					const cmdNumber = startIdx + index + 1;
					const cooldownIcon =
						cmd.cooldown <= 3 ? "⚡" : cmd.cooldown <= 10 ? "⏱️" : "🕐";
					const aliasCount = cmd.aliases?.length || 0;
					const aliasText = aliasCount > 0 ? ` \`+${aliasCount}\`` : "";

					return (
						`\`${cmdNumber.toString().padStart(2, "0")}.\` **${cmd.name}**${aliasText} ${cooldownIcon}\n` +
						`     *${cmd.description.content.length > 55 ? cmd.description.content.substring(0, 55) + "..." : cmd.description.content}*`
					);
				})
				.join("\n\n");

			selectedEmbed.addFields({
				name: `📋 Commands ${startIdx + 1}-${endIdx} of ${categoryCommands.size}`,
				value:
					`╭─ **${categoriesMessages[category.toLowerCase()] || client.utils.formatCapitalize(category)} Command List**\n` +
					`│\n` +
					commandsDisplay
						.split("\n")
						.map((line) => `│ ${line}`)
						.join("\n") +
					`\n` +
					`│\n` +
					`╰─ ${emoji.decoration?.main || "💡"} **Legend:** ⚡ Fast • ⏱️ Medium • 🕐 Slow • \`+N\` Aliases`,
				inline: false,
			});

			// Add usage statistics if available
			if (totalPages > 1) {
				selectedEmbed.addFields({
					name: `📊 Navigation Info`,
					value:
						`**Current Page:** ${currentPage}/${totalPages}\n` +
						`**Commands per page:** ${commandsPerPage}\n` +
						`**Total in category:** ${categoryCommands.size} commands\n` +
						`**Quick tip:** Use \`${prefix}help [command]\` for detailed info!`,
					inline: false,
				});
			}
		} else {
			selectedEmbed.addFields({
				name: `${emoji.result?.deny || "❌"} No Commands Found`,
				value:
					`This category appears to be empty. This might be because:\n\n` +
					`• Commands are being loaded\n` +
					`• Category has no public commands\n` +
					`• You don't have permission to see them\n\n` +
					`Try selecting another category or return to the main menu!`,
				inline: false,
			});
		}

		// Enhanced dropdown with current category selected
		const categoryOptions = categories.map((cat) => {
			const categoryCommandCount = commands.filter(
				(cmd) => cmd.category.toLowerCase() === cat.name.toLowerCase(),
			).size;
			return {
				emoji: emoji.help[cat.name.toLowerCase()]
					? emoji.help[cat.name.toLowerCase()]
					: globalEmoji.help[cat.name.toLowerCase()],
				label:
					categoriesMessages[cat.name.toLowerCase()] ||
					client.utils.formatCapitalize(cat.name),
				description: `${categoryCommandCount} commands available`,
				value: cat.name.toLowerCase(),
				default: cat.name.toLowerCase() === category.toLowerCase(),
			};
		});

		const categorySelectMenu = new StringSelectMenuBuilder()
			.setCustomId("category_select")
			.setPlaceholder(
				`📚 Currently viewing: ${
					categoriesMessages[category.toLowerCase()] ||
					client.utils.formatCapitalize(category)
				}`,
			)
			.setMinValues(1)
			.setMaxValues(Math.min(categories.length, 25))
			.addOptions(categoryOptions);

		// Enhanced pagination buttons
		const prevButton = new ButtonBuilder()
			.setCustomId(`prev_page_${category}`)
			.setLabel("Previous")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("◀️")
			.setDisabled(currentPage === 1);

		const nextButton = new ButtonBuilder()
			.setCustomId(`next_page_${category}`)
			.setLabel("Next")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("▶️")
			.setDisabled(currentPage === totalPages);

		const homeButton = new ButtonBuilder()
			.setCustomId("home")
			.setLabel("Home")
			.setStyle(ButtonStyle.Primary)
			.setEmoji("🏠");

		const pageIndicator = new ButtonBuilder()
			.setCustomId("page_indicator")
			.setLabel(`Page ${currentPage}/${totalPages}`)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true);

		// Create component rows
		const selectRow = new ActionRowBuilder().addComponents(categorySelectMenu);

		let buttonRow;
		if (totalPages > 1) {
			buttonRow = new ActionRowBuilder().addComponents(
				prevButton,
				pageIndicator,
				nextButton,
				homeButton,
			);
		} else {
			buttonRow = new ActionRowBuilder().addComponents(homeButton);
		}

		await interaction.update({
			embeds: [selectedEmbed],
			components: [selectRow, buttonRow],
		});
	}
};
