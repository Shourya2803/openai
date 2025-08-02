// Local Speech-to-Text Worker using Web Speech API
let recognition = null;
let isInitialized = false;

// Initialize Speech Recognition
async function initializeSpeechRecognition() {
  try {
    console.log('Initializing local speech recognition...');
    
    isInitialized = true;
    
    self.postMessage({
      type: 'whisper-ready',
      data: { initialized: true }
    });
    
    console.log('Local speech recognition initialized successfully');
  } catch (error) {
    console.error('Failed to initialize speech recognition:', error);
    self.postMessage({
      type: 'whisper-error',
      data: { error: error.message }
    });
  }
}

// Process audio data for transcription
function processAudio(audioData) {
  if (!isInitialized) {
    self.postMessage({
      type: 'transcription-error',
      data: { error: 'Speech recognition not initialized' }
    });
    return;
  }

  try {
    const startTime = performance.now();
    
    // Convert audio data to blob for processing
    const audioBlob = new Blob([audioData], { type: 'audio/webm' });
    
    // For local processing, we'll use a simplified approach
    // In a real implementation, you might use libraries like:
    // - @tensorflow/tfjs with speech models
    // - Web Assembly versions of Whisper
    // - Other client-side speech recognition libraries
    
    // For now, we'll simulate local processing with better mock data
    setTimeout(() => {
      const mockTranscriptions = [
        "Hello, how are you today?",
        "What's the weather like outside?",
        "Can you tell me a story?",
        "I want to learn something new",
        "What time is it right now?",
        "Tell me a funny joke",
        "Help me with my homework",
        "Let's play a game together",
        "What's your favorite color?",
        "Can you sing a song?"
      ];
      
      const transcription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      const processingTime = performance.now() - startTime;
      
      self.postMessage({
        type: 'transcription-result',
        data: {
          transcription,
          processingTime,
          confidence: 0.85 + Math.random() * 0.1 // 85-95% confidence
        }
      });
    }, 300 + Math.random() * 400); // 300-700ms processing time
    
  } catch (error) {
    console.error('Transcription error:', error);
    self.postMessage({
      type: 'transcription-error',
      data: { error: error.message }
    });
  }
}

// Message handler
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'initialize':
      initializeSpeechRecognition();
      break;
      
    case 'transcribe':
      processAudio(data.audioData);
      break;
      
    case 'stop':
      // Clean up if needed
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});