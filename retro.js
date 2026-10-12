const retroGames = [
  { name: 'Work at a Pizza Place', genre: 'Roleplay', players: 1842, image: 'photo-1555396273-367ea4eb4db5', alt: 'Busy neighborhood restaurant' },
  { name: 'Natural Disaster Survival', genre: 'Survival', players: 1328, image: 'photo-1500530855697-b586d89ba3ee', alt: 'Dramatic open landscape' },
  { name: 'Hide and Seek Extreme', genre: 'Adventure', players: 967, image: 'photo-1519681393784-d120267933ba', alt: 'Mountain beneath a starry night sky' },
  { name: 'Theme Park Tycoon 2', genre: 'Tycoon', players: 814, image: 'photo-1513883049090-d0b7439799bf', alt: 'Colorful amusement park rides' },
  { name: 'Murder Mystery 2', genre: 'Survival', players: 753, image: 'photo-1519608487953-e999c86e7455', alt: 'Twilight over a misty mountain lake' },
  { name: 'Speed Run 4', genre: 'Obby', players: 642, image: 'photo-1492684223066-81342ee5ff30', alt: 'Colorful lights at a lively event' },
  { name: 'Build to Survive', genre: 'Building', players: 428, image: 'photo-1470252649378-9c29740c9fa8', alt: 'Green hills in warm morning sunlight' },
  { name: 'Dragon Adventures', genre: 'Adventure', players: 359, image: 'photo-1464822759023-fed622ff2c3b', alt: 'Clouds gathering around a mountain' },
  { name: 'Fashion Famous', genre: 'Roleplay', players: 294, image: 'photo-1490481651871-ab68de25d43d', alt: 'Colorful outfits and accessories' },
  { name: 'Treasure Hunt Simulator', genre: 'Adventure', players: 213, image: 'photo-1500534623283-312aade485b7', alt: 'Open trail through sunlit hills' },
  { name: 'MeepCity', genre: 'Social', players: 186, image: 'photo-1470770841072-f978cf4d019e', alt: 'Peaceful landscape around a lake' },
  { name: 'Speed Draw', genre: 'Social', players: 147, image: 'photo-1513364776144-60967b0f800f', alt: 'Colorful art supplies on a studio table' }
];

const retroUsers = [
  { name: 'Builderman', status: 'Online', online: true, shirt: '#4684bf' },
  { name: 'skaterboy2015', status: 'Playing Work at a Pizza Place', online: true, shirt: '#598b49' },
  { name: 'PinkPixel', status: 'Online', online: true, shirt: '#c36c92' },
  { name: 'blocky_blox', status: 'Last online 2h ago', online: false, shirt: '#66569b' },
  { name: 'xXDragonFanXx', status: 'Playing a game', online: true, shirt: '#be493c' },
  { name: 'LegoBuilder54', status: 'Online', online: true, shirt: '#cf982a' },
  { name: 'coolcat444', status: 'Last online yesterday', online: false, shirt: '#489d96' },
  { name: 'StarryNight', status: 'Playing Hide and Seek Extreme', online: true, shirt: '#566aab' },
  { name: 'HappyCamper', status: 'Online', online: true, shirt: '#c56b4f' },
  { name: 'Robloxian2016', status: 'Last online 1h ago', online: false, shirt: '#676d76' },
  { name: 'PixelPilot', status: 'Online', online: true, shirt: '#4983a0' },
  { name: 'Mango_Muffin', status: 'Online', online: true, shirt: '#d58c43' }
];

let currentRoute = 'home';
let gameCategory = 'All';
let gameSearch = '';
let gameSort = 'popular';
let userSearch = '';
const basePath = location.pathname.replace(/(?:home|games|users)\/?$/, '') || '/';

function avatarMarkup(color = '#4684bf') {
  return `<span class="classic-avatar" aria-hidden="true"><i class="head"></i><i class="torso" style="background:${color};border-color:${color}"></i><i class="leg left"></i><i class="leg right"></i></span>`;
}

function gameMarkup(game, index) {
  return `<article class="classic-game"><a class="classic-game-image" href="${basePath}games/" data-retro-play="${game.name}"><img src="https://images.unsplash.com/${game.image}?auto=format&fit=crop&w=480&q=75" alt="${game.alt}" loading="lazy"></a><a class="classic-game-name" href="${basePath}games/" data-retro-play="${game.name}">${game.name}</a><div class="classic-game-meta"><span>${game.genre}</span><span class="classic-online">${game.players.toLocaleString()} playing</span></div></article>`;
}

function userMarkup(user, index) {
  return `<article class="classic-user">${avatarMarkup(user.shirt)}<a class="classic-user-name" href="#user-${index}" data-user-name="${user.name.toLowerCase()}">${user.name}</a><div class="classic-user-status ${user.online ? 'online' : ''}">${user.status}</div><button type="button" class="classic-button secondary" data-retro-friend="${index}">Add Friend</button></article>`;
}

function filteredGames() {
  const search = gameSearch.trim().toLowerCase();
  const results = retroGames.filter((game) => (gameCategory === 'All' || game.genre === gameCategory) && (!search || `${game.name} ${game.genre}`.toLowerCase().includes(search)));
  if (gameSort === 'popular') results.sort((a, b) => b.players - a.players);
  if (gameSort === 'alphabetical') results.sort((a, b) => a.name.localeCompare(b.name));
  if (gameSort === 'newest') results.reverse();
  return results;
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
  const sorted = [...retroGames].sort((a, b) => b.players - a.players);
  renderGameGrid(document.querySelector('[data-home-games]'), sorted.slice(0, 8));
  renderGameGrid(document.querySelector('[data-home-popular]'), [...sorted].reverse().slice(0, 4));
  document.querySelector('[data-friend-list]').innerHTML = retroUsers.filter((user) => user.online).slice(0, 5).map((user) => `<div class="classic-friend">${avatarMarkup(user.shirt)}<a href="${basePath}users/" data-retro-user-search="${user.name}">${user.name}</a><span>Online</span></div>`).join('');
}

function renderGamesPage() {
  const results = filteredGames();
  renderGameGrid(document.querySelector('[data-games-grid]'), results);
  document.querySelector('[data-game-results]').textContent = `${results.length} games`;
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

document.querySelector('[data-games-sort]').addEventListener('change', (event) => { gameSort = event.target.value; renderGamesPage(); });
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