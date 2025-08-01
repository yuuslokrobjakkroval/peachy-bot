const colorSchemes = {
  default: {
    primary: "#00FFD1", // Vibrant teal
    secondary: "#E0E0E0",
    text: "#424242",
  },
  brightRed: {
    primary: "#D82424",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  bubblegumPink: {
    primary: "#E43C6D",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  bubblegumPinkLight: {
    primary: "#F1A9D0",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  babyPink: {
    primary: "#F78CA2",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  babyPinkLight: {
    primary: "#FDC3D2",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  pinkPurpleGradient: {
    primary: "#D062AA",
    secondary: "#D67CE6",
    text: "#FFFFFF",
    isGradient: true,
    gradientDirection: "135deg",
  },
  lavender: {
    primary: "#C18FE7",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  goldPurpleGradient: {
    primary: "#E3AB56",
    secondary: "#8C53C5",
    text: "#FFFFFF",
    isGradient: true,
    gradientDirection: "135deg",
  },
  goldenYellow: {
    primary: "#F6C662",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  coralOrange: {
    primary: "#F27457",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  coralPink: {
    primary: "#F9A58A",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  brightGreen: {
    primary: "#47C265",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  yellowGreenGradient: {
    primary: "#F6C662",
    secondary: "#47C265",
    text: "#424242",
    isGradient: true,
    gradientDirection: "135deg",
  },
  tealBlue: {
    primary: "#58D3B0",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  mintIvoryGradient: {
    primary: "#EEFBE7",
    secondary: "#A8E6CF",
    text: "#424242",
    isGradient: true,
    gradientDirection: "135deg",
  },
  pastelRainbow: {
    primary: "#FFE871",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  aquaBlue: {
    primary: "#3ED0D6",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  cyanBlue: {
    primary: "#91EDEB",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  turquoiseBlue: {
    primary: "#7BE3DC",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  skyBlue: {
    primary: "#5DD7FB",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  lightLavender: {
    primary: "#B7A9EF",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  indigoBlue: {
    primary: "#32295C",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  purple: {
    primary: "#8C53C5",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  violet: {
    primary: "#A363CC",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  deepPurple: {
    primary: "#7936AD",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  lightPurple: {
    primary: "#BD92DB",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  pearlWhite: {
    primary: "#FFFFFF",
    secondary: "#E0E0E0",
    text: "#424242",
  },
  glossyBlack: {
    primary: "#2E2E2E",
    secondary: "#E0E0E0",
    text: "#FFFFFF",
  },
  // 🌟 AWESOME ADDITIONAL GRADIENT SCHEMES 🌟
  sunsetGradient: {
    primary: "#FF6B6B",
    secondary: "#FFE66D",
    text: "#424242",
    isGradient: true,
    gradientDirection: "135deg",
  },
  oceanGradient: {
    primary: "#667eea",
    secondary: "#764ba2",
    text: "#FFFFFF",
    isGradient: true,
    gradientDirection: "135deg",
  },
  forestGradient: {
    primary: "#134E5E",
    secondary: "#71B280",
    text: "#FFFFFF",
    isGradient: true,
    gradientDirection: "135deg",
  },
  fireGradient: {
    primary: "#FF4E50",
    secondary: "#F9D423",
    text: "#424242",
    isGradient: true,
    gradientDirection: "135deg",
  },
  crystalGradient: {
    primary: "#A8EDEA",
    secondary: "#FED6E3",
    text: "#424242",
    isGradient: true,
    gradientDirection: "135deg",
  },
  royalGradient: {
    primary: "#667eea",
    secondary: "#C5796D",
    text: "#FFFFFF",
    isGradient: true,
    gradientDirection: "135deg",
  },
  cherryGradient: {
    primary: "#FF9A9E",
    secondary: "#FECFEF",
    text: "#424242",
    isGradient: true,
    gradientDirection: "135deg",
  },
  coolBlueGradient: {
    primary: "#2196F3",
    secondary: "#21CBF3",
    text: "#FFFFFF",
    isGradient: true,
    gradientDirection: "90deg",
  },
  warmOrangeGradient: {
    primary: "#FF8A80",
    secondary: "#FFCC02",
    text: "#424242",
    isGradient: true,
    gradientDirection: "90deg",
  },
  mysticGradient: {
    primary: "#8E2DE2",
    secondary: "#4A00E0",
    text: "#FFFFFF",
    isGradient: true,
    gradientDirection: "45deg",
  },
  peacefulGradient: {
    primary: "#FFECD2",
    secondary: "#FCB69F",
    text: "#424242",
    isGradient: true,
    gradientDirection: "180deg",
  },
  neonGradient: {
    primary: "#00C9FF",
    secondary: "#92FE9D",
    text: "#424242",
    isGradient: true,
    gradientDirection: "135deg",
  },
};

// 🔥 GRADIENT UTILITY FUNCTIONS 🔥
const gradientUtils = {
  /**
   * Generate CSS gradient string for a color scheme
   * @param {string} colorName - Name of the color scheme
   * @returns {string} CSS gradient string or solid color
   */
  getGradient(colorName) {
    const scheme = colorSchemes[colorName];
    if (!scheme) return null;

    if (scheme.isGradient) {
      const direction = scheme.gradientDirection || "135deg";
      return `linear-gradient(${direction}, ${scheme.primary}, ${scheme.secondary})`;
    }

    return scheme.primary;
  },

  /**
   * Check if a color scheme is a gradient
   * @param {Object} colorScheme - Color scheme object OR string name
   * @returns {boolean}
   */
  isGradient(colorScheme) {
    // Handle both object and string inputs
    if (typeof colorScheme === "string") {
      const scheme = colorSchemes[colorScheme];
      return scheme ? scheme.isGradient === true : false;
    } else if (typeof colorScheme === "object" && colorScheme !== null) {
      return colorScheme.isGradient === true;
    }
    return false;
  },

  /**
   * Get all gradient color schemes
   * @returns {Object} Object containing only gradient schemes
   */
  getGradientSchemes() {
    const gradients = {};
    Object.keys(colorSchemes).forEach((key) => {
      if (colorSchemes[key].isGradient) {
        gradients[key] = colorSchemes[key];
      }
    });
    return gradients;
  },

  /**
   * Get all solid color schemes
   * @returns {Object} Object containing only solid color schemes
   */
  getSolidSchemes() {
    const solids = {};
    Object.keys(colorSchemes).forEach((key) => {
      if (!colorSchemes[key].isGradient) {
        solids[key] = colorSchemes[key];
      }
    });
    return solids;
  },

  /**
   * Create a gradient scheme from two colors
   * @param {string} color1 - First color (hex)
   * @param {string} color2 - Second color (hex)
   * @param {string} direction - Gradient direction (default: "135deg")
   * @param {string} textColor - Text color (default: "#424242")
   * @returns {Object} Color scheme object
   */
  createGradient(color1, color2, direction = "135deg", textColor = "#424242") {
    return {
      primary: color1,
      secondary: color2,
      text: textColor,
      isGradient: true,
      gradientDirection: direction,
    };
  },

  /**
   * Get random gradient scheme
   * @returns {Object} Random gradient color scheme
   */
  getRandomGradient() {
    const gradients = this.getGradientSchemes();
    const keys = Object.keys(gradients);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return { name: randomKey, scheme: gradients[randomKey] };
  },

  /**
   * Get gradient by theme
   * @param {string} theme - Theme name (warm, cool, nature, etc.)
   * @returns {Array} Array of gradient schemes matching theme
   */
  getGradientsByTheme(theme) {
    const themes = {
      warm: [
        "sunsetGradient",
        "fireGradient",
        "warmOrangeGradient",
        "cherryGradient",
      ],
      cool: [
        "oceanGradient",
        "coolBlueGradient",
        "crystalGradient",
        "neonGradient",
      ],
      nature: ["forestGradient", "mintIvoryGradient", "yellowGreenGradient"],
      royal: ["royalGradient", "goldPurpleGradient", "mysticGradient"],
      peaceful: ["peacefulGradient", "crystalGradient", "mintIvoryGradient"],
      vibrant: [
        "neonGradient",
        "fireGradient",
        "pinkPurpleGradient",
        "coolBlueGradient",
      ],
    };

    const themeGradients = themes[theme.toLowerCase()] || [];
    return themeGradients
      .map((name) => ({ name, scheme: colorSchemes[name] }))
      .filter((item) => item.scheme);
  },
};

module.exports = {
  ...colorSchemes,
  gradientUtils,
};
