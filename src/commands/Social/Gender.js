const { Command } = require("../../structures");
const User = require("../../schemas/user");

class Gender extends Command {
    constructor(client) {
        super(client, {
            name: "gender",
            description: {
                content: "Set your gender.",
                examples: ["setgender male", "setgender female"],
                usage: "setgender <gender>",
            },
            category: "profile",
            aliases: ["gender", "setgender"],
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
        const gender = args.join(" ").toLowerCase();

        if (!["male", "female", "non-binary", "other"].includes(gender)) {
            return ctx.sendMessage({ content: "Please specify a valid gender (male, female, non-binary, other).", ephemeral: true });
        }

        let user = await User.findOne({ userId: ctx.author.id });
        if (!user) {
            user = new User({
                userId: ctx.author.id,
                balance: 500, // or any default values you want
            });
        }

        user.gender = gender;
        await user.save();

        return ctx.sendMessage({ content: `Your gender has been set to \`${gender}\`.`, ephemeral: true });
    }
}

module.exports = Gender;
