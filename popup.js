document.addEventListener('DOMContentLoaded', () => {
  const minutesInput = document.getElementById('minutes');
  const startBtn = document.getElementById('startBtn');
  const statusDiv = document.getElementById('status');
  const optionsLink = document.getElementById('optionsLink');

  // 加载存储的默认分钟数
  chrome.storage.sync.get(['defaultMinutes'], (result) => {
    minutesInput.value = result.defaultMinutes || 30;
  });

  // 检查是否有正在运行的倒计时
  checkStatus();

  // 开始倒计时按钮点击事件
  startBtn.addEventListener('click', () => {
    const minutes = parseInt(minutesInput.value);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      alert('请输入1-1440之间的分钟数');
      return;
    }

    // 保存为默认值
    chrome.storage.sync.set({ defaultMinutes: minutes });

    // 发送消息到后台脚本
    chrome.runtime.sendMessage({
      action: 'startCountdown',
      minutes: minutes
    }, (response) => {
      if (response && response.success) {
        updateStatus(true, minutes * 60);
      }
    });
  });

  // 选项链接点击事件
  optionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  // 检查倒计时状态
  function checkStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      if (response && response.isRunning) {
        updateStatus(true, response.remainingTime);
      } else {
        updateStatus(false);
      }
    });
  }

  // 更新状态显示
  function updateStatus(isRunning, remainingSeconds) {
    if (isRunning) {
      startBtn.textContent = '停止倒计时';
      startBtn.onclick = () => {
        chrome.runtime.sendMessage({ action: 'stopCountdown' }, (response) => {
          if (response && response.success) {
            updateStatus(false);
          }
        });
      };

      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      statusDiv.innerHTML = `<p class="running">倒计时进行中: ${minutes}:${seconds.toString().padStart(2, '0')}</p>`;

      // 每秒更新倒计时显示
      const countdownInterval = setInterval(() => {
        remainingSeconds--;
        if (remainingSeconds <= 0) {
          clearInterval(countdownInterval);
          updateStatus(false);
          return;
        }

        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        statusDiv.innerHTML = `<p class="running">倒计时进行中: ${m}:${s.toString().padStart(2, '0')}</p>`;
      }, 1000);
    } else {
      startBtn.textContent = '开始倒计时';
      startBtn.onclick = () => {
        const minutes = parseInt(minutesInput.value);
        if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
          alert('请输入1-1440之间的分钟数');
          return;
        }

        chrome.storage.sync.set({ defaultMinutes: minutes });

        chrome.runtime.sendMessage({
          action: 'startCountdown',
          minutes: minutes
        }, (response) => {
          if (response && response.success) {
            updateStatus(true, minutes * 60);
          }
        });
      };

      statusDiv.innerHTML = '<p>倒计时未启动</p>';
    }
  }
});
