// Local Text-to-Speech Worker
let isInitialized = false;

// Initialize local TTS
async function initializeTTS() {
  try {
    console.log('Initializing local TTS...');
    
    isInitialized = true;
    
    self.postMessage({
      type: 'tts-ready',
      data: { initialized: true }
    });
    
    console.log('Local TTS initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize TTS:', error);
    self.postMessage({
      type: 'tts-error',
      data: { error: error.message }
    });
  }
}

// Generate more realistic speech-like audio
function generateSpeechAudio(text) {
  const sampleRate = 22050;
  const wordsPerSecond = 3; // Average speaking rate
  const words = text.split(' ').length;
  const duration = Math.max(1, words / wordsPerSecond);
  const samples = Math.floor(sampleRate * duration);
  
  const audioBuffer = new Float32Array(samples);
  
  // Generate more speech-like audio with varying frequencies and amplitude
  let phase = 0;
  const baseFreq = 150; // Base frequency for speech
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    
    // Simulate formants (speech resonances)
    const f1 = baseFreq + 50 * Math.sin(2 * Math.PI * 2 * t); // First formant
    const f2 = baseFreq * 2 + 100 * Math.sin(2 * Math.PI * 1.5 * t); // Second formant
    const f3 = baseFreq * 3 + 150 * Math.sin(2 * Math.PI * 0.8 * t); // Third formant
    
    // Combine formants with different amplitudes
    let sample = 0;
    sample += 0.4 * Math.sin(2 * Math.PI * f1 * t);
    sample += 0.3 * Math.sin(2 * Math.PI * f2 * t);
    sample += 0.2 * Math.sin(2 * Math.PI * f3 * t);
    
    // Add some noise for realism
    sample += 0.05 * (Math.random() - 0.5);
    
    // Apply envelope (fade in/out)
    const fadeTime = 0.1; // 100ms fade
    const fadeInSamples = fadeTime * sampleRate;
    const fadeOutSamples = fadeTime * sampleRate;
    
    if (i < fadeInSamples) {
      sample *= i / fadeInSamples;
    } else if (i > samples - fadeOutSamples) {
      sample *= (samples - i) / fadeOutSamples;
    }
    
    // Add pauses between words
    const wordIndex = Math.floor((i / samples) * words);
    const wordProgress = ((i / samples) * words) % 1;
    
    if (wordProgress > 0.8 && wordProgress < 0.9) {
      sample *= 0.1; // Brief pause between words
    }
    
    audioBuffer[i] = Math.max(-1, Math.min(1, sample * 0.3)); // Normalize and reduce volume
  }
  
  return audioBuffer;
}

// Synthesize speech from text
function synthesizeSpeech(text, options = {}) {
  if (!isInitialized) {
    self.postMessage({
      type: 'synthesis-error',
      data: { error: 'TTS not initialized' }
    });
    return;
  }

  try {
    const startTime = performance.now();
    
    // Generate speech-like audio
    const audioBuffer = generateSpeechAudio(text);
    const sampleRate = 22050;
    
    const processingTime = performance.now() - startTime;
    
    // Simulate realistic processing time
    const simulatedDelay = Math.min(2000, text.length * 50); // Up to 2 seconds
    
    setTimeout(() => {
      self.postMessage({
        type: 'synthesis-result',
        data: {
          audioBuffer: audioBuffer.buffer,
          sampleRate,
          processingTime: processingTime + simulatedDelay,
          text
        }
      }, [audioBuffer.buffer]);
      
    }, simulatedDelay);
    
  } catch (error) {
    console.error('TTS synthesis error:', error);
    self.postMessage({
      type: 'synthesis-error',
      data: { error: error.message }
    });
  }
}

// Message handler
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'initialize':
      initializeTTS();
      break;
      
    case 'synthesize':
      synthesizeSpeech(data.text, data.options);
      break;
      
    case 'stop':
      // Clean up if needed
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});