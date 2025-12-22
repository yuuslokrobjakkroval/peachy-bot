/**
 * @namespace: quest/tasks/questScheduler.js (adapted)
 * @type: Scheduled Task
 * @description Quest Notifier scheduler - checks for new Discord quests and posts them
 */

const cron = require('node-cron');
const QuestConfig = require('../schemas/questConfig');
const QuestGuildLog = require('../schemas/questGuildLog');

/**
 * Try a list of API URLs and return the first successful quests response.
 * @param {string[]} urls
 * @param {object} logger
 * @returns {Promise<null|Array>} - API Quests array, or null if all fail
 */
async function fetchQuestsFromAny(urls, logger) {
    const TIMEOUT_MS = 5000;

    for (const url of urls) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            logger.warn(`⏰ [QuestNotifier] API timeout (5s) for ${url}. Aborting...`);
            controller.abort();
        }, TIMEOUT_MS);

        try {
            logger.info(`⏰ [QuestNotifier] Trying quest API: ${url}`);

            const response = await fetch(url, {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                logger.warn(`⏰ [QuestNotifier] API fetch failed with status ${response.status} for ${url}`);
                continue;
            }

            const apiQuests = await response.json();
            logger.info(`⏰ [QuestNotifier] Got quest data from: ${url}`);
            return apiQuests;
        } catch (e) {
            clearTimeout(timeoutId);

            if (e.name === 'AbortError') {
                // Timeout occurred
            } else {
                logger.warn(`⏰ [QuestNotifier] Error fetching from ${url}: ${e.message}`);
            }
        }
    }

    return null;
}

/**
 * Build a quest notification message
 * @param {object} client Discord client
 * @param {object} quest Quest object from API
 * @param {string} roleMention Optional role to mention
 * @returns {Promise<object>} Message content and components
 */
async function buildQuestNotification(client, quest, roleMention = null) {
    try {
        const config = quest.config;

        const title = `🎁 **${config.messages?.quest_name || 'New Discord Quest'}**`;
        const description = config.messages?.quest_name || 'A new quest is available!';

        const embed = client
            .embed()
            .setColor(0x5865f2) // Discord blue
            .setTitle(title)
            .setDescription(description);

        if (config.messages?.game_title) {
            embed.addFields({
                name: 'Game',
                value: config.messages.game_title,
                inline: true,
            });
        }

        if (config.messages?.game_publisher) {
            embed.addFields({
                name: 'Publisher',
                value: config.messages.game_publisher,
                inline: true,
            });
        }

        // Add reward info if available
        if (config.rewards_config?.rewards?.[0]) {
            const reward = config.rewards_config.rewards[0];
            const rewardText = reward.messages?.name || 'Mystery Reward';
            if (reward.orb_quantity) {
                embed.addFields({
                    name: 'Reward',
                    value: `${rewardText} (${reward.orb_quantity} Orbs)`,
                    inline: true,
                });
            } else {
                embed.addFields({
                    name: 'Reward',
                    value: rewardText,
                    inline: true,
                });
            }
        }

        // Format task list
        if (config.task_config_v2?.tasks) {
            const tasks = Object.values(config.task_config_v2.tasks);
            const taskList = tasks
                .map((task) => {
                    let platform = task.type?.replace(/_/g, ' ').toLowerCase() || 'Unknown';
                    platform = platform.charAt(0).toUpperCase() + platform.slice(1);

                    const minutes = Math.floor(task.target / 60);
                    const seconds = task.target % 60;
                    let duration = '';

                    if (minutes > 0) {
                        duration = `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
                    } else {
                        duration = `${seconds}s`;
                    }

                    return `• ${platform} for ${duration}`;
                })
                .join('\n');

            if (taskList) {
                embed.addFields({
                    name: 'Tasks',
                    value: taskList,
                    inline: false,
                });
            }
        }

        // Add quest link
        if (config.id) {
            const questUrl = `https://discord.com/quests/${config.id}`;
            embed.setURL(questUrl);
        }

        // Add timestamps
        if (config.starts_at || config.expires_at) {
            const footer = [];
            if (config.starts_at) {
                const startTime = new Date(config.starts_at);
                footer.push(`Starts: ${startTime.toLocaleDateString()}`);
            }
            if (config.expires_at) {
                const endTime = new Date(config.expires_at);
                footer.push(`Expires: ${endTime.toLocaleDateString()}`);
            }
            embed.setFooter({ text: footer.join(' • ') });
        }

        const content = roleMention ? `${roleMention} 🎁 New quest available!` : '🎁 New quest available!';

        return {
            content,
            embeds: [embed],
        };
    } catch (error) {
        client.logger?.error('Error building quest notification:', error);
        return {
            content: roleMention ? `${roleMention}` : '',
            embeds: [
                {
                    title: '🎁 New Discord Quest',
                    description: 'A new quest is available on Discord!',
                    color: 0x5865f2,
                    url: 'https://discord.com/quests',
                },
            ],
        };
    }
}

/**
 * Main quest check function
 */
async function checkQuests(client, logger, apiUrls) {
    logger.info('⏰ [QuestNotifier] Running quest check...');

    if (!apiUrls || apiUrls.length === 0) {
        logger.error('⏰ [QuestNotifier] No API URLs configured!');
        return;
    }

    try {
        const apiQuests = await fetchQuestsFromAny(apiUrls, logger);

        if (!apiQuests || apiQuests.length === 0) {
            logger.warn('⏰ [QuestNotifier] No quests retrieved from API.');
            return;
        }

        logger.info(`⏰ [QuestNotifier] Retrieved ${apiQuests.length} quests from API`);

        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

        const validQuests = apiQuests.filter((quest) => {
            const startsAt = new Date(quest.config?.starts_at || 0);
            const expiresAt = new Date(quest.config?.expires_at || 0);

            const isExpired = expiresAt < now;
            const isTooOld = startsAt < twoDaysAgo;

            return !isExpired && !isTooOld;
        });

        if (validQuests.length === 0) {
            logger.info('⏰ [QuestNotifier] No valid quests found.');
            return;
        }

        logger.info(`⏰ [QuestNotifier] Found ${validQuests.length} valid quests`);

        const allGuildConfigs = await QuestConfig.find().lean();
        if (allGuildConfigs.length === 0) {
            logger.info('⏰ [QuestNotifier] No guilds have set up the notifier.');
            return;
        }

        logger.info(`⏰ [QuestNotifier] Notifying ${allGuildConfigs.length} guilds`);

        const validQuestIds = validQuests.map((q) => q.id);

        for (const config of allGuildConfigs) {
            try {
                const channel = await client.channels.fetch(config.channelId).catch(() => null);

                if (!channel) {
                    logger.warn(`⏰ [QuestNotifier] Channel ${config.channelId} not found for guild ${config.guildId}. Removing config.`);
                    await QuestConfig.deleteOne({ guildId: config.guildId });
                    continue;
                }

                // Find which quests have already been sent to this guild
                const sentLogs = await QuestGuildLog.find({
                    guildId: config.guildId,
                    questId: { $in: validQuestIds },
                }).lean();

                const sentQuestIds = new Set(sentLogs.map((log) => log.questId));

                const questsToSend = validQuests.filter((quest) => !sentQuestIds.has(quest.id));

                if (questsToSend.length === 0) {
                    logger.info(`⏰ [QuestNotifier] No new quests for guild ${config.guildId}`);
                    continue;
                }

                logger.info(`⏰ [QuestNotifier] Sending ${questsToSend.length} new quest(s) to guild ${config.guildId}...`);

                for (const quest of questsToSend) {
                    try {
                        const role = config.roleId ? `<@&${config.roleId}>` : null;
                        const message = await buildQuestNotification(client, quest, role);

                        await channel.send(message);

                        // Log that this quest was sent to this guild
                        await QuestGuildLog.create({
                            guildId: config.guildId,
                            questId: quest.id,
                        });

                        logger.info(`⏰ [QuestNotifier] Sent quest ${quest.id} to guild ${config.guildId}`);
                    } catch (questError) {
                        logger.error(
                            `⏰ [QuestNotifier] Failed to send quest ${quest.id} to guild ${config.guildId}: ${questError.message}`
                        );
                    }
                }
            } catch (guildError) {
                logger.error(`⏰ [QuestNotifier] Failed to process guild ${config.guildId}: ${guildError.message}`);
            }
        }

        logger.info('⏰ [QuestNotifier] Quest check completed.');
    } catch (error) {
        logger.error(`⏰ [QuestNotifier] ERROR: ${error.message}`);
    }
}

/**
 * Initialize the quest scheduler
 */
function initializeQuestScheduler(client) {
    const logger = client.logger;

    // Default API URLs - can be configured via environment variable
    const apiUrlsEnv = process.env.DISCORD_QUEST_API_URLS || 'https://discordapp.com/api/v10/quests';
    const apiUrls = apiUrlsEnv
        .split(',')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

    // Default cron schedule - every 30 minutes
    const cronSchedule = process.env.DISCORD_QUEST_CRON || '*/30 * * * *';

    if (apiUrls.length === 0) {
        logger.warn(
            '⏰ [QuestNotifier] No API URLs configured. Quest notifier will be disabled. Set DISCORD_QUEST_API_URLS environment variable.'
        );
        return;
    }

    try {
        // Schedule the cron job
        cron.schedule(cronSchedule, () => {
            checkQuests(client, logger, apiUrls);
        });

        logger.info(`⏰ [QuestNotifier] Scheduler initialized with cron pattern: ${cronSchedule}`);

        // Run once on startup
        checkQuests(client, logger, apiUrls);
    } catch (error) {
        logger.error(`⏰ [QuestNotifier] Failed to initialize scheduler: ${error.message}`);
    }
}

module.exports = {
    initializeQuestScheduler,
    checkQuests,
    buildQuestNotification,
};
