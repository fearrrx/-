(() => {
  const TOOLKIT_ICON_ID = 'toolkit-icon';
  const TOOLKIT_POPUP_ID = 'toolkit-popup';

  // Get Discord user token from webpack modules or localStorage
  function getDiscordToken() {
    // Try Discord React webpack module method
    try {
      for (const key in window.webpackChunkdiscord_app) {
        const chunk = window.webpackChunkdiscord_app[key];
        if (!chunk) continue;
        for (const m of chunk) {
          if (m && m.exports) {
            for (const key2 in m.exports) {
              const mod = m.exports[key2];
              if (mod && mod.getToken !== undefined) {
                const token = mod.getToken();
                if (token) return token;
              }
            }
          }
        }
      }
    } catch {}
    // Fallback to localStorage
    const tokenLS = localStorage.getItem('token') || localStorage.getItem('__token');
    if (tokenLS) return tokenLS.replace(/"/g, '');
    return null;
  }

  // Helper to add copy functionality to a button
  function addCopyListener(buttonId, copyValue, isImageUrl = false) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    const originalText = button.textContent;

    button.addEventListener('click', async (e) => {
      const btn = e.target;
      btn.textContent = 'Copying...';
      try {
        if (isImageUrl) {
          const response = await fetch(copyValue);
          const blob = await response.blob();
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } else {
          await navigator.clipboard.writeText(copyValue);
        }
        btn.textContent = 'Copied!';
      } catch (err) {
        console.error(`Failed to copy: `, err);
        btn.textContent = 'Failed!';
      } finally {
        setTimeout(() => { btn.textContent = originalText; }, 2000);
      }
    });
  }
  
  // Create toolkit icon bottom right
  function createToolkitIcon() {
    if (document.getElementById(TOOLKIT_ICON_ID)) return document.getElementById(TOOLKIT_ICON_ID);

    const icon = document.createElement('div');
    icon.id = TOOLKIT_ICON_ID;
    icon.title = 'Toolkit';
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('role', 'button');
    icon.setAttribute('aria-label', 'Open Toolkit');

    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    `;
    document.body.appendChild(icon);
    return icon;
  }

  // Create popup container
  function createPopup() {
    if (document.getElementById(TOOLKIT_POPUP_ID)) return document.getElementById(TOOLKIT_POPUP_ID);

    const popup = document.createElement('div');
    popup.id = TOOLKIT_POPUP_ID;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-hidden', 'true');
    popup.style.display = 'none';

    popup.innerHTML = `
      <div id="toolkit-popup-header">
        <span class="back-btn" role="button" aria-label="Back" tabindex="0">&#8592;</span>
        <span id="toolkit-popup-title">Toolkit</span>
      </div>
      <div id="toolkit-popup-body">
        <div class="tool-list">
          <button class="tool-btn" data-tool="copy-avatar" type="button">Copy Avatar</button>
          <button class="tool-btn" data-tool="server-lookup" type="button">Server Lookup</button>
        </div>
        <div class="tool-interface" style="display:none;"></div>
      </div>
    `;

    document.body.appendChild(popup);
    return popup;
  }

  // Show or hide popup
  function togglePopup(show) {
    const popup = document.getElementById(TOOLKIT_POPUP_ID);
    const icon = document.getElementById(TOOLKIT_ICON_ID);
    if (!popup || !icon) return;

    if (show) {
      popup.style.display = 'flex';
      popup.setAttribute('aria-hidden', 'false');
      icon.setAttribute('aria-pressed', 'true');
    } else {
      popup.style.display = 'none';
      popup.setAttribute('aria-hidden', 'true');
      icon.setAttribute('aria-pressed', 'false');
      resetPopupToMenu();
    }
  }

  // Reset popup UI to main menu
  function resetPopupToMenu() {
    const popup = document.getElementById(TOOLKIT_POPUP_ID);
    if (!popup) return;
    const headerBack = popup.querySelector('.back-btn');
    const title = popup.querySelector('#toolkit-popup-title');
    const body = popup.querySelector('#toolkit-popup-body');
    const toolList = body.querySelector('.tool-list');
    const toolInterface = body.querySelector('.tool-interface');

    headerBack.style.display = 'none';
    title.textContent = 'Toolkit';
    toolList.style.display = 'flex';
    toolInterface.style.display = 'none';
    toolInterface.innerHTML = '';
  }

  // Build Copy Avatar UI form
  function buildCopyAvatarUI() {
    return `
      <form class="tool-form" id="copy-avatar-form" autocomplete="off">
        <label for="user-id-input">User ID:</label>
        <input id="user-id-input" name="user-id-input" type="text" placeholder="Enter User ID" required />
        <button type="submit">Fetch Avatar</button>
      </form>
      <div class="info-box" id="copy-avatar-result" style="display:none;"></div>
    `;
  }

  // Build Server Lookup UI form
  function buildServerLookupUI() {
    return `
      <form class="tool-form" id="server-lookup-form" autocomplete="off">
        <label for="server-id-input">Server ID:</label>
        <input id="server-id-input" name="server-id-input" type="text" placeholder="Enter Server ID" required />
        <button type="submit">Fetch Server Info</button>
      </form>
      <div class="info-box" id="server-lookup-result" style="display:none;"></div>
    `;
  }

  // Helper to fetch Discord user info
  async function fetchUserInfo(userId, token) {
    try {
      const res = await fetch(`https://discord.com/api/v9/users/${userId}`, {
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch user info');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // Helper to fetch Discord guild info
  async function fetchGuildInfo(guildId, token) {
    try {
      const res = await fetch(`https://discord.com/api/v9/guilds/${guildId}`, {
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch guild info');
      return await res.json();
    } catch {
      return null;
    }
  }

  // Show user avatar info
  async function handleCopyAvatar(userId) {
    const resultBox = document.getElementById('copy-avatar-result');
    resultBox.style.display = 'block';
    resultBox.innerHTML = `<div class="loader" role="alert" aria-live="polite"></div>`;

    const token = getDiscordToken();
    if (!token) {
      resultBox.textContent = 'Discord token not found. Are you logged in?';
      return;
    }

    const userInfo = await fetchUserInfo(userId, token);
    if (!userInfo) {
      resultBox.textContent = 'Failed to fetch user data. Check User ID.';
      return;
    }

    const avatarUrl = userInfo.avatar
      ? `https://cdn.discordapp.com/avatars/${userId}/${userInfo.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(userInfo.discriminator) % 5}.png`;

    resultBox.innerHTML = `
      <p><strong>${userInfo.username}#${userInfo.discriminator}</strong></p>
      <img src="${avatarUrl}" alt="User Avatar" class="img-preview" />
      <div class="btn-container">
        <button id="copy-avatar-url-btn" class="copy-btn">Copy URL</button>
        <button id="copy-avatar-image-btn" class="copy-btn">Copy Image</button>
      </div>
    `;

    addCopyListener('copy-avatar-url-btn', avatarUrl);
    addCopyListener('copy-avatar-image-btn', avatarUrl, true);
  }

  // Show server info
  async function handleServerLookup(serverId) {
    const resultBox = document.getElementById('server-lookup-result');
    resultBox.style.display = 'block';
    resultBox.innerHTML = `<div class="loader" role="alert" aria-live="polite"></div>`;

    const token = getDiscordToken();
    if (!token) {
      resultBox.textContent = 'Discord token not found. Are you logged in?';
      return;
    }

    const guildInfo = await fetchGuildInfo(serverId, token);
    if (!guildInfo) {
      resultBox.textContent = 'Failed to fetch server data. Check Server ID or permissions.';
      return;
    }

    const createdAt = new Date(guildInfo.id / 4194304 + 1420070400000).toLocaleString();
    const bannerUrl = guildInfo.banner ? `https://cdn.discordapp.com/banners/${guildInfo.id}/${guildInfo.banner}.png?size=512` : null;
    const iconUrl = guildInfo.icon ? `https://cdn.discordapp.com/icons/${guildInfo.id}/${guildInfo.icon}.png?size=256` : null;

    let html = `
      <p><strong>${guildInfo.name}</strong></p>
      <p><strong>Created At:</strong> ${createdAt}</p>
      <p><strong>Owner ID:</strong> ${guildInfo.owner_id}</p>
      <p><strong>Roles Count:</strong> ${guildInfo.roles ? Object.keys(guildInfo.roles).length : 0}</p>
    `;

    if (iconUrl) {
      html += `
        <img src="${iconUrl}" alt="Server Icon" class="img-preview" />
        <div class="btn-container">
          <button id="copy-server-icon-url-btn" class="copy-btn">Copy Icon URL</button>
          <button id="copy-server-icon-image-btn" class="copy-btn">Copy Icon Image</button>
        </div>
      `;
    }
    if (bannerUrl) {
      html += `
        <img src="${bannerUrl}" alt="Server Banner" class="img-preview" />
        <div class="btn-container">
          <button id="copy-server-banner-url-btn" class="copy-btn">Copy Banner URL</button>
          <button id="copy-server-banner-image-btn" class="copy-btn">Copy Banner Image</button>
        </div>
      `;
    }

    resultBox.innerHTML = html;
    
    if (iconUrl) {
        addCopyListener('copy-server-icon-url-btn', iconUrl);
        addCopyListener('copy-server-icon-image-btn', iconUrl, true);
    }
    if (bannerUrl) {
        addCopyListener('copy-server-banner-url-btn', bannerUrl);
        addCopyListener('copy-server-banner-image-btn', bannerUrl, true);
    }
  }

  // Switch popup UI to tool interface
  function switchToToolInterface(toolName) {
    const popup = document.getElementById(TOOLKIT_POPUP_ID);
    if (!popup) return;

    const headerBack = popup.querySelector('.back-btn');
    const title = popup.querySelector('#toolkit-popup-title');
    const body = popup.querySelector('#toolkit-popup-body');
    const toolList = body.querySelector('.tool-list');
    const toolInterface = body.querySelector('.tool-interface');

    headerBack.style.display = 'inline-block';
    title.textContent = toolName === 'copy-avatar' ? 'Copy Avatar' : 'Server Lookup';
    toolList.style.display = 'none';
    toolInterface.style.display = 'block';
    toolInterface.innerHTML = toolName === 'copy-avatar' ? buildCopyAvatarUI() : buildServerLookupUI();
    
    body.scrollTop = 0; // Scroll to top when switching tools

    // Add form submit listeners
    if (toolName === 'copy-avatar') {
      document.getElementById('copy-avatar-form').addEventListener('submit', e => {
        e.preventDefault();
        const userId = e.target.querySelector('#user-id-input').value.trim();
        if (userId) handleCopyAvatar(userId);
      });
    } else if (toolName === 'server-lookup') {
      document.getElementById('server-lookup-form').addEventListener('submit', e => {
        e.preventDefault();
        const serverId = e.target.querySelector('#server-id-input').value.trim();
        if (serverId) handleServerLookup(serverId);
      });
    }
  }

  // Setup popup events
  function setupPopupEvents() {
    const popup = document.getElementById(TOOLKIT_POPUP_ID);
    if (!popup) return;

    const backBtn = popup.querySelector('.back-btn');
    const toolButtons = popup.querySelectorAll('.tool-btn');

    backBtn.addEventListener('click', () => resetPopupToMenu());
    backBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        resetPopupToMenu();
      }
    });

    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => switchToToolInterface(btn.dataset.tool));
      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchToToolInterface(btn.dataset.tool);
        }
      });
    });
  }

  // Initialize extension UI and events
  function init() {
    const icon = createToolkitIcon();
    const popup = createPopup();
    setupPopupEvents();

    icon.addEventListener('click', e => {
      e.stopPropagation();
      togglePopup(popup.style.display !== 'flex');
    });

    icon.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePopup(popup.style.display !== 'flex');
      }
    });

    document.addEventListener('click', () => togglePopup(false));
    popup.addEventListener('click', e => e.stopPropagation());
  }

  // Wait for DOM ready
  const readyCheck = setInterval(() => {
    if (document.body) {
      clearInterval(readyCheck);
      init();
    }
  }, 250);
})();