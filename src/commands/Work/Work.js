const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const taskOfWork = require('../../assets/inventory/Tasks');
const moment = require("moment/moment");
const chance = require('chance').Chance();

module.exports = class Work extends Command {
    constructor(client) {
        super(client, {
            name: 'work',
            description: {
                content: 'Earn some coins by working.',
                examples: ['work'],
                usage: 'work',
            },
            category: 'work',
            aliases: ['job', 'workjob', 'w'],
            cooldown: 10,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "user",
                    description: "The user to check the tasks",
                    type: 6, // USER type
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const taskMessages = language.locales.get(language.defaultLocale)?.workMessages?.taskMessages;

        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser("user") || ctx.author
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

        const user = await Users.findOne({ userId: mention.id });
        if (!user) {
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
        }

        // Check if user has a job
        const { position, status } = user.work;
        if (!position || position && status !== 'approved') {
            return client.utils.sendErrorMessage(client, ctx, taskMessages.noJob, color);
        }

        // Ensure the job has available tasks
        const tasks = taskOfWork[position]?.tasks;
        if (!tasks || tasks.length === 0) {
            return client.utils.sendErrorMessage(client, ctx, taskMessages.noTasks, color);
        }

        const cooldownTime = 3 * 60 * 60;
        return client.utils.checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime)
            .then(isCooldownExpired => {
                if (!isCooldownExpired) {
                    return client.utils.getCooldown(ctx.author.id, this.name.toLowerCase())
                        .then(lastCooldownTimestamp => {
                            const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                            const duration = moment.duration(remainingTime, 'seconds');
                            const hours = Math.floor(duration.asHours());
                            const minutes = Math.floor(duration.asMinutes()) % 60;
                            const seconds = Math.floor(duration.asSeconds()) % 60;

                            const taskEmbed = client.embed()
                                .setColor(color.main)
                                .setThumbnail(client.utils.emojiToImage(client.utils.emojiPosition(position)))
                                .setDescription(
                                    generalMessages.title
                                        .replace('%{mainLeft}', emoji.mainLeft)
                                        .replace('%{title}', "𝐓𝐀𝐒𝐊𝐒")
                                        .replace('%{mainRight}', emoji.mainRight) +
                                    taskMessages.cooldown
                                        .replace('%{hours}', hours)
                                        .replace('%{minutes}', minutes)
                                        .replace('%{seconds}', seconds) +
                                    `You have a task as a **${client.utils.formatCapitalize(position)}**: **${task}** ${quantity} times.\n` +
                                    `Rewards: ${emoji.coin} **${client.utils.formatNumber(reward.coins)} coins**, ` +
                                    `${emoji.exp} **${client.utils.formatNumber(reward.xp)} xp**`
                                )
                                .setFooter({
                                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                                    iconURL: ctx.author.displayAvatarURL(),
                                });

                            return ctx.sendMessage({embeds: [taskEmbed]});
                        });
                } else {
                    const randomTask = tasks[chance.integer({min: 0, max: tasks.length - 1})];
                    const task = randomTask.task;
                    const quantity = randomTask.quantity;
                    const reward = randomTask.reward;
                    const taskEmbed = client.embed()
                        .setColor(color.main)
                        .setThumbnail(client.utils.emojiToImage(client.utils.emojiPosition(position)))
                        .setDescription(
                            generalMessages.title
                                .replace('%{mainLeft}', emoji.mainLeft)
                                .replace('%{title}', "𝐓𝐀𝐒𝐊𝐒")
                                .replace('%{mainRight}', emoji.mainRight) +
                            `You have a task as a **${client.utils.formatCapitalize(position)}**: **${task}** ${quantity} times.\n` +
                            `Rewards: ${emoji.coin} **${client.utils.formatNumber(reward.coins)} coins**, ` +
                            `${emoji.exp} **${client.utils.formatNumber(reward.xp)} xp**`
                        )
                        .setFooter({
                            text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                            iconURL: ctx.author.displayAvatarURL(),
                        });

                    return ctx.sendMessage({embeds: [taskEmbed]});

                }
            });
    }
};
