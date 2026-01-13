/**
 * Lootbox Reward System
 * Defines random rewards for each lootbox type with weighted probabilities
 */

const Milk = require('../Shop/Milk');
const DutchMilk = require('../Shop/DutchMilk');
const Color = require('../Shop/Color');
const Decoration = require('../Shop/Decoration');
const Wallpaper = require('../Shop/Wallpaper');

// Extract items from shop modules
const milkItems = Milk.inventory;
const dutchMilkItems = DutchMilk.inventory;
const colorItems = Color.inventory;
const decorationItems = Decoration.inventory;
const wallpaperItems = Wallpaper.inventory;

/**
 * Lootbox reward pools with weighted probabilities
 * Higher weight = higher chance of being selected
 */
const LOOTBOX_POOLS = {
    box01: {
        // Cyberwave - Budget lootbox (50,000 coins)
        rewards: [
            // Common rewards (70% chance)
            { items: colorItems, weight: 35, rarity: 'common' },
            { items: decorationItems.slice(0, 3), weight: 35, rarity: 'common' },

            // Uncommon rewards (20% chance)
            { items: milkItems.slice(0, 2), weight: 15, rarity: 'uncommon' },
            { items: wallpaperItems.slice(0, 2), weight: 5, rarity: 'uncommon' },

            // Rare rewards (10% chance)
            { items: decorationItems.slice(3, 5), weight: 10, rarity: 'rare' },
        ],
        quantity: () => getRandomInt(1, 2), // 1-2 items per box
        quantityRange: [1, 2],
    },
    box02: {
        // Nebula - Mid-tier lootbox (100,000 coins)
        rewards: [
            // Common rewards (50% chance)
            { items: colorItems, weight: 25, rarity: 'common' },
            { items: decorationItems.slice(0, 5), weight: 25, rarity: 'common' },

            // Uncommon rewards (35% chance)
            { items: milkItems, weight: 20, rarity: 'uncommon' },
            { items: wallpaperItems.slice(0, 4), weight: 15, rarity: 'uncommon' },

            // Rare rewards (15% chance)
            { items: decorationItems.slice(5), weight: 10, rarity: 'rare' },
            { items: dutchMilkItems.slice(0, 2), weight: 5, rarity: 'rare' },
        ],
        quantity: () => getRandomInt(2, 3), // 2-3 items per box
        quantityRange: [2, 3],
    },
    box03: {
        // Kayukio - Premium lootbox (150,000 coins)
        rewards: [
            // Common rewards (30% chance)
            { items: colorItems, weight: 15, rarity: 'common' },
            { items: decorationItems, weight: 15, rarity: 'common' },

            // Uncommon rewards (40% chance)
            { items: milkItems, weight: 20, rarity: 'uncommon' },
            { items: wallpaperItems, weight: 20, rarity: 'uncommon' },

            // Rare rewards (25% chance)
            { items: dutchMilkItems, weight: 15, rarity: 'rare' },
            { items: decorationItems, weight: 10, rarity: 'rare' },
        ],
        quantity: () => getRandomInt(3, 4), // 3-4 items per box
        quantityRange: [3, 4],
    },
};

/**
 * Get a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Select a random item from a weighted pool
 * @param {Array} rewards - Array of reward objects with weights
 * @returns {Object} Selected reward pool object
 */
function selectWeightedReward(rewards) {
    const totalWeight = rewards.reduce((sum, reward) => sum + reward.weight, 0);
    let random = Math.random() * totalWeight;

    for (const reward of rewards) {
        random -= reward.weight;
        if (random <= 0) {
            return reward;
        }
    }

    return rewards[rewards.length - 1]; // Fallback to last reward
}

/**
 * Calculate expected value (EV) of a lootbox in coins using item sell prices.
 * This estimates average coin value a user would receive when opening the box.
 * @param {string} boxId
 * @returns {number|null} expected value in coins or null if unknown
 */
function calculateExpectedValue(boxId) {
    const pool = LOOTBOX_POOLS[boxId];
    if (!pool) return null;

    // expected draws (average of range)
    const [minQ, maxQ] = pool.quantityRange || [1, 1];
    const expectedCount = (minQ + maxQ) / 2;

    const totalWeight = pool.rewards.reduce((s, r) => s + r.weight, 0);

    // expected value per single reward draw
    let evPerDraw = 0;
    for (const reward of pool.rewards) {
        const prob = reward.weight / totalWeight;
        if (!reward.items || reward.items.length === 0) continue;

        // average sell price of items in this reward bucket
        const avgSell = reward.items.reduce((s, it) => s + (it.price?.sell || it.price?.buy || 0), 0) / reward.items.length;
        evPerDraw += prob * avgSell;
    }

    return evPerDraw * expectedCount;
}

/**
 * Get random items from a lootbox
 * @param {string} boxId - The lootbox ID (box01, box02, box03)
 * @returns {Array} Array of item objects with id and quantity
 */
function openLootbox(boxId) {
    const pool = LOOTBOX_POOLS[boxId];
    if (!pool) {
        throw new Error(`Unknown lootbox ID: ${boxId}`);
    }

    const rewards = [];
    const itemCount = pool.quantity();

    for (let i = 0; i < itemCount; i++) {
        const selectedReward = selectWeightedReward(pool.rewards);
        const randomItem = selectedReward.items[getRandomInt(0, selectedReward.items.length - 1)];

        if (randomItem) {
            const existingReward = rewards.find((r) => r.id === randomItem.id);
            if (existingReward) {
                existingReward.quantity += 1;
            } else {
                rewards.push({
                    id: randomItem.id,
                    quantity: 1,
                });
            }
        }
    }

    return rewards;
}

module.exports = {
    LOOTBOX_POOLS,
    openLootbox,
    getRandomInt,
    selectWeightedReward,
    calculateExpectedValue,
};
