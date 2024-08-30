const { Command } = require('../../structures/index.js');
const canvafy = require('canvafy');
const Users = require("../../schemas/User.js");
const gif = require('../../utils/Gif');
const { formatUsername } = require('../../utils/Utils');

const LevelBackground = [
    gif.levelOne,
    gif.levelTwo,
    gif.levelThree,
    gif.levelFour,
    gif.levelFive,
    gif.levelSix
];

module.exports = class LevelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'level',
            description: {
                content: 'Displays level and XP for a user.',
                examples: ['level', 'level @user'],
                usage: 'level [user]',
            },
            category: 'leveling',
            aliases: ['level', 'lvl', 'lv'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'AttachFiles'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'user',
                    description: 'The user to get level and XP for.',
                    type: 6,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, language) {
        try {
            if (ctx.isInteraction) {
                await ctx.interaction.deferReply({ ephemeral: true });
            }

            const targetUser = ctx.isInteraction
                ? ctx.interaction.options.getUser('user') || ctx.user
                : ctx.message.mentions.users.first() || ctx.author;

            const userData = await Users.findOne({ userId: targetUser.id }).exec();
            if (!userData || !userData.profile) {
                const replyMessage = 'User does not have any level data.';
                if (ctx.isInteraction) {
                    return ctx.interaction.followUp({ content: replyMessage, ephemeral: true });
                } else {
                    return ctx.sendMessage(replyMessage);
                }
            }

            const { level: userLevel, exp: userXp, levelExp: nextLevelExp } = userData.profile;

            const levelIndex = Math.min(userLevel - 1, LevelBackground.length - 1);
            const backgroundImage = LevelBackground[levelIndex];

            const rank = await new canvafy.Rank()
                .setAvatar(targetUser.displayAvatarURL({ format: 'png', size: 512 }))
                .setBackground("image", backgroundImage)
                .setUsername(formatUsername(targetUser.username))
                .setBorder("#bbdee4")
                .setLevel(userLevel)
                .setLevelColor({ text: "#ff0000", number: "#00ff00" })
                .setCurrentXp(userXp)
                .setRequiredXp(nextLevelExp)
                .build();

            const file = {
                attachment: rank,
                name: `rank-${targetUser.id}.png`,
            };

            if (ctx.isInteraction) {
                await ctx.interaction.followUp({ files: [file] });
            } else {
                await ctx.sendMessage({ files: [file] });
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = 'An error occurred while fetching the level data.';
            if (ctx.isInteraction) {
                await ctx.interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await ctx.sendMessage(errorMessage);
            }
        }
    }
};
