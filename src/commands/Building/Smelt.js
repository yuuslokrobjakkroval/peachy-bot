const { Command } = require("../../structures/index.js");
const Minerals = require("../../assets/inventory/Minerals.js");

module.exports = class Smelt extends Command {
	constructor(client) {
		super(client, {
			name: "smelt",
			description: {
				content: "Smelt ores into metal bars using fuel!",
				examples: ["smelt bronze 5", "smelt silver", "smelt all"],
				usage: "smelt <ore_type> [quantity|all]",
			},
			category: "inventory",
			aliases: ["melt"],
			cooldown: 5,
			args: false,
			permissions: {
				dev: false,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: true,
			options: [
				{
					name: "ore",
					description: "The type of ore to smelt",
					type: 3,
					required: true,
					choices: [
						{ name: "Bronze Ore", value: "bronzeore" },
						{ name: "Silver Ore", value: "silverore" },
						{ name: "Gold Ore", value: "goldore" },
						{ name: "Osmium Ore", value: "osmiumore" },
					],
				},
				{
					name: "quantity",
					description: "Amount to smelt (default: 1, use 'all' for maximum)",
					type: 3,
					required: false,
				},
			],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const author = ctx.author;
		const user = await client.utils.getCachedUser(author.id);

		if (!user) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				"You need to register first! Use the `/register` command.",
				color,
			);
		}

		// Parse arguments - handle both text and slash commands
		const oreType = args[0]?.toLowerCase() || ctx.options?.getString("ore");
		const quantity = args[1] || ctx.options?.getString("quantity") || "1";

		if (!oreType) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				"Please specify an ore type! Available: `bronze`, `silver`, `gold`, `osmium`",
				color,
			);
		}

		// Normalize ore type names
		const oreMap = {
			bronze: "bronzeore",
			silver: "silverore",
			gold: "goldore",
			osmium: "osmiumore",
			bronzeore: "bronzeore",
			silverore: "silverore",
			goldore: "goldore",
			osmiumore: "osmiumore",
		};

		const normalizedOre = oreMap[oreType];
		if (!normalizedOre) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				"Invalid ore type! Available: `bronze`, `silver`, `gold`, `osmium`",
				color,
			);
		}

		// Get ore and bar data
		const oreData = Minerals.find((m) => m.id === normalizedOre);
		const barType = normalizedOre.replace("ore", "bar");
		const barData = Minerals.find((m) => m.id === barType);

		if (!oreData || !barData) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				"Invalid ore or corresponding bar not found!",
				color,
			);
		}

		// Check user's ore inventory
		const userOre = user.inventory.find((item) => item.id === normalizedOre);
		if (!userOre || userOre.quantity <= 0) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				`You don't have any ${oreData.name} to smelt!`,
				color,
			);
		}

		// Calculate quantity to smelt
		let smeltAmount;
		if (quantity.toLowerCase() === "all") {
			smeltAmount = userOre.quantity;
		} else {
			smeltAmount = parseInt(quantity);
			if (isNaN(smeltAmount) || smeltAmount <= 0) {
				return await client.utils.sendErrorMessage(
					client,
					ctx,
					"Invalid quantity! Use a positive number or 'all'.",
					color,
				);
			}
			if (smeltAmount > userOre.quantity) {
				smeltAmount = userOre.quantity;
			}
		}

		// Check for fuel (coal)
		const coalNeeded = Math.ceil(smeltAmount / 2); // 1 coal per 2 ores
		const userCoal = user.inventory.find((item) => item.id === "coal");
		if (!userCoal || userCoal.quantity < coalNeeded) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				`You need ${coalNeeded} ${emoji.coal || "⛽"} Coal to smelt ${smeltAmount} ore! You have ${userCoal?.quantity || 0}.`,
				color,
			);
		}

		// Check cooldown
		const cooldown = user.cooldowns.find((c) => c.name === "smelt");
		const cooldownTime = 15000; // 15 seconds
		const isOnCooldown = cooldown
			? Date.now() - cooldown.timestamp < cooldownTime
			: false;

		if (isOnCooldown) {
			const remainingTime = Math.ceil(
				(cooldown.timestamp + cooldownTime - Date.now()) / 1000,
			);
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				`The smelter is still hot! Please wait <t:${Math.round(Date.now() / 1000) + remainingTime}:R>.`,
				color,
				remainingTime * 1000,
			);
		}

		// Calculate success rate based on rarity
		const successRate =
			{
				common: 0.95,
				uncommon: 0.85,
				rare: 0.75,
				legendary: 0.65,
			}[oreData.rarity] || 0.95;

		let successfulSmelts = 0;
		let totalWorth = 0;

		// Process each ore individually for success/failure
		for (let i = 0; i < smeltAmount; i++) {
			if (Math.random() < successRate) {
				successfulSmelts++;
				totalWorth += barData.price.sell;
			}
		}

		// Update user inventory
		await client.utils.updateUserWithRetry(author.id, async (user) => {
			// Remove ore and coal
			const oreItem = user.inventory.find((item) => item.id === normalizedOre);
			oreItem.quantity -= smeltAmount;
			if (oreItem.quantity <= 0) {
				user.inventory = user.inventory.filter(
					(item) => item.id !== normalizedOre,
				);
			}

			const coalItem = user.inventory.find((item) => item.id === "coal");
			coalItem.quantity -= coalNeeded;
			if (coalItem.quantity <= 0) {
				user.inventory = user.inventory.filter((item) => item.id !== "coal");
			}

			// Add bars if successful
			if (successfulSmelts > 0) {
				const existingBar = user.inventory.find((item) => item.id === barType);
				if (existingBar) {
					existingBar.quantity += successfulSmelts;
				} else {
					user.inventory.push({ id: barType, quantity: successfulSmelts });
				}
			}

			// Update cooldown
			const existingCooldown = user.cooldowns.find((c) => c.name === "smelt");
			if (existingCooldown) {
				existingCooldown.timestamp = Date.now();
			} else {
				user.cooldowns.push({
					name: "smelt",
					timestamp: Date.now(),
					duration: cooldownTime,
				});
			}
		});

		// Create result embed
		const failedSmelts = smeltAmount - successfulSmelts;
		const generalMessages = language.locales.get(
			language.defaultLocale,
		)?.generalMessages;

		let resultText = "";
		if (successfulSmelts > 0) {
			resultText += `${barData.emoji} **+${successfulSmelts}** ${barData.name}\n`;
		}
		if (failedSmelts > 0) {
			resultText += `💨 **${failedSmelts}** ore(s) failed to smelt\n`;
		}

		resultText += `\n**Resources Used:**\n`;
		resultText += `${oreData.emoji} **-${smeltAmount}** ${oreData.name}\n`;
		resultText += `⛽ **-${coalNeeded}** Coal`;

		const embed = client
			.embed()
			.setColor(color.main)
			.setDescription(
				generalMessages?.title
					?.replace("%{mainLeft}", emoji.mainLeft)
					?.replace("%{title}", "SMELTING FURNACE")
					?.replace("%{mainRight}", emoji.mainRight) ||
					`${emoji.mainLeft} **SMELTING FURNACE** ${emoji.mainRight}`,
			)
			.addFields(
				{
					name: "🔥 Smelting Results",
					value: resultText,
					inline: false,
				},
				{
					name: "💰 Total Worth",
					value: `**${client.utils.formatNumber(totalWorth)}** ${emoji.coin}`,
					inline: true,
				},
				{
					name: "✨ Success Rate",
					value: `**${Math.round(successRate * 100)}%**`,
					inline: true,
				},
			)
			.setFooter({
				text:
					generalMessages?.requestedBy?.replace(
						"%{username}",
						ctx.author.displayName,
					) || `Requested by ${ctx.author.displayName}`,
				iconURL: ctx.author.displayAvatarURL(),
			});

		return await ctx.sendMessage({ embeds: [embed] });
	}
};
