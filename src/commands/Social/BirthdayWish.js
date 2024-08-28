const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = class BirthdayWish extends Command {
    constructor(client) {
        super(client, {
            name: 'birthdaywish',
            description: {
                content: 'Sends a random birthday message to the mentioned user.',
                examples: ['birthdaywish @User from Keo'],
                usage: 'birthdaywish @User [from Keo]',
            },
            category: 'fun',
            aliases: ['bdaywish', 'happybirthday'],
            cooldown: 3,
            args: true,
            player: {
                voice: false,
                dj: false,
                active: false,
                djPerm: null,
            },
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [{
                name: 'user',
                description: 'Mention the person whose birthday it is.',
                type: 6, // USER type
                required: true,
            },
            {
                name: 'message',
                description: 'Custom message or "from Keo"',
                type: 3, // STRING type
                required: false,
            }],
        });
    }

    async run(client, ctx) {
        const userMention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]); // Gets the mentioned user
        const messageArg = ctx.isInteraction
            ? ctx.interaction.options.getString('message')
            : ctx.args.slice(1).join(' ');

        const fromKeo = messageArg && messageArg.toLowerCase().includes('from keo');

        // Define a set of random birthday wishes
        const randomWishes = [
            `Happy Birthday! May your special day be filled with love, laughter, and joy. 🎂❤️`,
            `Wishing you a year full of adventure and happiness. Happy Birthday! 🥳`,
            `May all your dreams come true this year. Happy Birthday! 🌟`,
            `Sending you warm wishes and sweet thoughts on your birthday. Enjoy your day! 🎉`,
            `Cheers to another year of greatness. Happy Birthday! 🥂`,
            `May your day be as special as you are. Happy Birthday! 💖`,
            `Here’s to celebrating you! Wishing you a fantastic birthday! 🎈`
        ];

        let message;

        if (fromKeo) {
            message = 
                `Your birthday is the first day of another 365-days journey. Happy birthday to you bong 🎂❤️ ` +
                `I hope your day is filled with lots of love and laughter!😍 May all of your birthday wishes come true.🙏🏻🙏🏻(sathuk sathuk) ` +
                `To someone who touches each life you enter, spreading joy to everyone you meet: may the love and happiness you share ` +
                `with others return to you tenfold.🤗 I wish you many more happy birthdays!!!!!! Mak nimol 😘💋💋 ` +
                `One more thing I just wanna tell you that "They say you lose your memory as you grow older. I say forget about the past ` +
                `and live life to the fullest today. Forget the past; look forward to the future, for the best things are yet to come." ` +
                `Enjoy your wonderful day with your full of smile and your happiness.👄🤑 ` +
                `If in this world don’t need you, I will. Remember that you’re my best sister that I ever never seen. ` +
                `I always keep you in my heart and love you with all my heart like I love my family, also my man😘☺️ ` +
                `Thanks for coming into my life and always protecting me in hard situations. You always stay with me. ` +
                `Love you bong j’muah j’muah bong nimol. I hope that your birthday is as much fun as you are, but that sets a very high standard 😍🎂🎂🎂🎂\n` +
                `**28/08/2024**`;
        } else {
            // Select a random wish from the array
            const randomWish = randomWishes[Math.floor(Math.random() * randomWishes.length)];
            message = `**To my amazing friend, ${userMention},**\n\n${randomWish}\n\n` +
                      `With all my love,\n${ctx.author.username}`;
        }

        const embed = client
            .embed()
            .setColor(client.color.main)
            .setTitle(`💖 Happy Birthday, ${userMention.username}! 💖`)
            .setDescription(message);

        await ctx.sendMessage({ content: `${userMention}`, embeds: [embed], components: [] });
    }
};
