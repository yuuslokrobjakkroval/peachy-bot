const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Users = require('../../schemas/user');
const ImportantItems = require('../../assets/inventory/ImportantItems.js');
const ShopItems = require('../../assets/inventory/ShopItems.js');
const gif = require("../../utils/Gif");
const moreItems = ShopItems.flatMap(shop => shop.inventory);
const allItems = moreItems.concat(ImportantItems);

module.exports = class Gift extends Command {
    constructor(client) {
        super(client, {
            name: "gift",
            description: {
                content: "Send a random gift from the Mystery Box.",
                examples: ["gift common 3", "gift common 3 #channel"],
                usage: "gift <type> <amount> [channel]",
            },
            category: "utility",
            aliases: ["mysterybox"],
            cooldown: 3,
            permissions: {
                dev: false,
                client: ["SendMessages"],
                user: ["ManageMessages"],
            },
            slashCommand: true,
            args: true,
            options: [
                {
                    name: "box_type",
                    description: "Type of box (common, rare, epic, legendary, mythic)",
                    type: 3,
                    required: true,
                    choices: [
                        {name: "Common", value: "common"},
                        {name: "Rare", value: "rare"},
                        {name: "Epic", value: "epic"},
                        {name: "Legendary", value: "legendary"},
                        {name: "Mythic", value: "mythic"}
                    ]
                },
                {
                    name: "amount",
                    description: "Number of random channels to send gifts to",
                    type: 4,
                    required: true,
                    minValue: 1
                },
                {
                    name: "channel",
                    description: "Channel to send the gift (optional)",
                    type: 7, // Channel type
                    required: false
                }
            ]
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        if (ctx.isInteraction) {
            await ctx.interaction.deferReply({ephemeral: true});
        }

        const boxType = ctx.isInteraction ? ctx.interaction.options.getString('box_type') : args[0];
        const amount = ctx.isInteraction ? ctx.interaction.options.getInteger('amount') : args[1];
        const specifiedChannel = ctx.isInteraction ? ctx.interaction.options.getChannel('channel') : args[2];

        if (!boxType || !["common", "rare", "epic", "legendary", "mythic"].includes(boxType) || isNaN(amount) || amount <= 0) {
            return ctx.isInteraction
                ? ctx.interaction.editReply({
                    content: "Usage: `gift <type> <amount> [channel]` (type: common/rare/epic/legendary/mythic)",
                    ephemeral: true
                })
                : ctx.sendMessage({
                    content: "Usage: `gift <type> <amount> [channel]` (type: common/rare/epic/legendary/mythic)",
                    ephemeral: true
                });
        }

        const gifts = [];
        const sentChannelNames = [];
        const claimedGifts = {};

        const categoryIds = [
            "1299718158403240048",
            "1299720660876136499",
            "1282991864751853569",
            "1282993254169837621",
            "1299715576834560092"
        ];

        // If a specific channel is provided, use it
        let channels;
        if (specifiedChannel) {
            channels = [specifiedChannel]; // Wrap in an array to match the processing logic
        } else {
            // Collect channels from the specified categories
            channels = ctx.guild.channels.cache.filter(channel => categoryIds.includes(channel.parentId));

            // Randomly select 'amount' of channels from the available ones
            channels = channels.random(amount);
        }

        // Check if any channels are available
        if (!channels || channels.length === 0) {
            return ctx.isInteraction
                ? ctx.interaction.editReply({
                    content: "No available channels found.",
                    ephemeral: true
                })
                : ctx.sendMessage({
                    content: "No available channels found.",
                    ephemeral: true
                });
        }

        // Send gifts to each selected channel
        for (const selectedChannel of channels) {
            gifts.push(await getRandomReward(boxType));
            claimedGifts[selectedChannel.id] = []; // Initialize array for claimed users

            const button = new ButtonBuilder()
                .setCustomId('claim_gift')
                .setLabel('Click Me')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            const giftEmbed = client.embed()
                .setColor(color.main)
                .setThumbnail(gif.luck)
                .setTitle(`${boxType.charAt(0).toUpperCase() + boxType.slice(1)} Mystery Box Opened!`)
                .setDescription(`Click the button below to claim your rewards:`)
                .setImage(gif.gift)
                .setFooter({text: "Good luck with your rewards!"});

            const giftMessage = await selectedChannel.send({
                embeds: [giftEmbed],
                components: [row]
            }).catch(err => {
                console.error(`Could not send message to ${selectedChannel.name}:`, err);
            });

            // Store the name of the channel where the gift was sent
            sentChannelNames.push(selectedChannel.name);
            const collector = giftMessage.createMessageComponentCollector({time: 90000});

            collector.on('collect', async (interaction) => {
                await interaction.deferUpdate();

                if (interaction.customId === 'claim_gift') {
                    if (claimedGifts[selectedChannel.id].includes(interaction.user.id)) {
                        return await interaction.followUp({
                            content: "This gift has already been claimed by you!",
                            ephemeral: true
                        });
                    }

                    const reward = gifts.pop(); // Get a random gift from gifts array
                    if (!reward) {
                        return await interaction.followUp({
                            content: "No rewards left to claim.",
                            ephemeral: true
                        });
                    }

                    // Update user collection with the reward and get the summary
                    const rewardSummary = await addRewardToUserInventory(client, interaction, color, emoji, reward);

                    // Record the user who claimed the gift
                    claimedGifts[selectedChannel.id].push(interaction.user.id);

                    // Create an embed for the success message
                    const successEmbed = this.client.embed()
                        .setColor(color.main)
                        .setThumbnail(client.utils.emojiToImage(emoji.congratulation))
                        .setTitle(`Gift Claimed!`)
                        .setDescription(`${interaction.displayName || interaction.user.displayName} received:\n${rewardSummary}`)
                        .setFooter({text: "Enjoy your rewards!"});

                    // Send the success message as an embed
                    try {
                        await giftMessage.delete();
                    } catch (error) {
                        console.error('Error deleting the gift message:', error);
                    }

                    const successMessage = await interaction.followUp({embeds: [successEmbed]});

                    const claimedUsers = await Promise.all(claimedGifts[selectedChannel.id].map(userId => {
                        return client.users.fetch(userId).then(user => user.displayName).catch(err => {
                            console.error(`Error fetching user ${userId}:`, err);
                            return null; // Return null for users that could not be fetched
                        });
                    }));

                    const claimedUsersString = claimedUsers.filter(Boolean).join(', ');

                    const responseMessage = `Gift boxes have been sent to **${amount}** random channels: ${sentChannelNames.join(', ')}!\n` +
                        `${selectedChannel.name} claimed by: ${claimedUsersString}`;

                    if (ctx.isInteraction) {
                        await ctx.interaction.editReply({content: responseMessage});
                    } else {
                        ctx.sendMessage({content: responseMessage, ephemeral: true});
                    }

                    // Schedule the embed message to be deleted after 10 seconds
                    setTimeout(async () => {
                        try {
                            await successMessage.delete();
                        } catch (error) {
                            if (error.code === 10008) {
                                console.log('Message already deleted or unknown.');
                            } else {
                                console.error('Error deleting the success message:', error);
                            }
                        }
                    }, 10000); // 10 seconds
                }
            });

            collector.on('end', async () => {
                try {
                    await giftMessage.delete();
                } catch (error) {
                    if (error.code === 10008) {
                        console.log('Message already deleted or unknown.');
                    } else {
                        console.error('Error deleting the gift message:', error);
                    }
                }
            });
        }

        const channelNamesString = sentChannelNames.join(', ');

        const initialResponseMessage = `Gift boxes have been sent to **${amount}** random channels: ${channelNamesString}!`;

        if (ctx.isInteraction) {
            await ctx.interaction.editReply({content: initialResponseMessage});
        } else {
            ctx.sendMessage({content: initialResponseMessage, ephemeral: true});
        }
    }
}

async function getRandomReward(boxType) {
    let coins;
    const rewards = []; // Initialize an array to store rewards

    // Helper function to get a random item from allItems of a specific type
    const getRandomItem = (type) => {
        const filteredItems = allItems.filter(item => item.type === type);
        return filteredItems[Math.floor(Math.random() * filteredItems.length)];
    };

    switch (boxType) {
        case "common":
            coins = Math.floor(Math.random() * (50000 - 30000 + 1)) + 30000; // Random coins between 30,000 and 50,000

            const foodItemCommon = getRandomItem('food');
            const drinkItemCommon = getRandomItem('drink');

            if (!foodItemCommon || !drinkItemCommon) {
                throw new Error("Failed to retrieve some items for common box.");
            }

            rewards.push({
                id: foodItemCommon.id,
                name: foodItemCommon.name,
                emoji: foodItemCommon.emoji, // Directly using emoji from item
                quantity: Math.floor(Math.random() * (3 - 1 + 1)) + 1 // Random food between 1 and 3
            });
            rewards.push({
                id: drinkItemCommon.id,
                name: drinkItemCommon.name,
                emoji: drinkItemCommon.emoji, // Directly using emoji from item
                quantity: Math.floor(Math.random() * (3 - 1 + 1)) + 1 // Random drink between 1 and 3
            });

            return {
                coins: coins,
                rewards: rewards
            };

        case "rare":
            coins = Math.floor(Math.random() * (75000 - 50000 + 1)) + 50000; // Random coins between 50,000 and 75,000

            const foodItemRare = getRandomItem('food');
            const drinkItemRare = getRandomItem('drink');

            if (!foodItemRare || !drinkItemRare) {
                throw new Error("Failed to retrieve some items for rare box.");
            }

            rewards.push({
                id: foodItemRare.id,
                name: foodItemRare.name,
                emoji: foodItemRare.emoji, // Directly using emoji from item
                quantity: Math.floor(Math.random() * (5 - 3 + 1)) + 3 // Random food between 3 and 5
            });
            rewards.push({
                id: drinkItemRare.id,
                name: drinkItemRare.name,
                emoji: drinkItemRare.emoji, // Directly using emoji from item
                quantity: Math.floor(Math.random() * (5 - 3 + 1)) + 3 // Random drink between 3 and 5
            });

            return {
                coins: coins,
                rewards: rewards
            };

        case "epic":
            coins = Math.floor(Math.random() * (100000 - 80000 + 1)) + 80000; // Random coins between 80,000 and 100,000

            const foodItemEpic = getRandomItem('food');
            const drinkItemEpic = getRandomItem('drink');
            const milkItemEpic = getRandomItem('milk');

            if (!foodItemEpic || !drinkItemEpic || !milkItemEpic) {
                throw new Error("Failed to retrieve some items for epic box.");
            }

            rewards.push({
                id: foodItemEpic.id,
                name: foodItemEpic.name,
                emoji: foodItemEpic.emoji, // Directly using emoji from item
                quantity: Math.floor(Math.random() * (8 - 7 + 1)) + 7 // Random food between 7 and 8
            });
            rewards.push({
                id: drinkItemEpic.id,
                name: drinkItemEpic.name,
                emoji: drinkItemEpic.emoji, // Directly using emoji from item
                quantity: Math.floor(Math.random() * (8 - 7 + 1)) + 7 // Random drink between 7 and 8
            });
            rewards.push({
                id: milkItemEpic.id,
                name: milkItemEpic.name,
                emoji: milkItemEpic.emoji, // Directly using emoji from item
                quantity: Math.floor(Math.random() * (3 - 1 + 1)) + 1 // Random milk between 1 and 3
            });

            return {
                amount: coins,
                rewards: rewards
            };

        case "legendary":
            coins = Math.floor(Math.random() * (300000 - 100000 + 1)) + 100000; // Random coins between 100,000 and 300,000

            const foodItemLegendary = getRandomItem('food');
            const drinkItemLegendary = getRandomItem('drink');
            const milkItemLegendary = getRandomItem('milk');

            if (!foodItemLegendary || !drinkItemLegendary || !milkItemLegendary) {
                throw new Error("Failed to retrieve some items for legendary box.");
            }

            rewards.push({
                id: foodItemLegendary.id,
                name: foodItemLegendary.name,
                emoji: foodItemLegendary.emoji, // Directly using emoji from item
                quantity: 10 // Fixed food quantity
            });
            rewards.push({
                id: drinkItemLegendary.id,
                name: drinkItemLegendary.name,
                emoji: drinkItemLegendary.emoji, // Directly using emoji from item
                quantity: 10 // Fixed drink quantity
            });
            rewards.push({
                id: milkItemLegendary.id,
                name: milkItemLegendary.name,
                emoji: milkItemLegendary.emoji, // Directly using emoji from item
                quantity: Math.floor(Math.random() * (5 - 3 + 1)) + 3 // Random milk between 3 and 5
            });

            return {
                amount: coins,
                rewards: rewards
            };

        case "mythic":
            coins = 1000000; // Fixed coins amount

            const foodItemMythic = getRandomItem('food');
            const drinkItemMythic = getRandomItem('drink');
            const milkItemMythic = getRandomItem('milk');

            if (!foodItemMythic || !drinkItemMythic || !milkItemMythic) {
                throw new Error("Failed to retrieve some items for mythic box.");
            }

            rewards.push({
                id: foodItemMythic.id,
                name: foodItemMythic.name,
                emoji: foodItemMythic.emoji, // Directly using emoji from item
                quantity: 10 // Fixed food quantity
            });
            rewards.push({
                id: drinkItemMythic.id,
                name: drinkItemMythic.name,
                emoji: drinkItemMythic.emoji, // Directly using emoji from item
                quantity: 10 // Fixed drink quantity
            });
            rewards.push({
                id: milkItemMythic.id,
                name: milkItemMythic.name,
                emoji: milkItemMythic.emoji, // Directly using emoji from item
                quantity: 5 // Fixed milk quantity
            });

            return {
                amount: coins,
                rewards: rewards
            };

        default:
            throw new Error("Invalid box type provided");
    }
}

async function addRewardToUserInventory(client, interaction, color, emoji, reward) {
    const rewardSummary = []; // Initialize an array to store the summary of rewards
    try {
        // Find the user by userId
        const user = await Users.findOne({ userId: interaction.user.id });

        if (!user) {
            return await interaction.reply({
                content: "User not found in the database.",
                ephemeral: true,
            });
        }

        // Process coins
        if (reward.amount) {
            user.balance.coin += reward.amount;
            rewardSummary.push(`**${client.utils.formatNumber(reward.amount)}** ${emoji.coin}`);
        }

        // Process item rewards
        for (const item of reward.rewards) {
            const inventoryItem = user.inventory.find(i => i.id === item.id); // Match by ID

            if (inventoryItem) {
                inventoryItem.quantity += item.quantity; // Update existing item's quantity
                rewardSummary.push(`**${item.emoji} ${item.name} ${item.quantity}**`);
            } else {
                // If it doesn't exist, add it to the inventory
                user.inventory.push({ id: item.id, name: item.name, quantity: item.quantity });
                rewardSummary.push(`**${item.emoji} ${item.name} ${item.quantity}**`);
            }
        }

        // Save the updated user
        await user.save();

        return rewardSummary.join('\n'); // Return a formatted string of rewards received
    } catch (error) {
        console.error('Error adding reward to inventory:', error);
        await interaction.reply({
            content: "An error occurred while processing your reward. Please try again.",
            ephemeral: true,
        });
    }
}

