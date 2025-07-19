# Gemini Code Assistant Configuration

This file provides context to the Gemini code assistant to help it understand the project structure, conventions, and commands.

## Project Overview

This project is a Discord bot named "peachy". It is built with Node.js and the `discord.js` library. The bot includes features for moderation, economy, fun, and utility. It uses slash commands and a custom command handler. Data is stored in a MongoDB database via the `mongoose` ODM.

## Key Technologies

- **Framework:** discord.js v14
- **Database:** MongoDB with Mongoose
- **Language:** JavaScript (Node.js)
- **Dependency Management:** npm
- **Code Formatting:** Prettier

## Project Structure

- `src/index.js`: The main entry point for the application.
- `src/structures/Client.js`: The extended Discord Client.
- `src/commands/`: Contains all the bot's commands, organized into categories.
- `src/events/`: Contains event listeners for the Discord client.
- `src/schemas/`: Mongoose schemas for the database models.
- `src/utils/`: Utility functions.
- `src/assets/`: Static assets like images and JSON data.
- `src/languages/`: Language files for localization.
- `src/managers/`: Managers for handling economy, resources, etc.

## Important Commands

- **Install dependencies:**
  ```bash
  npm install
  ```
- **Start the bot:**
  ```bash
  npm start
  ```
- **Start the bot in development mode (with nodemon):**
  ```bash
  npm run dev
  ```
- **Format the code:**
  ```bash
  npm run format
  ```
- **Check code formatting:**
  ```bash
  npm run prettier-check
  ```

## Coding Conventions

- Follow the existing code style.
- Use Prettier for code formatting.
- Commands should be placed in the appropriate subdirectory within `src/commands/`.
- New database models should have their schema defined in the `src/schemas/` directory.
