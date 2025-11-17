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
  
  const content = document.createElement('div');
  content.className = 'photo-checker-content';
  
  const icon = document.createElement('span');
  icon.className = 'photo-checker-icon';
  icon.textContent = results.withoutPhotos > 0 ? '⚠️' : '✅';
  
  const message = document.createElement('div');
  message.className = 'photo-checker-message';
  
  const closeBtnElem = document.createElement('button');
  closeBtnElem.className = 'photo-checker-close';
  closeBtnElem.title = 'Schließen';
  closeBtnElem.textContent = '×';
  
  if (results.withoutPhotos > 0) {
    const title = document.createElement('strong');
    title.textContent = `${results.withoutPhotos} Spieler ohne Foto${results.withoutPhotos > 1 ? 's' : ''}:`;
    message.appendChild(title);
    
    const playerList = document.createElement('ul');
    playerList.className = 'photo-checker-player-list';
    results.missingPhotoPlayers.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      playerList.appendChild(li);
    });
    message.appendChild(playerList);
  } else {
    const title = document.createElement('strong');
    title.textContent = `Alle ${results.total} Spieler haben Fotos!`;
    message.appendChild(title);
  }
  
  // Add disclaimer
  const disclaimer = document.createElement('div');
  disclaimer.className = 'photo-checker-disclaimer';
  disclaimer.textContent = 'Inoffizielle Erweiterung – keine Verbindung zu DFBnet GmbH oder DFB. Verwendung auf eigene Verantwortung. Diese Browser-Erweiterung dient ausschließlich als Hilfsmittel zur Unterstützung bei der Verwaltung von Spielerfotos. Die Nutzer sind selbst verantwortlich für die Kontrolle von Bildern, Spielerdaten und die Einhaltung aller Regeln im Spielbetrieb.Die Verwendung erfolgt auf eigene Verantwortung.'
  message.appendChild(disclaimer);
  
  content.appendChild(icon);
  content.appendChild(message);
  content.appendChild(closeBtnElem);
  banner.appendChild(content);

  // Insert banner at the top of the page
  document.body.insertBefore(banner, document.body.firstChild);

  // Add close button functionality
  closeBtnElem.addEventListener('click', () => {
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
