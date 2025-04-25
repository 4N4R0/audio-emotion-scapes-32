
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AudioVisualizer from './AudioVisualizer';
import { Card, CardContent } from '@/components/ui/card';

type AudioRecorderProps = {
  onRecordingComplete: (audioBlob: Blob) => void;
  minRecordingTime?: number;
};

const AudioRecorder = ({ onRecordingComplete, minRecordingTime = 30 }: AudioRecorderProps) => {
  // States for managing recording status and audio data
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<number[]>([]);

  // Refs for managing media recorder and timers
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Effect to clean up resources on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);

  // Timer function for recording duration
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Audio visualization setup
  const setupAudioVisualization = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 256;
    
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVisualization = () => {
      if (!analyserRef.current || !isRecording) return;
      
      requestAnimationFrame(updateVisualization);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Convert to normalized values for visualization
      const visualData = Array.from(dataArray).map(val => val / 256);
      setAudioData(visualData.slice(0, 64)); // Use subset for better visualization
    };
    
    updateVisualization();
  };

  // Start recording function
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Setup audio visualization
      setupAudioVisualization(stream);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        
        setRecordingBlob(audioBlob);
        setAudioUrl(url);
        
        // Reset for next recording
        audioChunksRef.current = [];
      });
      
      // Clear any previous recordings
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      setRecordingBlob(null);
      setRecordingTime(0);
      setIsRecording(true);
      setIsPaused(false);
      
      mediaRecorder.start();
      startTimer();
      
      toast.success("Recording started", {
        description: "Recording your audio..."
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Microphone access denied", {
        description: "Please allow microphone access to record audio."
      });
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    if (recordingTime < minRecordingTime) {
      toast.warning(`Recording is too short`, {
        description: `Please record for at least ${minRecordingTime} seconds.`
      });
      return;
    }
    
    mediaRecorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    
    toast.success("Recording completed", {
      description: `Audio recorded successfully (${recordingTime}s)`
    });
  };

  // Pause/resume recording functions
  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.pause();
    pauseTimer();
    setIsPaused(true);
  };

  const resumeRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.resume();
    startTimer();
    setIsPaused(false);
  };

  // Format time for display (MM:SS format)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle completion when a recording exists
  const handleComplete = () => {
    if (recordingBlob) {
      onRecordingComplete(recordingBlob);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        {/* Audio visualization component */}
        <div className="aspect-[4/1] w-full bg-secondary/20 rounded-lg overflow-hidden flex items-center justify-center">
          {isRecording ? (
            <AudioVisualizer audioData={audioData} isRecording={isRecording} isPaused={isPaused} />
          ) : (
            <div className="text-center">
              {audioUrl ? (
                <audio controls className="w-full" src={audioUrl}></audio>
              ) : (
                <p className="text-muted-foreground">Ready to record your audio...</p>
              )}
            </div>
          )}
        </div>

        {/* Recording time display */}
        <div className="flex justify-center">
          <div className={`text-2xl font-mono ${isRecording && !isPaused ? 'text-primary animate-pulse' : ''}`}>
            {formatTime(recordingTime)}
          </div>
        </div>

        {/* Recording controls */}
        <div className="flex flex-wrap gap-2 justify-center">
          {!isRecording ? (
            <>
              <Button 
                size="lg"
                onClick={startRecording}
                disabled={isRecording}
                className="gap-2"
              >
                <Mic className="h-5 w-5" />
                Start Recording
              </Button>
              
              {recordingBlob && (
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={handleComplete}
                  className="gap-2"
                >
                  Use Recording
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                variant="destructive" 
                size="lg"
                onClick={stopRecording}
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                Stop
              </Button>
              
              {!isPaused ? (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={pauseRecording}
                  className="gap-2"
                >
                  <Pause className="h-5 w-5" />
                  Pause
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={resumeRecording}
                  className="gap-2"
                >
                  <Play className="h-5 w-5" />
                  Resume
                </Button>
              )}
            </>
          )}
        </div>
        
        {/* Recording progress indicator */}
        {isRecording && minRecordingTime > 0 && (
          <div className="w-full mt-2">
            <div className="text-xs text-center text-muted-foreground mb-1">
              {recordingTime < minRecordingTime 
                ? `Record for at least ${minRecordingTime - recordingTime} more seconds...`
                : "Minimum recording time reached!"
              }
            </div>
            <div className="w-full bg-secondary/30 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${Math.min(100, (recordingTime / minRecordingTime) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;
