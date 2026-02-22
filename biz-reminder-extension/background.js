
// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "notify") {
    showNotification();
  }
});

function showNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png', // We will use a placeholder or you can add a real PNG
    title: 'Urgent Tax Reminder!',
    message: 'The Q2 Estimated Tax deadline is approaching. Click to view forms.',
    priority: 2
  });
}

// When the user clicks the notification, open the IRS website
chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: "https://www.irs.gov/payments" });
});