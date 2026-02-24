function safeSendMessage(payload) {
  chrome.runtime.sendMessage(payload, () => {
    if (chrome.runtime.lastError) {
      // Ignore when popup isn't open
    }
  });
}

console.log("TalentRadar background loaded");

const ALARM_NAME = "talentRadarFetch";
const FETCH_MINUTES = 30;

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  scheduleAlarm();
  await fetchAndProcess({ notify: false });
});

chrome.runtime.onStartup.addListener(() => {
  scheduleAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await fetchAndProcess({ notify: true });
  }
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  (async () => {
    try {
      if (req?.action === "refreshNow") {
        await fetchAndProcess({ notify: false });
        safeSendMessage({ type: "jobsUpdated" });
        sendResponse({ ok: true });
        return;
      }

      if (req?.action === "testNotify") {
        await chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "TalentRadar test",
          message: "Notifications are working ✅",
          priority: 2
        });
        sendResponse({ ok: true });
        return;
      }

      sendResponse({ ok: true });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || String(err) });
    }
  })();

  return true;
});

chrome.notifications.onClicked.addListener(async () => {
  const { lastNotificationUrl } = await chrome.storage.local.get(["lastNotificationUrl"]);
  if (lastNotificationUrl) {
    chrome.tabs.create({ url: lastNotificationUrl });
  }
});

function scheduleAlarm() {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: FETCH_MINUTES });
}

async function ensureDefaults() {
  const { alertConfig } = await chrome.storage.local.get(["alertConfig"]);
  if (!alertConfig) {
    await chrome.storage.local.set({
      alertConfig: {
        keywords: ["growth", "marketing", "crm", "performance"],
        remoteOnly: true
      }
    });
  }

  const { seenJobKeys } = await chrome.storage.local.get(["seenJobKeys"]);
  if (!seenJobKeys) {
    await chrome.storage.local.set({ seenJobKeys: [] });
  }
}

function matchKeywords(text, keywords) {
  const lower = (text || "").toLowerCase();
  return (keywords || []).some(k => lower.includes(String(k).toLowerCase()));
}

async function fetchRemotive() {
  const res = await fetch("https://remotive.com/api/remote-jobs?category=marketing");
  if (!res.ok) throw new Error("Remotive fetch failed: " + res.status);
  const data = await res.json();

  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
  return jobs.map(j => ({
    key: "remotive_" + j.id,
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location || "Remote",
    url: j.url,
    source: "Remotive",
    text: `${j.title} ${j.company_name} ${j.description || ""}`
  }));
}

async function fetchMuse() {
  const res = await fetch("https://www.themuse.com/api/public/jobs?page=1");
  if (!res.ok) throw new Error("Muse fetch failed: " + res.status);
  const data = await res.json();

  const results = Array.isArray(data?.results) ? data.results : [];
  return results.map(j => ({
    key: "muse_" + j.id,
    title: j.name,
    company: j.company?.name || "Unknown",
    location: j.locations?.[0]?.name || "—",
    url: j.refs?.landing_page || `https://www.themuse.com/jobs/${j.id}`,
    source: "The Muse",
    text: `${j.name} ${j.company?.name || ""} ${j.contents || ""}`
  }));
}

async function fetchAndProcess({ notify }) {
  const { alertConfig, seenJobKeys = [] } =
    await chrome.storage.local.get(["alertConfig", "seenJobKeys"]);

  const keywords = alertConfig?.keywords || [];
  const remoteOnly = !!alertConfig?.remoteOnly;

  let remotive = [];
  let muse = [];

  try { remotive = await fetchRemotive(); } catch (e) { console.warn(e); }
  try { muse = await fetchMuse(); } catch (e) { console.warn(e); }

  let jobs = [...remotive, ...muse];

  if (remoteOnly) {
    jobs = jobs.filter(j => {
      const loc = (j.location || "").toLowerCase();
      return loc.includes("remote") || loc.includes("worldwide") || loc.includes("anywhere") || loc.includes("flexible");
    });
  }

  if (keywords.length > 0) {
    jobs = jobs.filter(j => matchKeywords(j.text, keywords));
  }

  await chrome.storage.local.set({
    cachedJobs: jobs.slice(0, 50),
    lastFetchAt: Date.now()
  });

  if (notify) {
    const newJobs = jobs.filter(j => !seenJobKeys.includes(j.key));

    if (newJobs.length > 0) {
      const top = newJobs[0];

      await chrome.storage.local.set({
        seenJobKeys: [...newJobs.map(j => j.key), ...seenJobKeys].slice(0, 500),
        lastNotificationUrl: top.url
      });

      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "New job match 👀",
        message: `${top.title} — ${top.company}`,
        priority: 2
      });
    }
  }

  safeSendMessage({ type: "jobsUpdated" });
}