const retroGames = [
  { name: 'Baseplate', genre: 'Building', alt: 'Green studded building baseplate' }
];

const retroUsers = [
  { name: 'Builderman', status: 'Online', online: true, shirt: '#4684bf' },
  { name: 'skaterboy2015', status: 'Playing Baseplate', online: true, shirt: '#598b49' },
  { name: 'PinkPixel', status: 'Online', online: true, shirt: '#c36c92' },
  { name: 'blocky_blox', status: 'Last online 2h ago', online: false, shirt: '#66569b' },
  { name: 'xXDragonFanXx', status: 'Playing Baseplate', online: true, shirt: '#be493c' },
  { name: 'LegoBuilder54', status: 'Online', online: true, shirt: '#cf982a' },
  { name: 'coolcat444', status: 'Last online yesterday', online: false, shirt: '#489d96' },
  { name: 'StarryNight', status: 'Playing Baseplate', online: true, shirt: '#566aab' },
  { name: 'HappyCamper', status: 'Online', online: true, shirt: '#c56b4f' },
  { name: 'Robloxian2016', status: 'Last online 1h ago', online: false, shirt: '#676d76' },
  { name: 'PixelPilot', status: 'Online', online: true, shirt: '#4983a0' },
  { name: 'Mango_Muffin', status: 'Online', online: true, shirt: '#d58c43' }
];

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
  return `<article class="classic-user">${avatarMarkup(user.shirt)}<a class="classic-user-name" href="#user-${index}" data-user-name="${user.name.toLowerCase()}">${user.name}</a><div class="classic-user-status ${user.online ? 'online' : ''}">${user.status}</div><button type="button" class="classic-button secondary" data-retro-friend="${index}">Add Friend</button></article>`;
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
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderHome() {
  renderGameGrid(document.querySelector('[data-home-games]'), retroGames);
  document.querySelector('[data-friend-list]').innerHTML = retroUsers.filter((user) => user.online).slice(0, 5).map((user) => `<div class="classic-friend">${avatarMarkup(user.shirt)}<a href="${basePath}users/" data-retro-user-search="${user.name}">${user.name}</a><span>Online</span></div>`).join('');
}

function renderGamesPage() {
  const results = filteredGames();
  renderGameGrid(document.querySelector('[data-games-grid]'), results);
  document.querySelector('[data-game-results]').textContent = `${results.length} ${results.length === 1 ? 'game' : 'games'}`;
}

function renderUsersPage() {
  const query = userSearch.trim().toLowerCase();
  const results = retroUsers.filter((user) => !query || user.name.toLowerCase().includes(query));
  document.querySelector('[data-users-grid]').innerHTML = results.length ? results.map(userMarkup).join('') : '<div class="classic-empty">No users found. Check the spelling and try again.</div>';
  document.querySelector('[data-user-results]').textContent = `${results.length} users`;
}

renderHome();
renderGamesPage();
renderUsersPage();
showRoute(location.pathname.match(/\/(home|games|users)\/?$/)?.[1] || 'home');

document.addEventListener('click', (event) => {
  const routeLink = event.target.closest('[data-retro-route]');
  if (routeLink) {
    event.preventDefault();
    showRoute(routeLink.dataset.retroRoute, true);
    return;
  }
  const categoryButton = event.target.closest('[data-game-category]');
  if (categoryButton) {
    gameCategory = categoryButton.dataset.gameCategory;
    document.querySelectorAll('[data-game-category]').forEach((button) => button.classList.toggle('is-current', button === categoryButton));
    renderGamesPage();
    return;
  }
  const playLink = event.target.closest('[data-retro-play]');
  if (playLink) {
    event.preventDefault();
    showRoute('games', true);
    window.alert(`${playLink.dataset.retroPlay}\n\nGame launch will be available when Crafblox is connected to the Roblox platform.`);
    return;
  }
  const friendButton = event.target.closest('[data-retro-friend]');
  if (friendButton) {
    const user = retroUsers[Number(friendButton.dataset.retroFriend)];
    friendButton.textContent = 'Request Sent';
    friendButton.disabled = true;
    friendButton.classList.remove('secondary');
    friendButton.setAttribute('aria-label', `Friend request sent to ${user.name}`);
    return;
  }
  const suggestedUser = event.target.closest('[data-retro-user-search]');
  if (suggestedUser) {
    event.preventDefault();
    showRoute('users', true);
    document.querySelector('[data-users-search]').value = suggestedUser.dataset.retroUserSearch;
    userSearch = suggestedUser.dataset.retroUserSearch;
    renderUsersPage();
  }
});

document.querySelector('[data-classic-search]').addEventListener('submit', (event) => {
  event.preventDefault();
  gameSearch = document.querySelector('[data-classic-search-input]').value;
  showRoute('games', true);
  renderGamesPage();
});
document.querySelector('[data-users-search]').addEventListener('input', (event) => { userSearch = event.target.value; renderUsersPage(); });
document.querySelector('[data-users-search-form]').addEventListener('submit', (event) => { event.preventDefault(); userSearch = document.querySelector('[data-users-search]').value; renderUsersPage(); });
document.querySelector('[data-classic-search-input]').addEventListener('input', (event) => { gameSearch = event.target.value; });
window.addEventListener('popstate', () => showRoute(location.pathname.match(/\/(home|games|users)\/?$/)?.[1] || 'home'));