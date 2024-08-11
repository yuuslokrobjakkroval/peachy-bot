const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const numeral = require("numeral");
const random = require("random-number-csprng");
const { SLOTS, SPIN, COIN, TITLE } = require("../../utils/Emoji");

const maxBet = 250000;

class Slots extends Command {
	constructor(client) {
		super(client, {
			name: "slots",
			description: {
				content: "Bet your money in the slot machine! Earn up to 10x your money!",
				examples: ["slots all", "slots 1000"],
				usage: "SLOTS <amount>",
			},
			category: "gamble",
			aliases: ["slots", "slot", "s"],
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
					name: 'amount',
					description: 'The amount of money to bet',
					type: 'INTEGER',
					required: true,
				}
			],
		});
	}

	async run(client, ctx, args) {
		let amount = 0;
		let all = false;

		if (args.length === 0) amount = 1;
		else if (Number.isInteger(parseInt(args[0])) && args.length === 1) amount = parseInt(args[0]);
		else if (args.length === 1 && args[0] === 'all') all = true;
		else {
			return ctx.sendMessage({ content: ", Invalid arguments!! >:c", ephemeral: true });
		}

		if (amount === 0 && !all) {
			return ctx.sendMessage({ content: ", uwu.. you can't bet 0 silly!", ephemeral: true });
		} else if (amount < 0) {
			return ctx.sendMessage({ content: ", that... that's not how it works.", ephemeral: true });
		}

		const user = await Users.findOne({ userId: ctx.author.id });

		if (all) {
			amount = Math.min(user.balance, 250000);
		}

		if (user.balance <= 0 || user.balance < amount) {
			return ctx.sendMessage({ content: '**🚫 | ' + ctx.author.globalName + "**, You don't have enough coin!", ephemeral: true });
		}

		if (amount > maxBet) amount = maxBet;

		// ===================================== > Decide Results < ===================================== \\
		let rslots = [];
		let rand = (await random(1, 1000)) / 10;
		let win = 0;
		
		if (rand <= 18) { // 18%
			win = amount;
			rslots.push(SLOTS[0]);
			rslots.push(SLOTS[0]);
			rslots.push(SLOTS[0]);
		} else if (rand <= 31) { // 13%
			win = amount * 2;
			rslots.push(SLOTS[1]);
			rslots.push(SLOTS[1]);
			rslots.push(SLOTS[1]);
		} else if (rand <= 39.5) { // 8%
			win = amount * 3;
			rslots.push(SLOTS[2]);
			rslots.push(SLOTS[2]);
			rslots.push(SLOTS[2]);
		} else if (rand <= 45) { // 6.5%
			win = 0;
			rslots.push(SLOTS[5]);
			rslots.push(SLOTS[5]);
			rslots.push(SLOTS[5]);
		} else if (rand <= 50.75) { // 5.75%
			win = amount * 4;
			rslots.push(SLOTS[3]);
			rslots.push(SLOTS[3]);
			rslots.push(SLOTS[3]);
		} else if (rand <= 53.25) { // 2.5%
			win = amount * 10;
			rslots.push(SLOTS[4]);
			rslots.push(SLOTS[4]);
			rslots.push(SLOTS[4]);
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
			`**\`|        |\` You bet \`${numeral(amount).format()}\` ${COIN}**\n` +
			`**\`|        |\`**`;

		await Users.updateOne({ userId: ctx.author.id }, { $inc: { balance: win - amount } });
		await ctx.sendMessage({ content: content });



		let winmsg = win === 0 ? `and lost \`${numeral(amount).format()}\`` : `and won \`${numeral(win).format()}\``;

		setTimeout(async function () {
			let content = `**${TITLE} 𝐒𝐋𝐎𝐓𝐒 ${TITLE}**\n` +
				`**\`[\` ${rslots[0]} ${SPIN} ${SPIN} \`]\`** ** ${ctx.author.displayName} ** \n` +
				`**\`|        |\` You bet \`${numeral(amount).format()}\` ${COIN}**\n` +
				`**\`|        |\`**`;

			await ctx.editMessage({ content: content });
			setTimeout(async function () {
				let content = `**${TITLE} 𝐒𝐋𝐎𝐓𝐒 ${TITLE}**\n` +
					`**\`[\` ${rslots[0]} ${SPIN} ${rslots[2]} \`]\`** ** ${ctx.author.displayName} ** \n` +
					`**\`|        |\` You bet \`${numeral(amount).format()}\` ${COIN}**\n` +
					`**\`|        |\`**`;

				await ctx.editMessage({ content: content });
				setTimeout(async function () {
					let content = `**${TITLE} 𝐒𝐋𝐎𝐓𝐒 ${TITLE}**\n` +
						`**\`[\` ${rslots[0]} ${rslots[1]} ${rslots[2]} \`]\`** ** ${ctx.author.displayName} ** \n` +
						`**\`|        |\` You bet \`${numeral(amount).format()}\` ${COIN}**\n` +
						`**\`|        |\` ${winmsg} ${COIN}**`;

					await ctx.editMessage({ content: content });
				}, 1000);
			}, 700);
		}, 1000);
	}
}

module.exports = Slots;
