const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = class SisterBirthdayWish extends Command {
    constructor(client) {
        super(client, {
            name: 'sisterbirthday',
            description: {
                content: 'Sends a special birthday message to your sister.',
                examples: ['sisterbirthday @SisterName from Keo'],
                usage: 'sisterbirthday @SisterName [from Keo]',
            },
            category: 'fun',
            aliases: ['sisterbday', 'happysisterbirthday'],
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
                name: 'sister',
                description: 'Mention your sister',
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
        const sisterMention = ctx.isInteraction
                ? ctx.interaction.options.getUser('user')
                : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]); // Gets the mentioned user
        const messageArg = ctx?.options?.getString('message'); // Gets the optional message argument

        const fromKeo = messageArg && messageArg.toLowerCase().includes('from keo');

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
            message = 
                `**To my amazing sister, ${sisterMention},**\n\n` +
                `Words cannot express how much you mean to me. You've been my confidante, my partner in crime, my best friend, and ` +
                `the most wonderful sister anyone could ask for. On your special day, I want you to know just how deeply you're loved and cherished.\n\n` +
                `You've always been there for me, through thick and thin, always ready to lend a listening ear or a shoulder to cry on. ` +
                `Your kindness, generosity, and unwavering support have made my life so much richer, and I am endlessly grateful for all the memories we've shared.\n\n` +
                `As you celebrate another year of life, I wish you nothing but the best. May your day be filled with joy, laughter, and everything that makes you smile. ` +
                `May this year bring you closer to your dreams, and may you find happiness in every moment.\n\n` +
                `No matter where life takes us, know that I will always be here for you, just as you've always been there for me. ` +
                `I am so proud of the person you've become and can't wait to see all the incredible things you will achieve.\n\n` +
                `Happy Birthday, dear sister! Here's to a year filled with love, success, and all the wonderful things you deserve. 🎂🥳\n\n` +
                `With all my love,\n${ctx.author.username}`;
        }

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`💖 Happy Birthday, ${sisterMention.username}! 💖`)
            .setDescription(message);

        

        await ctx.sendMessage({ content: `${sisterMention}`, embeds: [embed], components: [] });
    }
};
