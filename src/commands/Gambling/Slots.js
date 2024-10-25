const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const numeral = require("numeral");
const random = require("random-number-csprng");
const emojiImage = require("../../utils/Emoji");

const maxAmount = 250000;

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
			cooldown: 3,
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
					type: 10,
					required: true,
				},
			],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
		const user = await Users.findOne({ userId: ctx.author.id }).exec();
		const SLOTS = [emoji.slots.cat, emoji.slots.coffee, emoji.slots.heart, emoji.slots.cake, emoji.slots.milk, emoji.slots.peachy]
		const verify = user.verification.verify.status === 'verified';
		const { coin, bank } = user.balance;

		if (coin < 1) {
			return await client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
		}

		let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[0] || 1;
		if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
			const amountMap = { all: coin, half: Math.ceil(coin / 2) };
			if (amount in amountMap) {
				amount = amountMap[amount];
			} else {
				return await client.utils.sendErrorMessage(client, ctx, generalMessages.invalidAmount, color);
			}
		}

		const baseCoins = parseInt(Math.min(amount, coin, maxAmount));
		await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': coin - baseCoins, 'balance.bank': bank } }).exec();

		// ===================================== > Decide Results < ===================================== \\
		let rslots = [];
		let rand = (await random(1, 1000)) / 10;
		let win = 0;

		 if (verify) {
			if (rand <= 24) { // 24%
				win = baseCoins;
				rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
			} else if (rand <= 38) { // 12%
				win = baseCoins * 2;
				rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
			} else if (rand <= 46) { // 8%
				win = baseCoins * 3;
				rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
			} else if (rand <= 55) { // 9%
				win = 0;
				rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
			} else if (rand <= 58) { // 3%
				win = baseCoins * 4;
				rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
			} else if (rand <= 60) { // 2%
				win = baseCoins * 10;
				rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
			} else { // 40%
				let slot1 = Math.floor(Math.random() * SLOTS.length);
				let slot2 = Math.floor(Math.random() * SLOTS.length);
				let slot3 = Math.floor(Math.random() * SLOTS.length);
				if (slot2 === slot1) slot2 = (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
				if (slot3 === slot1 || slot3 === slot2) slot3 = (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
				rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
			}
		} else {
			if (rand <= 25) { // 25%
				win = baseCoins;
				rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
			} else if (rand <= 36) { // 11%
				win = baseCoins * 2;
				rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
			} else if (rand <= 44) { // 8%
				win = baseCoins * 3;
				rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
			} else if (rand <= 54) { // 10%
				win = 0;
				rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
			} else if (rand <= 58) { // 4%
				win = baseCoins * 4;
				rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
			} else if (rand <= 60) { // 2%
				win = baseCoins * 10;
				rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
			} else { // 49.50%
				let slot1 = Math.floor(Math.random() * SLOTS.length);
				let slot2 = Math.floor(Math.random() * SLOTS.length);
				let slot3 = Math.floor(Math.random() * SLOTS.length);
				if (slot2 === slot1) slot2 = (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
				if (slot3 === slot1 || slot3 === slot2) slot3 = (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
				rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
			}
		}

		let newBalance = coin + win - baseCoins;
		const initialEmbed = client.embed()
			.setColor(color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`# **${emoji.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.mainRight}**\n ### \`╭┈ • ┈ ୨୧ ┈ • ┈╮\`\n ## **\`|\`     ${emoji.slots.spin} ${emoji.slots.spin} ${emoji.slots.spin}     \`|\`**\n ### \`╰┈ • ┈ ୨୧ ┈ • ┈╯\`\n**\nYou bet \`${numeral(baseCoins).format()}\` ${emoji.coin}**\n`)
			.setFooter({
				text: `${ctx.author.displayName}, your game is in progress!`,
				iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
			})

		await ctx.sendMessage({ embeds: [initialEmbed] });
		await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'balance.bank': bank } }).exec();

		const spinEmbed = client.embed()
			.setColor(color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`# **${emoji.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.mainRight}**\n ### \`╭┈ • ┈ ୨୧ ┈ • ┈╮\`\n ## **\`|\`     ${rslots[0]} ${emoji.slots.spin} ${emoji.slots.spin}     \`|\`**\n ### \`╰┈ • ┈ ୨୧ ┈ • ┈╯\`\n**\nYou bet \`${numeral(baseCoins).format()}\` ${emoji.coin}**\n`)
			.setFooter({
				text: `${ctx.author.displayName}, your game is in progress!`,
				iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
			})

		const spinSecondEmbed = client.embed()
			.setColor(color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`# **${emoji.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.mainRight}**\n ### \`╭┈ • ┈ ୨୧ ┈ • ┈╮\`\n ## **\`|\`     ${rslots[0]} ${emoji.slots.spin} ${rslots[2]}     \`|\`**\n ### \`╰┈ • ┈ ୨୧ ┈ • ┈╯\`\n**\nYou bet \`${numeral(baseCoins).format()}\` ${emoji.coin}**\n`)
			.setFooter({
				text: `${ctx.author.displayName}, your game is in progress!`,
				iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
			})

		const resultEmbed = client.embed()
			.setColor(color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`# **${emoji.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.mainRight}**\n ### \`╭┈ • ┈ ୨୧ ┈ • ┈╮\`\n ## **\`|\`     ${rslots[0]} ${rslots[1]} ${rslots[2]}     \`|\`**\n ### \`╰┈ • ┈ ୨୧ ┈ • ┈╯\`\n**\nYou bet \`${numeral(baseCoins).format()}\` ${emoji.coin}**\n**${win === 0 ? `and lost \`${numeral(baseCoins).format()}\`` : `and won \`${numeral(win).format()}\``} ${emoji.coin}**`)
			.setFooter({
				text: `${ctx.author.displayName}! your game is over.`,
				iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
			})

		setTimeout(async function () {
			await ctx.editMessage({ embeds: [spinEmbed] });
			setTimeout(async function () {
				await ctx.editMessage({embeds: [spinSecondEmbed]});
				setTimeout(async function () {
					await ctx.editMessage({embeds: [resultEmbed]});
				}, 1000);
			}, 700);
		}, 1000);

	}
}