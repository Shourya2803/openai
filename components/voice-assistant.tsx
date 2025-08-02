'use client';

import { useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVoiceAssistant } from '@/hooks/use-voice-assistant';

export function VoiceAssistant() {
  const {
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
  } = useVoiceAssistant();

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  const getStateMessage = () => {
    switch (state) {
      case 'recording':
        return '🎤 Listening...';
      case 'processing':
        return '🤔 Thinking...';
      case 'speaking':
        return '🗣️ Speaking...';
      case 'error':
        return '❌ Oops! Something went wrong';
      default:
        return '👋 Hi! Press the button to talk to me!';
    }
  };

  const getButtonIcon = () => {
    switch (state) {
      case 'recording':
        return <MicOff className="w-8 h-8" />;
      case 'processing':
        return <Loader2 className="w-8 h-8 animate-spin" />;
      case 'speaking':
        return <Volume2 className="w-8 h-8" />;
      case 'error':
        return <AlertCircle className="w-8 h-8" />;
      default:
        return <Mic className="w-8 h-8" />;
    }
  };

  const getButtonColor = () => {
    switch (state) {
      case 'recording':
        return 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50';
      case 'processing':
        return 'bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/50';
      case 'speaking':
        return 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/50';
      case 'error':
        return 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50';
      default:
        return 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/50';
    }
  };

  const handleButtonClick = () => {
    if (error) {
      resetError();
      return;
    }

    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle') {
      startRecording();
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-white/95 backdrop-blur">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Getting Ready...</h2>
          <p className="text-gray-600">Setting up your voice buddy!</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            🤖 Voice Buddy
          </h1>
          <p className="text-xl text-white/90 drop-shadow">
            Your friendly AI companion!
          </p>
        </div>

        {/* Main Interface */}
        <Card className="bg-white/95 backdrop-blur p-8 rounded-3xl shadow-2xl">
          <div className="text-center space-y-6">
            {/* Status Message */}
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {getStateMessage()}
              </h2>
              {!error && (
                <div className="text-sm text-gray-600">
                  {state === 'recording' && "Speak clearly and I'll listen!"}
                  {state === 'processing' && "Processing your message..."}
                  {state === 'speaking' && "Playing my response..."}
                  {state === 'idle' && "Ready when you are!"}
                </div>
              )}
            </div>

            {/* Main Action Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleButtonClick}
                disabled={state === 'processing' || state === 'speaking'}
                className={`w-32 h-32 rounded-full text-white font-bold text-lg transition-all duration-200 transform hover:scale-105 ${getButtonColor()}`}
              >
                {getButtonIcon()}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-400 rounded-2xl p-4">
                <p className="text-red-700 font-medium">{error}</p>
                <Button
                  onClick={resetError}
                  className="mt-3 bg-red-500 hover:bg-red-600 text-white"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={clearHistory}
                variant="outline"
                className="bg-white hover:bg-gray-100 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        </Card>

        {/* Conversation Display */}
        {(transcription || response) && (
          <Card className="bg-white/95 backdrop-blur p-6 rounded-3xl shadow-xl">
            <div className="space-y-4">
              {transcription && (
                <div className="bg-blue-50 rounded-2xl p-4">
                  <h3 className="font-bold text-blue-800 mb-2 text-lg">You said:</h3>
                  <p className="text-blue-700 text-lg">{transcription}</p>
                </div>
              )}
              
              {response && (
                <div className="bg-green-50 rounded-2xl p-4">
                  <h3 className="font-bold text-green-800 mb-2 text-lg">I replied:</h3>
                  <p className="text-green-700 text-lg">{response}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Performance Metrics */}
        {processingTimes && (
          <Card className="bg-white/95 backdrop-blur p-6 rounded-3xl shadow-xl">
            <h3 className="font-bold text-gray-800 mb-4 text-xl text-center">⚡ Speed Report</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center bg-purple-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-600">
                  {processingTimes.stt.toFixed(0)}ms
                </div>
                <div className="text-sm text-purple-700 font-medium">Listening</div>
              </div>
              <div className="text-center bg-blue-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-blue-600">
                  {processingTimes.api.toFixed(0)}ms
                </div>
                <div className="text-sm text-blue-700 font-medium">Thinking</div>
              </div>
              <div className="text-center bg-green-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-green-600">
                  {processingTimes.tts.toFixed(0)}ms
                </div>
                <div className="text-sm text-green-700 font-medium">Speaking</div>
              </div>
              <div className="text-center bg-orange-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-orange-600">
                  {processingTimes.total.toFixed(0)}ms
                </div>
                <div className="text-sm text-orange-700 font-medium">Total</div>
              </div>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-white/80 text-sm">
          <p>🚀 Works locally in your browser! • 🔒 Local processing for privacy • 🎤 Uses Web Speech API</p>
        </div>
      </div>
    </div>
  );
}