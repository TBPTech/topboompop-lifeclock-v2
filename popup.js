// Navigation elements
const toolSelector = document.getElementById('toolSelector');
const viewTitle = document.getElementById('viewTitle');

// View elements
const birthdaySetup = document.getElementById('birthdaySetup');
const lifeClockView = document.getElementById('lifeClockView');
const timerView = document.getElementById('timerView');
const countdownView = document.getElementById('countdownView');
const journalView = document.getElementById('journalView');

// Life clock elements
const birthdayInput = document.getElementById('birthday');
const calcBtn = document.getElementById('calcTime');
const resetBtn = document.getElementById('resetBirthday');
const lived = document.getElementById('lived');
const remaining = document.getElementById('remaining');
const MAX_AGE = 90;

// Journal elements
const journalDate = document.getElementById('journalDate');
const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');
const journalText = document.getElementById('journalText');
const dailyGoal = document.getElementById('dailyGoal');
const gratitude = document.getElementById('gratitude');
const saveJournalBtn = document.getElementById('saveJournalBtn');
const clearJournalBtn = document.getElementById('clearJournalBtn');

// Dream analysis elements
const dreamEntry = document.getElementById('dreamEntry');
const analyzeDreamBtn = document.getElementById('analyzeDreamBtn');
const dreamAnalysis = document.getElementById('dreamAnalysis');
const dreamResults = document.getElementById('dreamResults');

// Journal state
let currentJournalDate = new Date();
let selectedMood = null;

// Timer tracking variables
let currentTimer = null;
let timerInterval = null;
let isPaused = false;
let lifeProgressInterval = null;

// Set max date to today for birthday input
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('birthday').max = today;
});

// Navigation functionality
toolSelector.addEventListener('change', (e) => {
  switchView(e.target.value);
});

function switchView(view) {
  // Hide all views
  const views = [birthdaySetup, lifeClockView, timerView, countdownView, journalView];
  views.forEach(v => v.classList.remove('active'));
  
  switch(view) {
    case 'lifeclock':
      viewTitle.textContent = '🕒 Life Clock';
      // Stop any running intervals when switching views
      if (lifeProgressInterval) {
        clearInterval(lifeProgressInterval);
        lifeProgressInterval = null;
      }
      // Check if birthday is set
      chrome.storage.local.get(['birthday'], (data) => {
        if (data.birthday) {
          showLifeClock(data.birthday);
        } else {
          birthdaySetup.classList.add('active');
        }
      });
      break;
      
    case 'timer':
      viewTitle.textContent = '⏱️ Segmented Timer';
      // Stop life progress animation when switching to timer
      if (lifeProgressInterval) {
        clearInterval(lifeProgressInterval);
        lifeProgressInterval = null;
      }
      // Check if timer is running
      chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' }, (response) => {
        if (response && response.currentTimer && isValidTimer(response.currentTimer)) {
          currentTimer = response.currentTimer;
          isPaused = response.isPaused || false;
          
          if (currentTimer.currentTime > 0 || 
              (currentTimer.currentBlock < currentTimer.blocks - 1) ||
              (currentTimer.currentBlock === currentTimer.blocks - 1 && currentTimer.remainingTime > 0)) {
            
            countdownView.classList.add('active');
            document.getElementById('pauseBtn').style.display = isPaused ? 'none' : 'block';
            document.getElementById('resumeBtn').style.display = isPaused ? 'block' : 'none';
            startCountdown();
          } else {
            timerView.classList.add('active');
          }
        } else {
          timerView.classList.add('active');
        }
      });
      break;
      
    case 'journal':
      viewTitle.textContent = '📝 Daily Journal';
      // Stop life progress animation when switching to journal
      if (lifeProgressInterval) {
        clearInterval(lifeProgressInterval);
        lifeProgressInterval = null;
      }
      loadJournalEntry();
      journalView.classList.add('active');
      break;
  }
}

// Initialize on load
chrome.storage.local.get(['birthday'], (data) => {
  if (data.birthday) {
    toolSelector.value = 'lifeclock';
    switchView('lifeclock');
  } else {
    toolSelector.value = 'lifeclock';
    switchView('lifeclock');
  }
});

function isValidTimer(timer) {
  return timer && 
         typeof timer.total === 'number' && timer.total > 0 &&
         typeof timer.segment === 'number' && timer.segment > 0 &&
         typeof timer.grace === 'number' && timer.grace >= 0 &&
         typeof timer.currentBlock === 'number' && timer.currentBlock >= 0 &&
         typeof timer.currentTime === 'number' && timer.currentTime > 0 &&
         typeof timer.isWorkTime === 'boolean' &&
         timer.currentBlock <= timer.blocks &&
         timer.currentTime >= 0; // Allow 0 for completed segments
}

calcBtn.addEventListener('click', () => {
  const birthdate = birthdayInput.value;
  if (!birthdate) return alert('Please enter your birthday.');
  
  // Validate birthdate
  const birth = new Date(birthdate);
  const now = new Date();
  const ageMs = now - birth;
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  
  // Check if birthdate is in the future
  if (birth > now) {
    alert('Please enter a valid birthdate. You cannot be born in the future!');
    return;
  }
  
  // Check if age exceeds 100 years
  if (ageYears > 100) {
    alert('Please enter a valid birthdate. Age cannot exceed 100 years.');
    return;
  }
  
  chrome.storage.local.set({ birthday: birthdate });
  showLifeClock(birthdate);
});

resetBtn.addEventListener('click', () => {
  chrome.storage.local.remove('birthday');
  birthdaySetup.classList.add('active');
  lifeClockView.classList.remove('active');
});

function showLifeClock(birthdate) {
  // Update countdown immediately
  updateLifeCountdown(birthdate);
  
  // Update animated life progress bar
  updateLifeProgressBar((new Date() - new Date(birthdate)) / (1000 * 60 * 60 * 24 * 365.25));
  
  // Start real-time animation
  startLifeProgressAnimation(birthdate);
  
  birthdaySetup.classList.remove('active');
  lifeClockView.classList.add('active');
}

function updateLifeProgressBar(livedYears) {
  const progressBar = document.getElementById('lifeProgressBar');
  const progressPercent = Math.min((livedYears / MAX_AGE) * 100, 100);
  
  // Update progress bar width
  progressBar.style.width = `${progressPercent}%`;
  
  // Update color based on life stage
  progressBar.className = 'life-progress-bar';
  if (livedYears <= 25) {
    progressBar.classList.add('life-stage-early'); // Green - Youth
  } else if (livedYears <= 50) {
    progressBar.classList.add('life-stage-mid'); // Yellow - Middle age
  } else if (livedYears <= 75) {
    progressBar.classList.add('life-stage-late'); // Red - Senior
  } else {
    progressBar.classList.add('life-stage-final'); // Dark red - Final years
  }
}

function startLifeProgressAnimation(birthdate) {
  // Clear any existing interval
  if (lifeProgressInterval) {
    clearInterval(lifeProgressInterval);
  }
  
  // Update every second for smooth animation
  lifeProgressInterval = setInterval(() => {
    const now = new Date();
    const birth = new Date(birthdate);
    const ageMs = now - birth;
    const livedYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    
    // Update the display
    lived.textContent = `Time Lived: ${livedYears.toFixed(2)} years`;
    
    // Update countdown
    updateLifeCountdown(birthdate);
    
    // Update progress bar
    updateLifeProgressBar(livedYears);
  }, 1000);
}

function updateLifeCountdown(birthdate) {
  const now = new Date();
  const birth = new Date(birthdate);
  const deathDate = new Date(birth.getTime() + (MAX_AGE * 365.25 * 24 * 60 * 60 * 1000));
  const timeLeft = deathDate - now;
  
  if (timeLeft <= 0) {
    // Life completed
    document.getElementById('yearsLeft').textContent = '00';
    document.getElementById('monthsLeft').textContent = '00';
    document.getElementById('daysLeft').textContent = '00';
    document.getElementById('hoursLeft').textContent = '00';
    document.getElementById('minutesLeft').textContent = '00';
    document.getElementById('secondsLeft').textContent = '00';
    return;
  }
  
  // Calculate time components
  const years = Math.floor(timeLeft / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor((timeLeft % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
  const days = Math.floor((timeLeft % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
  
  // Update display with zero padding
  document.getElementById('yearsLeft').textContent = years.toString().padStart(2, '0');
  document.getElementById('monthsLeft').textContent = months.toString().padStart(2, '0');
  document.getElementById('daysLeft').textContent = days.toString().padStart(2, '0');
  document.getElementById('hoursLeft').textContent = hours.toString().padStart(2, '0');
  document.getElementById('minutesLeft').textContent = minutes.toString().padStart(2, '0');
  document.getElementById('secondsLeft').textContent = seconds.toString().padStart(2, '0');
}

// Old toggle button functionality removed - now using dropdown navigation

document.getElementById('startBtn').addEventListener('click', () => {
  const total = parseInt(document.getElementById('totalTime').value);
  const segment = parseInt(document.getElementById('segmentLength').value);
  const grace = parseInt(document.getElementById('gracePeriod').value);
  
  // Validate inputs
  if (!total || total <= 0) {
    alert('Please enter a valid total time (greater than 0)');
    return;
  }
  if (!segment || segment <= 0) {
    alert('Please enter a valid segment length (greater than 0)');
    return;
  }
  if (grace < 0) {
    alert('Grace period cannot be negative');
    return;
  }
  if (segment >= total) {
    alert('Segment length must be less than total time');
    return;
  }
  
  // Disable button and show feedback
  const startBtn = document.getElementById('startBtn');
  const originalText = startBtn.textContent;
  startBtn.textContent = 'Starting...';
  startBtn.disabled = true;
  
  // Clear any existing timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Store timer data (convert minutes to seconds for countdown)
  currentTimer = {
    total,
    segment,
    grace,
    fullBlock: segment + grace,
    blocks: Math.floor(total / (segment + grace)),
    remainingTime: total % (segment + grace),
    currentBlock: 0,
    currentTime: segment * 60, // Convert minutes to seconds
    isWorkTime: true,
    startTime: Date.now()
  };
  
  // Send message to background script
  chrome.runtime.sendMessage({ type: 'START_TIMER', total, segment, grace }, (response) => {
    if (response && response.success) {
      // Timer started successfully in background
      console.log('Timer started in background');
    }
  });
  
  // Switch to countdown view
  timerView.classList.remove('active');
  birthdaySetup.classList.remove('active');
  countdownView.classList.add('active');
  
  // Save timer to storage
  chrome.storage.local.set({ currentTimer });
  
  // Start countdown display
  startCountdown();
  
  // Show confirmation
  alert(`Timer started! You'll receive notifications for ${currentTimer.blocks} segments of ${segment} minutes each, with ${grace} minute breaks.`);
});

// Stop button functionality
document.getElementById('stopBtn').addEventListener('click', () => {
  stopTimer();
});

// Pause button functionality
document.getElementById('pauseBtn').addEventListener('click', () => {
  pauseTimer();
});

// Resume button functionality
document.getElementById('resumeBtn').addEventListener('click', () => {
  resumeTimer();
});

function startCountdown() {
  if (!currentTimer) return;
  
  updateCountdownDisplay();
  
  // Sync with background timer every second
  timerInterval = setInterval(() => {
    // Get current state from background
    chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' }, (response) => {
      if (response && response.currentTimer) {
        currentTimer = response.currentTimer;
        isPaused = response.isPaused || false;
        
        // Update button states
        document.getElementById('pauseBtn').style.display = isPaused ? 'none' : 'block';
        document.getElementById('resumeBtn').style.display = isPaused ? 'block' : 'none';
        
        updateCountdownDisplay();
        
        // Check if timer completed
        if (currentTimer.currentTime <= 0 && 
            currentTimer.currentBlock >= currentTimer.blocks && 
            !currentTimer.isWorkTime) {
          alert('Timer has ended. Great work! 🎉');
          stopTimer();
        }
      } else {
        // Timer was stopped in background
        stopTimer();
      }
    });
  }, 1000);
}

function updateCountdownDisplay() {
  if (!currentTimer) return;
  
  const minutes = Math.floor(currentTimer.currentTime / 60);
  const seconds = currentTimer.currentTime % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  document.getElementById('countdownTime').textContent = timeStr;
  
  // Calculate correct segment display
  let segmentDisplay;
  if (currentTimer.isWorkTime) {
    if (currentTimer.currentBlock < currentTimer.blocks) {
      segmentDisplay = `Segment ${currentTimer.currentBlock + 1} of ${currentTimer.blocks}`;
    } else {
      // Final remaining time segment
      segmentDisplay = `Final Segment`;
    }
  } else {
    // Break time
    if (currentTimer.currentBlock < currentTimer.blocks) {
      segmentDisplay = `Break after Segment ${currentTimer.currentBlock + 1}`;
    } else {
      segmentDisplay = `Final Break`;
    }
  }
  
  document.getElementById('currentSegment').textContent = segmentDisplay;
  document.getElementById('sessionType').textContent = currentTimer.isWorkTime ? 'Work Time' : 'Break Time';
  
  // Update progress bar
  const totalElapsedSeconds = (currentTimer.total * 60) - getTotalRemainingTime(); // Convert total to seconds
  const progressPercent = Math.min((totalElapsedSeconds / (currentTimer.total * 60)) * 100, 100);
  document.getElementById('progressFill').style.width = `${progressPercent}%`;
  document.getElementById('sessionProgress').textContent = `Total Progress: ${Math.round(progressPercent)}%`;
}

function getTotalRemainingTime() {
  if (!currentTimer) return 0;
  
  let remaining = 0;
  
  // Add remaining time in current segment
  remaining += currentTimer.currentTime;
  
  if (currentTimer.isWorkTime) {
    // Currently in work time
    if (currentTimer.currentBlock < currentTimer.blocks - 1) {
      // Add break after current work + remaining full blocks
      remaining += currentTimer.grace * 60; // Convert minutes to seconds
      remaining += (currentTimer.blocks - currentTimer.currentBlock - 1) * currentTimer.fullBlock * 60; // Convert minutes to seconds
    } else if (currentTimer.currentBlock === currentTimer.blocks - 1) {
      // Last regular segment, add break only if there's remaining time
      if (currentTimer.remainingTime > 0) {
        remaining += currentTimer.grace * 60; // Convert minutes to seconds
      }
    }
    // If currentBlock >= blocks, we're in final segment, no additional time
  } else {
    // Currently in break time
    if (currentTimer.currentBlock < currentTimer.blocks) {
      // Add remaining full blocks after this break
      remaining += (currentTimer.blocks - currentTimer.currentBlock - 1) * currentTimer.fullBlock * 60; // Convert minutes to seconds
    }
    // If currentBlock >= blocks, we're in final break, no additional time
  }
  
  return remaining;
}

function pauseTimer() {
  chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' }, (response) => {
    if (response && response.success) {
      isPaused = true;
      document.getElementById('pauseBtn').style.display = 'none';
      document.getElementById('resumeBtn').style.display = 'block';
    }
  });
}

function resumeTimer() {
  chrome.runtime.sendMessage({ type: 'RESUME_TIMER' }, (response) => {
    if (response && response.success) {
      isPaused = false;
      document.getElementById('pauseBtn').style.display = 'block';
      document.getElementById('resumeBtn').style.display = 'none';
    }
  });
}

function stopTimer() {
  chrome.runtime.sendMessage({ type: 'STOP_TIMER' }, (response) => {
    if (response && response.success) {
      // Stop local timer display
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      
      currentTimer = null;
      isPaused = false;
      
      // Switch back to timer view
      countdownView.classList.remove('active');
      birthdaySetup.classList.remove('active');
      timerView.classList.add('active');
      
      // Reset buttons
      document.getElementById('pauseBtn').style.display = 'block';
      document.getElementById('resumeBtn').style.display = 'none';
      
      // Reset start button
      const startBtn = document.getElementById('startBtn');
      startBtn.textContent = 'Start Session';
      startBtn.disabled = false;
    }
  });
}

// Journal functionality
function loadJournalEntry() {
  const dateKey = formatDateKey(currentJournalDate);
  updateJournalDateDisplay();
  
  // Load existing entry
  chrome.storage.local.get(['journalEntries'], (data) => {
    const entries = data.journalEntries || {};
    const entry = entries[dateKey];
    
    if (entry) {
      journalText.value = entry.text || '';
      dailyGoal.value = entry.goal || '';
      gratitude.value = entry.gratitude || '';
      dreamEntry.value = entry.dream || '';
      selectedMood = entry.mood || null;
      updateMoodButtons();
      
      // Load dream analysis if it exists
      if (entry.dreamAnalysis) {
        displayDreamAnalysis(entry.dreamAnalysis);
      } else {
        hideDreamAnalysis();
      }
    } else {
      clearJournalForm();
    }
  });
}

function updateJournalDateDisplay() {
  const today = new Date();
  const isToday = currentJournalDate.toDateString() === today.toDateString();
  
  if (isToday) {
    journalDate.textContent = 'Today\'s Entry';
  } else {
    journalDate.textContent = currentJournalDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Disable next button if it's today
  nextDayBtn.disabled = isToday;
  nextDayBtn.style.opacity = isToday ? '0.5' : '1';
}

function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

function clearJournalForm() {
  journalText.value = '';
  dailyGoal.value = '';
  gratitude.value = '';
  dreamEntry.value = '';
  selectedMood = null;
  updateMoodButtons();
  hideDreamAnalysis();
}

function updateMoodButtons() {
  const moodButtons = document.querySelectorAll('.mood-btn');
  moodButtons.forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.mood === selectedMood) {
      btn.classList.add('selected');
    }
  });
}

// Journal event listeners
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedMood = btn.dataset.mood;
    updateMoodButtons();
  });
});

prevDayBtn.addEventListener('click', () => {
  currentJournalDate.setDate(currentJournalDate.getDate() - 1);
  loadJournalEntry();
});

nextDayBtn.addEventListener('click', () => {
  const today = new Date();
  if (currentJournalDate.toDateString() !== today.toDateString()) {
    currentJournalDate.setDate(currentJournalDate.getDate() + 1);
    loadJournalEntry();
  }
});

saveJournalBtn.addEventListener('click', () => {
  const dateKey = formatDateKey(currentJournalDate);
  const entry = {
    date: dateKey,
    text: journalText.value.trim(),
    goal: dailyGoal.value.trim(),
    gratitude: gratitude.value.trim(),
    dream: dreamEntry.value.trim(),
    mood: selectedMood,
    timestamp: Date.now()
  };
  
  // Include dream analysis if it exists
  if (dreamAnalysis && !dreamAnalysis.classList.contains('hidden')) {
    entry.dreamAnalysis = getCurrentDreamAnalysis();
  }
  
  chrome.storage.local.get(['journalEntries'], (data) => {
    const entries = data.journalEntries || {};
    entries[dateKey] = entry;
    
    chrome.storage.local.set({ journalEntries: entries }, () => {
      // Show success feedback
      const originalText = saveJournalBtn.textContent;
      saveJournalBtn.textContent = 'Saved!';
      saveJournalBtn.style.background = 'linear-gradient(90deg,#22c55e,#16a34a)';
      
      setTimeout(() => {
        saveJournalBtn.textContent = originalText;
        saveJournalBtn.style.background = 'linear-gradient(90deg,#6b8cff,#9f7fff)';
      }, 1500);
    });
  });
});

clearJournalBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear this entry?')) {
    clearJournalForm();
  }
});

// Dream Analysis Functions
analyzeDreamBtn.addEventListener('click', async () => {
  const dreamText = dreamEntry.value.trim();
  
  if (!dreamText) {
    showDreamError('Please enter a dream to analyze.');
    return;
  }
  
  if (dreamText.length < 20) {
    showDreamError('Please provide a more detailed dream description (at least 20 characters).');
    return;
  }
  
  // Show loading state
  showDreamLoading();
  
  try {
    // Try API first, fallback to local analysis
    let analysis;
    try {
      analysis = await analyzeDreamWithAPI(dreamText);
    } catch (apiError) {
      console.warn('API analysis failed, falling back to local analysis:', apiError);
      analysis = await analyzeDreamLocally(dreamText);
    }
    
    displayDreamAnalysis(analysis);
  } catch (error) {
    console.error('Dream analysis error:', error);
    showDreamError('Failed to analyze dream. Please try again.');
  }
});

// API Integration
async function analyzeDreamWithAPI(dreamText) {
  const API_BASE_URL = 'https://topboompop-lifeclock-v2.vercel.app'; // Replace with your actual Vercel URL
  
  const response = await fetch(`${API_BASE_URL}/api/analyzeDream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add authentication header when auth is implemented
      // 'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      dreamText: dreamText.trim(),
      timestamp: Date.now()
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'API returned unsuccessful response');
  }

  return {
    success: true,
    data: data.data,
    requestId: data.requestId
  };
}

async function analyzeDreamLocally(dreamText) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simple local analysis (in a real app, this would be an API call)
  const words = dreamText.toLowerCase().split(/\s+/);
  const emotions = [];
  const themes = [];
  
  // Basic emotion detection
  const emotionWords = {
    'fear': ['scared', 'afraid', 'terrified', 'frightened', 'panic'],
    'joy': ['happy', 'excited', 'elated', 'cheerful', 'delighted'],
    'sadness': ['sad', 'depressed', 'crying', 'tears', 'mourning'],
    'anger': ['angry', 'mad', 'furious', 'rage', 'hostile'],
    'anxiety': ['worried', 'nervous', 'anxious', 'stressed', 'uneasy']
  };
  
  // Basic theme detection
  const themeWords = {
    'flying': ['flying', 'soaring', 'airplane', 'wings', 'sky'],
    'falling': ['falling', 'dropping', 'plunging', 'descending'],
    'chase': ['chasing', 'running', 'pursuing', 'escaping'],
    'water': ['water', 'ocean', 'swimming', 'drowning', 'waves'],
    'home': ['home', 'house', 'family', 'childhood', 'room']
  };
  
  // Analyze emotions
  Object.entries(emotionWords).forEach(([emotion, words]) => {
    if (words.some(word => dreamText.toLowerCase().includes(word))) {
      emotions.push(emotion);
    }
  });
  
  // Analyze themes
  Object.entries(themeWords).forEach(([theme, words]) => {
    if (words.some(word => dreamText.toLowerCase().includes(word))) {
      themes.push(theme);
    }
  });
  
  return {
    emotions: emotions.length > 0 ? emotions : ['neutral'],
    themes: themes.length > 0 ? themes : ['general'],
    interpretation: generateInterpretation(emotions, themes),
    symbols: extractSymbols(dreamText),
    timestamp: Date.now()
  };
}

function generateInterpretation(emotions, themes) {
  const interpretations = {
    'fear': 'This dream may reflect underlying anxieties or concerns in your waking life.',
    'joy': 'This dream suggests positive emotions and a sense of well-being.',
    'sadness': 'This dream may indicate processing of difficult emotions or experiences.',
    'anger': 'This dream could represent unresolved conflicts or frustrations.',
    'anxiety': 'This dream may reflect stress or worry about current life situations.',
    'flying': 'Flying dreams often represent freedom, ambition, or a desire to escape limitations.',
    'falling': 'Falling dreams may indicate feelings of losing control or insecurity.',
    'chase': 'Being chased in dreams often represents avoidance of something in waking life.',
    'water': 'Water in dreams can symbolize emotions, cleansing, or life transitions.',
    'home': 'Dreams about home often relate to security, identity, or childhood memories.'
  };
  
  let interpretation = 'Dream analysis suggests: ';
  const relevantInterpretations = [...emotions, ...themes].map(item => interpretations[item]).filter(Boolean);
  
  if (relevantInterpretations.length > 0) {
    interpretation += relevantInterpretations.join(' ');
  } else {
    interpretation += 'This dream may reflect your subconscious processing of daily experiences.';
  }
  
  return interpretation;
}

function extractSymbols(dreamText) {
  // Simple symbol extraction (in a real app, this would be more sophisticated)
  const commonSymbols = ['house', 'car', 'animal', 'person', 'tree', 'water', 'fire', 'door', 'window'];
  const foundSymbols = commonSymbols.filter(symbol => 
    dreamText.toLowerCase().includes(symbol)
  );
  
  return foundSymbols.slice(0, 3); // Limit to 3 symbols
}

function showDreamLoading() {
  dreamAnalysis.classList.remove('hidden');
  dreamResults.innerHTML = '<div class="loading">Analyzing your dream...</div>';
  analyzeDreamBtn.disabled = true;
  analyzeDreamBtn.textContent = 'Analyzing...';
}

function displayDreamAnalysis(analysis) {
  dreamAnalysis.classList.remove('hidden');
  
  const html = `
    <div class="analysis-section">
      <div class="section-title">Emotions</div>
      <div class="section-content">${analysis.emotions.join(', ')}</div>
    </div>
    <div class="analysis-section">
      <div class="section-title">Themes</div>
      <div class="section-content">${analysis.themes.join(', ')}</div>
    </div>
    <div class="analysis-section">
      <div class="section-title">Interpretation</div>
      <div class="section-content">${analysis.interpretation}</div>
    </div>
    ${analysis.symbols && analysis.symbols.length > 0 ? `
    <div class="analysis-section">
      <div class="section-title">Key Symbols</div>
      <div class="section-content">${analysis.symbols.join(', ')}</div>
    </div>
    ` : ''}
  `;
  
  dreamResults.innerHTML = html;
  analyzeDreamBtn.disabled = false;
  analyzeDreamBtn.textContent = 'Analyze Dream';
}

function showDreamError(message) {
  dreamAnalysis.classList.remove('hidden');
  dreamResults.innerHTML = `<div class="error">${message}</div>`;
  analyzeDreamBtn.disabled = false;
  analyzeDreamBtn.textContent = 'Analyze Dream';
}

function hideDreamAnalysis() {
  dreamAnalysis.classList.add('hidden');
}

function getCurrentDreamAnalysis() {
  // Extract analysis data from the displayed results
  if (dreamAnalysis.classList.contains('hidden')) {
    return null;
  }
  
  // This would need to be more sophisticated in a real implementation
  // For now, we'll store a simple representation
  return {
    emotions: [],
    themes: [],
    interpretation: dreamResults.textContent,
    timestamp: Date.now()
  };
}