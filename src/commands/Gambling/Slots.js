const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const emojiImage = require("../../utils/Emoji");

const maxAmount = 300000;

module.exports = class Slots extends Command {
	constructor(client) {
		super(client, {
			name: 'slots',
			description: {
				content: 'Bet your money in the slot machine! Earn up to 10x your money.',
				examples: ['slots 100'],
				usage: 'slots <baseCoins>',
			},
			category: 'gambling',
			aliases: ['slot', 's'],
			cooldown: 4,
			args: false,
			permissions: {
				dev: false,
				client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
				user: [],
			},
			slashCommand: true,
			options: [
				{
					name: 'amount',
					description: 'The baseCoins you want to bet.',
					type: 3,
					required: true,
				},
			],
		});
	}

	run(client, ctx, args, color, emoji, language) {
		const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
		client.utils.getUser(ctx.author.id).then(user => {
			const SLOTS = [emoji.slots.cat, emoji.slots.coffee, emoji.slots.heart, emoji.slots.cake, emoji.slots.milk, emoji.slots.peachy]
			const verify = user.verification.verify.status === 'verified';
			const {coin, bank} = user.balance;

			if (coin < 1) {
				return client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
			}

			let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[0] || 1;
			if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
				const amountMap = {all: coin, half: Math.ceil(coin / 2)};
				if (amount in amountMap) {
					amount = amountMap[amount];
				} else {
					return client.utils.sendErrorMessage(client, ctx, generalMessages.invalidAmount, color);
				}
			}

			const baseCoins = parseInt(Math.min(amount, coin, maxAmount));
			Users.updateOne({userId: ctx.author.id}, {
				$set: {
					'balance.coin': coin - baseCoins,
					'balance.bank': bank
				}
			}).exec();

			// ===================================== > Decide Results < ===================================== \\
			let rslots = [];
			let rand = client.utils.getRandomNumber(1, 100);
			let win = 0;

			if (user.verification.isBlacklist) {
				if (rand <= 10) { // 10%
					win = baseCoins ;
					rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
				} else if (rand <= 15) { // 3%
					win = baseCoins * 3;
					rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
				} else if (rand <= 20) { // 2%
					win = baseCoins * 4;
					rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
				} else if (rand <= 23) { // 8%
					win = baseCoins* 5;
					rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
				} else if (rand <= 33) { // 1%
					win = baseCoins * 2;
					rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
				} else if (rand <= 24.5) { // 0.5%
					win = baseCoins * 10;
					rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
				} else { // 75.5%
					let slot1 = Math.floor(Math.random() * SLOTS.length);
					let slot2 = Math.floor(Math.random() * SLOTS.length);
					let slot3 = Math.floor(Math.random() * SLOTS.length);
					if (slot2 === slot1) slot2 = (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
					if (slot3 === slot1 || slot3 === slot2) slot3 = (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
					rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
				}
			} else {
				if (rand <= 20) { // 20% for baseCoins
					win = baseCoins;
					rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
				} else if (rand <= 30) { // 10% for baseCoins * 2
					win = baseCoins * 2;
					rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
				} else if (rand <= 35) { // 5% for baseCoins * 3
					win = baseCoins * 3;
					rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
				} else if (rand <= 39) { // 4% for baseCoins * 4
					win = baseCoins * 4;
					rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
				} else if (rand <= 43) { // 3% for baseCoins * 5
					win = baseCoins * 5;
					rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
				} else if (rand <= 45) { // 2% for baseCoins * 10
					win = baseCoins * 10;
					rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
				} else { // 60% chance to lose
					let slot1 = Math.floor(Math.random() * SLOTS.length);
					let slot2 = Math.floor(Math.random() * SLOTS.length);
					let slot3 = Math.floor(Math.random() * SLOTS.length);
					if (slot2 === slot1) slot2 = (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
					if (slot3 === slot1 || slot3 === slot2) slot3 = (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
					rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
					win = 0;
				}
			}

			let newBalance = coin + win - baseCoins;
			const initialEmbed = client.embed()
				.setColor(color.main)
				.setThumbnail(ctx.author.displayAvatarURL({dynamic: true, size: 1024}))
				.setDescription(`# **${emoji.slots.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.slots.mainRight}**\n ### ┍━━━━━»•» 🌺 «•«━┑\n ## **❯「${emoji.slots.spin} ${emoji.slots.spin} ${emoji.slots.spin}」❮**\n ### ┕━»•» 🌺 «•«━━━━━┙\n\nYou bet **${client.utils.formatNumber(baseCoins)}** ${emoji.coin}\n`)
				.setFooter({
					text: `${ctx.author.displayName}, your game is in progress!`,
					iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
				})
			
			ctx.sendMessage({embeds: [initialEmbed]}).then(initialMessage => {
				ctx.msg = initialMessage; // Store the message object
				// Update the user's balance immediately
				Users.updateOne({userId: ctx.author.id}, {
					$set: {
						'balance.coin': newBalance,
						'balance.bank': bank
					}
				}).exec();

			const spinEmbed = client.embed()
				.setColor(color.main)
				.setThumbnail(ctx.author.displayAvatarURL({dynamic: true, size: 1024}))
				.setDescription(`# **${emoji.slots.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.slots.mainRight}**\n ### ┍━━━━━»•» 🌺 «•«━┑\n ## **❯「${rslots[0]} ${emoji.slots.spin} ${emoji.slots.spin}」❮**\n ### ┕━»•» 🌺 «•«━━━━━┙\n\nYou bet **${client.utils.formatNumber(baseCoins)}** ${emoji.coin}\n`)
				.setFooter({
					text: `${ctx.author.displayName}, your game is in progress!`,
					iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
				})

			const spinSecondEmbed = client.embed()
				.setColor(color.main)
				.setThumbnail(ctx.author.displayAvatarURL({dynamic: true, size: 1024}))
				.setDescription(`# **${emoji.slots.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.slots.mainRight}**\n ### ┍━━━━━»•» 🌺 «•«━┑\n ## **❯「${rslots[0]} ${emoji.slots.spin} ${rslots[2]}」❮**\n ### ┕━»•» 🌺 «•«━━━━━┙\n\nYou bet **${client.utils.formatNumber(baseCoins)}** ${emoji.coin}\n`)
				.setFooter({
					text: `${ctx.author.displayName}, your game is in progress!`,
					iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
				})

			const resultEmbed = client.embed()
				.setColor(color.main)
				.setThumbnail(ctx.author.displayAvatarURL({dynamic: true, size: 1024}))
				.setDescription(`# **${emoji.slots.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.slots.mainRight}**\n ### ┍━━━━━»•» 🌺 «•«━┑\n ## **❯「${rslots[0]} ${rslots[1]} ${rslots[2]}」❮**\n ### ┕━»•» 🌺 «•«━━━━━┙\n\nYou bet **${client.utils.formatNumber(baseCoins)}** ${emoji.coin}\n${win === 0 ? `and lost **${client.utils.formatNumber(baseCoins)}** ${emoji.coin}` : `and won **${client.utils.formatNumber(win)}** ${emoji.coin}`}`)
				.setFooter({
					text: `${ctx.author.displayName}! your game is over.`,
					iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
				})

			setTimeout(async () => {
				await ctx.editMessage({embeds: [spinEmbed]});
				setTimeout(async () => {
					await ctx.editMessage({embeds: [spinSecondEmbed]});
					setTimeout(async () => {
						await ctx.editMessage({embeds: [resultEmbed]});
					}, 1000);
				}, 700);
			}, 1000);
			}).catch(err => console.error("Error sending initial message:", err));
		})
	}
}