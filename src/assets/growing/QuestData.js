// QuestData.js - Data model for tracking daily and weekly quests per user

class QuestData {
  constructor() {
    this.daily = {
      date: null, // YYYY-MM-DD
      objective: null,
      completed: false,
      claimed: false,
    };
    this.weekly = {
      week: null, // YYYY-WW
      objective: null,
      completed: false,
      claimed: false,
    };
  }

  setDailyQuest(date, objective) {
    this.daily = {
      date,
      objective,
      completed: false,
      claimed: false,
    };
  }

  setWeeklyQuest(week, objective) {
    this.weekly = {
      week,
      objective,
      completed: false,
      claimed: false,
    };
  }

  completeDaily() {
    this.daily.completed = true;
  }

  claimDaily() {
    if (this.daily.completed && !this.daily.claimed) {
      this.daily.claimed = true;
      return true;
    }
    return false;
  }

  completeWeekly() {
    this.weekly.completed = true;
  }

  claimWeekly() {
    if (this.weekly.completed && !this.weekly.claimed) {
      this.weekly.claimed = true;
      return true;
    }
    return false;
  }
}

module.exports = QuestData;
