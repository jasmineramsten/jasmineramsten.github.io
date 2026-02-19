const token = 'DIN_SPOTIFY_TOKEN_HÄR'; // Ersätt med token

async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    method,
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}

async function getTopTracks() {
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
  )).items;
}

async function showTracks() {
  const tracksContainer = document.getElementById('tracks');
  try {
    const topTracks = await getTopTracks();
    tracksContainer.innerHTML = topTracks.map(
      ({ name, artists }) =>
        `<div class="track">
          <strong>${name}</strong><br>
          <span class="artist">${artists.map(a => a.name).join(', ')}</span>
        </div>`
    ).join('');
  } catch (err) {
    tracksContainer.innerHTML = 'Kunde inte hämta låtar. Kontrollera token.';
    console.error(err);
  }
}

showTracks();
