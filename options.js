// 加载设置
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['defaultMinutes', 'notification'], (result) => {
    document.getElementById('defaultMinutes').value = result.defaultMinutes || 30;
    document.getElementById('notification').checked = result.notification !== undefined ? result.notification : true;
  });

  // 保存设置
  document.getElementById('saveBtn').addEventListener('click', () => {
    const defaultMinutes = parseInt(document.getElementById('defaultMinutes').value);
    const notification = document.getElementById('notification').checked;

    if (isNaN(defaultMinutes) || defaultMinutes < 1 || defaultMinutes > 1440) {
      showStatus('请输入1-1440之间的分钟数', 'error');
      return;
    }

    chrome.storage.sync.set({
      defaultMinutes: defaultMinutes,
      notification: notification
    }, () => {
      showStatus('设置已保存', 'success');
    });
  });
});

// 显示状态消息
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  // 3秒后隐藏消息
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}