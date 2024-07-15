const audioContext = new AudioContext();
let clickBuffers = {};
let currentClick = 'click1';
const soundSelect = document.getElementById('sound-select');
const startStopButton = document.getElementById('start-stop');
const feedbackDiv = document.getElementById('feedback');
const bpmSlider = document.getElementById('bpm-slider');
const bpmDisplay = document.getElementById('bpm-display');
const bpmDecrease = document.getElementById('bpm-decrease');
const bpmIncrease = document.getElementById('bpm-increase');
let isRunning = false;
let intervalId = null;
let bpm = bpmDisplay.value;

const loadClickSound = (url) => {
  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data));
};

const clickSoundUrls = {
  'click1': 'https://santimeza.github.io/metro-gnome/audioFiles/click_1.wav',
  'click2': 'https://santimeza.github.io/metro-gnome/audioFiles/click_2.wav',
  'click3': 'https://santimeza.github.io/metro-gnome/audioFiles/click_3.wav'
};

Promise.all([
  loadClickSound(clickSoundUrls['click1']).then(buffer => { clickBuffers['click1'] = buffer; }),
  loadClickSound(clickSoundUrls['click2']).then(buffer => { clickBuffers['click2'] = buffer; }),
  loadClickSound(clickSoundUrls['click3']).then(buffer => { clickBuffers['click3'] = buffer; })
]).then(() => {
  console.log('Click sounds loaded');
});

const playClick = () => {
  let source = audioContext.createBufferSource();
  source.buffer = clickBuffers[currentClick];
  source.connect(audioContext.destination);
  source.start();
};

const playClickWithFeedback = () => {
  playClick();
  lastClickTime = audioContext.currentTime * 1000; // Convert to ms
};

const startMetronome = () => {
  intervalId = setInterval(playClickWithFeedback, (60 / bpm) * 1000);
};

const stopMetronome = () => {
  clearInterval(intervalId);
};

startStopButton.addEventListener('click', () => {
  if (isRunning) {
    stopMetronome();
    isRunning = false;
  } else {
    startMetronome();
    isRunning = true;
  }
});

soundSelect.addEventListener('change', () => {
  currentClick = soundSelect.value;
  console.log('changing click');
});

bpmDisplay.addEventListener('input', (event) => {
  if(event.target.value < 40)
    bpm = 40;
  else if(event.target.value > 240)
    bpm = 240;
  else
    bpm = event.target.value;
    bpmSlider.value = bpm;
  
    if (isRunning) {
    stopMetronome();
    startMetronome();
  }
});

bpmSlider.addEventListener('input', (event) => {
  bpm = event.target.value;
  bpmDisplay.value = bpm;
  if (isRunning) {
    stopMetronome();
    startMetronome();
  }
});

bpmDecrease.addEventListener('click', () => {
  bpm = Math.max(40, bpm - 1);
  bpmSlider.value = bpm;
  bpmDisplay.textContent = bpm;
  if (isRunning) {
    stopMetronome();
    startMetronome();
  }
});

bpmIncrease.addEventListener('click', () => {
  bpm = Math.min(240, bpm + 1);
  bpmSlider.value = bpm;
  bpmDisplay.textContent = bpm;
  if (isRunning) {
    stopMetronome();
    startMetronome();
  }
});

// input handling
let lastClickTime = 0;
let tolerance = 100; // ms tolerance for "correct" timing

const handleKeyPress = (event) => {
  if (event.code === 'Space') {
    event.preventDefault(); // Prevent default behavior
    let currentTime = audioContext.currentTime * 1000; // Convert to ms
    let quarterNoteDuration = 60000 / bpm; // Duration of a quarter note in ms
    let onTime = false;

    // quarter note check
    /// before beat
    if(Math.abs(currentTime - lastClickTime + quarterNoteDuration) <= tolerance) {
      onTime = true;
    }
    /// after beat
    if(Math.abs(currentTime - lastClickTime) <= tolerance) {
      onTime = true;
    }

    // eighth note check
    if(document.getElementById('eighthNotes').checked) {
      if(Math.abs(currentTime - (lastClickTime + (quarterNoteDuration / 2))) <= tolerance) {
        onTime = true;
      }
    }

    // triplet check
    if(document.getElementById('triplets').checked) {
      if((Math.abs(currentTime - (lastClickTime + (quarterNoteDuration / 3))) < tolerance) || 
        (Math.abs(currentTime - (lastClickTime + (2 * quarterNoteDuration / 3))) < tolerance)) {
        onTime = true;
      }
    }

    //let timeDiff = currentTime - lastClickTime;

    if (onTime == true) {
      feedbackDiv.style.backgroundColor = 'green'; // Correct timing
    } else {
      feedbackDiv.style.backgroundColor = 'red'; // Early
    }

    setTimeout(() => {
      feedbackDiv.style.backgroundColor = '#8ba484'; // Reset color
    }, 200);
  }
};

// Listen for touch events on the feedback box
feedbackDiv.addEventListener('touchstart', (event) => {
  handleFeedback();
});

// Optional: Prevent scrolling when touching the feedback box
feedbackDiv.addEventListener('touchmove', (event) => {
  event.preventDefault();
}, { passive: false });

// Stop event propagation from feedbackDiv clicks
feedbackDiv.addEventListener('click', (event) => {
  event.stopPropagation();
});

// Ensure bpmSlider is not affected by space bar press
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    handleKeyPress(event);
    document.activeElement.blur(); // Remove focus from any element
  }
});
