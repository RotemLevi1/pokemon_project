
const express = require('express');
const router = express.Router();


let users = {};  // In-memory object for now

// Initialize default users
function initializeDefaultUsers() {
  console.log('🔧 Initializing default users...');
  
  let newUsersAdded = 0;
  
  // Default user 1: lolo
  if (!users['lolo']) {
    users['lolo'] = {
      username: 'lolo',
      email: 'lolo@gmail.com',
      password: 'Ll1999!',
      favorites: {},
      battleStats: {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      },
      battleHistory: []
    };
    newUsersAdded++;
    console.log('  ✅ Added default user: lolo');
  } else {
    // Ensure existing users have the new structure
    if (!users['lolo'].battleStats) {
      users['lolo'].battleStats = { totalBattles: 0, wins: 0, losses: 0, winRate: 0 };
      users['lolo'].battleHistory = [];
      console.log('  🔄 Updated lolo with battle tracking');
    } else {
      console.log('  ℹ️ Default user already exists: lolo');
    }
  }
  
  // Default user 2: Rotem Levi
  if (!users['Rotem Levi']) {
    users['Rotem Levi'] = {
      username: 'Rotem Levi',
      email: 'levi.rotem191@gmail.com',
      password: 'Rr1999!',
      favorites: {},
      battleStats: {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      },
      battleHistory: []
    };
    newUsersAdded++;
    console.log('  ✅ Added default user: Rotem Levi');
  } else {
    // Ensure existing users have the new structure
    if (!users['Rotem Levi'].battleStats) {
      users['Rotem Levi'].battleStats = { totalBattles: 0, wins: 0, losses: 0, winRate: 0 };
      users['Rotem Levi'].battleHistory = [];
      console.log('  🔄 Updated Rotem Levi with battle tracking');
    } else {
      console.log('  ℹ️ Default user already exists: Rotem Levi');
    }
  }
  
  if (newUsersAdded > 0) {
    console.log(`✅ Initialized ${newUsersAdded} new default user(s)`);
  } else {
    console.log('ℹ️ All default users were already present');
  }
}

// Initialize default users when module loads
initializeDefaultUsers();

// Login route: checks name, email, password
router.post('/login', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ success: false, message: 'All fields are required.' });
  }
  const user = users[name];
  if (!user) {
    return res.json({ success: false, message: 'User not found.' });
  }
  if (user.email !== email) {
    return res.json({ success: false, message: 'Email does not match.' });
  }
  if (user.password !== password) {
    return res.json({ success: false, message: 'Incorrect password.' });
  }
  
  // Create session with unique ID
  req.session.user = { 
    id: user.username, // Use username as unique ID
    name: user.username, 
    email: user.email 
  };
  return res.json({ success: true, message: 'OK' });
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error logging out' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check authentication status
router.get('/auth/status', (req, res) => {
  if (req.session.user && req.session.user.id) {
    res.json({ 
      authenticated: true, 
      user: req.session.user 
    });
  } else {
    res.json({ 
      authenticated: false, 
      user: null 
    });
  }
});

function addUser(username, email, password) {
  users[username] = { 
    username, 
    email, 
    password, 
    favorites: {},
    battleStats: {
      totalBattles: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    },
    battleHistory: []
  };
}


const fs = require('fs');
const path = require('path');



function validateUserInput(name, email, password, passwordConfirm) {

  // Check for duplicate username
  if (users[name]) {
    if (name === 'lolo' || name === 'Rotem Levi') {
      return "This username is reserved for system default users.";
    }
    return "Username already exists.";
  }

  // Check for duplicate email
  const existingUser = Object.values(users).find(u => u.email === email);
  if (existingUser) {
    if (email === 'lolo@gmail.com' || email === 'levi.rotem191@gmail.com') {
      return "This email is reserved for system default users.";
    }
    return "Email already exists.";
  }
    
  // Name: 1-50 chars, no digits or special symbols
  if (typeof name !== 'string' || name.length < 1 || name.length > 50 || /[^A-Za-zא-ת ]/.test(name))
    return "Invalid name: must be 1-50 letters, no digits or special symbols.";

  // Email: valid format
  if (typeof email !== 'string' || !/^[^@]+@[^@]+\.[^@]+$/.test(email))
    return "Invalid email format.";


  // Password: 7-15 chars, at least one uppercase English, one lowercase English, one non-English, one number
  if (typeof password !== 'string' || password.length < 7 || password.length > 15)
    return "Password must be 7-15 characters.";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase English letter.";
  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase English letter.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must contain at least one non-English character or symbol.";
  if (!/[0-9]/.test(password))
    return "Password must contain at least one number.";

  // Password confirmation matches
  if (password !== passwordConfirm)
    return "Passwords do not match.";

  return "OK";
}

// Get personal info
router.get('/:username/personalInfo', (req, res) => {
  const user = users[req.params.username];
  if (user) {
    res.json({ username: user.username, email: user.email, password: user.password });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Get favorites
router.get('/:username/favorites', (req, res) => {
    console.log(users);
  const user = users[req.params.username];
  if (user) {
    res.json({ favoritePokemons: user.favorites });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Add a favorite
router.post('/:username/addFavorite', (req, res) => {
    
  const user = users[req.params.username];
  const { pokemon } = req.body;
  if (user && pokemon) {
    // If favorites is not an object, initialize it
    if (typeof user.favorites !== 'object' || Array.isArray(user.favorites)) {
      user.favorites = {};
    }
    // Use pokemon name as key
    if (!user.favorites[pokemon.name]) {
      user.favorites[pokemon.name] = pokemon;
      res.json({ success: true, favoritePokemons: user.favorites });
    } else {
      res.json({ success: false, message: 'Already in favorites or invalid.' });
    }
  } else {
    res.json({ success: false, message: 'Invalid user or pokemon.' });
  }
});

// Remove a favorite by pokemon name
router.delete('/:username/removeFavorite', (req, res) => {
  const user = users[req.params.username];
  const pokemonName = req.query.pokemonName;
  
  console.log(`🗑️ Remove favorite request: user=${req.params.username}, pokemon=${pokemonName}`);
  console.log(`🗑️ User favorites keys:`, Object.keys(user?.favorites || {}));
  
  if (user && typeof user.favorites === 'object' && !Array.isArray(user.favorites)) {
    // Case-insensitive search for Pokemon name
    const pokemonKey = Object.keys(user.favorites).find(key => 
      key.toLowerCase() === pokemonName.toLowerCase()
    );
    
    if (pokemonKey) {
      console.log(`🗑️ Found Pokemon with key: ${pokemonKey}, removing...`);
      delete user.favorites[pokemonKey];
      res.json({ success: true, favoritePokemons: user.favorites });
    } else {
      console.log(`🗑️ Pokemon not found in favorites: ${pokemonName}`);
      res.json({ success: false, message: `Pokemon '${pokemonName}' not found in favorites.` });
    }
  } else {
    console.log(`🗑️ User not found or invalid favorites structure`);
    res.status(404).json({ error: 'User not found' });
  }
});



// Function to get all users (for battle system)
function getUsers() {
  return users;
}

// Function to list all current users (for debugging)
function listCurrentUsers() {
  console.log('👥 Current users in system:');
  Object.keys(users).forEach(username => {
    const user = users[username];
    console.log(`  - ${username} (${user.email}) - Favorites: ${Object.keys(user.favorites).length}`);
  });
  console.log(`📊 Total users: ${Object.keys(users).length}`);
}

 module.exports = {
   router,
   addUser,
   validateUserInput,
   getUsers,
   listCurrentUsers
 };