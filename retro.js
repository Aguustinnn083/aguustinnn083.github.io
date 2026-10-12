let currentUser = null;
let friends = [];
let incomingRequests = [];
let outgoingRequests = [];
let currentCommunityView = 'discover';
let authMode = 'signup';
let activeConversation = null;
let lastMessageId = 0;
let messagePoll;
let userSearchTimer;

let currentRoute = 'home';
let gameSearch = '';
let userSearch = '';
const basePath = location.pathname.replace(/(?:home|games|users)\/?$/, '') || '/';

function avatarMarkup(color = '#4684bf') {
  return `<span class="classic-avatar" aria-hidden="true"><i class="head"></i><i class="torso" style="background:${color};border-color:${color}"></i><i class="leg left"></i><i class="leg right"></i></span>`;
}

function gameMarkup(game) {
  return `<article class="classic-game"><a class="classic-game-image classic-baseplate" href="${basePath}games/" data-retro-play="${game.name}" role="img" aria-label="${game.alt}"></a><a class="classic-game-name" href="${basePath}games/" data-retro-play="${game.name}">${game.name}</a><div class="classic-game-meta"><span>${game.genre}</span><span class="classic-online">Click to play</span></div></article>`;
}

function userMarkup(user, index) {
  const friend = friends.some((item) => item.id === user.id);
  const outgoing = outgoingRequests.some((item) => item.recipientId === user.id);
  const incoming = incomingRequests.find((item) => item.requesterId === user.id);
  let actions;
  if (friend) {
    actions = `<button type="button" class="classic-button" data-chat-user="${user.id}" data-chat-name="${user.username}">Message</button><button type="button" class="classic-button secondary" data-friend-remove="${user.id}">Remove Friend</button>`;
  } else if (incoming) {
    actions = `<button type="button" class="classic-button" data-request-action="accept" data-request-id="${incoming.id}">Accept Request</button>`;
  } else if (outgoing) {
    actions = '<button type="button" class="classic-button secondary" disabled>Request Sent</button>';
  } else {
    actions = `<button type="button" class="classic-button" data-friend-request="${user.id}">Add Friend</button>`;
  }
  return `<article class="classic-user">${avatarMarkup('#4684bf')}<a class="classic-user-name" href="#user-${user.id}">${user.username}</a><div class="classic-user-status ${user.online ? 'online' : ''}">${user.online ? 'Online' : 'Offline'}</div><div class="classic-user-actions">${actions}</div><details class="classic-user-safety"><summary>More</summary><button type="button" data-user-action="block" data-user-id="${user.id}" data-user-name="${user.username}">Block</button><button type="button" data-user-action="report" data-user-id="${user.id}" data-user-name="${user.username}">Report</button></details></article>`;
}

async function api(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(endpoint, { ...options, headers, credentials: 'same-origin' });
  let data = {};
  try { data = await response.json(); } catch { /* Empty responses are allowed. */ }
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

function filteredGames() {
  const search = gameSearch.trim().toLowerCase();
  return retroGames.filter((game) => !search || `${game.name} ${game.genre}`.toLowerCase().includes(search));
}

function renderGameGrid(container, list) {
  container.innerHTML = list.length ? list.map(gameMarkup).join('') : '<div class="classic-empty">No games found. Try another search.</div>';
}

function syncNav() {
  document.querySelectorAll('[data-retro-route]').forEach((link) => {
    const active = link.dataset.retroRoute === currentRoute;
    link.classList.toggle('is-current', active);
    if (link.matches('.classic-side-nav a')) link.classList.toggle('is-current', active);
    link.href = `${basePath}${link.dataset.retroRoute}/`;
  });
  document.querySelector('[data-classic-breadcrumb]').textContent = { home: 'Home', games: 'Games', users: 'Users' }[currentRoute];
  document.title = `${currentRoute === 'users' ? 'Users' : currentRoute[0].toUpperCase() + currentRoute.slice(1)} - Crafblox`;
}

function showRoute(name, updateHistory = false) {
  currentRoute = ['home', 'games', 'users'].includes(name) ? name : 'home';
  document.querySelectorAll('[data-retro-page]').forEach((page) => { page.hidden = page.dataset.retroPage !== currentRoute; });
  syncNav();
  if (updateHistory) history.pushState(null, '', `${basePath}${currentRoute}/`);
  if (currentRoute === 'users' && currentUser) void refreshCommunity();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderHome() {
  renderGameGrid(document.querySelector('[data-home-games]'), retroGames);
  void renderFriendSidebar();
}

function renderGamesPage() {
  const results = filteredGames();
  renderGameGrid(document.querySelector('[data-games-grid]'), results);
  document.querySelector('[data-game-results]').textContent = `${results.length} ${results.length === 1 ? 'game' : 'games'}`;
}

async function renderUsersPage() {
  const query = userSearch.trim().toLowerCase();
  if (!currentUser) {
    document.querySelector('[data-users-grid]').innerHTML = '<div class="classic-empty">Sign in to find people and send friend requests.</div>';
    document.querySelector('[data-user-results]').textContent = '';
    return;
  }
  try {
    const result = await api(`/api/users?search=${encodeURIComponent(query)}`);
    document.querySelector('[data-users-grid]').innerHTML = result.users.length
      ? result.users.map(userMarkup).join('')
      : '<div class="classic-empty">No users found. Check the spelling and try again.</div>';
    document.querySelector('[data-user-results]').textContent = `${result.users.length} users`;
  } catch (cause) {
    setFeedback(cause.message, true);
  }
}

function setFeedback(message, isError = false) {
  const feedback = document.querySelector('[data-social-feedback]');
  feedback.textContent = message;
  feedback.classList.toggle('is-error', isError);
  feedback.hidden = !message;
  if (message) window.setTimeout(() => { feedback.hidden = true; }, 5000);
}

function escapeText(text) {
  return String(text).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function setCommunityView(view) {
  currentCommunityView = view;
  document.querySelectorAll('[data-community-view]').forEach((button) => {
    const selected = button.dataset.communityView === view;
    button.classList.toggle('is-current', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  document.querySelectorAll('[data-community-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.communityPanel !== view;
  });
  if (currentUser) void refreshCommunity();
}

async function renderFriendSidebar() {
  const sidebar = document.querySelector('[data-friend-list]');
  if (!currentUser) {
    sidebar.innerHTML = '<span class="classic-muted-link">Sign in to see friends.</span>';
    return;
  }
  try {
    const result = await api('/api/friends');
    sidebar.innerHTML = result.friends.length
      ? result.friends.filter((friend) => friend.online).slice(0, 6).map((friend) => `<div class="classic-friend">${avatarMarkup('#4684bf')}<a href="${basePath}users/" data-open-chat="${friend.id}" data-chat-name="${escapeText(friend.username)}">${escapeText(friend.username)}</a><span>Online</span></div>`).join('') || '<span class="classic-muted-link">No friends online.</span>'
      : '<span class="classic-muted-link">No friends yet.</span>';
  } catch {
    sidebar.innerHTML = '<span class="classic-muted-link">Could not load friends.</span>';
  }
}

function renderFriendCards() {
  const container = document.querySelector('[data-friends-grid]');
  container.innerHTML = friends.length ? friends.map((friend) => `<article class="classic-user">${avatarMarkup('#4684bf')}<strong class="classic-user-name">${escapeText(friend.username)}</strong><div class="classic-user-status ${friend.online ? 'online' : ''}">${friend.online ? 'Online' : 'Offline'}</div><div class="classic-user-actions"><button type="button" class="classic-button" data-chat-user="${friend.id}" data-chat-name="${escapeText(friend.username)}">Message</button><button type="button" class="classic-button secondary" data-friend-remove="${friend.id}">Remove Friend</button></div></article>`).join('') : '<div class="classic-empty">You have no friends yet. Find someone to build with!</div>';
  document.querySelector('[data-friends-count]').textContent = String(friends.length);
}

function renderRequests() {
  const incoming = document.querySelector('[data-incoming-requests]');
  const outgoing = document.querySelector('[data-outgoing-requests]');
  incoming.innerHTML = incomingRequests.length ? incomingRequests.map((request) => `<article class="classic-user"><strong class="classic-user-name">${escapeText(request.requesterUsername)}</strong><div class="classic-user-status">Wants to be your friend</div><div class="classic-user-actions"><button type="button" class="classic-button" data-request-action="accept" data-request-id="${request.id}">Accept</button><button type="button" class="classic-button secondary" data-request-action="decline" data-request-id="${request.id}">Decline</button></div></article>`).join('') : '<div class="classic-empty">No incoming requests.</div>';
  outgoing.innerHTML = outgoingRequests.length ? outgoingRequests.map((request) => `<article class="classic-user"><strong class="classic-user-name">${escapeText(request.recipientUsername)}</strong><div class="classic-user-status">Friend request sent</div><div class="classic-user-actions"><button type="button" class="classic-button secondary" data-request-cancel="${request.id}">Cancel Request</button></div></article>`).join('') : '<div class="classic-empty">No sent requests.</div>';
  document.querySelector('[data-requests-count]').textContent = String(incomingRequests.length);
}

async function refreshCommunity() {
  if (!currentUser) return;
  try {
    const [friendResult, requestResult] = await Promise.all([api('/api/friends'), api('/api/friend-requests')]);
    friends = friendResult.friends;
    incomingRequests = requestResult.incoming;
    outgoingRequests = requestResult.outgoing;
    renderFriendCards();
    renderRequests();
    await Promise.all([renderUsersPage(), renderFriendSidebar()]);
  } catch (cause) {
    setFeedback(cause.message, true);
  }
}

function persistUser(user) {
  if (!user) {
    window.localStorage.removeItem('crafblox_user');
    return;
  }
  window.localStorage.setItem('crafblox_user', JSON.stringify(user));
}

function updateAccount(user) {
  currentUser = user;
  persistUser(user);
  document.querySelector('[data-signed-out]').hidden = Boolean(user);
  document.querySelector('[data-signed-in]').hidden = !user;
  document.querySelector('[data-current-username]').textContent = user?.username || '';
  document.querySelector('[data-sidebar-username]').textContent = user?.username || 'Guest';
  document.querySelector('[data-sidebar-welcome]').textContent = user ? 'Welcome back!' : 'Sign in to save your account.';
  if (user) void refreshCommunity();
  else {
    friends = [];
    incomingRequests = [];
    outgoingRequests = [];
    void renderFriendSidebar();
    void renderUsersPage();
    renderFriendCards();
    renderRequests();
  }
}

function openAuth(mode = 'signup') {
  authMode = mode;
  const dialog = document.querySelector('[data-auth-dialog]');
  const isSignup = mode === 'signup';
  const confirmInput = document.querySelector('[data-auth-confirm-password] input');
  document.querySelector('#auth-dialog-title').textContent = isSignup ? 'Create your account' : 'Log in to Crafblox';
  document.querySelector('[data-auth-submit]').textContent = isSignup ? 'Create Account' : 'Log In';
  document.querySelector('[data-auth-confirm-password]').hidden = !isSignup;
  confirmInput.required = isSignup;
  confirmInput.value = '';
  document.querySelector('[data-auth-switch-prompt]').textContent = isSignup ? 'Already registered?' : 'New to Crafblox?';
  document.querySelector('[data-auth-switch]').textContent = isSignup ? 'Log In' : 'Sign Up';
  document.querySelector('[data-auth-error]').hidden = true;
  if (!dialog.open) dialog.showModal();
}

function appendMessages(messages) {
  const list = document.querySelector('[data-message-list]');
  if (!messages.length && lastMessageId === 0) {
    list.innerHTML = '<p class="classic-message-empty">No messages yet. Say hello!</p>';
    return;
  }
  const empty = list.querySelector('.classic-message-empty');
  if (empty) empty.remove();
  messages.forEach((message) => {
    if (message.id <= lastMessageId) return;
    lastMessageId = message.id;
    const item = document.createElement('article');
    item.className = `classic-message${message.senderId === currentUser.id ? ' is-mine' : ''}`;
    const heading = document.createElement('strong');
    heading.textContent = message.senderUsername;
    const text = document.createElement('p');
    text.textContent = message.body;
    item.append(heading, text);
    list.append(item);
  });
  list.scrollTop = list.scrollHeight;
}

async function loadConversation() {
  if (!activeConversation || !document.querySelector('[data-chat-dialog]').open) return;
  try {
    const result = await api(`/api/messages/${activeConversation.id}?after=${lastMessageId}`);
    appendMessages(result.messages);
  } catch (cause) {
    document.querySelector('[data-chat-error]').textContent = cause.message;
    document.querySelector('[data-chat-error]').hidden = false;
    window.clearInterval(messagePoll);
  }
}

async function openConversation(id, username) {
  activeConversation = { id: Number(id), username };
  lastMessageId = 0;
  const list = document.querySelector('[data-message-list]');
  list.innerHTML = '';
  document.querySelector('#chat-title').textContent = `Chat with ${username}`;
  document.querySelector('[data-chat-error]').hidden = true;
  document.querySelector('[data-chat-dialog]').showModal();
  await loadConversation();
  window.clearInterval(messagePoll);
  messagePoll = window.setInterval(loadConversation, 2500);
  document.querySelector('[data-message-form] input').focus();
}

async function initialize() {
  renderHome();
  renderGamesPage();
  showRoute(location.pathname.match(/\/(home|games|users)\/?$/)?.[1] || 'home');
  try {
    const result = await api('/api/me');
    updateAccount(result.user);
  } catch {
    try {
      const cached = JSON.parse(window.localStorage.getItem('crafblox_user') || 'null');
      if (cached && cached.username) {
        updateAccount(cached);
        return;
      }
    } catch {
      // Ignore invalid cached user state and fall back to signed-out.
    }
    updateAccount(null);
  }
}

void initialize();

document.addEventListener('click', async (event) => {
  const openChat = event.target.closest('[data-open-chat]');
  const messageFriend = event.target.closest('[data-chat-user]');
  if (openChat || messageFriend) {
    event.preventDefault();
    const control = openChat || messageFriend;
    await openConversation(control.dataset.openChat || control.dataset.chatUser, control.dataset.chatName);
    return;
  }

  const authButton = event.target.closest('[data-auth-open]');
  if (authButton) {
    openAuth(authButton.dataset.authOpen);
    return;
  }
  if (event.target.closest('[data-auth-close]')) {
    document.querySelector('[data-auth-dialog]').close();
    return;
  }
  if (event.target.closest('[data-auth-switch]')) {
    openAuth(authMode === 'signup' ? 'login' : 'signup');
    return;
  }
  if (event.target.closest('[data-logout]')) {
    try {
      await api('/api/auth/logout', { method: 'POST' });
      updateAccount(null);
      setFeedback('You are signed out.');
    } catch (cause) {
      updateAccount(null);
      setFeedback(cause.message, true);
    }
    return;
  }

  const routeLink = event.target.closest('[data-retro-route]');
  if (routeLink) {
    event.preventDefault();
    showRoute(routeLink.dataset.retroRoute, true);
    return;
  }
  const communityTab = event.target.closest('[data-community-view]');
  if (communityTab) {
    setCommunityView(communityTab.dataset.communityView);
    return;
  }
  if (event.target.closest('[data-retro-play]')) {
    event.preventDefault();
    showRoute('games', true);
    setFeedback('Baseplate is ready to build in. Game launch requires a Roblox game integration.');
    return;
  }

  const requestButton = event.target.closest('[data-friend-request]');
  if (requestButton) {
    requestButton.disabled = true;
    try {
      await api(`/api/users/${requestButton.dataset.friendRequest}/friend-request`, { method: 'POST', body: '{}' });
      setFeedback('Friend request sent.');
      await refreshCommunity();
    } catch (cause) {
      requestButton.disabled = false;
      setFeedback(cause.message, true);
    }
    return;
  }
  const requestAction = event.target.closest('[data-request-action]');
  if (requestAction) {
    try {
      await api(`/api/friend-requests/${requestAction.dataset.requestId}/${requestAction.dataset.requestAction}`, { method: 'POST', body: '{}' });
      setFeedback(requestAction.dataset.requestAction === 'accept' ? 'Friend request accepted.' : 'Friend request declined.');
      await refreshCommunity();
    } catch (cause) {
      setFeedback(cause.message, true);
    }
    return;
  }
  const cancelRequest = event.target.closest('[data-request-cancel]');
  if (cancelRequest) {
    try {
      await api(`/api/friend-requests/${cancelRequest.dataset.requestCancel}`, { method: 'DELETE' });
      setFeedback('Friend request canceled.');
      await refreshCommunity();
    } catch (cause) {
      setFeedback(cause.message, true);
    }
    return;
  }
  const removeFriend = event.target.closest('[data-friend-remove]');
  if (removeFriend) {
    try {
      await api(`/api/friends/${removeFriend.dataset.friendRemove}`, { method: 'DELETE' });
      setFeedback('Friend removed.');
      await refreshCommunity();
    } catch (cause) {
      setFeedback(cause.message, true);
    }
    return;
  }
  const safetyButton = event.target.closest('[data-user-action]');
  if (safetyButton) {
    const { userId, userName, userAction } = safetyButton.dataset;
    if (userAction === 'block') {
      if (!window.confirm(`Block ${userName}? They will no longer be able to find or message you.`)) return;
      try {
        await api(`/api/users/${userId}/block`, { method: 'POST', body: '{}' });
        setFeedback(`${userName} has been blocked.`);
        await refreshCommunity();
      } catch (cause) {
        setFeedback(cause.message, true);
      }
      return;
    }
    const reason = window.prompt(`Why are you reporting ${userName}?`);
    if (reason === null) return;
    try {
      await api(`/api/users/${userId}/report`, { method: 'POST', body: JSON.stringify({ reason }) });
      setFeedback('Report sent to the Crafblox moderation team.');
    } catch (cause) {
      setFeedback(cause.message, true);
    }
  }
});

document.querySelector('[data-auth-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const username = data.get('username').trim();
  const password = data.get('password');
  const error = document.querySelector('[data-auth-error]');
  if (authMode === 'signup' && password !== data.get('confirmPassword')) {
    error.textContent = 'The passwords do not match.';
    error.hidden = false;
    return;
  }
  const submit = document.querySelector('[data-auth-submit]');
  submit.disabled = true;
  error.hidden = true;
  try {
    const result = await api(`/api/auth/${authMode}`, { method: 'POST', body: JSON.stringify({ username, password }) });
    updateAccount(result.user);
    form.reset();
    document.querySelector('[data-auth-dialog]').close();
    setFeedback(authMode === 'signup' ? 'Your Crafblox account is ready.' : 'Welcome back.');
  } catch (cause) {
    error.textContent = cause.message;
    error.hidden = false;
  } finally {
    submit.disabled = false;
  }
});

document.querySelector('[data-auth-dialog]').addEventListener('close', () => document.querySelector('[data-auth-form]').reset());
document.querySelector('[data-users-search]').addEventListener('input', (event) => {
  userSearch = event.target.value;
  clearTimeout(userSearchTimer);
  userSearchTimer = window.setTimeout(() => { void renderUsersPage(); }, 180);
});
document.querySelector('[data-users-search-form]').addEventListener('submit', (event) => { event.preventDefault(); userSearch = document.querySelector('[data-users-search]').value; void renderUsersPage(); });
document.querySelector('[data-classic-search]').addEventListener('submit', (event) => {
  event.preventDefault();
  gameSearch = document.querySelector('[data-classic-search-input]').value;
  showRoute('games', true);
  renderGamesPage();
});
document.querySelector('[data-classic-search-input]').addEventListener('input', (event) => { gameSearch = event.target.value; });
document.querySelector('[data-message-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeConversation) return;
  const input = event.currentTarget.elements.message;
  const message = input.value.trim();
  if (!message) return;
  const button = event.currentTarget.querySelector('button');
  button.disabled = true;
  try {
    await api(`/api/messages/${activeConversation.id}`, { method: 'POST', body: JSON.stringify({ message }) });
    input.value = '';
    document.querySelector('[data-chat-error]').hidden = true;
    await loadConversation();
    input.focus();
  } catch (cause) {
    const error = document.querySelector('[data-chat-error]');
    error.textContent = cause.message;
    error.hidden = false;
  } finally {
    button.disabled = false;
  }
});
document.querySelector('[data-chat-close]').addEventListener('click', () => document.querySelector('[data-chat-dialog]').close());
document.querySelector('[data-chat-dialog]').addEventListener('close', () => {
  window.clearInterval(messagePoll);
  activeConversation = null;
});
window.setInterval(() => { if (currentUser) void refreshCommunity(); }, 30_000);
window.addEventListener('popstate', () => showRoute(location.pathname.match(/\/(home|games|users)\/?$/)?.[1] || 'home'));