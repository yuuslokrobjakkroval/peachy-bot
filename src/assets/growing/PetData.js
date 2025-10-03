const expList = require("./ExpList");
const petList = require("./Pet");

// Pet stats template
const defaultStats = {
  strength: 1,
  agility: 1,
  intelligence: 1,
};

// Pet data structure for a user's pet
class PetData {
  constructor(petId) {
    this.petId = petId; // e.g., 'skye'
    this.level = 1;
    this.exp = 0;
    this.stats = { ...defaultStats };
    this.evolved = false;
    this.inventory = [];
  }

  addExp(amount) {
    this.exp += amount;
    // Level up if enough exp
    while (this.level < 10 && this.exp >= expList[this.level + 1]) {
      this.level++;
    }
  }

  train(stat, amount = 1) {
    if (this.stats[stat] !== undefined) {
      this.stats[stat] += amount;
    }
  }

  evolve() {
    if (this.level === 10 && !this.evolved) {
      this.evolved = true;
      // Optionally boost stats on evolution
      Object.keys(this.stats).forEach((stat) => {
        this.stats[stat] += 5;
      });
    }
  }

  addItem(item) {
    this.inventory.push(item);
  }

  // Send pet on a quest and return result
  goOnQuest(questType) {
    // Example quest types: 'forest', 'mountain', 'lake'
    // Each type can use different stats for success
    let baseChance = 0.5;
    let statBonus = 0;
    let reward = null;

    switch (questType) {
      case "forest":
        statBonus = this.stats.agility * 0.05;
        break;
      case "mountain":
        statBonus = this.stats.strength * 0.05;
        break;
      case "lake":
        statBonus = this.stats.intelligence * 0.05;
        break;
      default:
        statBonus =
          (this.stats.strength + this.stats.agility + this.stats.intelligence) *
          0.01;
    }

    const successChance = baseChance + statBonus;
    const success = Math.random() < successChance;

    if (success) {
      // Example rewards
      reward = {
        type: "item",
        name: `${questType} Gem`,
        value: Math.floor(Math.random() * 10 + 5),
      };
      this.addItem(reward);
      this.addExp(50);
    } else {
      this.addExp(10);
    }

    return {
      success,
      reward,
      expGained: success ? 50 : 10,
    };
  }
}

module.exports = PetData;
