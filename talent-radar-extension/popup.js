document.addEventListener("DOMContentLoaded", () => {
  const els = {
    keywords: document.getElementById("keywords"),
    remoteOnly: document.getElementById("remoteOnly"),
    saveBtn: document.getElementById("saveBtn"),
    testBtn: document.getElementById("testBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    jobs: document.getElementById("jobs"),
    lastUpdated: document.getElementById("lastUpdated")
  };

  function normalizeKeywords(str) {
    return (str || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 25);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function fmtTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    return "Updated " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function renderJobs(items) {
    if (!items || items.length === 0) {
      els.jobs.innerHTML = `<div class="muted" style="margin-top:10px;">No matches yet. Try “growth” or “marketing”.</div>`;
      return;
    }

    els.jobs.innerHTML = items.slice(0, 8).map(job => {
      const title = escapeHtml(job.title);
      const company = escapeHtml(job.company || "Unknown");
      const location = escapeHtml(job.location || "—");
      const source = escapeHtml(job.source || "—");

      return `
        <div class="job">
          <p class="title">${title}</p>
          <p class="meta">${company} • ${location} • ${source}</p>
          <div class="linkrow">
            <a class="linkbtn" href="${job.url}" target="_blank" rel="noreferrer">Open job</a>
          </div>
          <div class="small">Source: ${source === "Remotive" ? "Remotive (link back included)" : source}</div>
        </div>
      `;
    }).join("");
  }

  async function loadState() {
    const { alertConfig, cachedJobs, lastFetchAt, lastError } =
      await chrome.storage.local.get(["alertConfig", "cachedJobs", "lastFetchAt", "lastError"]);

    if (alertConfig) {
      els.keywords.value = (alertConfig.keywords || []).join(", ");
      els.remoteOnly.checked = !!alertConfig.remoteOnly;
    }

    if (lastError) {
      els.jobs.innerHTML = `<div class="muted" style="margin-top:10px;"><strong>Error:</strong> ${escapeHtml(lastError)}</div>`;
    } else {
      renderJobs(cachedJobs || []);
    }

    els.lastUpdated.textContent = fmtTime(lastFetchAt);
  }

  els.saveBtn.addEventListener("click", async () => {
    const keywords = normalizeKeywords(els.keywords.value);
    const remoteOnly = els.remoteOnly.checked;

    await chrome.storage.local.set({ alertConfig: { keywords, remoteOnly } });

    chrome.runtime.sendMessage({ action: "refreshNow" });
    els.saveBtn.textContent = "Saved ✓";
    setTimeout(() => (els.saveBtn.textContent = "Save alert"), 1000);
  });

  els.testBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "testNotify" });
  });

  els.refreshBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "refreshNow" });
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "jobsUpdated" || msg?.type === "jobsError") {
      loadState();
    }
  });

  loadState();
});