const { Command } = require("../structures/index.js");
const globalConfig = require("../ nnutils/Config");
const ms = require("ms");

module.exports = class BaseGiveaway extends Command {
  constructor(client, options) {
    super(client, options);
  }

  /**
   * Checks if a user has special permissions for giveaway operations
   * @param {string} userId - The user ID to check
   * @param {string} operation - The operation to check permissions for
   * @returns {boolean} - Whether the user has permission
   */
  hasSpecialPermission(userId, operation) {
    return globalConfig.owners.includes(userId);
  }

  /**
   * Validates common giveaway parameters
   * @param {Object} ctx - Command context
   * @param {Object} client - Discord client
   * @param {Object} color - Color configuration
   * @param {string} durationStr - Duration string
   * @param {number} winners - Number of winners
   * @returns {Object} - Validation result with success flag and data
   */
  async validateCommonParams(ctx, client, color, durationStr, winners) {
    // Validate duration
    const duration = ms(durationStr);
    if (!duration) {
      await this.sendErrorMessage(
        ctx,
        client,
        color,
        "Invalid duration format. Please use a valid format like 1h, 1d, 1w, etc."
      );
      return { success: false };
    }

    // Validate winners
    if (isNaN(winners) || winners <= 0 || winners > 20) {
      await this.sendErrorMessage(
        ctx,
        client,
        color,
        "Number of winners must be between 1 and 20."
      );
      return { success: false };
    }

    // Calculate end time
    const endTime = Date.now() + duration;
    const formattedDuration = Math.floor(endTime / 1000);

    return {
      success: true,
      data: {
        duration,
        endTime,
        formattedDuration,
      },
    };
  }

  /**
   * Sends an error message
   * @param {Object} ctx - Command context
   * @param {Object} client - Discord client
   * @param {Object} color - Color configuration
   * @param {string} message - Error message
   */
  async sendErrorMessage(ctx, client, color, message) {
    const errorEmbed = client
      .embed()
      .setColor(color.danger)
      .setDescription(message);

    if (ctx.isInteraction) {
      await ctx.interaction.editReply({ embeds: [errorEmbed] });
    } else {
      await ctx.editMessage({ embeds: [errorEmbed] });
    }
  }

  /**
   * Creates and sends a giveaway message
   * @param {Object} ctx - Command context
   * @param {Object} options - Message options
   * @returns {Object} - Result with success flag and message
   */
  async createGiveawayMessage(ctx, options) {
    const { client, embed, buttonRow } = options;

    try {
      const giveawayMessage = ctx.isInteraction
        ? await ctx.interaction.editReply({
            content: "",
            embeds: [embed],
            components: [buttonRow],
            fetchReply: true,
          })
        : await ctx.editMessage({
            content: "",
            embeds: [embed],
            components: [buttonRow],
            fetchReply: true,
          });

      return { success: true, message: giveawayMessage };
    } catch (err) {
      console.error("Error sending giveaway message:", err);
      const response = "There was an error sending the giveaway message.";

      if (ctx.isInteraction) {
        await ctx.interaction.editReply({ content: response });
      } else {
        await ctx.editMessage({ content: response });
      }

      return { success: false };
    }
  }
};
