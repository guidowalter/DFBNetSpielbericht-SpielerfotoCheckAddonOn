// Spielbericht Photo Checker - Content Script
// Automatically checks for players without uploaded photos

function checkPlayerPhotos() {
  const results = {
    total: 0,
    withoutPhotos: 0,
    missingPhotoPlayers: []
  };

  // Target only the visible player lists (excludes hidden detail panels)
  const playerCards = document.querySelectorAll('.team-player-list .player-list .player');
  
  playerCards.forEach(playerCard => {
    const photoContainer = playerCard.querySelector('.player-photo');
    
    if (photoContainer) {
      const img = photoContainer.querySelector('img');
      
      if (img) {
        results.total++;
        const src = img.src || '';
        
        // Check if image is the dummy-person.svg placeholder
        if (src.includes('dummy-person.svg')) {
          results.withoutPhotos++;
          
          // Extract player name
          const nameElement = playerCard.querySelector('.player-name b');
          if (nameElement) {
            const playerName = nameElement.textContent.trim();
            results.missingPhotoPlayers.push(playerName);
          }
        }
      }
    }
  });

  return results;
}

function showWarningBanner(results) {
  // Remove any existing banner
  const existingBanner = document.getElementById('photo-checker-banner');
  if (existingBanner) {
    existingBanner.remove();
  }

  // Create warning banner
  const banner = document.createElement('div');
  banner.id = 'photo-checker-banner';
  banner.className = results.withoutPhotos > 0 ? 'photo-checker-warning' : 'photo-checker-success';
  
  if (results.withoutPhotos > 0) {
    const playerList = results.missingPhotoPlayers.map(name => `<li>${name}</li>`).join('');
    banner.innerHTML = `
      <div class="photo-checker-content">
        <span class="photo-checker-icon">⚠️</span>
        <div class="photo-checker-message">
          <strong>${results.withoutPhotos} Spieler ohne Foto${results.withoutPhotos > 1 ? 's' : ''}:</strong>
          <ul class="photo-checker-player-list">${playerList}</ul>
        </div>
        <button class="photo-checker-close" title="Schließen">×</button>
      </div>
    `;
  } else {
    banner.innerHTML = `
      <div class="photo-checker-content">
        <span class="photo-checker-icon">✅</span>
        <div class="photo-checker-message">
          <strong>Alle ${results.total} Spieler haben Fotos!</strong>
        </div>
        <button class="photo-checker-close" title="Schließen">×</button>
      </div>
    `;
  }

  // Insert banner at the top of the page
  document.body.insertBefore(banner, document.body.firstChild);

  // Add close button functionality
  const closeBtn = banner.querySelector('.photo-checker-close');
  closeBtn.addEventListener('click', () => {
    banner.remove();
  });

  // Auto-hide success message after 5 seconds
  if (results.withoutPhotos === 0) {
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 5000);
  }
}

// Continuously monitor for changes and update the banner
function initPhotoChecker() {
  let checkTimeout = null;
  
  function tryCheck() {
    // Clear any pending check
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }
    
    // Wait a bit to let DOM settle after changes
    checkTimeout = setTimeout(() => {
      const playerCards = document.querySelectorAll('.team-player-list .player-list .player');
      
      if (playerCards.length > 0) {
        const results = checkPlayerPhotos();
        
        // Always show/update banner when players are visible
        if (results.total > 0) {
          showWarningBanner(results);
          
          // Log to console for debugging
          console.log('[Spielbericht Photo Checker]', results);
        }
      }
    }, 300); // 300ms debounce
  }
  
  // Try immediately
  tryCheck();
  
  // Set up observer to watch for DOM changes (when panels open/close)
  const observer = new MutationObserver((mutations) => {
    // Check if any mutations affected the team panels
    const relevantChange = mutations.some(mutation => {
      const target = mutation.target;
      // Check if a panel body was added/removed or if visibility changed
      return target.classList && 
             (target.classList.contains('panel-body') || 
              target.classList.contains('panel') ||
              target.classList.contains('team-player-list') ||
              Array.from(mutation.addedNodes).some(node => 
                node.classList && 
                (node.classList.contains('player') || 
                 node.classList.contains('panel-body'))
              ));
    });
    
    if (relevantChange) {
      tryCheck();
    }
  });
  
  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'] // Watch for visibility changes
  });
  
  // Also check when user clicks on chevron icons (panel open/close)
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList && 
        (target.classList.contains('icon-chevron-down') || 
         target.classList.contains('icon-chevron-up') ||
         target.closest('.panel-heading'))) {
      // Panel was clicked, recheck after animation
      setTimeout(tryCheck, 500);
    }
  });
}

// Run the checker when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhotoChecker);
} else {
  initPhotoChecker();
}
