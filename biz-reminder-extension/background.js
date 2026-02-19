chrome.alarms.create('notifyAlarm', { delayInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'notifyAlarm') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Test Notification',
      message: 'Det här är en automatisk notifiering efter 60 sekunder.',
      priority: 2
    });
  }
});
