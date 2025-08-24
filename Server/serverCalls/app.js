// Load environment variables
require('dotenv').config();

const searchResults = require('../pokemonAPIdata/pageData.js');
const pokemonAPIcalls = require('../pokemonAPIdata/pokemonAPIcalls.js');
const pageData = require('../pokemonAPIdata/pageData.js');
const { router: usersDataRouter, addUser, validateUserInput, getUsers, listCurrentUsers } = require('../usersData/usersData.js');
// Import necessary modules

const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Track active online users
const onlineUsers = new Map(); // userId -> { id, name, lastSeen }

// Serve static files from the correct Client folder (relative to project root)
app.use(express.static(path.join(__dirname, '../../Client')));
app.use(express.json());
app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // secure: true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.user) {
        // Update user's last seen time when they make authenticated requests
        if (req.session.user.id) {
            onlineUsers.set(req.session.user.id, {
                id: req.session.user.id,
                name: req.session.user.name,
                lastSeen: Date.now()
            });
        }
        next();
    } else {
        res.status(401).json({ message: 'Authentication required' });
    }
}

// Middleware to track user activity
app.use((req, res, next) => {
    if (req.session.user && req.session.user.id) {
        const userId = req.session.user.id;
        const userName = req.session.user.name;
        
        // Only log on certain requests to avoid spam
        if (req.path === '/online-players' || req.path === '/heartbeat' || req.path.includes('/battle')) {
            console.log(`🔄 Middleware tracking: ${userName} (ID: ${userId}) on ${req.path}`);
        }
        
        onlineUsers.set(userId, {
            id: userId,
            name: userName,
            lastSeen: Date.now()
        });
    }
    next();
});

// Ensure usersData router is connected
app.use('/', usersDataRouter);

// Dynamically load all user routers from usersData folder
const fs = require('fs');
const usersDataPath = path.join(__dirname, '../usersData');
fs.readdirSync(usersDataPath).forEach(file => {
    if (file.endsWith('.js') && file !== 'usersData.js') {
        const userModule = require(path.join(usersDataPath, file));
        // Only use if it's an Express router (function or has .stack property)
        if (typeof userModule === 'function' || (userModule && userModule.stack)) {
            app.use('/', userModule);
        }
    }
});

// get commands from server for fetching the search selection options

app.get('/idList', requireAuth, (req, res) => {
    res.json({
        idList: searchResults.idList
    });
});

app.get('/typeList', requireAuth, (req, res) => {
    res.json({
        typeList: searchResults.typeList
    });
});

app.get('/abilityList', requireAuth, (req, res) => {
    res.json({
        abilityList: searchResults.abilityList
    });
});

// Battle routes (must come before generic search route to avoid conflicts)

// Get battle data
app.get('/battle/:battleId', requireAuth, async (req, res) => {
    try {
        const { battleId } = req.params;
        console.log(`\n=== GET BATTLE DATA DEBUG ===`);
        console.log(`🔍 Looking for battle ID: ${battleId}`);
        console.log(`📊 Available battles:`, Object.keys(global.battles || {}));
        
        const battle = global.battles?.[battleId];
        
        if (!battle) {
            console.log(`❌ Battle not found for ID: ${battleId}`);
            return res.status(404).json({ error: 'Battle not found' });
        }
        
        console.log(`✅ Found battle:`, battle);
        
        // Get random Pokemon from each player's favorites
        console.log(`🎮 Getting Pokemon for player1: ${battle.player1.name} (ID: ${battle.player1.id})`);
        
        // Debug: Check what users exist and their favorites
        const allUsers = getUsers();
        console.log(`🔍 All users in system:`, Object.keys(allUsers));
        console.log(`🔍 Current user ID being looked up: ${battle.player1.id}`);
        
        if (allUsers[battle.player1.id]) {
            console.log(`🔍 User ${battle.player1.id} found in system`);
            console.log(`🔍 User favorites:`, allUsers[battle.player1.id].favorites);
            console.log(`🔍 Favorites count:`, Object.keys(allUsers[battle.player1.id].favorites || {}).length);
        } else {
            console.log(`❌ User ${battle.player1.id} NOT found in system`);
            console.log(`❌ Available user IDs:`, Object.keys(allUsers));
        }
        
        let player1Favorites;
        try {
            player1Favorites = await getRandomPokemonFromFavorites(battle.player1.id);
            console.log(`🎮 Player1 Pokemon:`, player1Favorites);
        } catch (error) {
            console.log(`❌ Player1 (${battle.player1.name}) has no favorites:`, error.message);
            console.log(`❌ Full error details:`, error);
            return res.status(400).json({ 
                error: 'Cannot start battle',
                message: `${battle.player1.name} has no Pokemon in their favorites list. Please add some Pokemon to your favorites before battling.`
            });
        }
        
        console.log(`🎮 Getting Pokemon for player2: ${battle.player2.name} (ID: ${battle.player2.id})`);
        
        // Debug: Check what users exist and their favorites for player2
        console.log(`🔍 Current user ID being looked up for player2: ${battle.player2.id}`);
        
        if (allUsers[battle.player2.id]) {
            console.log(`🔍 User ${battle.player2.id} found in system`);
            console.log(`🔍 User favorites:`, allUsers[battle.player2.id].favorites);
            console.log(`🔍 Favorites count:`, Object.keys(allUsers[battle.player2.id].favorites || {}).length);
        } else {
            console.log(`❌ User ${battle.player2.id} NOT found in system`);
            console.log(`❌ Available user IDs:`, Object.keys(allUsers));
        }
        
        let player2Favorites;
        try {
            player2Favorites = await getRandomPokemonFromFavorites(battle.player2.id);
            console.log(`🎮 Player2 Pokemon:`, player2Favorites);
        } catch (error) {
            console.log(`❌ Player2 (${battle.player2.name}) has no favorites:`, error.message);
            console.log(`❌ Full error details for player2:`, error);
            return res.status(400).json({ 
                error: 'Cannot start battle',
                message: `${battle.player2.name} has no Pokemon in their favorites list. Please add some Pokemon to your favorites before battling.`
            });
        }
        
        const battleData = {
            battleId: battleId,
            player1: {
                id: battle.player1.id,
                name: battle.player1.name,
                pokemon: player1Favorites
            },
            player2: {
                id: battle.player2.id,
                name: battle.player2.name,
                pokemon: player2Favorites
            }
        };
        
        // Store Pokemon data in battle for result calculation
        global.battles[battleId].player1Pokemon = player1Favorites;
        global.battles[battleId].player2Pokemon = player2Favorites;
        
        console.log(`📋 Final battle data:`, battleData);
        console.log('=== GET BATTLE DATA DEBUG END ===\n');
        
        res.json(battleData);
    } catch (error) {
        console.error('❌ Error getting battle data:', error);
        res.status(500).json({ error: 'Failed to get battle data' });
    }
});

// Get battle result
app.get('/battle/:battleId/result', requireAuth, async (req, res) => {
    try {
        const { battleId } = req.params;
        console.log(`\n=== GET BATTLE RESULT DEBUG ===`);
        console.log(`🔍 Looking for battle ID: ${battleId}`);
        console.log(`📊 Available battles:`, Object.keys(global.battles || {}));
        
        const battle = global.battles?.[battleId];
        
        if (!battle) {
            console.log(`❌ Battle not found for ID: ${battleId}`);
            return res.status(404).json({ error: 'Battle not found' });
        }
        
        console.log(`✅ Found battle:`, battle);
        
        // Get Pokemon data for scoring - use existing battle data if available
        let player1Pokemon, player2Pokemon;
        
        if (battle.player1Pokemon && battle.player2Pokemon) {
            // Use existing Pokemon data from battle
            player1Pokemon = battle.player1Pokemon;
            player2Pokemon = battle.player2Pokemon;
            console.log(`✅ Using existing Pokemon data from battle`);
            console.log(`🎮 Player1 Pokemon:`, player1Pokemon);
            console.log(`🎮 Player2 Pokemon:`, player2Pokemon);
        } else {
            // Fallback: get Pokemon data again
            console.log(`⚠️ No existing Pokemon data, fetching again`);
            try {
                player1Pokemon = await getRandomPokemonFromFavorites(battle.player1.id);
                player2Pokemon = await getRandomPokemonFromFavorites(battle.player2.id);
                console.log(`✅ Fetched Pokemon data again`);
            } catch (fetchError) {
                console.error(`❌ Error fetching Pokemon data:`, fetchError);
                return res.status(400).json({
                    error: 'Failed to fetch Pokemon data',
                    message: `Error fetching Pokemon: ${fetchError.message}`
                });
            }
        }
        
        // Calculate scores using the Hebrew formula
        console.log(`🎯 Calculating scores for battle ${battleId}`);
        console.log(`🎮 Player1 Pokemon stats:`, player1Pokemon.stats);
        console.log(`🎮 Player2 Pokemon stats:`, player2Pokemon.stats);
        
        let player1Score, player2Score;
        try {
            player1Score = calculateBattleScore(player1Pokemon);
            player2Score = calculateBattleScore(player2Pokemon);
            console.log(`📊 Scores - Player1: ${player1Score}, Player2: ${player2Score}`);
        } catch (scoreError) {
            console.error(`❌ Error calculating scores:`, scoreError);
            return res.status(400).json({
                error: 'Failed to calculate battle scores',
                message: `Error calculating scores: ${scoreError.message}`
            });
        }
        
        // Determine winner
        const winnerId = player1Score > player2Score ? battle.player1.id : battle.player2.id;
        const loserId = winnerId === battle.player1.id ? battle.player2.id : battle.player1.id;
        
        const result = {
            winner: winnerId,
            loser: loserId,
            player1Score: player1Score,
            player2Score: player2Score,
            player1Pokemon: player1Pokemon,
            player2Pokemon: player2Pokemon
        };
        
        // Update battle with result
        global.battles[battleId].result = result;
        
        // Update player vs player battle statistics
        const allUsers = getUsers();
        const player1User = allUsers[battle.player1.id];
        const player2User = allUsers[battle.player2.id];
        
        [player1User, player2User].forEach((user, index) => {
            if (user) {
                const playerId = index === 0 ? battle.player1.id : battle.player2.id;
                const playerPokemon = index === 0 ? player1Pokemon : player2Pokemon;
                const opponentPokemon = index === 0 ? player2Pokemon : player1Pokemon;
                const playerScore = index === 0 ? player1Score : player2Score;
                const opponentScore = index === 0 ? player2Score : player1Score;
                const opponentName = index === 0 ? battle.player2.name : battle.player1.name;
                
                if (!user.battleStats) {
                    user.battleStats = { totalBattles: 0, wins: 0, losses: 0, winRate: 0 };
                }
                if (!user.battleHistory) {
                    user.battleHistory = [];
                }
                
                // Update stats
                user.battleStats.totalBattles++;
                if (winnerId === playerId) {
                    user.battleStats.wins++;
                } else {
                    user.battleStats.losses++;
                }
                user.battleStats.winRate = (user.battleStats.wins / user.battleStats.totalBattles) * 100;
                
                // Add to battle history
                user.battleHistory.unshift({
                    battleId: battleId,
                    date: new Date().toISOString(),
                    opponent: opponentName,
                    opponentType: 'player',
                    userPokemon: {
                        name: playerPokemon.name,
                        sprite: playerPokemon.sprites?.other?.['official-artwork']?.front_default || playerPokemon.sprites?.front_default
                    },
                    opponentPokemon: {
                        name: opponentPokemon.name,
                        sprite: opponentPokemon.sprites?.other?.['official-artwork']?.front_default || opponentPokemon.sprites?.front_default
                    },
                    userScore: playerScore,
                    opponentScore: opponentScore,
                    result: winnerId === playerId ? 'win' : 'loss'
                });
                
                console.log(`📊 Updated ${user.username} battle stats: ${user.battleStats.wins}W/${user.battleStats.losses}L (${user.battleStats.winRate.toFixed(1)}%)`);
            }
        });
        
        console.log(`🏆 Battle result calculated successfully:`, result);
        console.log('=== GET BATTLE RESULT DEBUG END ===\n');
        
        res.json(result);
    } catch (error) {
        console.error('❌ Error getting battle result:', error);
        console.log('=== GET BATTLE RESULT DEBUG END WITH ERROR ===\n');
        res.status(500).json({ error: 'Failed to get battle result' });
    }
});

// Get battle status
app.get('/battle/:battleId/status', requireAuth, (req, res) => {
    try {
        const { battleId } = req.params;
        const battle = global.battles?.[battleId];
        
        if (!battle) {
            return res.status(404).json({ error: 'Battle not found' });
        }
        
        res.json({ status: battle.status });
    } catch (error) {
        console.error('Error getting battle status:', error);
        res.status(500).json({ error: 'Failed to get battle status' });
    }
});

// Battle against Bot
app.post('/battle-bot', requireAuth, async (req, res) => {
    try {
        const currentUser = req.session.user;
        console.log(`\n=== BATTLE AGAINST BOT DEBUG ===`);
        console.log(`🤖 Bot battle request from ${currentUser.name} (ID: ${currentUser.id})`);
        
        // Get random Pokemon from user's favorites
        let userPokemon;
        try {
            userPokemon = await getRandomPokemonFromFavorites(currentUser.id);
            console.log(`🎮 User Pokemon: ${userPokemon.name}`);
        } catch (error) {
            console.log(`❌ User has no favorites: ${error.message}`);
            return res.status(400).json({
                error: 'Cannot start bot battle',
                message: 'You need at least one Pokemon in your favorites list to battle the bot.'
            });
        }
        
        // Get random Pokemon ID from pageData
        const pageData = require('../pokemonAPIdata/pageData.js');
        const idList = pageData.idList;
        
        if (!idList || idList.length === 0) {
            console.log(`❌ No Pokemon IDs available`);
            return res.status(500).json({ error: 'Pokemon database not ready' });
        }
        
        // Select random Pokemon ID for bot
        const randomId = idList[Math.floor(Math.random() * idList.length)];
        console.log(`🤖 Bot selected Pokemon ID: ${randomId}`);
        
        // Fetch complete Pokemon data for bot
        const pokemonAPIcalls = require('../pokemonAPIdata/pokemonAPIcalls.js');
        const botPokemon = await pokemonAPIcalls.fetchPokemons('pokemon', randomId);
        
        if (!botPokemon || !botPokemon.stats) {
            console.log(`❌ Failed to fetch bot Pokemon data`);
            return res.status(500).json({ error: 'Failed to generate bot Pokemon' });
        }
        
        console.log(`🤖 Bot Pokemon: ${botPokemon.name}`);
        
        // Generate battle ID
        const battleId = `bot_battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create battle data
        const battleData = {
            battleId: battleId,
            type: 'bot',
            player1: {
                id: currentUser.id,
                name: currentUser.name,
                pokemon: userPokemon
            },
            player2: {
                id: 'bot',
                name: 'Bot',
                pokemon: botPokemon
            }
        };
        
        // Store battle in global battles
        if (!global.battles) {
            global.battles = {};
        }
        
        global.battles[battleId] = {
            id: battleId,
            type: 'bot',
            player1: { id: currentUser.id, name: currentUser.name },
            player2: { id: 'bot', name: 'Bot' },
            player1Pokemon: userPokemon,
            player2Pokemon: botPokemon,
            status: 'active',
            createdAt: new Date()
        };
        
        console.log(`📋 Bot battle data created:`, battleData);
        console.log('=== BATTLE AGAINST BOT DEBUG END ===\n');
        
        res.json(battleData);
    } catch (error) {
        console.error('❌ Error creating bot battle:', error);
        res.status(500).json({ error: 'Failed to create bot battle' });
    }
});

// Get bot battle result
app.get('/battle-bot/:battleId/result', requireAuth, async (req, res) => {
    try {
        const { battleId } = req.params;
        console.log(`\n=== GET BOT BATTLE RESULT DEBUG ===`);
        console.log(`🔍 Looking for bot battle ID: ${battleId}`);
        
        const battle = global.battles?.[battleId];
        
        if (!battle || battle.type !== 'bot') {
            console.log(`❌ Bot battle not found for ID: ${battleId}`);
            return res.status(404).json({ error: 'Bot battle not found' });
        }
        
        console.log(`✅ Found bot battle:`, battle);
        
        // Use existing Pokemon data from battle
        const player1Pokemon = battle.player1Pokemon;
        const player2Pokemon = battle.player2Pokemon;
        
        // Calculate scores using the battle formula
        console.log(`🎯 Calculating scores for bot battle ${battleId}`);
        
        let player1Score, player2Score;
        try {
            player1Score = calculateBattleScore(player1Pokemon);
            player2Score = calculateBattleScore(player2Pokemon);
            console.log(`📊 Scores - Player: ${player1Score}, Bot: ${player2Score}`);
        } catch (scoreError) {
            console.error(`❌ Error calculating scores:`, scoreError);
            return res.status(400).json({
                error: 'Failed to calculate battle scores',
                message: `Error calculating scores: ${scoreError.message}`
            });
        }
        
        // Determine winner
        const winnerId = player1Score > player2Score ? battle.player1.id : 'bot';
        const loserId = winnerId === battle.player1.id ? 'bot' : battle.player1.id;
        
        const result = {
            winner: winnerId,
            loser: loserId,
            player1Score: player1Score,
            player2Score: player2Score,
            player1Pokemon: player1Pokemon,
            player2Pokemon: player2Pokemon,
            isBotBattle: true
        };
        
        // Update user battle statistics
        const allUsers = getUsers();
        const user = allUsers[battle.player1.id];
        if (user) {
            if (!user.battleStats) {
                user.battleStats = { totalBattles: 0, wins: 0, losses: 0, winRate: 0 };
            }
            if (!user.battleHistory) {
                user.battleHistory = [];
            }
            
            // Update stats
            user.battleStats.totalBattles++;
            if (winnerId === battle.player1.id) {
                user.battleStats.wins++;
            } else {
                user.battleStats.losses++;
            }
            user.battleStats.winRate = (user.battleStats.wins / user.battleStats.totalBattles) * 100;
            
            // Add to battle history
            user.battleHistory.unshift({
                battleId: battleId,
                date: new Date().toISOString(),
                opponent: 'Bot',
                opponentType: 'bot',
                userPokemon: {
                    name: player1Pokemon.name,
                    sprite: player1Pokemon.sprites?.other?.['official-artwork']?.front_default || player1Pokemon.sprites?.front_default
                },
                opponentPokemon: {
                    name: player2Pokemon.name,
                    sprite: player2Pokemon.sprites?.other?.['official-artwork']?.front_default || player2Pokemon.sprites?.front_default
                },
                userScore: player1Score,
                opponentScore: player2Score,
                result: winnerId === battle.player1.id ? 'win' : 'loss'
            });
            
            console.log(`📊 Updated ${user.username} battle stats: ${user.battleStats.wins}W/${user.battleStats.losses}L (${user.battleStats.winRate.toFixed(1)}%)`);
        }
        
        // Update battle with result
        global.battles[battleId].result = result;
        
        console.log(`🏆 Bot battle result calculated successfully:`, result);
        console.log('=== GET BOT BATTLE RESULT DEBUG END ===\n');
        
        res.json(result);
    } catch (error) {
        console.error('❌ Error getting bot battle result:', error);
        console.log('=== GET BOT BATTLE RESULT DEBUG END WITH ERROR ===\n');
        res.status(500).json({ error: 'Failed to get bot battle result' });
    }
});

// Player ranking endpoint
app.get('/player-ranking', requireAuth, (req, res) => {
    try {
        console.log(`\n=== PLAYER RANKING REQUEST ===`);
        
        const allUsers = getUsers();
        const rankings = [];
        
        // Process all users with battle stats
        Object.values(allUsers).forEach(user => {
            if (user.battleStats && user.battleStats.totalBattles > 0) {
                rankings.push({
                    username: user.username,
                    totalBattles: user.battleStats.totalBattles,
                    wins: user.battleStats.wins,
                    losses: user.battleStats.losses,
                    winRate: user.battleStats.winRate
                });
            }
        });
        
        // Sort by wins (primary), then by win rate (secondary), then by total battles (tertiary)
        rankings.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            return b.totalBattles - a.totalBattles;
        });
        
        console.log(`📊 Generated ranking for ${rankings.length} players`);
        console.log('=== PLAYER RANKING REQUEST END ===\n');
        
        res.json({ rankings });
    } catch (error) {
        console.error('❌ Error getting player ranking:', error);
        res.status(500).json({ error: 'Failed to get player ranking' });
    }
});

// Battle history endpoint
app.get('/battle-history', requireAuth, (req, res) => {
    try {
        const currentUser = req.session.user;
        console.log(`\n=== BATTLE HISTORY REQUEST ===`);
        console.log(`📜 Battle history request from ${currentUser.name} (ID: ${currentUser.id})`);
        
        const allUsers = getUsers();
        const user = allUsers[currentUser.id];
        
        if (!user || !user.battleHistory) {
            console.log(`ℹ️ No battle history found for ${currentUser.name}`);
            return res.json({ history: [] });
        }
        
        console.log(`📊 Returning ${user.battleHistory.length} battle records for ${currentUser.name}`);
        console.log('=== BATTLE HISTORY REQUEST END ===\n');
        
        res.json({ 
            history: user.battleHistory,
            stats: user.battleStats || { totalBattles: 0, wins: 0, losses: 0, winRate: 0 }
        });
    } catch (error) {
        console.error('❌ Error getting battle history:', error);
        res.status(500).json({ error: 'Failed to get battle history' });
    }
});

// get commands for search results

app.get('/:id/:type/:ability', requireAuth, async (req, res) => {

    console.log(`Received search request with ID: ${req.params.id}, Type: ${req.params.type}, Ability: ${req.params.ability}`);

    if (!pageData.isValidElement(req.params.id, req.params.type, req.params.ability)) {
        return res.status(400).json({ error: 'Invalid search parameters' });
    }

    try {
    const results = await pokemonAPIcalls.getSearchResults(
        req.params.id,
        req.params.type,
        req.params.ability
    );

    // Handle errors
    if (!results) {
        return res.status(404).json({ error: 'No results found' });
    }

    // Always return an array to simplify front-end
    const arrayResults = Array.isArray(results) ? results : [results];

    res.json({ allPokemons: arrayResults });
    } catch (error) {
        console.error('❌ Error fetching Pokemon data:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message,
            url: `/${req.params.id}/${req.params.type}/${req.params.ability}`
        });
    }
});


app.get('/logInPageExplanation', requireAuth, (req, res) => {
    res.json({ welcomePageData: searchResults.welcomePageData });
});

// Logout endpoint to remove user from online list
app.post('/logout', requireAuth, (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Remove user from online users
        if (onlineUsers.has(userId)) {
            onlineUsers.delete(userId);
            console.log(`User ${req.session.user.name} logged out and removed from online list`);
        }
        
        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            
            res.json({ message: 'Logged out successfully' });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Debug endpoint to check current online users (remove in production)
app.get('/debug/online-users', (req, res) => {
    try {
        const now = Date.now();
        const users = Array.from(onlineUsers.entries()).map(([id, user]) => ({
            id: id,
            name: user.name,
            lastSeen: new Date(user.lastSeen).toISOString(),
            secondsAgo: Math.round((now - user.lastSeen) / 1000)
        }));
        
        res.json({
            totalOnline: onlineUsers.size,
            users: users,
            currentTime: new Date(now).toISOString()
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ error: 'Debug failed' });
    }
});

// Heartbeat endpoint to keep users active
app.get('/heartbeat', requireAuth, (req, res) => {
    try {
        const userId = req.session.user.id;
        const userName = req.session.user.name;
        
        console.log(`💓 Heartbeat from ${userName} (ID: ${userId})`);
        
        // Update user's last seen time
        if (onlineUsers.has(userId)) {
            onlineUsers.get(userId).lastSeen = Date.now();
            console.log(`✅ Updated ${userName}'s last seen time`);
        } else {
            console.log(`⚠️  User ${userName} not found in onlineUsers, adding them`);
            onlineUsers.set(userId, {
                id: userId,
                name: userName,
                lastSeen: Date.now()
            });
        }
        
        console.log(`📊 Current online users: ${onlineUsers.size}`);
        Array.from(onlineUsers.entries()).forEach(([id, user]) => {
            console.log(`  - ${user.name} (ID: ${id})`);
        });
        
        res.json({ 
            message: 'Heartbeat received',
            onlineUsers: onlineUsers.size
        });
    } catch (error) {
        console.error('❌ Heartbeat error:', error);
        res.status(500).json({ error: 'Heartbeat failed' });
    }
});

// YouTube API endpoint for Pokemon videos
app.get('/youtube/:pokemonName', requireAuth, async (req, res) => {
    try {
        const { pokemonName } = req.params;
        // Get API key from environment variables
        const apiKey = process.env.YOUTUBE_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'YouTube API key not configured. Please set YOUTUBE_API_KEY in your .env file.' });
        }
        
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${pokemonName}+pokemon&type=video&maxResults=5&key=${apiKey}`
        );
        
        if (!response.ok) {
            console.error(`YouTube API response not ok: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ error: `YouTube API error: ${response.status}` });
        }
        
        const data = await response.json();
        
        // Log the response for debugging
        console.log(`YouTube API response for ${pokemonName}:`, data);
        
        if (data.items) {
            const videos = data.items.map(item => ({
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.medium.url,
                videoId: item.id.videoId, // Extract the video ID for embedding
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                duration: 'N/A' // Would need additional API call for duration
            }));
            
            res.json({ videos });
        } else if (data.error) {
            // Handle YouTube API errors
            console.error(`YouTube API error for ${pokemonName}:`, data.error);
            if (data.error.code === 403) {
                return res.status(403).json({ error: 'YouTube API key invalid or quota exceeded' });
            } else if (data.error.code === 400) {
                return res.status(400).json({ error: 'Invalid request to YouTube API' });
            }
            res.json({ videos: [] });
        } else {
            res.json({ videos: [] });
        }
    } catch (error) {
        console.error('YouTube API error:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// YouTube embed endpoint for getting embed HTML
app.get("/embed", async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: "Missing YouTube URL" });
    }

    try {
        const apiUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            return res.status(response.status).json({ error: "Failed to fetch embed data" });
        }
        const data = await response.json();

        // Return just the embed HTML
        res.json({ embedHtml: data.html });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/newUser', (req, res) => {
    try {
    const { name, email, password, passwordConfirm } = req.body;

    console.log(`Received registration request for user: ${name}, email: ${email}, password: ${password}`);

    // Validate user input
        const validationResult = validateUserInput(name, email, password, passwordConfirm);
    console.log(`Validation result: ${validationResult}`);
    if (validationResult !== "OK") {
        return res.status(400).json({ message: validationResult });
    }

    // Add user
        addUser(name, email, password);
    res.status(201).json({ message: validationResult });
    console.log(`User ${name} registered successfully.`);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
});

// Battle calculation function using the formula from the Hebrew specifications
function calculateBattleScore(pokemon) {
    try {
        console.log(`🎲 Calculating score for Pokemon: ${pokemon.name}`);
        console.log(`📊 Pokemon stats:`, pokemon.stats);
        
        // Formula: Total Score = HP × 0.3 + Attack × 0.4 + Defense × 0.2 + Speed × 0.1 + small random
        const hp = pokemon.stats.find(stat => stat.stat.name === 'hp')?.base_stat || 0;
        const attack = pokemon.stats.find(stat => stat.stat.name === 'attack')?.base_stat || 0;
        const defense = pokemon.stats.find(stat => stat.stat.name === 'defense')?.base_stat || 0;
        const speed = pokemon.stats.find(stat => stat.stat.name === 'speed')?.base_stat || 0;
        
        console.log(`📈 Individual stats - HP: ${hp}, Attack: ${attack}, Defense: ${defense}, Speed: ${speed}`);
        
        const score = (hp * 0.3) + (attack * 0.4) + (defense * 0.2) + (speed * 0.1) + (Math.random() * 10);
        const finalScore = Math.round(score * 100) / 100; // Round to 2 decimal places
        
        console.log(`🏆 Final score for ${pokemon.name}: ${finalScore}`);
        return finalScore;
    } catch (error) {
        console.error(`❌ Error calculating score for Pokemon ${pokemon.name}:`, error);
        throw new Error(`Failed to calculate score for ${pokemon.name}: ${error.message}`);
    }
}

// Get online players - show only real online users
app.get('/online-players', requireAuth, (req, res) => {
    try {
        const currentUser = req.session.user;
        const now = Date.now();
        const timeoutMs = 5 * 60 * 1000; // 5 minutes timeout
        
        console.log('\n=== ONLINE PLAYERS REQUEST DEBUG ===');
        console.log(`👤 Current user: ${currentUser.name} (ID: ${currentUser.id})`);
        console.log(`📊 Current onlineUsers map size: ${onlineUsers.size}`);
        console.log(`📅 Current time: ${new Date(now).toISOString()}`);
        
        // Clean up inactive users (haven't been seen in 5 minutes)
        let cleanedCount = 0;
        for (const [userId, userData] of onlineUsers.entries()) {
            const timeSinceLastSeen = now - userData.lastSeen;
            console.log(`⏰ User ${userData.name} last seen: ${new Date(userData.lastSeen).toISOString()} (${Math.round(timeSinceLastSeen / 1000)}s ago)`);
            
            if (timeSinceLastSeen > timeoutMs) {
                console.log(`🧹 Cleaning up inactive user: ${userData.name}`);
                onlineUsers.delete(userId);
                cleanedCount++;
            }
        }
        console.log(`🧹 Cleaned up ${cleanedCount} inactive users`);
        
        // Get all online users except the current user
        const availableOpponents = Array.from(onlineUsers.values())
            .filter(user => user.id !== currentUser.id)
            .map(user => ({
                id: user.id,
                name: user.name
            }));
        
        console.log(`📋 All online users after cleanup:`);
        Array.from(onlineUsers.entries()).forEach(([id, user]) => {
            console.log(`  - ${user.name} (ID: ${id}) - Last seen: ${new Date(user.lastSeen).toISOString()}`);
        });
        
        console.log(`🎯 Available opponents (excluding current user):`);
        availableOpponents.forEach((opponent, index) => {
            console.log(`  ${index + 1}. ${opponent.name} (ID: ${opponent.id})`);
        });
        
        console.log(`📊 Final stats: Total online: ${onlineUsers.size}, Available opponents: ${availableOpponents.length}`);
        console.log('=== ONLINE PLAYERS REQUEST DEBUG END ===\n');
        
        res.json({ 
            players: availableOpponents,
            currentUser: currentUser.name,
            totalOnline: onlineUsers.size
        });
    } catch (error) {
        console.error('❌ Error getting online players:', error);
        res.status(500).json({ error: 'Failed to get online players' });
    }
});

// Challenge a player to battle
app.post('/challenge-player', requireAuth, async (req, res) => {
    try {
        const { opponentId, opponentName } = req.body;
        const challengerId = req.session.user.id;
        
        console.log('\n=== CHALLENGE PLAYER DEBUG ===');
        console.log(`⚔️ Challenge from ${req.session.user.name} (ID: ${challengerId}) to ${opponentName} (ID: ${opponentId})`);
        
        // For now, auto-accept challenges. In production, you'd implement challenge system
        const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🆔 Generated battle ID: ${battleId}`);
        
        // Store battle data (in production, use database)
        global.battles = global.battles || {};
        global.battles[battleId] = {
            id: battleId,
            player1: { id: challengerId, name: req.session.user.name },
            player2: { id: opponentId, name: opponentName },
            status: 'accepted',
            createdAt: new Date()
        };
        
        console.log(`💾 Stored battle data:`, global.battles[battleId]);
        console.log(`📊 Total battles: ${Object.keys(global.battles).length}`);
        console.log('=== CHALLENGE PLAYER DEBUG END ===\n');
        
        res.json({ 
            status: 'accepted', 
            battleId: battleId,
            message: 'Challenge accepted! Battle starting...'
        });
    } catch (error) {
        console.error('❌ Error challenging player:', error);
        res.status(500).json({ error: 'Failed to send challenge' });
    }
});

// Get battle data
app.get('/battle/:battleId', requireAuth, async (req, res) => {
    try {
        const { battleId } = req.params;
        console.log(`\n=== GET BATTLE DATA DEBUG ===`);
        console.log(`🔍 Looking for battle ID: ${battleId}`);
        console.log(`📊 Available battles:`, Object.keys(global.battles || {}));
        
        const battle = global.battles?.[battleId];
        
        if (!battle) {
            console.log(`❌ Battle not found for ID: ${battleId}`);
            return res.status(404).json({ error: 'Battle not found' });
        }
        
        console.log(`✅ Found battle:`, battle);
        
        // Get random Pokemon from each player's favorites
        console.log(`🎮 Getting Pokemon for player1: ${battle.player1.name} (ID: ${battle.player1.id})`);
        
        // Debug: Check what users exist and their favorites
        const allUsers = getUsers();
        console.log(`🔍 All users in system:`, Object.keys(allUsers));
        console.log(`🔍 Current user ID being looked up: ${battle.player1.id}`);
        
        if (allUsers[battle.player1.id]) {
            console.log(`🔍 User ${battle.player1.id} found in system`);
            console.log(`🔍 User favorites:`, allUsers[battle.player1.id].favorites);
            console.log(`🔍 Favorites count:`, Object.keys(allUsers[battle.player1.id].favorites || {}).length);
        } else {
            console.log(`❌ User ${battle.player1.id} NOT found in system`);
            console.log(`❌ Available user IDs:`, Object.keys(allUsers));
        }
        
        let player1Favorites;
        try {
            player1Favorites = await getRandomPokemonFromFavorites(battle.player1.id);
            console.log(`🎮 Player1 Pokemon:`, player1Favorites);
        } catch (error) {
            console.log(`❌ Player1 (${battle.player1.name}) has no favorites:`, error.message);
            console.log(`❌ Full error details:`, error);
            return res.status(400).json({ 
                error: 'Cannot start battle',
                message: `${battle.player1.name} has no Pokemon in their favorites list. Please add some Pokemon to your favorites before battling.`
            });
        }
        
        console.log(`🎮 Getting Pokemon for player2: ${battle.player2.name} (ID: ${battle.player2.id})`);
        
        // Debug: Check what users exist and their favorites for player2
        console.log(`🔍 Current user ID being looked up for player2: ${battle.player2.id}`);
        
        if (allUsers[battle.player2.id]) {
            console.log(`🔍 User ${battle.player2.id} found in system`);
            console.log(`🔍 User favorites:`, allUsers[battle.player2.id].favorites);
            console.log(`🔍 Favorites count:`, Object.keys(allUsers[battle.player2.id].favorites || {}).length);
        } else {
            console.log(`❌ User ${battle.player2.id} NOT found in system`);
            console.log(`❌ Available user IDs:`, Object.keys(allUsers));
        }
        
        let player2Favorites;
        try {
            player2Favorites = await getRandomPokemonFromFavorites(battle.player2.id);
            console.log(`🎮 Player2 Pokemon:`, player2Favorites);
        } catch (error) {
            console.log(`❌ Player2 (${battle.player2.name}) has no favorites:`, error.message);
            console.log(`❌ Full error details for player2:`, error);
            return res.status(400).json({ 
                error: 'Cannot start battle',
                message: `${battle.player2.name} has no Pokemon in their favorites list. Please add some Pokemon to your favorites before battling.`
            });
        }
        
        const battleData = {
            battleId: battleId,
            player1: {
                id: battle.player1.id,
                name: battle.player1.name,
                pokemon: player1Favorites
            },
            player2: {
                id: battle.player2.id,
                name: battle.player2.name,
                pokemon: player2Favorites
            }
        };
        
        // Store Pokemon data in the battle for later use
        global.battles[battleId].player1Pokemon = player1Favorites;
        global.battles[battleId].player2Pokemon = player2Favorites;
        
        console.log(`📋 Final battle data:`, battleData);
        console.log('=== GET BATTLE DATA DEBUG END ===\n');
        
        res.json(battleData);
    } catch (error) {
        console.error('❌ Error getting battle data:', error);
        res.status(500).json({ error: 'Failed to get battle data' });
    }
});

// Get battle result
app.get('/battle/:battleId/result', requireAuth, async (req, res) => {
    try {
        const { battleId } = req.params;
        console.log(`\n=== GET BATTLE RESULT DEBUG ===`);
        console.log(`🔍 Looking for battle ID: ${battleId}`);
        console.log(`📊 Available battles:`, Object.keys(global.battles || {}));
        
        const battle = global.battles?.[battleId];
        
        if (!battle) {
            console.log(`❌ Battle not found for ID: ${battleId}`);
            return res.status(404).json({ error: 'Battle not found' });
        }
        
        console.log(`✅ Found battle:`, battle);
        
        // Get Pokemon data for scoring - use existing battle data if available
        let player1Pokemon, player2Pokemon;
        
        if (battle.player1Pokemon && battle.player2Pokemon) {
            // Use existing Pokemon data from battle
            player1Pokemon = battle.player1Pokemon;
            player2Pokemon = battle.player2Pokemon;
            console.log(`✅ Using existing Pokemon data from battle`);
            console.log(`🎮 Player1 Pokemon:`, player1Pokemon);
            console.log(`🎮 Player2 Pokemon:`, player2Pokemon);
        } else {
            // Fallback: get Pokemon data again
            console.log(`⚠️ No existing Pokemon data, fetching again`);
            try {
                player1Pokemon = await getRandomPokemonFromFavorites(battle.player1.id);
                player2Pokemon = await getRandomPokemonFromFavorites(battle.player2.id);
                console.log(`✅ Fetched Pokemon data again`);
            } catch (fetchError) {
                console.error(`❌ Error fetching Pokemon data:`, fetchError);
                return res.status(400).json({ 
                    error: 'Failed to fetch Pokemon data',
                    message: `Error fetching Pokemon: ${fetchError.message}`
                });
            }
        }
        
        // Calculate scores using the Hebrew formula
        console.log(`🎯 Calculating scores for battle ${battleId}`);
        console.log(`🎮 Player1 Pokemon stats:`, player1Pokemon.stats);
        console.log(`🎮 Player2 Pokemon stats:`, player2Pokemon.stats);
        
        let player1Score, player2Score;
        try {
            player1Score = calculateBattleScore(player1Pokemon);
            player2Score = calculateBattleScore(player2Pokemon);
            console.log(`📊 Scores - Player1: ${player1Score}, Player2: ${player2Score}`);
        } catch (scoreError) {
            console.error(`❌ Error calculating scores:`, scoreError);
            return res.status(400).json({ 
                error: 'Failed to calculate battle scores',
                message: `Error calculating scores: ${scoreError.message}`
            });
        }
        
        // Determine winner
        const winner = player1Score > player2Score ? battle.player1.id : battle.player2.id;
        const winnerName = player1Score > player2Score ? battle.player1.name : battle.player2.name;
        
        const result = {
            battleId: battleId,
            player1: {
                id: battle.player1.id,
                name: battle.player1.name,
                pokemon: player1Pokemon,
                score: player1Score
            },
            player2: {
                id: battle.player2.id,
                name: battle.player2.name,
                pokemon: player2Pokemon,
                score: player2Score
            },
            winner: winner,
            winnerName: winnerName,
            scores: {
                player1: player1Score,
                player2: player2Score
            }
        };
        
        // Update battle with result
        global.battles[battleId].result = result;
        
        console.log(`🏆 Battle result calculated successfully:`, result);
        console.log('=== GET BATTLE RESULT DEBUG END ===\n');
        
        res.json(result);
    } catch (error) {
        console.error('❌ Error getting battle result:', error);
        console.log('=== GET BATTLE RESULT DEBUG END WITH ERROR ===\n');
        res.status(500).json({ error: 'Failed to get battle result' });
    }
});

// Get battle status
app.get('/battle/:battleId/status', requireAuth, (req, res) => {
    try {
        const { battleId } = req.params;
        const battle = global.battles?.[battleId];
        
        if (!battle) {
            return res.status(404).json({ error: 'Battle not found' });
        }
        
        res.json({ status: battle.status });
    } catch (error) {
        console.error('Error getting battle status:', error);
        res.status(500).json({ error: 'Failed to get battle status' });
    }
});

// Helper function to get random Pokemon from favorites
async function getRandomPokemonFromFavorites(userId) {
    try {
        console.log(`\n=== GET RANDOM POKEMON FROM FAVORITES DEBUG ===`);
        console.log(`🎲 Getting random Pokemon for user ID: ${userId}`);
        console.log(`📋 User ID type: ${typeof userId}`);

        // Get all users to access favorites
        const allUsers = getUsers();
        console.log(`📊 Total users in system: ${Object.keys(allUsers).length}`);
        console.log(`📋 All user IDs in system:`, Object.keys(allUsers));
        
        const user = allUsers[userId];
        console.log(`🔍 Looking for user with ID: "${userId}"`);
        console.log(`🔍 User found:`, !!user);

        if (!user) {
            console.log(`❌ User not found: ${userId}`);
            console.log(`❌ Available users:`, Object.keys(allUsers));
            console.log(`❌ User ID being searched: "${userId}" (type: ${typeof userId})`);
            console.log('=== GET RANDOM POKEMON FROM FAVORITES DEBUG END ===\n');
            throw new Error('User not found');
        }

        console.log(`✅ User ${userId} found in system`);
        console.log(`🔍 User object:`, user);
        console.log(`🔍 User favorites object:`, user.favorites);
        console.log(`🔍 User favorites type:`, typeof user.favorites);

        if (!user.favorites || Object.keys(user.favorites).length === 0) {
            console.log(`❌ User ${userId} has no favorites`);
            console.log(`❌ Favorites is:`, user.favorites);
            console.log(`❌ Favorites keys:`, Object.keys(user.favorites || {}));
            console.log('=== GET RANDOM POKEMON FROM FAVORITES DEBUG END ===\n');
            throw new Error('No favorites found');
        }

        // Get random Pokemon from user's actual favorites
        const favoriteNames = Object.keys(user.favorites);
        console.log(`📋 Favorite Pokemon names:`, favoriteNames);
        console.log(`📊 Number of favorites: ${favoriteNames.length}`);
        
        const randomFavoriteName = favoriteNames[Math.floor(Math.random() * favoriteNames.length)];
        console.log(`🎯 Randomly selected: ${randomFavoriteName}`);
        
        const favoritePokemon = user.favorites[randomFavoriteName];
        console.log(`🔍 Selected Pokemon object:`, favoritePokemon);

        console.log(`✅ Found real favorite Pokemon: ${favoritePokemon.name} for user ${userId}`);

        // Verify Pokemon has complete stats data
        if (!favoritePokemon.stats || favoritePokemon.stats.length === 0) {
            console.log(`⚠️ Pokemon ${favoritePokemon.name} missing stats - fetching complete data from API`);
            console.log(`❌ Stats object:`, favoritePokemon.stats);
            
            try {
                // Fetch complete Pokemon data from API
                const pokemonAPIcalls = require('../pokemonAPIdata/pokemonAPIcalls.js');
                const completePokemon = await pokemonAPIcalls.fetchPokemons('pokemon', favoritePokemon.name.toLowerCase());
                
                if (completePokemon && completePokemon.stats && completePokemon.stats.length > 0) {
                    console.log(`✅ Successfully fetched complete data for ${favoritePokemon.name}`);
                    console.log(`✅ Pokemon ${completePokemon.name} has complete stats:`, completePokemon.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(', '));
                    
                    // Update the user's favorites with complete data
                    user.favorites[randomFavoriteName] = completePokemon;
                    console.log(`📝 Updated ${favoritePokemon.name} in user's favorites with complete stats`);
                    
                    // Save the updated user data back to the file system
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const usersFilePath = path.join(__dirname, '../usersData/users.json');
                        
                        // Write the updated users data back to file
                        fs.writeFileSync(usersFilePath, JSON.stringify(allUsers, null, 2));
                        console.log(`💾 Saved updated user data to file system`);
                    } catch (saveError) {
                        console.log(`⚠️ Failed to save updated user data:`, saveError.message);
                        // Continue anyway - the battle can still work with the in-memory data
                    }
                    
                    console.log('=== GET RANDOM POKEMON FROM FAVORITES DEBUG END ===\n');
                    return completePokemon;
                } else {
                    console.log(`❌ Failed to fetch complete data for ${favoritePokemon.name}`);
                    console.log('=== GET RANDOM POKEMON FROM FAVORITES DEBUG END ===\n');
                    throw new Error('Pokemon missing stats data and failed to fetch from API');
                }
            } catch (fetchError) {
                console.log(`❌ Error fetching complete Pokemon data:`, fetchError);
                console.log('=== GET RANDOM POKEMON FROM FAVORITES DEBUG END ===\n');
                throw new Error('Pokemon missing stats data and failed to fetch from API');
            }
        }

        console.log(`✅ Pokemon ${favoritePokemon.name} has complete stats:`, favoritePokemon.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(', '));

        console.log(`🔍 Full favorite Pokemon data for ${userId}:`, favoritePokemon);
        console.log('=== GET RANDOM POKEMON FROM FAVORITES DEBUG END ===\n');
        return favoritePokemon;
        
    } catch (error) {
        console.error(`❌ Error getting Pokemon for user ${userId}:`, error.message);
        console.error(`❌ Full error:`, error);
        console.log('=== GET RANDOM POKEMON FROM FAVORITES DEBUG END WITH ERROR ===\n');
        throw error; // Re-throw to handle in calling function
    }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('');
  // List all current users for verification
  listCurrentUsers();
});