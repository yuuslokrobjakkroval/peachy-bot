const { Command } = require("../../structures");
const Users = require("../../schemas/user");

module.exports = class MultiTransfer extends Command {
	constructor(client) {
		super(client, {
			name: "multitransfer",
			description: {
				content: "Transfer coins to multiple users at once.",
				examples: ["mpay @user1 @user2 100000", "mpay @user1 @user2 100k"],
				usage: "mpay <user(s)> <amount>",
			},
			category: "bank",
			aliases: ["mpay", "mgive", "moy", "mt"],
			cooldown: 5,
			args: true,
			permissions: {
				dev: false,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: false,
			options: [],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const generalMessages = language.locales.get(
			language.defaultLocale,
		)?.generalMessages;
		const multiTransferMessages = language.locales.get(language.defaultLocale)
			?.bankMessages?.multiTransferMessages;

		// Extract users and amounts from arguments
		const userArgs = args.filter((arg) =>
			ctx.message.mentions.users.has(arg.replace(/[<@!>]/g, "")),
		);
		const amount = args.pop() || 1;

		if (!userArgs.length) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				multiTransferMessages.noValidUsers,
				color,
			);
		}

		const users = userArgs
			.map((id) => ctx.guild.members.cache.get(id.replace(/[<@!>]/g, "")))
			.filter(Boolean);

		// Check if any mentioned users are bots
		const bots = users.filter((user) => user.user.bot);
		if (bots.length) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				generalMessages.botTransfer,
				color,
			);
		}

		const sender = await Users.findOne({ userId: ctx.author.id });

		if (!sender || sender.balance.coin < 1) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				generalMessages.zeroBalance,
				color,
			);
		}

		if (amount.toString().startsWith("-")) {
			return ctx.sendMessage({
				embeds: [
					client
						.embed()
						.setColor(color.danger)
						.setDescription(multiTransferMessages.invalidAmount),
				],
			});
		}

		let transferAmount;
		if (
			isNaN(amount) ||
			amount <= 0 ||
			amount.toString().includes(".") ||
			amount.toString().includes(",")
		) {
			const multiplier = { k: 1000, m: 1000000, b: 1000000000 };
			if (amount.match(/\d+[kmbtq]/i)) {
				const unit = amount.slice(-1).toLowerCase();
				const number = Number.parseInt(amount);
				transferAmount = number * (multiplier[unit] || 1);
			} else {
				return ctx.sendMessage({
					embeds: [
						client
							.embed()
							.setColor(color.danger)
							.setDescription(multiTransferMessages.invalidAmount),
					],
				});
			}
		} else {
			transferAmount = Number.parseInt(amount);
		}

		if (transferAmount <= 0) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				multiTransferMessages.tooSmallAmount,
				color,
			);
		}

		const totalAmount = transferAmount * users.length;

		if (sender.balance.coin < totalAmount) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				multiTransferMessages.insufficientBalanceForAll,
				color,
			);
		}

		// Create confirmation buttons
		const confirmButton = client.utils.labelButton(
			"confirm_button",
			"Confirm",
			3,
		);
		const cancelButton = client.utils.labelButton("cancel_button", "Cancel", 4);
		const buttonRow = client.utils.createButtonRow(confirmButton, cancelButton);

		// Embed for confirmation
		const userList = users.map((user) => user.displayName).join(", ");
		const confirmEmbed = client
			.embed()
			.setColor(color.main)
			.setDescription(
				multiTransferMessages.confirm
					.replace("%{amount}", client.utils.formatNumber(transferAmount))
					.replace("%{emoji}", emoji.coin)
					.replace("%{userList}", userList),
			);

		const confirmMessage = await ctx.channel.send({
			embeds: [confirmEmbed],
			components: [buttonRow],
		});

		// Collector for buttons
		const filter = (interaction) => interaction.user.id === ctx.author.id;
		const collector = confirmMessage.createMessageComponentCollector({
			filter,
			time: 60000,
		});

		collector.on("collect", async (interaction) => {
			try {
				interaction.deferUpdate();

				if (interaction.customId === "confirm_button") {
					sender.balance.coin -= totalAmount;

					await confirmMessage.delete().catch((error) => {
						if (error.code !== 10008) {
							console.error("Error deleting the confirmation message:", error);
						}
					});

					await Users.findOneAndUpdate(
						{ userId: ctx.author.id },
						{
							"balance.coin": sender.balance.coin,
							"validation.isMultiTransfer": false,
						},
					);

					// Process each user and transfer amount
					for (const user of users) {
						let recipient = await Users.findOne({ userId: user.id });

						if (!recipient) {
							recipient = new Users({ userId: user.id, balance: { coin: 0 } });
						}

						recipient.balance.coin += transferAmount;
						await recipient.save();
					}

					const successEmbed = client
						.embed()
						.setColor(color.main)
						.setDescription(
							multiTransferMessages.success
								.replace("%{amount}", client.utils.formatNumber(totalAmount))
								.replace("%{emoji}", emoji.coin)
								.replace("%{userCount}", users.length)
								.replace(
									"%{individualAmount}",
									client.utils.formatNumber(transferAmount),
								),
						);

					await ctx.channel.send({ embeds: [successEmbed] });
				} else {
					await confirmMessage.delete().catch((error) => {
						if (error.code !== 10008) {
							console.error("Error deleting the cancellation message:", error);
						}
					});

					const cancelEmbed = client
						.embed()
						.setColor(color.warning)
						.setDescription(multiTransferMessages.cancel);

					await ctx.channel.send({ embeds: [cancelEmbed] });
				}
			} catch (error) {
				console.error("Error during the multi-transfer process:", error);
				await ctx.channel.send(generalMessages.databaseUpdate);
			}
		});

		collector.on("end", async (collected) => {
			if (collected.size === 0) {
				const timeoutEmbed = client
					.embed()
					.setColor(color.warning)
					.setDescription(multiTransferMessages.timeout);

				await confirmMessage.edit({ embeds: [timeoutEmbed], components: [] });
			}
		});
	}
};
