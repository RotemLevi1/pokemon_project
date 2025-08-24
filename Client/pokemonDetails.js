// Pokemon Details Modal functionality

let currentPokemon = null;

// Create and show Pokemon details modal
function showPokemonDetails(pokemon) {
    currentPokemon = pokemon;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'pokemonDetailsModal';
    modal.className = 'pokemon-modal-overlay';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'pokemon-modal-content';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = closePokemonDetails;
    
    // Create Pokemon details content
    const detailsContent = createPokemonDetailsContent(pokemon);
    
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(detailsContent);
    modal.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modal);
    
    // Add body scroll lock
    document.body.style.overflow = 'hidden';
    
    // Load YouTube videos
    loadPokemonVideos(pokemon.name);
}

// Create Pokemon details content
function createPokemonDetailsContent(pokemon) {
    const content = document.createElement('div');
    content.className = 'pokemon-details-content';
    
    // Pokemon header with image and basic info
    const header = document.createElement('div');
    header.className = 'pokemon-header';
    
    const image = document.createElement('img');
    image.src = pokemon.sprites?.other['official-artwork']?.front_default || pokemon.sprites?.front_default || '';
    image.alt = pokemon.name;
    image.className = 'pokemon-detail-image';
    
    const headerInfo = document.createElement('div');
    headerInfo.className = 'pokemon-header-info';
    
    const name = document.createElement('h1');
    name.textContent = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
    name.className = 'pokemon-detail-name';
    
    const id = document.createElement('span');
    id.textContent = `#${pokemon.id}`;
    id.className = 'pokemon-detail-id';
    
    headerInfo.appendChild(name);
    headerInfo.appendChild(id);
    
    header.appendChild(image);
    header.appendChild(headerInfo);
    
    // Pokemon stats
    const stats = createPokemonStats(pokemon);
    
    // Pokemon abilities
    const abilities = createPokemonAbilities(pokemon);
    
    // Pokemon types
    const types = createPokemonTypes(pokemon);
    
    // YouTube videos section
    const videosSection = document.createElement('div');
    videosSection.className = 'videos-section';
    videosSection.innerHTML = '<h3>Related Videos</h3><div id="youtubeVideos" class="youtube-videos"></div>';
    
    content.appendChild(header);
    content.appendChild(types);
    content.appendChild(abilities);
    content.appendChild(stats);
    content.appendChild(videosSection);
    
    return content;
}

// Create Pokemon stats section
function createPokemonStats(pokemon) {
    const statsSection = document.createElement('div');
    statsSection.className = 'stats-section';
    
    const title = document.createElement('h3');
    title.textContent = 'Base Stats';
    title.className = 'section-title';
    
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';
    
    if (pokemon.stats) {
        pokemon.stats.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            const statName = document.createElement('span');
            statName.className = 'stat-name';
            statName.textContent = stat.stat.name.toUpperCase();
            
            const statValue = document.createElement('span');
            statValue.className = 'stat-value';
            statValue.textContent = stat.base_stat;
            
            const statBar = document.createElement('div');
            statBar.className = 'stat-bar';
            statBar.style.width = `${(stat.base_stat / 255) * 100}%`;
            
            statItem.appendChild(statName);
            statItem.appendChild(statValue);
            statItem.appendChild(statBar);
            statsGrid.appendChild(statItem);
        });
    }
    
    statsSection.appendChild(title);
    statsSection.appendChild(statsGrid);
    
    return statsSection;
}

// Create Pokemon abilities section
function createPokemonAbilities(pokemon) {
    const abilitiesSection = document.createElement('div');
    abilitiesSection.className = 'abilities-section';
    
    const title = document.createElement('h3');
    title.textContent = 'Abilities';
    title.className = 'section-title';
    
    const abilitiesList = document.createElement('div');
    abilitiesList.className = 'abilities-list';
    
    if (pokemon.abilities) {
        pokemon.abilities.forEach(ability => {
            const abilityItem = document.createElement('div');
            abilityItem.className = 'ability-item';
            
            const abilityName = document.createElement('span');
            abilityName.textContent = ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1);
            
            if (ability.is_hidden) {
                const hiddenBadge = document.createElement('span');
                hiddenBadge.className = 'hidden-badge';
                hiddenBadge.textContent = 'Hidden';
                abilityItem.appendChild(hiddenBadge);
            }
            
            abilityItem.appendChild(abilityName);
            abilitiesList.appendChild(abilityItem);
        });
    }
    
    abilitiesSection.appendChild(title);
    abilitiesSection.appendChild(abilitiesList);
    
    return abilitiesSection;
}

// Create Pokemon types section
function createPokemonTypes(pokemon) {
    const typesSection = document.createElement('div');
    typesSection.className = 'types-section';
    
    const title = document.createElement('h3');
    title.textContent = 'Types';
    title.className = 'section-title';
    
    const typesList = document.createElement('div');
    typesList.className = 'types-list';
    
    if (pokemon.types) {
        pokemon.types.forEach(type => {
            const typeBadge = document.createElement('span');
            typeBadge.className = `type-badge type-${type.type.name}`;
            typeBadge.textContent = type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1);
            typesList.appendChild(typeBadge);
        });
    }
    
    typesSection.appendChild(title);
    typesSection.appendChild(typesList);
    
    return typesSection;
}

// Load YouTube videos for Pokemon
async function loadPokemonVideos(pokemonName) {
    try {
        const videosContainer = document.getElementById('youtubeVideos');
        if (videosContainer) {
            // Show loading state
            videosContainer.innerHTML = '<div class="video-loading">Loading videos...</div>';
            
            // Make real API call to our server
            const response = await fetch(`http://localhost:3000/youtube/${encodeURIComponent(pokemonName)}`);
            const data = await response.json();
            
            if (data.videos && data.videos.length > 0) {
                await displayVideos(data.videos);
            } else {
                videosContainer.innerHTML = '<div class="no-videos">No videos found for this Pokemon</div>';
            }
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        const videosContainer = document.getElementById('youtubeVideos');
        if (videosContainer) {
            videosContainer.innerHTML = '<div class="video-error">Error loading videos</div>';
        }
    }
}

// Display videos in the container
async function displayVideos(videos) {
    const videosContainer = document.getElementById('youtubeVideos');
    if (!videosContainer) return;
    
    // Clear container and show loading for each video
    videosContainer.innerHTML = '<div class="video-loading">Loading embedded videos...</div>';
    
    try {
        // Fetch embed HTML for each video
        const videoPromises = videos.map(async (video) => {
            try {
                const response = await fetch(`http://localhost:3000/embed?url=${encodeURIComponent(video.url)}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch embed for ${video.title}`);
                }
                const data = await response.json();
                return {
                    ...video,
                    embedHtml: data.embedHtml
                };
            } catch (error) {
                console.error(`Error fetching embed for ${video.title}:`, error);
                return video; // Return video without embed if fetch fails
            }
        });
        
        const videosWithEmbeds = await Promise.all(videoPromises);
        
        // Display videos with embeds
        const videosHTML = videosWithEmbeds.map(video => `
            <div class="video-item">
                <div class="video-embed-container">
                    ${video.embedHtml || `
                        <div class="video-fallback">
                            <a href="${video.url}" target="_blank" class="video-link">
                                <div class="video-thumbnail">
                                    <img src="${video.thumbnail}" alt="${video.title}">
                                    <div class="play-button">▶</div>
                                </div>
                                <div class="video-info">
                                    <h4 class="video-title">${video.title}</h4>
                                    <span class="video-duration">${video.duration}</span>
                                    <span class="video-link-text">Click to watch on YouTube</span>
                                </div>
                            </a>
                        </div>
                    `}
                </div>
                <div class="video-info">
                    <h4 class="video-title">${video.title}</h4>
                    <span class="video-duration">${video.duration}</span>
                </div>
            </div>
        `).join('');
        
        videosContainer.innerHTML = videosHTML;
        
    } catch (error) {
        console.error('Error displaying videos:', error);
        // Fallback to link-based display
        const videosHTML = videos.map(video => `
            <div class="video-item">
                <div class="video-link-container">
                    <a href="${video.url}" target="_blank" class="video-link">
                        <div class="video-thumbnail">
                            <img src="${video.thumbnail}" alt="${video.title}">
                            <div class="play-button">▶</div>
                        </div>
                        <div class="video-info">
                            <h4 class="video-title">${video.title}</h4>
                            <span class="video-duration">${video.duration}</span>
                            <span class="video-link-text">Click to watch on YouTube</span>
                        </div>
                    </a>
                </div>
            </div>
        `).join('');
        
        videosContainer.innerHTML = videosHTML;
    }
}

// Open video in new tab
function openVideo(url) {
    if (url && url !== '#') {
        window.open(url, '_blank');
    }
}

// Close Pokemon details modal
function closePokemonDetails() {
    const modal = document.getElementById('pokemonDetailsModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
        currentPokemon = null;
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.id === 'pokemonDetailsModal') {
        closePokemonDetails();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePokemonDetails();
    }
});
