let currentAudio = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchInitialTrends();
  document.getElementById('search-btn').addEventListener('click', performAnalysis);
});

async function fetchInitialTrends() {
  const url = "https://itunes.apple.com/se/rss/topsongs/limit=10/json";
  try {
    const res = await fetch(url);
    const data = await res.json();
    const list = document.getElementById('itunes-list');
    list.innerHTML = "";

    data.feed.entry.forEach(song => {
      const previewUrl = song.link.find(l => l.attributes.rel === 'enclosure')?.attributes.href;
      
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="flex: 1;">
          <div style="font-weight:600; font-size:0.85rem;">${song['im:name'].label}</div>
          <div class="itunes-artist">${song['im:artist'].label}</div>
        </div>
        <button class="play-btn" data-url="${previewUrl}">▶</button>
      `;
      list.appendChild(li);
    });

    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        
        if (currentAudio && currentAudio.src === url) {
          currentAudio.pause();
          currentAudio = null;
          this.textContent = "▶";
          this.classList.remove('playing');
        } else {
          if (currentAudio) {
            currentAudio.pause();
            document.querySelectorAll('.play-btn').forEach(b => {
                b.textContent = "▶";
                b.classList.remove('playing');
            });
          }
          currentAudio = new Audio(url);
          currentAudio.play();
          this.textContent = "⏸";
          this.classList.add('playing');
          currentAudio.onended = () => {
            this.textContent = "▶";
            this.classList.remove('playing');
          };
        }
      });
    });
  } catch (e) { console.error(e); }
}

function performAnalysis() {
  const query = document.getElementById('query').value;
  if(!query) return;
  document.getElementById('results').style.display = 'block';
  const growth = Math.floor(Math.random() * 150) + 20;
  
  document.getElementById('analysis-content').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span>"${query}"</span>
      <span class="trend-percent">+${growth}%</span>
    </div>
    <button id="detail-btn" style="width:100%; margin-top:10px; background:#f1f0ff; color:#6c5ce7; border:none; padding:5px; border-radius:5px; cursor:pointer; font-size:0.7rem;">Se på Google Trends ↗</button>
  `;

  document.getElementById('detail-btn').onclick = () => {
    chrome.tabs.create({ url: `https://trends.google.com/trends/explore?date=now%207-d&geo=SE&q=${encodeURIComponent(query)}` });
  };
}