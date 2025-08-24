

// Simple in-memory cache to reduce external API calls
const pokemonCache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

// Configuration for Render free tier limits
const MAX_POKEMON_FETCH = process.env.MAX_POKEMON_FETCH || 1000; // Reduce from 100,000
const ENABLE_CACHING = process.env.ENABLE_CACHING !== 'false'; // Enable by default

// Request throttling to stay within Render free tier limits
const requestQueue = [];
const MAX_CONCURRENT_REQUESTS = 3; // Limit concurrent Pokemon API calls
let activeRequests = 0;

// Cache helper functions
function getCachedData(key) {
  if (!ENABLE_CACHING) return null;
  
  const cached = pokemonCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`💾 Using cached data for: ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  if (!ENABLE_CACHING) return;
  
  pokemonCache.set(key, {
    data: data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached data for: ${key}`);
}

async function getSearchResults(id, type, ability) {
  if (id !== "null") {
    var id_pokemon = await fetchPokemons('pokemon', id);
    if (id_pokemon && (type === "null" || id_pokemon.types.some(t => t.type.name === type)) && (ability === "null" || id_pokemon.abilities.some(a => a.ability.name === ability))) {
     
      return id_pokemon;
    } else {
      return null;
    }
  }




  let type_pokemons, ability_pokemons;
  if (type !== "null") {
    type_pokemons = await fetchPokemons('type', type);
  }
  if (ability !== "null") {
    console.log(ability !== "null");
    ability_pokemons = await fetchPokemons('ability', ability);
  }

  const counts_dic = {};
  if (type !== "null") {
    type_pokemons.pokemon.forEach(entry => {
      const name = entry.pokemon.name;
      counts_dic[name] = (counts_dic[name] || 0) + 1;
    });
  }
  if (ability !== "null") {
    ability_pokemons.pokemon.forEach(entry => {
      const name = entry.pokemon.name;
      counts_dic[name] = (counts_dic[name] || 0) + 1;
    });
  }
  var threshold = 1;
  if (type !== "null" && ability !== "null") { threshold = 2; }
  // Check if any Pokémon matches the threshold, else show error and return
  if (!Object.values(counts_dic).includes(threshold)) {
    
    return null;
  }

  // Gather all matching names
  let matchingNames = Object.keys(counts_dic).filter(name => counts_dic[name] === threshold);
  // Fetch all matching pokemons in parallel
  let fetchPromises;
  if (type !== "null") {
    fetchPromises = type_pokemons.pokemon.filter(entry => matchingNames.includes(entry.pokemon.name)).map(entry => fetchPokemons('pokemon', entry.pokemon.name));
  } else {
    fetchPromises = ability_pokemons.pokemon.filter(entry => matchingNames.includes(entry.pokemon.name)).map(entry => fetchPokemons('pokemon', entry.pokemon.name));
  }
  const allPokemons = await Promise.all(fetchPromises);
  return allPokemons ;
}

async function getSearchResultsCheck(id, type, ability){
  console.log(`Fetching Pokémon for ID: ${id}, Type: ${type}, Ability: ${ability}`);
  console.log("id value:", id, "type:", typeof id);

  if (id !== null && id !== "null" && id !== "" && id.toLowerCase() !== "null") {
    var id_pokemon = await fetchPokemons('pokemon', id);
    if (id_pokemon && (type === "null" || id_pokemon.types.some(t => t.type.name === type)) && (ability === "null" || id_pokemon.abilities.some(a => a.ability.name === ability))) {
     
      return id_pokemon;
    } else {
      return null;
    }
  }

  let type_pokemons, ability_pokemons;
  if (type !== "null") {
    console.log(
      `Fetching Pokémon for type: ${type} with ability: ${ability}`   
    )
    url_type_pokemons = await fetchPokemons('type', type);

  }
  if (ability !== "null") {
    ability_pokemons = await fetchPokemons('ability', ability);
  }

  return type_pokemons;
}


async function getAllPokemonIDs() {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10');
  const data = await response.json();
  const ids = data.results.map(p => {
    const parts = p.url.split('/');
    return parseInt(parts[parts.length - 2]); // e.g., 'https://pokeapi.co/api/v2/pokemon/1/' → 1
  });
  return ids;
}


async function loadAsyncDataUsingFetch(list_name, url) {
  // this function returns a list given from the url
    try {
        const response = await fetch(url);
        const data = await response.json();
        // The API returns results in a 'results' array
        data.results.forEach(item => {
            list_name.push(item.name); // Each item has a 'name' property
        });
        
        return list_name;
    } catch (error) {
        console.log('Error loading data:', error);
    }
}


async function fetchPokemons(category, user_input) {
  // this function returns a JSON object of the pokemon data
  const cacheKey = `${category}:${user_input}`;
  
  // Check cache first
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  const url = `https://pokeapi.co/api/v2/${category}/${user_input}`;
  let data = null;
  
  // Throttle requests to stay within Render free tier limits
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    console.log(`⏳ Request throttled (${activeRequests}/${MAX_CONCURRENT_REQUESTS} active), waiting...`);
    await new Promise(resolve => {
      requestQueue.push(resolve);
    });
  }
  
  activeRequests++;
  try {
    console.log(`🌐 Fetching Pokemon data from: ${url} (${activeRequests}/${MAX_CONCURRENT_REQUESTS} active)`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Pokemon API HTTP Error: ${response.status} ${response.statusText}`);
      console.error(`❌ Failed URL: ${url}`);
      throw new Error(`Pokemon API HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    console.log(`✅ Pokemon API response received (${response.status})`);
    data = await response.json();
    console.log(`✅ Pokemon data parsed successfully for ${category}:${user_input}`);
    
    // Cache the successful response
    setCachedData(cacheKey, data);
    
    // If this is a Pokemon endpoint, ensure we have complete stats data
    if (category === 'pokemon' && data && data.stats) {
      // Ensure stats array has the correct structure
      if (Array.isArray(data.stats)) {
        // Map stats to ensure they have the correct format
        data.stats = data.stats.map((stat, index) => {
          // Ensure stat has the correct structure
          if (!stat.stat || !stat.stat.name) {
            // Create proper stat structure if missing
            const statNames = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
            return {
              stat: { name: statNames[index] || 'unknown' },
              base_stat: stat.base_stat || 0,
              effort: stat.effort || 0
            };
          }
          return stat;
        });
        
        console.log(`✅ Pokemon ${data.name} stats processed:`, data.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(', '));
      }
    }
  } catch (error) {
    console.error('❌ Error fetching Pokémon:', error);
    
    // Add retry logic for network issues
    if (error.message.includes('fetch') || error.message.includes('network')) {
      console.log('🔄 Network error detected, this might be due to Render free tier limits');
      console.log('💡 Consider upgrading to paid plan or implementing more aggressive caching');
    }
  } finally {
    // Clean up request tracking
    activeRequests--;
    if (requestQueue.length > 0) {
      const nextRequest = requestQueue.shift();
      nextRequest();
    }
    console.log(`📊 Request completed, ${activeRequests}/${MAX_CONCURRENT_REQUESTS} active`);
  }

  return data;
}

module.exports = {
  getSearchResults,
  getSearchResultsCheck,
  getAllPokemonIDs,
  loadAsyncDataUsingFetch,
  fetchPokemons
};

