export class WorkerManager {
  private whisperWorker: Worker | null = null;
  private ttsWorker: Worker | null = null;
  private isWhisperReady = false;
  private isTTSReady = false;

  async initialize(): Promise<void> {
    return Promise.all([
      this.initializeWhisperWorker(),
      this.initializeTTSWorker()
    ]).then(() => {});
  }

  private initializeWhisperWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.whisperWorker = new Worker('/workers/whisper-worker.js');
      
      this.whisperWorker.onmessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'whisper-ready') {
          this.isWhisperReady = true;
          resolve();
        } else if (type === 'whisper-error') {
          reject(new Error(data.error));
        }
      };

      this.whisperWorker.onerror = (error) => {
        reject(error);
      };

      this.whisperWorker.postMessage({ type: 'initialize' });
    });
  }

  private initializeTTSWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ttsWorker = new Worker('/workers/tts-worker.js');
      
      this.ttsWorker.onmessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'tts-ready') {
          this.isTTSReady = true;
          resolve();
        } else if (type === 'tts-error') {
          reject(new Error(data.error));
        }
      };

      this.ttsWorker.onerror = (error) => {
        reject(error);
      };

      this.ttsWorker.postMessage({ type: 'initialize' });
    });
  }

  transcribeAudio(audioData: ArrayBuffer): Promise<{ transcription: string; processingTime: number }> {
    return new Promise((resolve, reject) => {
      if (!this.whisperWorker || !this.isWhisperReady) {
        reject(new Error('Whisper worker not ready'));
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        const { type, data } = event.data;
        
        if (type === 'transcription-result') {
          this.whisperWorker!.removeEventListener('message', handleMessage);
          resolve({
            transcription: data.transcription,
            processingTime: data.processingTime
          });
        } else if (type === 'transcription-error') {
          this.whisperWorker!.removeEventListener('message', handleMessage);
          reject(new Error(data.error));
        }
      };

      this.whisperWorker.addEventListener('message', handleMessage);
      this.whisperWorker.postMessage({ 
        type: 'transcribe', 
        data: { audioData } 
      });
    });
  }

  synthesizeSpeech(text: string): Promise<{ audioBuffer: ArrayBuffer; sampleRate: number; processingTime: number }> {
    return new Promise((resolve, reject) => {
      if (!this.ttsWorker || !this.isTTSReady) {
        reject(new Error('TTS worker not ready'));
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        const { type, data } = event.data;
        
        if (type === 'synthesis-result') {
          this.ttsWorker!.removeEventListener('message', handleMessage);
          resolve({
            audioBuffer: data.audioBuffer,
            sampleRate: data.sampleRate,
            processingTime: data.processingTime
          });
        } else if (type === 'synthesis-error') {
          this.ttsWorker!.removeEventListener('message', handleMessage);
          reject(new Error(data.error));
        }
      };

      this.ttsWorker.addEventListener('message', handleMessage);
      this.ttsWorker.postMessage({ 
        type: 'synthesize', 
        data: { text } 
      });
    });
  }

  cleanup(): void {
    if (this.whisperWorker) {
      this.whisperWorker.terminate();
      this.whisperWorker = null;
    }
    
    if (this.ttsWorker) {
      this.ttsWorker.terminate();
      this.ttsWorker = null;
    }
    
    this.isWhisperReady = false;
    this.isTTSReady = false;
  }
}