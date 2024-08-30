const { Command } = require("../../structures");
const Users = require("../../schemas/User");
const numeral = require("numeral");
const random = require("random-number-csprng");
const { SLOTS, SPIN, COIN, TITLE } = require("../../utils/Emoji");

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
			cooldown: 12,
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
			rslots.push(SLOTS[1]);
			rslots.push(SLOTS[1]);
			rslots.push(SLOTS[1]);
		} else if (rand <= 33) { // 13%
			win = baseCoins * 2;
			rslots.push(SLOTS[2]);
			rslots.push(SLOTS[2]);
			rslots.push(SLOTS[2]);
		} else if (rand <= 41.5) { // 8.5%
			win = baseCoins * 3;
			rslots.push(SLOTS[3]);
			rslots.push(SLOTS[3]);
			rslots.push(SLOTS[3]);
		} else if (rand <= 48) { // 7.5%
			win = 0;
			rslots.push(SLOTS[0]);
			rslots.push(SLOTS[0]);
			rslots.push(SLOTS[0]);
		} else if (rand <= 52.75) { // 3.75%
			win = baseCoins * 4;
			rslots.push(SLOTS[4]);
			rslots.push(SLOTS[4]);
			rslots.push(SLOTS[4]);
		} else if (rand <= 55.75) { // 1.5%
			win = baseCoins * 10;
			rslots.push(SLOTS[5]);
			rslots.push(SLOTS[5]);
			rslots.push(SLOTS[5]);
		} else { // 45.5%
			let slot1 = Math.floor(Math.random() * SLOTS.length);
			let slot2 = Math.floor(Math.random() * SLOTS.length);
			let slot3 = Math.floor(Math.random() * SLOTS.length);
			if (slot2 === slot1) slot2 = (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
			if (slot3 === slot1 || slot3 === slot2) slot3 = (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
			rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
		}

		let content = `**${TITLE} 𝐒𝐋𝐎𝐓𝐒 ${TITLE}**\n` +
			`**\`[\` ${SPIN} ${SPIN} ${SPIN} \`]\`** ** ${ctx.author.displayName} ** \n` +
			`**\`|        |\` You bet \`${numeral(baseCoins).format()}\` ${COIN}**\n` +
			`**\`|        |\`**`;

		const newBalance = coin + win - baseCoins;
		await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'balance.bank': bank } }).exec();
		await ctx.sendMessage({ content: content });

		let winmsg = win === 0 ? `and lost \`${numeral(baseCoins).format()}\`` : `and won \`${numeral(win).format()}\``;

		setTimeout(async function () {
			let content = `**${TITLE} 𝐒𝐋𝐎𝐓𝐒 ${TITLE}**\n` +
				`**\`[\` ${rslots[0]} ${SPIN} ${SPIN} \`]\`** ** ${ctx.author.displayName} ** \n` +
				`**\`|        |\` You bet \`${numeral(baseCoins).format()}\` ${COIN}**\n` +
				`**\`|        |\`**`;

			await ctx.editMessage({ content: content });
			setTimeout(async function () {
				let content = `**${TITLE} 𝐒𝐋𝐎𝐓𝐒 ${TITLE}**\n` +
					`**\`[\` ${rslots[0]} ${SPIN} ${rslots[2]} \`]\`** ** ${ctx.author.displayName} ** \n` +
					`**\`|        |\` You bet \`${numeral(baseCoins).format()}\` ${COIN}**\n` +
					`**\`|        |\`**`;

				await ctx.editMessage({ content: content });
				setTimeout(async function () {
					let content = `**${TITLE} 𝐒𝐋𝐎𝐓𝐒 ${TITLE}**\n` +
						`**\`[\` ${rslots[0]} ${rslots[1]} ${rslots[2]} \`]\`** ** ${ctx.author.displayName} ** \n` +
						`**\`|        |\` You bet \`${numeral(baseCoins).format()}\` ${COIN}**\n` +
						`**\`|        |\` ${winmsg} ${COIN}**`;

					await ctx.editMessage({ content: content });
				}, 1000);
			}, 700);
		}, 1000);
	}
}

module.exports = Slots;
