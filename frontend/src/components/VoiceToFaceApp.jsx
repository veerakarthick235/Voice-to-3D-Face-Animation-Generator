import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, Upload, Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import FaceCanvas from './FaceCanvas';
import AnimationControls from './AnimationControls';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VoiceToFaceApp = () => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [activeTab, setActiveTab] = useState('text');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Process text to animation
  const handleTextToAnimation = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await axios.post(`${API}/animate/text`, {
        text: inputText,
        fps: 30
      });

      setAnimationData(response.data);
      setCurrentFrame(0);
      toast.success(`Animation generated! ${response.data.total_frames} frames`);
    } catch (error) {
      console.error('Error generating animation:', error);
      toast.error('Failed to generate animation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioBlob(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info('Processing audio...');
    }
  };

  // Process audio blob
  const processAudioBlob = async (audioBlob) => {
    setIsProcessing(true);
    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        
        // For demo, we'll convert WebM to PCM using Web Audio API
        const audioContext = new AudioContext();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get PCM data
        const pcmData = audioBuffer.getChannelData(0);
        const pcm16 = new Int16Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, pcmData[i] * 32768));
        }
        
        // Convert to base64
        const pcmBase64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        
        // Send to backend
        const response = await axios.post(`${API}/animate/audio`, {
          audio_data: pcmBase64,
          sample_rate: audioContext.sampleRate,
          fps: 30
        });

        setAnimationData(response.data);
        setCurrentFrame(0);
        toast.success(`Animation generated! ${response.data.total_frames} frames`);
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    await processAudioBlob(file);
  };

  // Animation playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetAnimation = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
  };

  // Animation loop
  useEffect(() => {
    if (isPlaying && animationData) {
      const fps = animationData.fps;
      const frameInterval = 1000 / fps;
      
      const animate = () => {
        setCurrentFrame((prev) => {
          if (prev >= animationData.total_frames - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
        
        animationFrameRef.current = setTimeout(animate, frameInterval);
      };
      
      animationFrameRef.current = setTimeout(animate, frameInterval);
    } else {
      if (animationFrameRef.current) {
        clearTimeout(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        clearTimeout(animationFrameRef.current);
      }
    };
  }, [isPlaying, animationData]);

  const currentBlendshapes = animationData?.frames[currentFrame]?.blendshapes || null;

  return (
    <div className="min-h-screen relative">
      {/* Background particles */}
      <div className="bg-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: `${Math.random() * 60 + 20}px`,
              height: `${Math.random() * 60 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 20 + 15}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 text-gradient">
            Voice to 3D Face
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Real-time speech to facial animation powered by phoneme mapping
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Panel - Input Controls */}
          <div className="space-y-6">
            <div className="glass-container p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="text" data-testid="text-tab">Text Input</TabsTrigger>
                  <TabsTrigger value="audio" data-testid="audio-tab">Audio Input</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enter text to animate
                    </label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type something like 'Hello world! How are you today?'"
                      className="w-full h-32 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      data-testid="text-input"
                    />
                  </div>
                  <Button
                    onClick={handleTextToAnimation}
                    disabled={isProcessing || !inputText.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold py-6 rounded-xl"
                    data-testid="generate-text-animation-btn"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Generate Animation'
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="audio" className="space-y-4">
                  <div className="space-y-4">
                    {/* Microphone recording */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Record from microphone
                      </label>
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={`w-full font-semibold py-6 rounded-xl ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600'
                        } text-white`}
                        data-testid="record-audio-btn"
                      >
                        <Mic className="mr-2 h-5 w-5" />
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-900/80 px-2 text-gray-400">Or</span>
                      </div>
                    </div>

                    {/* File upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Upload audio file
                      </label>
                      <label htmlFor="audio-upload" className="block">
                        <div className="w-full border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-blue-500 transition cursor-pointer bg-gray-900/30">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-400">
                            Click to upload or drag audio file
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Supports WAV, MP3, WebM
                          </p>
                        </div>
                        <Input
                          id="audio-upload"
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isProcessing}
                          data-testid="audio-file-input"
                        />
                      </label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Animation info */}
            {animationData && (
              <div className="glass-container p-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Animation Info</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Total Frames</p>
                    <p className="text-2xl font-bold text-white">{animationData.total_frames}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="text-2xl font-bold text-white">{animationData.duration.toFixed(2)}s</p>
                  </div>
                  <div>
                    <p className="text-gray-400">FPS</p>
                    <p className="text-2xl font-bold text-white">{animationData.fps}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Current Frame</p>
                    <p className="text-2xl font-bold text-white">{currentFrame}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - 3D Face Visualization */}
          <div className="space-y-6">
            <div className="glass-container p-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">3D Face Animation</h3>
              <div className="canvas-container aspect-square">
                <FaceCanvas blendshapes={currentBlendshapes} />
              </div>
            </div>

            {/* Playback controls */}
            {animationData && (
              <div className="glass-container p-6">
                <AnimationControls
                  isPlaying={isPlaying}
                  currentFrame={currentFrame}
                  totalFrames={animationData.total_frames}
                  onTogglePlay={togglePlayback}
                  onReset={resetAnimation}
                  onSeek={setCurrentFrame}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceToFaceApp;
