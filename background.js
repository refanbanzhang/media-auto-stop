// 存储倒计时信息
let countdown = {
  isRunning: false,
  startTime: 0,
  duration: 0,
  alarmName: 'mediaAutoStop'
};

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  // 设置默认选项
  chrome.storage.sync.set({
    defaultMinutes: 30,
    notification: true
  });
});

// 监听闹钟事件
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === countdown.alarmName) {
    stopAllMedia();
    countdown.isRunning = false;
    updateBadge();

    // 通知用户
    chrome.storage.sync.get(['notification'], (result) => {
      if (result.notification) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: '媒体自动停止',
          message: '倒计时结束，已停止所有标签页中的媒体播放'
        });
      }
    });
  }
});

// 停止所有标签页中的媒体
async function stopAllMedia() {
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    // 检查URL是否可以注入脚本
    if (tab.id && tab.url && isInjectableUrl(tab.url)) {
      // 向标签页注入脚本停止媒体
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          document.querySelectorAll('video, audio').forEach(media => {
            if (!media.paused) {
              media.pause();
              media.currentTime = 0;
            }
          });
        }
      }).catch(error => {
        console.error(`Failed to inject script into tab ${tab.id}:`, error);
      });
    }
  });
}

// 检查URL是否可以注入脚本
function isInjectableUrl(url) {
  // 检查是否是Chrome内部页面或其他特殊页面
  return url &&
    !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.startsWith('chrome-search://') &&
    !url.startsWith('chrome-devtools://') &&
    !url.startsWith('devtools://') &&
    !url.startsWith('about:') &&
    !url.startsWith('edge://') &&  // 为Edge浏览器添加的
    !url.startsWith('brave://');   // 为Brave浏览器添加的
}

// 更新扩展图标上的徽章
function updateBadge() {
  if (countdown.isRunning) {
    const remainingSeconds = Math.max(0, Math.floor((countdown.startTime + countdown.duration - Date.now()) / 1000));
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    chrome.action.setBadgeText({ text: `${minutes}:${seconds.toString().padStart(2, '0')}` });
    chrome.action.setBadgeBackgroundColor({ color: '#FF4500' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// 每秒更新徽章显示
setInterval(() => {
  if (countdown.isRunning) {
    updateBadge();
  }
}, 1000);

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCountdown') {
    const { minutes } = message;
    const duration = minutes * 60 * 1000; // 转换为毫秒

    // 清除之前的闹钟
    chrome.alarms.clear(countdown.alarmName);

    // 设置新闹钟
    chrome.alarms.create(countdown.alarmName, {
      when: Date.now() + duration
    });

    // 更新倒计时状态
    countdown.isRunning = true;
    countdown.startTime = Date.now();
    countdown.duration = duration;

    // 更新徽章
    updateBadge();

    sendResponse({ success: true });
  } else if (message.action === 'stopCountdown') {
    // 清除闹钟
    chrome.alarms.clear(countdown.alarmName);

    // 更新倒计时状态
    countdown.isRunning = false;

    // 更新徽章
    updateBadge();

    sendResponse({ success: true });
  } else if (message.action === 'getStatus') {
    sendResponse({
      isRunning: countdown.isRunning,
      remainingTime: countdown.isRunning ?
        Math.max(0, Math.floor((countdown.startTime + countdown.duration - Date.now()) / 1000)) : 0
    });
  }
});
