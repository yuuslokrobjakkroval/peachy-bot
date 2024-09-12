const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const numeral = require("numeral");
const random = require("random-number-csprng");

const maxAmount = 250000;

class Slots extends Command {
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
			cooldown: 8,
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

	async run(client, ctx, args, language) {
		const SLOTS = [client.emoji.slots.cat, client.emoji.slots.coffee, client.emoji.slots.heart, client.emoji.slots.cake, client.emoji.slots.milk, client.emoji.slots.peachy]
		const user = await Users.findOne({ userId: ctx.author.id }).exec();
		const { coin, bank } = user.balance;
		if (coin < 1) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'zero_balance'));

		let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[0] || 1;
		if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
			const amountMap = { all: coin, half: Math.ceil(coin / 2) };
			if (amount in amountMap) amount = amountMap[amount];
			else {
				return await ctx.sendMessage({
					embeds: [
						client.embed().setColor(client.color.red).setDescription(client.i18n.get(language, 'commands', 'invalid_amount')),
					],
				});
			}
		}

		const baseCoins = parseInt(Math.min(amount, coin, maxAmount));
		await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': coin - baseCoins, 'balance.bank': bank } }).exec();

		// ===================================== > Decide Results < ===================================== \\
		let rslots = [];
		let rand = (await random(1, 1000)) / 10;
		let win = 0;

		if (rand <= 20) { // 20%
			win = baseCoins;
			rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
		} else if (rand <= 33) { // 13%
			win = baseCoins * 2;
			rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
		} else if (rand <= 41.5) { // 8.5%
			win = baseCoins * 3;
			rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
		} else if (rand <= 48) { // 7.5%
			win = 0;
			rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
		} else if (rand <= 54.75) { // 5.75%
			win = baseCoins * 4;
			rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
		} else if (rand <= 57.25) { // 2.5%
			win = baseCoins * 10;
			rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
		} else { // 42.75%
			let slot1 = Math.floor(Math.random() * SLOTS.length);
			let slot2 = Math.floor(Math.random() * SLOTS.length);
			let slot3 = Math.floor(Math.random() * SLOTS.length);
			if (slot2 === slot1) slot2 = (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
			if (slot3 === slot1 || slot3 === slot2) slot3 = (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
			rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
		}

		let newBalance = coin + win - baseCoins;

		const initialEmbed = client.embed()
			.setColor(client.color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(
				`# **${client.emoji.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${client.emoji.mainRight}**\n ## \`╭┈ • ┈ ୨୧ ┈ • ┈╮\`\n # **\`|\`      ${client.emoji.slots.spin} ${client.emoji.slots.spin} ${client.emoji.slots.spin}       \`|\`**\n ## \`╰┈ • ┈ ୨୧ ┈ • ┈╯\`\n**\nYou bet \`${numeral(baseCoins).format()}\` ${client.emoji.coin}**\n`)
			.setFooter({
				text: `Requested by ${ctx.author.displayName}`,
				iconURL: ctx.author.displayAvatarURL(),
			})

		await ctx.sendMessage({ embeds: [initialEmbed] });


		const spinEmbed = client.embed()
			.setColor(client.color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`# **${client.emoji.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${client.emoji.mainRight}**\n ## \`╭┈ • ┈ ୨୧ ┈ • ┈╮\`\n # **\`|\`      ${rslots[0]} ${client.emoji.slots.spin} ${client.emoji.slots.spin}       \`|\`**\n ## \`╰┈ • ┈ ୨୧ ┈ • ┈╯\`\n**\nYou bet \`${numeral(baseCoins).format()}\` ${client.emoji.coin}**\n`)
			.setFooter({
				text: `Requested by ${ctx.author.displayName}`,
				iconURL: ctx.author.displayAvatarURL(),
			})

		const spinSecondEmbed = client.embed()
			.setColor(client.color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`# **${client.emoji.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${client.emoji.mainRight}**\n ## \`╭┈ • ┈ ୨୧ ┈ • ┈╮\`\n # **\`|\`      ${rslots[0]} ${client.emoji.slots.spin} ${rslots[2]}       \`|\`**\n ## \`╰┈ • ┈ ୨୧ ┈ • ┈╯\`\n**\nYou bet \`${numeral(baseCoins).format()}\` ${client.emoji.coin}**\n`)
			.setFooter({
				text: `Requested by ${ctx.author.displayName}`,
				iconURL: ctx.author.displayAvatarURL(),
			})

		const resultEmbed = client.embed()
			.setColor(client.color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`# **${client.emoji.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${client.emoji.mainRight}**\n ## \`╭┈ • ┈ ୨୧ ┈ • ┈╮\`\n # **\`|\`     ${rslots[0]} ${rslots[1]} ${rslots[2]}       \`|\`**\n ## \`╰┈ • ┈ ୨୧ ┈ • ┈╯\`\n**\nYou bet \`${numeral(baseCoins).format()}\` ${client.emoji.coin}**\n**${win === 0 ? `and lost \`${numeral(baseCoins).format()}\`` : `and won \`${numeral(win).format()}\``} ${client.emoji.coin}**`)
			.setFooter({
				text: `Requested by ${ctx.author.displayName}`,
				iconURL: ctx.author.displayAvatarURL(),
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

		await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'balance.bank': bank } }).exec();
	}
}

module.exports = Slots;
