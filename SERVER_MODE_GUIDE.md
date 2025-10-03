# 🌍🏠 Server Mode System Documentation

The Server Mode System allows your Discord bot to operate in two different data modes:

## 🔧 Modes Explained

### 🌍 Global Mode (Default)

- **Data Sharing**: User data is shared across ALL servers using the bot
- **Balance**: Same balance/coins everywhere
- **Progress**: Levels, achievements, and progress carry over between servers
- **Economy**: Universal economy system
- **Best For**: Communities that want unified progression

### 🏠 Private Mode

- **Data Isolation**: Each server has completely separate user data
- **Balance**: Server-specific balances and economies
- **Progress**: Independent leveling and achievements per server
- **Economy**: Isolated server economies
- **Best For**: Servers wanting unique, independent gameplay

## 📋 Command Reference

### `/servermode info`

View current server mode and statistics

- Shows current mode (Global/Private)
- Displays total mode switches
- Shows last switch date
- User count (for private mode)

### `/servermode set <mode> [reason]`

**⚠️ Administrator Only**
Change server mode between Global and Private

- `mode`: Choose "global" or "private"
- `reason`: Optional reason for the change
- Includes confirmation dialog for safety

### `/servermode import`

Import your global data to private mode

- Only available in Private Mode
- Copies all your global progress to this server
- Your global data remains unchanged
- One-time action per server

### `/servermode export`

Export your private data to global

- Available in any mode
- **⚠️ Warning**: Overwrites your global data
- Useful for promoting server-specific progress

### `/servermode stats`

View detailed server mode statistics

- Mode switch history
- User counts and activity
- Last switch details and reasons

### `/serverstatus`

Quick overview of current server mode

- Current mode with description
- Benefits of current mode
- Available actions for users

## 🔄 Migration Process

### Switching from Global to Private

1. Administrator runs `/servermode set private`
2. Confirms the change in dialog
3. Server switches to Private Mode
4. Users can use `/servermode import` to get their global data
5. All new progress is server-specific

### Switching from Private to Global

1. Administrator runs `/servermode set global`
2. Confirms the change in dialog
3. Server switches to Global Mode
4. Users automatically use global data
5. Private data remains but is not used

## 🛠️ Implementation Details

### Database Structure

- **ServerMode Collection**: Stores server mode configuration
- **PrivateUser Collection**: Stores server-specific user data
- **User Collection**: Stores global user data (existing)

### Caching System

- Server modes are cached for performance
- Cache invalidation on mode changes
- Automatic cache cleanup

### Economy Integration

- EconomyManager updated to support both modes
- Commands automatically detect server mode
- Transparent switching between data sources

## 🎮 User Experience

### For Users in Global Mode

- Same experience across all servers
- Progress never lost when joining new servers
- Universal leaderboards and economy
- No action needed when switching servers

### For Users in Private Mode

- Fresh start on each server
- Server-specific progression
- Independent economies per server
- Can import global data if desired

## 📊 Command Changes

All economy and profile commands now automatically:

- Detect current server mode
- Use appropriate data source
- Display mode indicator in embeds
- Handle both global and private data seamlessly

### Examples:

- `/balance` shows mode indicator
- `/profile` uses server-appropriate data
- `/transfer` works within server mode
- `/shop` uses correct inventory

## 🔒 Permissions & Security

### Administrator Required:

- Changing server modes
- Viewing mode statistics (detailed)

### User Actions:

- Import/Export personal data
- View server status
- All regular bot commands

### Safety Features:

- Confirmation dialogs for mode changes
- Data backup recommendations
- Clear warnings about data overwriting
- Rollback capabilities

## 🚀 Getting Started

1. **Default Setup**: All servers start in Global Mode
2. **Check Status**: Use `/serverstatus` to see current mode
3. **Switch Mode**: Admins use `/servermode set <mode>`
4. **User Actions**: Users can import/export as needed
5. **Monitor**: Use `/servermode stats` to track changes

## 💡 Best Practices

### For Server Administrators:

- Clearly communicate mode changes to users
- Provide import instructions when switching to private
- Monitor user feedback after mode changes
- Use descriptive reasons for mode switches

### For Users:

- Import global data when joining private mode servers
- Export valuable progress before servers switch modes
- Understand the implications of each mode
- Ask admins about server mode policies

## 🔧 Technical Integration

### For Developers:

- Use `client.serverModeManager.getUserData(userId, guildId)`
- Update commands to pass `guildId` parameter
- Add mode indicators to embeds
- Handle both data sources in economy operations

### Database Queries:

```javascript
// Get user data (mode-aware)
const user = await client.serverModeManager.getUserData(userId, guildId);

// Save user data (mode-aware)
await client.serverModeManager.saveUserData(userId, guildId, userData);

// Check server mode
const mode = await client.serverModeManager.getServerMode(guildId);
```

## 🎯 Use Cases

### Global Mode Scenarios:

- Gaming communities with multiple servers
- Networks wanting unified progression
- Cross-server competitions and events
- Shared economies and trading

### Private Mode Scenarios:

- Unique server themes and gameplay
- Independent server competitions
- Custom economy rules per server
- Testing new features in isolation

## 📈 Analytics & Monitoring

The system tracks:

- Mode switch frequency
- User adoption rates
- Data import/export usage
- Server-specific activity levels

## 🔮 Future Enhancements

Planned features:

- Automatic data sync options
- Scheduled mode switches
- Bulk user data operations
- Advanced analytics dashboard
- Cross-server leaderboards in private mode

---

**Need Help?** Join our support server or check the command help for more information!
