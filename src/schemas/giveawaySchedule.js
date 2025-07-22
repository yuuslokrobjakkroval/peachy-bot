const { Schema, model } = require("mongoose");

const ScheduleSchema = new Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  channelId: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  content: { type: String, default: "" },
  scheduleType: { type: String, enum: ["DAILY", "WEEKLY", "MONTHLY"] },
  winners: { type: Number, default: 1 },
  prize: { type: Number, default: 0 },
  autopay: { type: Boolean, default: false },
});

const GiveawaySchedulesSchema = new Schema(
  {
    guildId: { type: String, default: null },
    feature: { type: String, default: null },
    schedules: { type: [ScheduleSchema], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = model("giveawayschedules", GiveawaySchedulesSchema);
