// Global timer state
let globalTimerState = null;
let globalIsPaused = false;
let globalTimerInterval = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_TIMER') {
    try {
      startSegmentedTimer(msg.total, msg.segment, msg.grace);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error starting timer:', error);
      notify('Timer Error', 'Failed to start timer. Please try again.');
      sendResponse({ success: false });
    }
  } else if (msg.type === 'PAUSE_TIMER') {
    pauseBackgroundTimer();
    sendResponse({ success: true });
  } else if (msg.type === 'RESUME_TIMER') {
    resumeBackgroundTimer();
    sendResponse({ success: true });
  } else if (msg.type === 'STOP_TIMER') {
    stopBackgroundTimer();
    sendResponse({ success: true });
  } else if (msg.type === 'GET_TIMER_STATE') {
    sendResponse({ 
      currentTimer: globalTimerState,
      isPaused: globalIsPaused 
    });
  }
  return true;
});

function startSegmentedTimer(total, segment, grace) {
  // Stop any existing timer
  if (globalTimerInterval) {
    clearInterval(globalTimerInterval);
  }
  
  // Initialize timer state
  globalTimerState = {
    total,
    segment,
    grace,
    fullBlock: segment + grace,
    blocks: Math.floor(total / (segment + grace)),
    remainingTime: total % (segment + grace),
    currentBlock: 0,
    currentTime: segment * 60, // Convert to seconds
    isWorkTime: true,
    startTime: Date.now()
  };
  
  globalIsPaused = false;
  
  // Save to storage
  chrome.storage.local.set({ currentTimer: globalTimerState, isPaused: false });
  
  // Initial notification
  notify('Session Started', `Total ${total} mins | ${segment}-min sets + ${grace}-min breaks | ${globalTimerState.blocks} segments`);
  
  // Start countdown
  startBackgroundCountdown();
}

function startBackgroundCountdown() {
  globalTimerInterval = setInterval(() => {
    if (!globalTimerState || globalIsPaused) return;
    
    globalTimerState.currentTime--;
    
    if (globalTimerState.currentTime <= 0) {
      // Time segment finished
      if (globalTimerState.isWorkTime) {
        // Work time finished, start break
        if (globalTimerState.currentBlock < globalTimerState.blocks - 1 || 
            (globalTimerState.currentBlock === globalTimerState.blocks - 1 && globalTimerState.remainingTime > 0)) {
          globalTimerState.isWorkTime = false;
          globalTimerState.currentTime = globalTimerState.grace * 60;
          notify('Break Time 🕒', `Take ${globalTimerState.grace} minutes to reset.`);
        } else {
          // Timer complete
          notify('Session Complete 🏁', 'All segments done! Great work!');
          stopBackgroundTimer();
          return;
        }
      } else {
        // Break time finished, start next work segment
        globalTimerState.currentBlock++;
        globalTimerState.isWorkTime = true;
        
        if (globalTimerState.currentBlock >= globalTimerState.blocks) {
          // All segments done
          if (globalTimerState.remainingTime > 0) {
            // Final segment with remaining time
            globalTimerState.currentTime = globalTimerState.remainingTime * 60;
            notify('Final Segment', `Go for ${globalTimerState.remainingTime} minutes!`);
          } else {
            // Timer complete
            notify('Session Complete 🏁', 'All segments done! Great work!');
            stopBackgroundTimer();
            return;
          }
        } else {
          globalTimerState.currentTime = globalTimerState.segment * 60;
          notify(`Segment ${globalTimerState.currentBlock + 1} of ${globalTimerState.blocks}`, `Go for ${globalTimerState.segment} minutes!`);
        }
      }
    }
    
    // Save state every 10 seconds
    if (globalTimerState.currentTime % 10 === 0) {
      chrome.storage.local.set({ currentTimer: globalTimerState, isPaused: globalIsPaused });
    }
  }, 1000);
}

function pauseBackgroundTimer() {
  globalIsPaused = true;
  chrome.storage.local.set({ currentTimer: globalTimerState, isPaused: true });
}

function resumeBackgroundTimer() {
  globalIsPaused = false;
  chrome.storage.local.set({ currentTimer: globalTimerState, isPaused: false });
}

function stopBackgroundTimer() {
  if (globalTimerInterval) {
    clearInterval(globalTimerInterval);
    globalTimerInterval = null;
  }
  
  globalTimerState = null;
  globalIsPaused = false;
  
  chrome.storage.local.remove(['currentTimer', 'isPaused']);
}

function notify(title, message) {
  chrome.notifications.create('', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 2
  });
}