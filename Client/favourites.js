window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get authenticated user from session
    const authRes = await fetch('/auth/status');
    if (!authRes.ok) {
      window.location.href = 'login.html';
      return;
    }
    const authData = await authRes.json();
    if (!authData.authenticated || !authData.user) {
      window.location.href = 'login.html';
      return;
    }
    
    const user = authData.user.name;
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    // Show loading animation
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-spinner';
    loadingDiv.innerHTML = `
      <div class="spinner"></div>
      <div class="loading-text">Loading...</div>
    `;
    container.appendChild(loadingDiv);

    // Fetch favorites from backend
    let favoritesRes = await fetch(`/${user}/favorites`);
    let favoritesData = await favoritesRes.json();
    let favorites = favoritesData.favoritePokemons;

    if (!favorites || typeof favorites !== 'object' || Object.keys(favorites).length === 0) {
      loadingDiv.remove();
      container.innerHTML = '<div style="color:#ff5e5e; font-size:1.2rem; font-weight:600; margin-top:2rem;">No favourites selected yet.</div>';
      return;
    }

    // Show each favourite as a card
    for (const key in favorites) {
        createPokemonCard(favorites[key], user);
    }
    loadingDiv.remove();
  } catch (error) {
    console.error('Error loading favorites:', error);
    window.location.href = 'login.html';
  }
});



function createPokemonCard(pokemon, user) {
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
    const typeBadges = types.map(type =>
      `<span class="type-badge type-${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</span>`
    ).join('');
    const abilityBadges = abilities.map(ability =>
      `<span class="ability-badge">${ability.charAt(0).toUpperCase() + ability.slice(1)}</span>`
    ).join(' ');

    // Card flip structure for favorites
    const card = document.createElement('div');
    card.className = 'pokemon-card card-flip';

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
        <button class="remove-btn" onclick="removeFromFavorites('${pokemon.name}')">Remove</button>
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

async function removeFromFavorites(name) {
  try {
    // Get authenticated user from session
    const authRes = await fetch('/auth/status');
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
    fetch(`/${user}/removeFavorite?pokemonName=${encodeURIComponent(name)}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Remove the Pokémon card from the UI
        const container = document.getElementById('resultsContainer');
        const card = Array.from(container.getElementsByClassName('pokemon-card'))
          .find(c => c.querySelector('h2 span').textContent.toLowerCase() === name.toLowerCase());
        if (card) {
          card.remove();
        }
        
        // Check if there are any cards left
        const remainingCards = document.querySelectorAll('.pokemon-card');
        if (remainingCards.length === 0) {
          document.getElementById('resultsContainer').innerHTML = '<div style="color:#ff5e5e; font-size:1.2rem; font-weight:600; margin-top:2rem;">No favourites selected yet.</div>';
        }
      } else {
        alert('Error removing favorite.');
      }
    })
    .catch(err => {
      console.error('Error removing favorite:', err);
      alert('Error removing favorite.');
    });
  } catch (error) {
    console.error('Error getting auth status:', error);
    alert('Authentication error!');
  }
}



function backButton() {
  // Just go back to search page - authentication will be handled by auth.js
  window.location.href = 'search.html';
}

function goToArena() {
  // Navigate to the battle arena page
  window.location.href = 'arena.html';
}


function sortPokemonTable(by = 'name') {
  const table = document.querySelector('.pokemon-table'); // make sure this is your table's ID
  const cards = Array.from(table.querySelectorAll('.pokemon-card'));

  const getValue = (card) => {
    switch (by) {
      case 'name':
        return card.querySelector('h2 span').innerText.toLowerCase();
      case 'id':
        return parseInt(card.querySelector('h2 span:nth-child(2)').innerText.replace('#', ''));
      case 'baseExp':
        return parseInt(card.querySelector('.exp-points').textContent);
      default:
        return '';
    }
  };

  // Sort cards
  const sorted = cards.sort((a, b) => {
    const valA = getValue(a);
    const valB = getValue(b);
    return typeof valA === 'string' ? valA.localeCompare(valB) : valA - valB;
  });

  // Clear table
  table.innerHTML = '';

  // Rebuild table rows with 3 cards per row
  let row;
  sorted.forEach((card, index) => {
    if (index % 3 === 0) {
      row = table.insertRow();
    }
    const cell = row.insertCell();
    cell.appendChild(card);
  });
}

function downloadFavorites() {
  const table = document.querySelector('.pokemon-table');
  if (!table) return;
  const cards = Array.from(table.querySelectorAll('.pokemon-card'));
  const pokemons = cards.map(card => {
    const name = card.querySelector('h2 span').textContent;
    const id = parseInt(card.querySelector('h2 span:nth-child(2)').textContent.replace('#', ''));
    const img = card.querySelector('img').src;
    const typeBadges = Array.from(card.querySelectorAll('.type-badge')).map(b => b.textContent);
    const abilityBadges = Array.from(card.querySelectorAll('.ability-badge')).map(b => b.textContent);
    return {
      name,
      id,
      image: img,
      types: typeBadges,
      abilities: abilityBadges
    };
  });
  const blob = new Blob([JSON.stringify(pokemons, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'favorites.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
