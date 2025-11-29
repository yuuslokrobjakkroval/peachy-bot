const { Command } = require("../../structures/index.js");
const maxAmount = 250000;
const deck = Array.from({ length: 52 }, (_, i) => i + 1);
const bjUtil = require("../../utils/BlackjackUtil.js");
const activeGames = new Map();

module.exports = class Cmd extends Command {
	constructor(client) {
		super(client, {
			name: "blackjack",
			description: {
				content: "Bet an amount and try to get closer to 21",
				examples: ["blackjack 100"],
				usage: "blackjack <amount>",
			},
			category: "gambling",
			aliases: ["bj"],
			cooldown: 3,
			args: false,
			permissions: {
				dev: false,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: true,
			options: [
				{
					name: "amount",
					description: "The amount you want to bet.",
					type: 3,
					required: true,
				},
			],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const generalMessages = language.locales.get(
			language.defaultLocale,
		)?.generalMessages;
		const blackjackMessages = language.locales.get(language.defaultLocale)
			?.gamblingMessages?.blackjackMessages;

		const interaction = ctx.isInteraction ? ctx.interaction : null;
		const userId = ctx.author.id;

		try {
			const user = await client.utils.getUser(userId);
			if (!user) {
				return client.utils.sendErrorMessage(
					client,
					ctx,
					generalMessages.userNotFound,
					color,
				);
			}

			if (user.validation.isKlaKlouk || user.validation.isMultiTransfer) {
				const activeCommand = user.validation.isKlaKlouk
					? "Kla Klouk"
					: "Multiple Transfer";
				return client.utils.sendErrorMessage(
					client,
					ctx,
					`You have already started the ${activeCommand} event. Please finish it before using this command.`,
					color,
				);
			}

			if (activeGames.has(ctx.author.id)) {
				return client.utils.sendErrorMessage(
					client,
					ctx,
					generalMessages.alreadyInGame,
					color,
				);
			}

			const { coin, blackjack, bank } = user.balance;

			if (coin < 1) {
				return client.utils.sendErrorMessage(
					client,
					ctx,
					generalMessages.zeroBalance,
					color,
				);
			}

			let amount = ctx.isInteraction
				? interaction.options.getString("amount") || 1
				: args[0] || 1;

			if (amount.toString().startsWith("-")) {
				return ctx.sendMessage({
					embeds: [
						client
							.embed()
							.setColor(color.danger)
							.setDescription(generalMessages.invalidAmount),
					],
				});
			}

			if (
				isNaN(amount) ||
				amount <= 0 ||
				amount.toString().includes(".") ||
				amount.toString().includes(",")
			) {
				const amountMap = { all: coin, half: Math.ceil(coin / 2) };
				if (amount in amountMap) {
					amount = amountMap[amount];
				} else {
					return client.utils.sendErrorMessage(
						client,
						ctx,
						generalMessages.invalidAmount,
						color,
					);
				}
			}

			const baseCoins = parseInt(Math.min(amount, coin, maxAmount));

			user.balance.coin = coin - baseCoins;
			user.balance.blackjack = blackjack + baseCoins;
			user.balance.bank = bank;
			await user.save(); // Await the user save operation

			activeGames.set(ctx.author.id, true);

			if (interaction) await interaction.deferReply();

			await initBlackjack(
				client,
				ctx,
				color,
				emoji,
				baseCoins,
				generalMessages,
				blackjackMessages,
			);
		} catch (err) {
			console.error("Error fetching user data:", err);
			client.utils.sendErrorMessage(
				client,
				ctx,
				generalMessages.userFetchError,
				color,
			);
		}
	}
};

function initBlackjack(
	client,
	ctx,
	color,
	emoji,
	bet,
	generalMessages,
	blackjackMessages,
) {
	const tdeck = deck.slice(0);
	const player = [
		bjUtil.randCard(client, tdeck, "f"),
		bjUtil.randCard(client, tdeck, "f"),
	];
	const dealer = [
		bjUtil.randCard(client, tdeck, "f"),
		bjUtil.randCard(client, tdeck, "b"),
	];

	return blackjack(
		ctx,
		client,
		color,
		emoji,
		player,
		dealer,
		bet,
		generalMessages,
		blackjackMessages,
	);
}

async function blackjack(
	ctx,
	client,
	color,
	emoji,
	player,
	dealer,
	bet,
	generalMessages,
	blackjackMessages,
) {
	try {
		// First embed with GIF
		let embed = client
			.embed()
			.setColor(color.main)
			.setImage("https://i.imgur.com/lKe4ssI.gif");

		try {
			const msg = await ctx.sendDeferMessage({
				embeds: [embed],
			});

			// Wait 2.4 seconds before sending the next embed
			await new Promise((resolve) => setTimeout(resolve, 2800));

			// New embed after 2.4 seconds
			embed = bjUtil.generateEmbed(
				ctx.author,
				client,
				color,
				emoji,
				dealer,
				player,
				bet,
				"",
				"",
				generalMessages,
				blackjackMessages,
			);

			const hitButton = client.utils.fullOptionButton(
				"hit",
				"",
				blackjackMessages.hit,
				1,
			);
			const standButton = client.utils.fullOptionButton(
				"stand",
				"",
				blackjackMessages.stand,
				2,
			);
			const row = client.utils.createButtonRow(hitButton, standButton);

			// Edit the message to update the embed and components
			try {
				const updatedMsg = await msg.edit({
					embeds: [embed],
					components: [row],
				});

				const collector = updatedMsg.createMessageComponentCollector({
					filter: async (int) => {
						if (int.user.id === ctx.author.id) return true;
						else {
							await int.reply({
								flags: 64,
								content: `This button is controlled by **${ctx.author.displayName}**!`,
							});
							return false;
						}
					},
					time: 60000,
				});

				collector.on("collect", async (int) => {
					try {
						if (int.customId === "hit") {
							await int.deferUpdate();
							hit(
								int,
								client,
								color,
								emoji,
								player,
								dealer,
								updatedMsg,
								bet,
								collector,
								generalMessages,
								blackjackMessages,
							);
						} else if (int.customId === "stand") {
							await int.deferUpdate();
							collector.stop("done");
							await stop(
								int,
								client,
								color,
								emoji,
								player,
								dealer,
								updatedMsg,
								bet,
								true,
								generalMessages,
								blackjackMessages,
							);
						}
					} catch (error) {
						console.error("Error handling button interaction:", error);
					}
				});

				collector.on("end", async (collected, reason) => {
					if (reason === "done") return;
					activeGames.delete(ctx.author.id);
					const timeoutEmbed = client
						.embed()
						.setColor(color.warning)
						.setDescription(
							generalMessages.title
								.replace("%{mainLeft}", emoji.mainLeft)
								.replace("%{title}", blackjackMessages.title)
								.replace("%{mainRight}", emoji.mainRight) +
								`⏳ **Time is up** !!! You didn't click the button in time.`,
						)
						.setFooter({
							text: `${ctx.author.displayName}, ${generalMessages.pleaseStartAgain}`,
							iconURL: ctx.author.displayAvatarURL(),
						});
					try {
						await updatedMsg.edit({ embeds: [timeoutEmbed], components: [] });
					} catch (error) {
						console.error("Error editing message on timeout:", error);
					}
				});
			} catch (err) {
				console.error("Failed to edit the message:", err);
			}
		} catch (err) {
			console.error("Failed to send the initial message:", err);
		}
	} catch (err) {
		console.error("Error in blackjack function:", err);
	}
}

function hit(
	int,
	client,
	color,
	emoji,
	player,
	dealer,
	msg,
	bet,
	collector,
	generalMessages,
	blackjackMessages,
) {
	const tdeck = bjUtil.initDeck(deck.slice(0), player, dealer);
	const card = bjUtil.randCard(client, tdeck, "f");
	player.push(card);

	// Recalculate points after drawing a new card
	const playerHand = bjUtil.cardValue(player);
	const ppoints = playerHand.points;

	if (ppoints >= 21) {
		collector.stop("done");
		stop(
			int,
			client,
			color,
			emoji,
			player,
			dealer,
			msg,
			bet,
			true,
			generalMessages,
			blackjackMessages,
		);
	} else {
		const embed = bjUtil.generateEmbed(
			int.user,
			client,
			color,
			emoji,
			dealer,
			player,
			bet,
			"",
			"",
			generalMessages,
			blackjackMessages,
		);
		msg.edit({ embeds: [embed] });
	}
}

async function stop(
	int,
	client,
	color,
	emoji,
	player,
	dealer,
	msg,
	bet,
	fromHit,
	generalMessages,
	blackjackMessages,
) {
	try {
		if (!fromHit) {
			player.forEach((card) => (card.type = "c")); // Reveal all player's cards
		}
		dealer.forEach((card) => {
			if (card.type === "b")
				card.type = "f"; // Reveal face-down dealer cards
			else card.type = "c"; // Mark other dealer cards as completed
		});

		const playerHand = bjUtil.cardValue(player);
		const ppoints = playerHand.points;

		let dealerHand = bjUtil.cardValue(dealer);
		let dpoints = dealerHand.points;

		const tdeck = bjUtil.initDeck(deck.slice(0), player, dealer);

		// Dealer continues to draw cards until their total points >= 17
		while (dpoints < 17) {
			const nextCard = bjUtil.randCard(client, tdeck, "f");
			if (!nextCard) break; // Prevent error if the deck runs out of cards
			dealer.push(nextCard);
			dealerHand = bjUtil.cardValue(dealer);
			dpoints = dealerHand.points;
		}

		// Determine the game outcome
		let winner;
		if (ppoints > 21 && dpoints > 21)
			winner = "tb"; // Both bust
		else if (ppoints === dpoints)
			winner = "t"; // Tie
		else if (ppoints > 21)
			winner = "l"; // Player busts
		else if (dpoints > 21)
			winner = "w"; // Dealer busts
		else if (ppoints > dpoints)
			winner = "w"; // Player wins
		else winner = "l"; // Dealer wins

		// Adjust user balance based on the result
		try {
			const user = await client.utils.getUser(int.user.id);
			const { coin } = user.balance;
			let newBalance = coin;

			if (winner === "w") {
				newBalance += bet * 2; // Win: Double the bet
			} else if (winner === "t" || winner === "tb") {
				newBalance += bet; // Tie: Refund the bet
			} // Lose: No changes as the bet is already deducted

			user.balance.coin = newBalance;
			try {
				await user.save();
			} catch (err) {
				console.error("Error saving user data:", err);
			}

			// Generate and send the final result embed
			const embed = bjUtil.generateEmbed(
				int.user,
				client,
				color,
				emoji,
				dealer,
				player,
				bet,
				winner,
				bet,
				generalMessages,
				blackjackMessages,
			);

			activeGames.delete(int.user.id);

			try {
				await msg.edit({ embeds: [embed], components: [] });
			} catch (error) {
				console.error("Error editing message:", error);
			}
		} catch (err) {
			console.error("Error fetching user data:", err);
		}
	} catch (error) {
		console.error("Error in stop function:", error);
	}
}
