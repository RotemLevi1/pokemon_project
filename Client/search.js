window.addEventListener('DOMContentLoaded', LoadPreviousSearch);

// Global favorites variable
window.userFavorites = [];

function toggleList(category) {
  const ul = document.getElementById(`${category}List`);
  if (ul) {
    ul.classList.toggle('hidden');
  }
}

function filterList(category) {
  const input = document.getElementById(`${category}Input`).value.toLowerCase();
  const list = {
    type: typeList,
    ability: abilityList,
    id: idList
  }[category];

  const filtered = list.filter(item => {
    const str = String(item).toLowerCase(); // ensure everything is a string
    return str.startsWith(input);
  });

  populateList(category, filtered);
  document.getElementById(`${category}List`).classList.remove('hidden');
}


var typeList = [];
var abilityList = [];
var idList = [];

function isValidElement(id, type, ability) {

  return (idList.includes(Number(id)) || !id) &&
         (typeList.includes(type) || !type) &&
         (abilityList.includes(ability) || !ability);
}

function populateList(category, data) {
  const ul = document.getElementById(`${category}List`);
  if (!ul) {
    console.error(`Element with id '${category}List' not found.`);
    return;
  }
  if (!Array.isArray(data)) {
    console.error(`Data for category '${category}' is not an array:`, data);
    return;
  }
  ul.innerHTML = '';
  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    li.onclick = () => {
      const input = document.getElementById(`${category}Input`);
      if (input) input.value = item;
      ul.classList.add('hidden');
    };
    ul.appendChild(li);
  });
}

  async function LoadPreviousSearch() {
    try {
      const [idRes, typeRes, abilityRes] = await Promise.all([
        fetch('http://localhost:3000/idList'),
        fetch('http://localhost:3000/typeList'),
        fetch('http://localhost:3000/abilityList'),
      ]);
      if (!idRes.ok || !typeRes.ok || !abilityRes.ok) {
        throw new Error('One or more fetches failed');
      }
      const idData = await idRes.json();
      const typeData = await typeRes.json();
      const abilityData = await abilityRes.json();

      typeData.typeList = typeData.typeList.sort((a, b) => a.localeCompare(b));
      abilityData.abilityList = abilityData.abilityList.sort((a, b) => a.localeCompare(b));

      typeList = typeData.typeList;
      abilityList = abilityData.abilityList;
      idList = idData.idList;

      populateList('id', idData.idList);
      populateList('type', typeData.typeList);
      populateList('ability', abilityData.abilityList);

      // Get authenticated user from session
      let currentUser = null;
      try {
        const authRes = await fetch('http://localhost:3000/auth/status');
        if (authRes.ok) {
          const authData = await authRes.json();
          currentUser = authData.user;
        }
      } catch (err) {
        console.error('Error getting auth status:', err);
      }

      // Load favorites once and store globally
      window.userFavorites = {};
      if (currentUser) {
        try {
          let favoritesRes = await fetch(`http://localhost:3000/${currentUser.name}/favorites`);
          if (favoritesRes.ok) {
            let favoritesData = await favoritesRes.json();
            window.userFavorites = favoritesData.favoritePokemons || [];
          } else {
            console.warn('Could not load favorites for user:', currentUser.name);
          }
        } catch (err) {
          console.error('Error loading favorites:', err);
        }
      }

      // Set input boxes to values from URL (for search parameters only)
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') || '';
      const ability = params.get('ability') || '';
      const id = params.get('id') || '';

      document.getElementById('typeInput').value = type;
      document.getElementById('abilityInput').value = ability;
      document.getElementById('idInput').value = id;

      // If any input is present, show search results
      if (type || ability || id) {
        await search_Npresent();
      }

    } catch (err) {
      console.error('Error in LoadPreviousSearch:', err);
    }
  }


async function save_in_url_Nsearch() {
  const type = document.getElementById('typeInput').value.trim();
  const ability = document.getElementById('abilityInput').value.trim();
  const id = document.getElementById('idInput').value.trim();
  
  // Build URL with only search parameters (no user parameter needed)
  let url = window.location.pathname + '?';
  const newParams = [];
  if(type) newParams.push('type=' + encodeURIComponent(type));
  if(ability) newParams.push('ability=' + encodeURIComponent(ability));
  if(id) newParams.push('id=' + encodeURIComponent(id));
  url += newParams.join('&');

  window.history.replaceState({}, '', url);

  await search_Npresent();
};

async function search_Npresent() {
  // Remove previous results and error
  let oldResult = document.getElementById('resultsContainer');
  if (oldResult) oldResult.remove();
  let oldError = document.getElementById('errorMsg');
  if (oldError) oldError.remove();

  // Create results container if not exists
  let container = document.getElementById('resultsContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'resultsContainer';
    document.querySelector('.container').appendChild(container);
  }

  // Show loading animation
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingDiv';
  loadingDiv.className = 'loading-spinner';
  loadingDiv.innerHTML = `
    <div class="spinner"></div>
    <div class="loading-text">Loading...</div>
  `;
  container.appendChild(loadingDiv);

  // Get parameters from URL
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const ability = params.get('ability');
  const id = params.get('id');

  // If no input, do nothing
  if (!type && !ability && !id) {
    showError(document.getElementById('resultsContainer'));
    loadingDiv.remove();
    return;
  }

  
  
  try {
    // getting al the needed information from the server
    if(!isValidElement(id, type, ability)){
      removeLoading();
      showError(document.getElementById('resultsContainer'));
      console.error('Error fetching pokemons:', error);
      return;
    }
    const response = await fetch(`http://localhost:3000/${id}/${type}/${ability}`);
    if (!response.ok) {
      removeLoading();
      showError(document.getElementById('resultsContainer'));
      console.error('Error fetching pokemons:', error);
      return;
    }
    const allPokemons = await response.json();
    const check = allPokemons.allPokemons;
    if (check.length === 0) {
      removeLoading();
      showError(document.getElementById('resultsContainer'));
      console.error('No pokemons found');
      return;
    }
    // building the cards in the html
    allPokemons.allPokemons.forEach(pokemon => {
      if (pokemon) createPokemonCard(pokemon);
    });
  } catch (error) {
    removeLoading();
    showError(document.getElementById('resultsContainer'));
    console.error('Error fetching pokemons:', error);
  }
  removeLoading();
}


// Helper to remove loading when done
function removeLoading() {
  const loadingDiv = document.getElementById('loadingDiv');
  loadingDiv.remove();
}

async function createPokemonCard(pokemon) {
  // Find the table in the results container, or create it if not exists
  let container = document.getElementById('resultsContainer');
  let table = container.querySelector('table.pokemon-table');
  if (!table) {
    table = document.createElement('table');
    table.className = 'pokemon-table';
    container.appendChild(table);
  }

  // Build the card element
  const name = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
  const img = pokemon.sprites?.other['official-artwork'].front_default || pokemon.sprites?.front_default || '';
  const types = pokemon.types.map(t => t.type.name);
  const id = pokemon.id;
  const abilities = pokemon.abilities.map(a => a.ability.name);
  const baseExp = pokemon.base_experience;

  // Card flip structure
  const card = document.createElement('div');
  card.className = 'pokemon-card card-flip';

  // Front of card
  const typeBadges = types.map(type =>
    `<span class="type-badge type-${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</span>`
  ).join('');
  const abilityBadges = abilities.map(ability =>
    `<span class="ability-badge">${ability.charAt(0).toUpperCase() + ability.slice(1)}</span>`
  ).join(' ');

  var button_text = 'Add';
  // Robust check: compare all keys case-insensitively
  let isFavorite = false;
  if (window.userFavorites && typeof window.userFavorites === 'object') {
    for (const key in window.userFavorites) {
      if (key.toLowerCase() === pokemon.name.toLowerCase()) {
        isFavorite = true;
        break;
      }
    }
  }
  if (isFavorite) {
    button_text = 'Added';
  }

  

  // Card inner HTML
  const pokemonData = {
    name,
    id,
    sprites: {
      front_default: img,
      other: {
        'official-artwork': { front_default: img }
      }
    },
    types: pokemon.types,
    abilities: pokemon.abilities,
    base_experience: baseExp
  };

  // Store all pokemonData objects in a global array for reference
  if (!window.allPokemonData) window.allPokemonData = [];
  const pokemonIndex = window.allPokemonData.length;
  window.allPokemonData.push(pokemonData);

  card.innerHTML = `
    <div class="card-content">
      <div class="card-inner" onclick="showPokemonDetails(${JSON.stringify(pokemon).replace(/"/g, '&quot;')})" style="cursor: pointer;">
        <div class="card-front">
          <img src="${img}" alt="${name}">
          <h2><span>${name}</span> <span style="font-size:1.2rem; color:#4fc3dc; font-weight:bold;">#${id}</span></h2>
          <div class="pokemon-info">
            <strong>Type:</strong> ${typeBadges}<br>
            <strong>Abilities:</strong> ${abilityBadges}
          </div>
        </div>
        <div class="card-back">
          <div class="exp-points">${baseExp}</div>
          <span class="exp-label">Base Experience</span>
        </div>
      </div>
      <button class="add-btn" data-pokemon-index="${pokemonIndex}" onclick='addToFavoritesByIndex(${pokemonIndex})'>${button_text}</button>
    </div>
  `;

  // Place card in table, 3 per row
  let lastRow = table.rows[table.rows.length - 1];
  if (!lastRow || lastRow.cells.length >= 3) {
    lastRow = table.insertRow();
  }
  const cell = lastRow.insertCell();
  cell.appendChild(card);
}

function showError(container) {
  const error = document.createElement('div');
  error.id = 'errorMsg';
  error.textContent = 'הקומבינציה שבחרת לא קיימת. אנא בחר סט קלטים אחר';
  error.style = 'background: #ffeded; color: #ff5e5e; border-radius: 16px; padding: 18px; margin: 32px auto 0 auto; max-width: 350px; font-size: 1.2rem; font-weight: 600; box-shadow: 0 2px 8px rgba(255,94,94,0.10);';
  container.appendChild(error);
}


async function addToFavorites(pokemon) {
  try {
    // Get authenticated user from session
    const authRes = await fetch('http://localhost:3000/auth/status');
    if (!authRes.ok) {
      alert('Authentication required!');
      return;
    }
    const authData = await authRes.json();
    if (!authData.authenticated || !authData.user) {
      alert('Authentication required!');
      return;
    }
    
    const user = authData.user.name;
    fetch(`http://localhost:3000/${user}/addFavorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pokemon })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Find the index of the pokemon in the global array
        const index = window.allPokemonData.findIndex(p => p.id === pokemon.id);
        // Select the button with the matching data-pokemon-index
        const btn = document.querySelector(`.add-btn[data-pokemon-index="${index}"]`);
        if (btn) {
          btn.textContent = 'Added';
          btn.disabled = true;
          btn.style.opacity = '0.7';
          btn.style.cursor = 'default';
        }
      } else {
        // Do nothing if already in favorites or invalid
      }
    })
    .catch(err => {
      console.error('Error adding favorite:', err);
      alert('Error adding favorite.');
    });
  } catch (error) {
    console.error('Error getting auth status:', error);
    alert('Authentication error!');
  }
}

function goToFavPage(){
  // Just go to favorites page - authentication will be handled by auth.js
  window.location.href = 'favorites.html';
};

function goToArena(){
  // Navigate to the battle arena page
  window.location.href = 'arena.html';
};

function addToFavoritesByIndex(index) {
  const pokemon = window.allPokemonData[index];
  addToFavorites(pokemon);
}

