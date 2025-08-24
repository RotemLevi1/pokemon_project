// Arena Page JavaScript Logic

// Navigation functions
function goToGallery() {
  window.location.href = 'search.html';
}

function goToFavPage() {
  window.location.href = 'favorites.html';
}

// Battle against Bot
async function battleAgainstBot() {
  try {
    console.log('🤖 Starting bot battle...');
    
    // Show loading state
    showLoading('Preparing battle against bot...');
    
    // Request bot battle from server
    const response = await fetch('http://localhost:3000/battle-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    hideLoading();
    
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.message) {
        alert(errorData.message);
      } else {
        throw new Error('Failed to start bot battle');
      }
      return;
    }
    
    const battleData = await response.json();
    console.log('🤖 Bot battle data received:', battleData);
    
    // Show battle page using the same interface as player vs player
    showBattlePage(battleData, true);
    
  } catch (error) {
    hideLoading();
    console.error('Error starting bot battle:', error);
    alert(`Error starting bot battle: ${error.message || 'Please try again.'}`);
  }
}

// Start bot battle countdown and animation (unified with regular battles)
async function startBotBattle(battleId) {
  try {
    console.log('🤖 Starting bot battle countdown for:', battleId);
    
    // Disable the start button
    const startBtn = document.querySelector('.start-battle-btn');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.textContent = '⚔️ Battle in Progress...';
    }
    
    // Hide the close button during battle
    const closeBtn = document.querySelector('.close-battle-btn');
    if (closeBtn) {
      closeBtn.style.display = 'none';
    }
    
    // Start battle countdown
    showCountdown();
    
    // After countdown, show battle result (5 seconds total as per specs)
    setTimeout(async () => {
      await showBotBattleResult(battleId);
    }, 5000);
    
  } catch (error) {
    console.error('Error starting bot battle countdown:', error);
    alert(`Error starting battle: ${error.message || 'Please try again.'}`);
  }
}

// Random VS Player Battle - Main functionality
async function randomVsPlayer() {
  try {
    console.log('=== RANDOM BATTLE DEBUG START ===');
    
    // Show loading state
    showLoading('Finding online players...');
    
    // Check current session storage
    console.log('🔍 Checking current session storage...');
    const currentSession = sessionStorage.getItem('user');
    console.log('Current session storage user:', currentSession);
    
    // Check if we have auth status
    try {
      const authResponse = await fetch('http://localhost:3000/auth/status', {
        credentials: 'include'
      });
      const authData = await authResponse.json();
      console.log('🔐 Auth status response:', authData);
    } catch (authError) {
      console.log('❌ Auth status check failed:', authError);
    }
    
    // Send heartbeat to keep user active
    console.log('💓 Sending heartbeat...');
    try {
      const heartbeatResponse = await fetch('http://localhost:3000/heartbeat', {
        method: 'GET',
        credentials: 'include'
      });
      const heartbeatData = await heartbeatResponse.json();
      console.log('💓 Heartbeat response:', heartbeatData);
    } catch (heartbeatError) {
      console.log('❌ Heartbeat failed, but continuing...');
    }
    
    // Get online players
    console.log('👥 Fetching online players...');
    const response = await fetch('http://localhost:3000/online-players', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch online players');
    }
    
    const data = await response.json();
    console.log('👥 Online players API response:', data);
    
    // Show available opponents (already filtered by server)
    const onlinePlayers = data.players;
    
    if (data.currentUser) {
      console.log(`👤 Current user: ${data.currentUser}`);
    }
    
    if (data.totalOnline) {
      console.log(`📊 Total users online: ${data.totalOnline}`);
    }
    
    console.log(`🎯 Available opponents: ${onlinePlayers.length}`);
    onlinePlayers.forEach((player, index) => {
      console.log(`  ${index + 1}. ${player.name} (ID: ${player.id})`);
    });
    
    if (onlinePlayers.length === 0) {
      hideLoading();
      console.log('❌ No opponents found - showing alert');
      alert('No other players are currently online. You can try:\n\n1. Wait for other players to join\n2. Try the "Battle against Bot" feature\n3. Check back later!');
      return;
    }
    
    // Show player selection modal
    console.log('✅ Showing player selection modal');
    showPlayerSelectionModal(onlinePlayers);
    
    console.log('=== RANDOM BATTLE DEBUG END ===');
    
  } catch (error) {
    console.error('❌ Error finding players:', error);
    hideLoading();
    alert('Error finding online players. Please try again.');
  }
}

// Show player selection modal
function showPlayerSelectionModal(players) {
  hideLoading();
  
  const modal = document.createElement('div');
  modal.className = 'player-selection-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>🎯 Select Your Opponent</h3>
      <p>Choose a player to challenge:</p>
      <div class="players-list">
        ${players.map(player => `
          <div class="player-item" onclick="challengePlayer('${player.id}', '${player.name}')">
            <span class="player-name">${player.name}</span>
            <span class="player-status">🟢 Online Now</span>
          </div>
        `).join('')}
      </div>
      <p style="font-size: 0.9rem; color: #666; margin-top: 1rem;">
        These are real players currently online in the system.
      </p>
      <button class="cancel-btn" onclick="closePlayerSelectionModal()">Cancel</button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Close player selection modal
function closePlayerSelectionModal() {
  const modal = document.querySelector('.player-selection-modal');
  if (modal) {
    modal.remove();
  }
}

// Challenge a player to battle
async function challengePlayer(opponentId, opponentName) {
  try {
    closePlayerSelectionModal();
    showLoading(`Challenging ${opponentName}...`);
    
    // Send challenge
    const response = await fetch('http://localhost:3000/challenge-player', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        opponentId: opponentId,
        opponentName: opponentName
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send challenge');
    }
    
    const data = await response.json();
    
    if (data.status === 'accepted') {
      // Start battle immediately
      startBattle(data.battleId, opponentName);
    } else if (data.status === 'pending') {
      // Wait for opponent to accept
      waitForOpponentResponse(data.battleId, opponentName);
    }
    
  } catch (error) {
    console.error('Error challenging player:', error);
    hideLoading();
    alert('Error sending challenge. Please try again.');
  }
}

// Start battle with opponent
async function startBattle(battleId, opponentName) {
  try {
    hideLoading();
    
    // Get battle data (random Pokemon selection)
    const response = await fetch(`http://localhost:3000/battle/${battleId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.message) {
        // Show specific error message from server
        alert(errorData.message);
      } else {
        throw new Error('Failed to get battle data');
      }
      return;
    }
    
         const battleData = await response.json();
     
     // Debug: Log the Pokemon data received
     console.log('🔍 Battle data received:', battleData);
     console.log('🎮 Player1 Pokemon:', battleData.player1.pokemon);
     console.log('🎮 Player2 Pokemon:', battleData.player2.pokemon);
     
     // Show battle page
     showBattlePage(battleData);
    
  } catch (error) {
    console.error('Error starting battle:', error);
    alert('Error starting battle. Please try again.');
  }
}

// Show battle page with Pokemon comparison
function showBattlePage(battleData, isBotBattle = false) {
  const modal = document.createElement('div');
  modal.className = 'battle-modal';
  
  // Determine the title and button action based on battle type
  const battleTitle = isBotBattle ? 
    `⚔️ Battle: ${battleData.player1.name} vs 🤖 ${battleData.player2.name}` : 
    `⚔️ Battle: ${battleData.player1.name} vs ${battleData.player2.name}`;
  
  const buttonAction = isBotBattle ? 
    `startBotBattle('${battleData.battleId}')` : 
    `startBattleAnimation('${battleData.battleId}')`;
  
  // Add special styling for bot battles using unified battle card class
  const player1Class = 'battle-pokemon-card';
  const player2Class = isBotBattle ? 'battle-pokemon-card bot-card' : 'battle-pokemon-card';
  const player2Title = isBotBattle ? `🤖 ${battleData.player2.name}'s Pokemon` : `${battleData.player2.name}'s Pokemon`;
  
  modal.innerHTML = `
    <div class="battle-content">
      <h2>${battleTitle}</h2>
      
      <div class="battle-pokemon">
                 <div class="${player1Class}">
           <h3>${battleData.player1.name}'s Pokemon</h3>
           <div class="pokemon-image-container">
             <img src="${battleData.player1.pokemon.sprites.other?.['official-artwork']?.front_default || battleData.player1.pokemon.sprites.front_default}" alt="${battleData.player1.pokemon.name}">
           </div>
           <h4>${battleData.player1.pokemon.name}</h4>
                     <div class="pokemon-stats">
             <div class="stat">HP: ${battleData.player1.pokemon.stats?.find(s => s.stat.name === 'hp')?.base_stat || 'N/A'}</div>
             <div class="stat">Attack: ${battleData.player1.pokemon.stats?.find(s => s.stat.name === 'attack')?.base_stat || 'N/A'}</div>
             <div class="stat">Defense: ${battleData.player1.pokemon.stats?.find(s => s.stat.name === 'defense')?.base_stat || 'N/A'}</div>
             <div class="stat">Speed: ${battleData.player1.pokemon.stats?.find(s => s.stat.name === 'speed')?.base_stat || 'N/A'}</div>
           </div>
        </div>
        
        <div class="vs-symbol">⚔️</div>
        
                 <div class="${player2Class}">
           <h3>${player2Title}</h3>
           <div class="pokemon-image-container">
             <img src="${battleData.player2.pokemon.sprites.other?.['official-artwork']?.front_default || battleData.player2.pokemon.sprites.front_default}" alt="${battleData.player2.pokemon.name}">
           </div>
           <h4>${battleData.player2.pokemon.name}</h4>
                     <div class="pokemon-stats">
             <div class="stat">HP: ${battleData.player2.pokemon.stats?.find(s => s.stat.name === 'hp')?.base_stat || 'N/A'}</div>
             <div class="stat">Attack: ${battleData.player2.pokemon.stats?.find(s => s.stat.name === 'attack')?.base_stat || 'N/A'}</div>
             <div class="stat">Defense: ${battleData.player2.pokemon.stats?.find(s => s.stat.name === 'defense')?.base_stat || 'N/A'}</div>
             <div class="stat">Speed: ${battleData.player2.pokemon.stats?.find(s => s.stat.name === 'speed')?.base_stat || 'N/A'}</div>
           </div>
        </div>
      </div>
      
      <button class="start-battle-btn" onclick="${buttonAction}">
        🚀 Start Battle!
      </button>
      
      <button class="close-battle-btn" onclick="closeBattleModal()">Close</button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Start battle animation and determine winner
async function startBattleAnimation(battleId) {
  try {
    const startBtn = document.querySelector('.start-battle-btn');
    startBtn.disabled = true;
    startBtn.textContent = '⚔️ Battle in Progress...';
    
    // Show countdown
    showCountdown();
    
         // After countdown, show battle result (5 seconds total as per Hebrew specs)
     setTimeout(async () => {
       await showBattleResult(battleId);
     }, 5000);
    
  } catch (error) {
    console.error('Error in battle animation:', error);
  }
}

// Show countdown animation
function showCountdown() {
  const countdownDiv = document.createElement('div');
  countdownDiv.className = 'countdown-overlay';
  countdownDiv.innerHTML = `
    <div class="countdown-content">
      <div class="countdown-number">3</div>
    </div>
  `;
  
  document.body.appendChild(countdownDiv);
  
  // Animate countdown: 3-2-1 (3 seconds total)
  let count = 3;
  const countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownDiv.querySelector('.countdown-number').textContent = count;
    } else {
      clearInterval(countdownInterval);
      countdownDiv.remove();
    }
  }, 1000);
}

// Show battle result
async function showBattleResult(battleId) {
  try {
    console.log(`🔍 Fetching battle result for: ${battleId}`);
    
    const response = await fetch(`http://localhost:3000/battle/${battleId}/result`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Battle result failed: ${response.status} - ${errorText}`);
      throw new Error(`Failed to get battle result: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Battle result received:`, result);
    
    // Update battle display with result
    showBattleResultDisplay(result);
    
  } catch (error) {
    console.error('❌ Error getting battle result:', error);
    // Show error to user
    const battleContent = document.querySelector('.battle-content');
    if (battleContent) {
      battleContent.innerHTML = `
        <div class="battle-result">
          <h2>❌ Battle Error</h2>
          <p>Failed to get battle result: ${error.message}</p>
          <button class="close-battle-btn" onclick="closeBattleModal()">Close Battle</button>
        </div>
      `;
    }
  }
}

// Show battle result display
async function showBattleResultDisplay(result) {
  const resultDiv = document.createElement('div');
  resultDiv.className = 'battle-result';
  
  const currentUserId = await getCurrentUserId();
  
  if (result.winner === currentUserId) {
    resultDiv.innerHTML = `
      <div class="winner-display">
        <h2>🏆 You Won! 🏆</h2>
        <div class="crown">👑</div>
        <p>Congratulations! Your Pokemon emerged victorious!</p>
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div class="loser-display">
        <h2>😔 You Lost</h2>
        <p>Better luck next time! Your Pokemon fought bravely.</p>
      </div>
    `;
  }
  
  // Replace battle content with result
  const battleContent = document.querySelector('.battle-content');
  battleContent.innerHTML = '';
  battleContent.appendChild(resultDiv);
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-battle-btn';
  closeBtn.textContent = 'Close Battle';
  closeBtn.onclick = closeBattleModal;
  battleContent.appendChild(closeBtn);
}

// Close battle modal
function closeBattleModal() {
  const modal = document.querySelector('.battle-modal');
  if (modal) {
    modal.remove();
  }
}

// Wait for opponent response
function waitForOpponentResponse(battleId, opponentName) {
  hideLoading();
  alert(`Challenge sent to ${opponentName}! Waiting for response...`);
  
  // Poll for response
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`http://localhost:3000/battle/${battleId}/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'accepted') {
          clearInterval(pollInterval);
          startBattle(battleId, opponentName);
        } else if (data.status === 'declined') {
          clearInterval(pollInterval);
          alert(`${opponentName} declined your challenge.`);
        }
      }
    } catch (error) {
      console.error('Error polling battle status:', error);
    }
  }, 2000);
}

// View battle history (placeholder)
function viewBattleHistory() {
  alert('📜 Battle history feature coming soon!');
}

// View player ranking (placeholder)
function viewPlayerRanking() {
  alert('🏆 Player ranking feature coming soon!');
}

// Utility functions
async function getCurrentUserId() {
  try {
    // Get current user ID from auth status
    const response = await fetch('http://localhost:3000/auth/status', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated && data.user && data.user.id) {
        return data.user.id;
      }
    }
    
    // Fallback: try to get from session storage
    const sessionUser = sessionStorage.getItem('user');
    if (sessionUser) {
      try {
        const userData = JSON.parse(sessionUser);
        return userData.id || userData.name;
      } catch (e) {
        return sessionUser;
      }
    }
    
    console.warn('Could not determine current user ID, using fallback');
    return 'unknown-user';
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return 'unknown-user';
  }
}

// Show bot battle result
async function showBotBattleResult(battleId) {
  try {
    console.log(`🔍 Fetching bot battle result for: ${battleId}`);

    const response = await fetch(`http://localhost:3000/battle-bot/${battleId}/result`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Bot battle result failed: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`Failed to get bot battle result: ${errorText}`);
    }

    const result = await response.json();

    // Update battle display with result
    await showBattleResultDisplay(result);

  } catch (error) {
    console.error('Error getting bot battle result:', error);
    alert(`Error during bot battle result: ${error.message || 'Please try again.'}`);
  }
}

// Player Ranking
async function viewPlayerRanking() {
  try {
    console.log('📊 CLIENT: Starting player ranking request...');
    
    showLoading('Loading player rankings...');
    
    const response = await fetch('http://localhost:3000/player-ranking', {
      credentials: 'include'
    });
    
    console.log('📊 CLIENT: Received response:', response.status, response.statusText);
    
    hideLoading();
    
    if (!response.ok) {
      console.error('📊 CLIENT: Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to fetch player ranking: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 CLIENT: Received data:', data);
    console.log('📊 CLIENT: Rankings array:', data.rankings);
    console.log('📊 CLIENT: Rankings length:', data.rankings.length);
    
    console.log('📊 CLIENT: Calling showPlayerRankingModal...');
    showPlayerRankingModal(data.rankings);
    console.log('📊 CLIENT: showPlayerRankingModal called successfully');
    
  } catch (error) {
    hideLoading();
    console.error('❌ CLIENT: Error fetching player ranking:', error);
    console.error('❌ CLIENT: Error details:', error.message, error.stack);
    alert(`Error loading player ranking: ${error.message || 'Please try again.'}`);
  }
}

// Show player ranking modal
function showPlayerRankingModal(rankings) {
  try {
    console.log('🎯 CLIENT: showPlayerRankingModal called with rankings:', rankings);
    console.log('🎯 CLIENT: Rankings type:', typeof rankings);
    console.log('🎯 CLIENT: Is rankings array?:', Array.isArray(rankings));
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    console.log('🎯 CLIENT: Created modal element');
    
    let rankingHTML = '<h2>🏆 Player Rankings</h2>';
    
    if (!rankings || rankings.length === 0) {
      rankingHTML += '<p>No players have battle records yet. Start battling to appear on the leaderboard!</p>';
      console.log('🎯 CLIENT: No rankings data, showing empty message');
    } else {
      console.log('🎯 CLIENT: Building rankings table with', rankings.length, 'players');
      rankingHTML += `
        <table class="ranking-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Wins</th>
              <th>Battles</th>
              <th>Win Rate</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      rankings.forEach((player, index) => {
        console.log('🎯 CLIENT: Processing player', index, ':', player);
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        
        rankingHTML += `
          <tr>
            <td class="rank">${medal}</td>
            <td class="player-name">${player.username}</td>
            <td class="wins">${player.wins}</td>
            <td class="battles">${player.totalBattles}</td>
            <td class="win-rate">${player.winRate.toFixed(1)}%</td>
          </tr>
        `;
      });
      
      rankingHTML += '</tbody></table>';
    }
    
    modal.innerHTML = `
      <div class="modal-content ranking-modal">
        ${rankingHTML}
        <button class="close-modal-btn" onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;
    
    console.log('🎯 CLIENT: Modal HTML created:', modal.innerHTML.substring(0, 200) + '...');
    console.log('🎯 CLIENT: Appending modal to body...');
    
    document.body.appendChild(modal);
    
    console.log('🎯 CLIENT: Modal appended successfully');
    console.log('🎯 CLIENT: Modal element in DOM:', document.querySelector('.modal-overlay') !== null);
    
    // Add fallback styles if CSS isn't loaded
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 2rem;
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
      `;
    }
    
    console.log('🎯 CLIENT: Fallback styles applied');
    
  } catch (error) {
    console.error('❌ CLIENT: Error in showPlayerRankingModal:', error);
    console.error('❌ CLIENT: Error details:', error.message, error.stack);
    alert(`Error displaying player ranking: ${error.message}`);
  }
}

// View Battle History
async function viewBattleHistory() {
  try {
    console.log('📜 CLIENT: Starting battle history request...');
    
    showLoading('Loading battle history...');
    
    const response = await fetch('http://localhost:3000/battle-history', {
      credentials: 'include'
    });
    
    console.log('📜 CLIENT: Received response:', response.status, response.statusText);
    
    hideLoading();
    
    if (!response.ok) {
      console.error('📜 CLIENT: Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to fetch battle history: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📜 CLIENT: Received data:', data);
    console.log('📜 CLIENT: History array:', data.history);
    console.log('📜 CLIENT: History length:', data.history?.length);
    console.log('📜 CLIENT: Stats object:', data.stats);
    
    console.log('📜 CLIENT: Calling showBattleHistoryModal...');
    showBattleHistoryModal(data.history, data.stats);
    console.log('📜 CLIENT: showBattleHistoryModal called successfully');
    
  } catch (error) {
    hideLoading();
    console.error('❌ CLIENT: Error fetching battle history:', error);
    console.error('❌ CLIENT: Error details:', error.message, error.stack);
    alert(`Error loading battle history: ${error.message || 'Please try again.'}`);
  }
}

// Show battle history modal
function showBattleHistoryModal(history, stats) {
  try {
    console.log('🎯 CLIENT: showBattleHistoryModal called with history:', history);
    console.log('🎯 CLIENT: showBattleHistoryModal called with stats:', stats);
    console.log('🎯 CLIENT: History type:', typeof history);
    console.log('🎯 CLIENT: Is history array?:', Array.isArray(history));
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    console.log('🎯 CLIENT: Created modal element');
  
  let historyHTML = '<h2>📜 Battle History</h2>';
  
  // Show stats summary
  historyHTML += `
    <div class="stats-summary">
      <div class="stat-item">
        <span class="stat-label">Total Battles:</span>
        <span class="stat-value">${stats.totalBattles}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Wins:</span>
        <span class="stat-value win">${stats.wins}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Losses:</span>
        <span class="stat-value loss">${stats.losses}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Win Rate:</span>
        <span class="stat-value">${stats.winRate.toFixed(1)}%</span>
      </div>
    </div>
  `;
  
  if (history.length === 0) {
    historyHTML += '<p>No battle history yet. Start battling to see your records here!</p>';
  } else {
    historyHTML += '<div class="history-list">';
    
    history.forEach((battle, index) => {
      const date = new Date(battle.date).toLocaleDateString();
      const time = new Date(battle.date).toLocaleTimeString();
      const resultClass = battle.result === 'win' ? 'battle-win' : 'battle-loss';
      const resultIcon = battle.result === 'win' ? '🏆' : '❌';
      const opponentIcon = battle.opponentType === 'bot' ? '🤖' : '👤';
      
      historyHTML += `
        <div class="battle-record ${resultClass}">
          <div class="battle-header">
            <span class="battle-result">${resultIcon} ${battle.result.toUpperCase()}</span>
            <span class="battle-date">${date} ${time}</span>
          </div>
          <div class="battle-details">
            <div class="battle-opponent">
              <span>vs ${opponentIcon} ${battle.opponent}</span>
            </div>
            <div class="pokemon-matchup">
              <div class="user-pokemon">
                <img src="${battle.userPokemon.sprite}" alt="${battle.userPokemon.name}" />
                <span>${battle.userPokemon.name}</span>
                <span class="score">${battle.userScore}</span>
              </div>
              <span class="vs">VS</span>
              <div class="opponent-pokemon">
                <img src="${battle.opponentPokemon.sprite}" alt="${battle.opponentPokemon.name}" />
                <span>${battle.opponentPokemon.name}</span>
                <span class="score">${battle.opponentScore}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    historyHTML += '</div>';
  }
  
  modal.innerHTML = `
    <div class="modal-content history-modal">
      ${historyHTML}
      <button class="close-modal-btn" onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;
  
  console.log('🎯 CLIENT: Modal HTML created:', modal.innerHTML.substring(0, 200) + '...');
  console.log('🎯 CLIENT: Appending modal to body...');
  
  document.body.appendChild(modal);
  
  console.log('🎯 CLIENT: Modal appended successfully');
  console.log('🎯 CLIENT: Modal element in DOM:', document.querySelector('.modal-overlay') !== null);
  
  // Add fallback styles if CSS isn't loaded
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 2rem;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    `;
  }
  
  console.log('🎯 CLIENT: Fallback styles applied');
  
  } catch (error) {
    console.error('❌ CLIENT: Error in showBattleHistoryModal:', error);
    console.error('❌ CLIENT: Error details:', error.message, error.stack);
    alert(`Error displaying battle history: ${error.message}`);
  }
}

function showLoading(message) {
  // Create loading overlay
  const loading = document.createElement('div');
  loading.className = 'loading-overlay';
  loading.innerHTML = `
    <div class="loading-content">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(loading);
}

function hideLoading() {
  const loading = document.querySelector('.loading-overlay');
  if (loading) {
    loading.remove();
  }
}

// Send periodic heartbeats to keep user online
function startHeartbeat() {
  setInterval(async () => {
    try {
      await fetch('http://localhost:3000/heartbeat', {
        method: 'GET',
        credentials: 'include'
      });
    } catch (error) {
      console.log('Heartbeat failed:', error);
    }
  }, 30000); // Send heartbeat every 30 seconds
}

// Initialize heartbeat when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Start sending heartbeats to keep user online
  startHeartbeat();
});
