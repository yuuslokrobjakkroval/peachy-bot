const { Command } = require("../../structures");
const User = require("../../schemas/user");
const config = require("../../config");
const { TITLE, MALE, FEMALE, GAY} = require("../../utils/Emoji");
const { formatCapitalize } = require('../../functions/function')

class Gender extends Command {
    constructor(client) {
        super(client, {
            name: "gender",
            description: {
                content: "Set your gender.",
                examples: ["gender set male", "gender set female"],
                usage: ["gender set <gender>", "gd set <gender>"],
            },
            category: "profile",
            aliases: ["gender", "gd"],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'gender',
                    description: 'Your gender',
                    type: 'STRING',
                    required: true,
                }
            ],
        });
    }

    async run(client, ctx, args) {
        const user = await User.findOne({ userId: ctx.author.id });

        if (args[0] !== 'set') {
            return ctx.sendMessage({
                content: "Please use the command in the format: `gender set <gender>`.",
                ephemeral: true
            });
        }

        const gender = args.slice(1).join(" ").toLowerCase();
        if (!["male", "female"].includes(gender)) {

            const embed = this.client.embed()
                .setColor(config.color.main)
                .setTitle(`**${TITLE} Gender ${TITLE}**\n`)
                .setDescription("Please specify a valid gender (male, female).");
            return await ctx.channel.send({ embeds: [embed] });
        }

        let GENDER;

        if(gender === "male") {
            GENDER = MALE;
        } else if (gender === "female") {
            GENDER = FEMALE;
        } else {
            GENDER = GAY;
        }

        user.gender = gender;
        await user.save();

        const embed = this.client.embed()
            .setColor(config.color.main)
            .setTitle(`**${TITLE} Gender ${TITLE}**\n`)
            .setDescription(`Your gender has been set to **\`${formatCapitalize(gender)}\`** ${GENDER}.`);

        await ctx.channel.send({ embeds: [embed] });
    }
}

module.exports = Gender;
