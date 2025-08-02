'use client';

import { useState, useEffect, useCallback } from 'react';
import { AudioRecorder } from '@/lib/audio-recorder';
import { WorkerManager } from '@/lib/worker-manager';
import { OpenAIClient } from '@/lib/openai-client';
import { supabase } from '@/lib/supabase';

export type AssistantState = 'idle' | 'recording' | 'processing' | 'speaking' | 'error';

export interface ProcessingTimes {
  stt: number;
  api: number;
  tts: number;
  total: number;
}

export function useVoiceAssistant() {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcription, setTranscription] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processingTimes, setProcessingTimes] = useState<ProcessingTimes | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [audioRecorder] = useState(() => new AudioRecorder());
  const [workerManager] = useState(() => new WorkerManager());
  const [openaiClient] = useState(() => new OpenAIClient());

  const initialize = useCallback(async () => {
    try {
      setState('idle');
      setError(null);
      
      await Promise.all([
        audioRecorder.initialize(),
        workerManager.initialize()
      ]);
      
      setIsInitialized(true);
      console.log('Voice assistant initialized successfully');
    } catch (err) {
      console.error('Failed to initialize voice assistant:', err);
      setError(err instanceof Error ? err.message : 'Initialization failed');
      setState('error');
    }
  }, [audioRecorder, workerManager]);

  const startRecording = useCallback(async () => {
    if (!isInitialized || state !== 'idle') return;

    try {
      setState('recording');
      setTranscription('');
      setResponse('');
      setError(null);
      
      await audioRecorder.startRecording();
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Recording failed');
      setState('error');
    }
  }, [isInitialized, state, audioRecorder]);

  const stopRecording = useCallback(async () => {
    if (state !== 'recording') return;

    try {
      setState('processing');
      const totalStartTime = performance.now();
      
      let text = '';
      let sttTime = 0;

      try {
        // Try to use Web Speech API first for better local recognition
        const sttStartTime = performance.now();
        text = await audioRecorder.startSpeechRecognition();
        sttTime = performance.now() - sttStartTime;
        setTranscription(text);
      } catch (speechError) {
        console.log('Web Speech API failed, falling back to worker:', speechError);
        
        // Fallback to worker-based approach
        const audioBlob = await audioRecorder.stopRecording();
        const audioBuffer = await audioBlob.arrayBuffer();
        
        const sttStartTime = performance.now();
        const result = await workerManager.transcribeAudio(audioBuffer);
        text = result.transcription;
        sttTime = result.processingTime;
        setTranscription(text);
      }
      
      if (!text.trim()) {
        setState('idle');
        return;
      }

      // Get AI response
      const apiStartTime = performance.now();
      const aiResponse = await openaiClient.getChatCompletion(text);
      const apiTime = performance.now() - apiStartTime;
      setResponse(aiResponse);

      // Synthesize speech
      const ttsStartTime = performance.now();
      const { audioBuffer: ttsBuffer, sampleRate } = await workerManager.synthesizeSpeech(aiResponse);
      const ttsTime = performance.now() - ttsStartTime;

      const totalTime = performance.now() - totalStartTime;
      const times: ProcessingTimes = {
        stt: sttTime,
        api: apiTime,
        tts: ttsTime,
        total: totalTime
      };
      setProcessingTimes(times);

      // Play audio
      setState('speaking');
      await playAudioBuffer(ttsBuffer, sampleRate);

      // Save to database
      try {
        await supabase.from('conversations').insert({
          user_input: text,
          ai_response: aiResponse,
          processing_time: totalTime
        });
      } catch (dbError) {
        console.warn('Failed to save conversation:', dbError);
      }

      setState('idle');
      console.log('Conversation completed:', times);
      
    } catch (err) {
      console.error('Processing failed:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
      setState('error');
    }
  }, [state, audioRecorder, workerManager, openaiClient]);

  const playAudioBuffer = useCallback(async (buffer: ArrayBuffer, sampleRate: number) => {
    return new Promise<void>((resolve) => {
      const audioContext = new AudioContext();
      const audioBuffer = audioContext.createBuffer(1, buffer.byteLength / 4, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      const float32Array = new Float32Array(buffer);
      channelData.set(float32Array);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        audioContext.close();
        resolve();
      };
      
      source.start();
    });
  }, []);

  const resetError = useCallback(() => {
    setError(null);
    setState('idle');
  }, []);

  const clearHistory = useCallback(() => {
    openaiClient.clearHistory();
    setTranscription('');
    setResponse('');
    setProcessingTimes(null);
  }, [openaiClient]);

  useEffect(() => {
    initialize();
    
    return () => {
      audioRecorder.cleanup();
      workerManager.cleanup();
    };
  }, [initialize, audioRecorder, workerManager]);

  return {
    state,
    transcription,
    response,
    error,
    processingTimes,
    isInitialized,
    startRecording,
    stopRecording,
    resetError,
    clearHistory
  };
}