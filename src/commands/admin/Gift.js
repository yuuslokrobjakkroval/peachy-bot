const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Users = require('../../schemas/user'); // Adjust path
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
                examples: ["gift common 3"],
                usage: "gift <type> <amount>",
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
                        { name: "Common", value: "common" },
                        { name: "Rare", value: "rare" },
                        { name: "Epic", value: "epic" },
                        { name: "Legendary", value: "legendary" },
                        { name: "Mythic", value: "mythic" }
                    ]
                },
                {
                    name: "amount",
                    description: "Number of random channels to send gifts to",
                    type: 4,
                    required: true,
                    minValue: 1
                }
            ]
        });
    }

    getRandomReward(boxType) {
        let coins;
        const rewards = []; // Initialize an array to store rewards

        // Helper function to get a random item from allItems of a specific type
        const getRandomItem = (type) => {
            const filteredItems = allItems.filter(item => item.type === type);
            return filteredItems[Math.floor(Math.random() * filteredItems.length)];
        };

        switch (boxType) {
            case "common":
                coins = Math.floor(Math.random() * (500000 - 300000 + 1)) + 300000; // Random coins between 300,000 and 500,000
                rewards.push({ item: getRandomItem('food').name, quantity: Math.floor(Math.random() * (3 - 1 + 1)) + 1 }); // Random food between 1 and 3
                rewards.push({ item: getRandomItem('drink').name, quantity: Math.floor(Math.random() * (3 - 1 + 1)) + 1 }); // Random drink between 1 and 3
                return {
                    item: "Coins",
                    amount: coins,
                    rewards: rewards
                };

            case "rare":
                coins = Math.floor(Math.random() * (750000 - 500000 + 1)) + 500000; // Random coins between 500,000 and 750,000
                rewards.push({ item: getRandomItem('food').name, quantity: Math.floor(Math.random() * (5 - 3 + 1)) + 3 }); // Random food between 3 and 5
                rewards.push({ item: getRandomItem('drink').name, quantity: Math.floor(Math.random() * (5 - 3 + 1)) + 3 }); // Random drink between 3 and 5
                return {
                    item: "Coins",
                    amount: coins,
                    rewards: rewards
                };

            case "epic":
                coins = Math.floor(Math.random() * (1000000 - 800000 + 1)) + 800000; // Random coins between 800,000 and 1,000,000
                rewards.push({ item: getRandomItem('food').name, quantity: Math.floor(Math.random() * (8 - 7 + 1)) + 7 }); // Random food between 7 and 8
                rewards.push({ item: getRandomItem('drink').name, quantity: Math.floor(Math.random() * (8 - 7 + 1)) + 7 }); // Random drink between 7 and 8
                rewards.push({ item: getRandomItem('milk').name, quantity: Math.floor(Math.random() * (3 - 1 + 1)) + 1 }); // Random milk between 1 and 3
                return {
                    item: "Coins",
                    amount: coins,
                    rewards: rewards
                };

            case "legendary":
                coins = Math.floor(Math.random() * (3000000 - 1000000 + 1)) + 1000000; // Random coins between 1,000,000 and 3,000,000
                // Fixed quantities for food and drink, but randomly select from allItems
                rewards.push({ item: getRandomItem('food').name, quantity: 10 }); // Fixed food quantity
                rewards.push({ item: getRandomItem('drink').name, quantity: 10 }); // Fixed drink quantity
                rewards.push({ item: getRandomItem('milk').name, quantity: Math.floor(Math.random() * (5 - 3 + 1)) + 3 }); // Random milk between 3 and 5
                return {
                    item: "Coins",
                    amount: coins,
                    rewards: rewards
                };

            case "mythic":
                coins = 5000000; // Fixed coins amount
                rewards.push({ item: getRandomItem('food').name, quantity: 10 }); // Fixed food quantity
                rewards.push({ item: getRandomItem('drink').name, quantity: 10 }); // Fixed drink quantity
                rewards.push({ item: getRandomItem('milk').name, quantity: 5 }); // Fixed milk quantity
                return {
                    item: "Coins",
                    amount: coins,
                    rewards: rewards
                };

            default:
                throw new Error("Invalid box type provided");
        }
    }


    async run(client, ctx, args, color, emoji, language) {
        if (ctx.isInteraction) {
            await ctx.interaction.deferReply({ ephemeral: true });
        }

        const boxType = ctx.isInteraction ? ctx.interaction.options.getString('box_type') : args[0];
        const amount = ctx.isInteraction ? ctx.interaction.options.getInteger('amount') : args[1];

        if (!boxType || !["common", "rare", "epic", "legendary", "mythic"].includes(boxType) || isNaN(amount) || amount <= 0) {
            return ctx.isInteraction
                ? ctx.interaction.editReply({ content: "Usage: `gift <type> <amount>` (type: common/rare/epic/legendary/mythic)", ephemeral: true })
                : ctx.sendMessage({ content: "Usage: `gift <type> <amount>` (type: common/rare/epic/legendary/mythic)", ephemeral: true });
        }

        const gifts = [];
        const sentChannelNames = [];

        const categoryIds = [
            "1299718158403240048",
            "1299720660876136499",
            "1282991864751853569",
            "1282993254169837621",
            "1299715576834560092"
        ];

        // Collect channels from the specified categories
        const channels = ctx.guild.channels.cache.filter(channel => categoryIds.includes(channel.parentId));

        // Randomly select 'amount' of channels from the available ones
        const availableChannels = channels.random(amount);

        if (!availableChannels || availableChannels.length === 0) {
            return ctx.isInteraction
                ? ctx.interaction.editReply({ content: "No available channels found within the specified categories.", ephemeral: true })
                : ctx.sendMessage({ content: "No available channels found within the specified categories.", ephemeral: true });
        }

        // Send gifts to each selected channel
        for (const selectedChannel of availableChannels) {
            gifts.push(this.getRandomReward(boxType));

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
                .setFooter({ text: "Good luck with your rewards!" });

            const giftMessage = await selectedChannel.send({ embeds: [giftEmbed], components: [row] }).catch(err => {
                console.error(`Could not send message to ${selectedChannel.name}:`, err);
            });

            // Store the name of the channel where the gift was sent
            sentChannelNames.push(selectedChannel.name);
            // Handle message collection for the button (similar to your existing logic)
            const collector = giftMessage.createMessageComponentCollector({ time: 60000 });

            const claimedUsers = new Set();

            collector.on('collect', async (interaction) => {
                // Acknowledge the interaction
                await interaction.deferUpdate();

                if (interaction.customId === 'claim_gift') {
                    // Check if the user has already claimed their reward
                    if (claimedUsers.has(interaction.user.id)) {
                        return await interaction.followUp({
                            content: "You've already claimed your gift!",
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

                    // Mark the user as having claimed the reward
                    claimedUsers.add(interaction.user.id);

                    // Update user collection with the reward and get the summary
                    const rewardSummary = await addRewardToUserInventory(client, interaction, color, emoji, reward);

                    // Create an embed for the success message
                    const successEmbed = this.client.embed()
                        .setColor(color.main) // Use your preferred color
                        .setThumbnail(client.utils.emojiToImage(emoji.congratulation))
                        .setTitle(`Gift Claimed!`)
                        .setDescription(`${interaction.displayName ? interaction.displayName : interaction.user.displayName} received:\n${rewardSummary}`) // Include the summary of rewards
                        .setFooter({ text: "Enjoy your rewards!" });

                    // Send the success message as an embed
                    const successMessage = await interaction.followUp({ embeds: [successEmbed] });

                    // Schedule the embed message to be deleted after 30 seconds
                    setTimeout(async () => {
                        try {
                            await successMessage.delete();
                        } catch (error) {
                            console.error('Error deleting the success message:', error);
                        }
                    }, 6000); // 10 seconds


                    // Disable the button after claiming
                    await giftMessage.edit({
                        components: [new ActionRowBuilder().addComponents(button.setDisabled(true))]
                    });
                }
            });


            collector.on('end', async () => {
                // Disable the button when the collector ends
                await giftMessage.edit({
                    components: [new ActionRowBuilder().addComponents(button.setDisabled(true))]
                });

                // Schedule the gift message to be deleted after 30 seconds
                setTimeout(async () => {
                    try {
                        await giftMessage.delete();
                    } catch (error) {
                        console.error('Error deleting the gift message:', error);
                    }
                }, 6000); // 10 seconds
            });

        }

        const channelNamesString = sentChannelNames.join(', ');

        const responseMessage = `Gift boxes have been sent to **${amount}** random channels: ${channelNamesString}!`;

        if (ctx.isInteraction) {
            await ctx.interaction.editReply({ content: responseMessage });
        } else {
            ctx.sendMessage({ content: responseMessage, ephemeral: true });
        }
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

        // Check if the reward is coins or an item
        if (reward) {
            // Add coins to the balance and store the summary
            if (reward.item === "Coins") {
                user.balance.coin += reward.amount;
                rewardSummary.push(`**${client.utils.formatNumber(reward.amount)}** ${emoji.coin}`);
            } else {
                const inventoryItem = user.inventory.find(item => item.name === reward.item);
                if (inventoryItem) {
                    inventoryItem.quantity += reward.amount;
                    rewardSummary.push(`**${reward.amount} ${reward.item}** (Total: ${inventoryItem.quantity})`);
                } else {
                    // If it doesn't exist, add it to the inventory
                    user.inventory.push({ id: reward.item, name: reward.item, quantity: reward.amount });
                    rewardSummary.push(`**${reward.amount} ${reward.item}** (New item added)`);
                }
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
