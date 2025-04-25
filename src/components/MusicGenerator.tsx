
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Music, Share, Download, Play, Pause } from 'lucide-react';
import { type Mood } from './MoodSelector';
import { toast } from 'sonner';

type MusicGeneratorProps = {
  audioBlob?: Blob | null;
  selectedMood: Mood | null;
};

// Simulated music generation using Web Audio API
// In a real app, this would use Magenta.js and other ML models
const generateMusicFromAudio = async (audioBlob: Blob, mood: Mood): Promise<Blob> => {
  console.log(`Generating ${mood} music from audio...`);
  
  // Simulate audio processing by the Web Audio API
  const audioContext = new AudioContext();
  const originalBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
  const duration = originalBuffer.duration;
  const sampleRate = originalBuffer.sampleRate;
  
  // Create a new buffer for our generated music
  // In a real implementation, Magenta.js would create actual music based on the mood
  const outputBuffer = audioContext.createBuffer(
    originalBuffer.numberOfChannels,
    originalBuffer.length,
    sampleRate
  );
  
  // Copy and modify the original audio based on mood
  for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
    const inputData = originalBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);
    
    // Apply different effects based on the selected mood
    switch (mood) {
      case 'happy':
        // Increase pitch (simple speed-up effect) and add "brightness"
        for (let i = 0; i < outputData.length; i++) {
          const newIndex = Math.floor(i * 1.05) % inputData.length;
          outputData[i] = inputData[newIndex] * 0.8 + (Math.random() * 0.1 - 0.05);
        }
        break;
        
      case 'calm':
        // Slow down and smooth out the audio
        for (let i = 0; i < outputData.length; i++) {
          const newIndex = Math.floor(i * 0.95) % inputData.length;
          // Apply a simple low-pass filter effect
          const prev = i > 0 ? outputData[i-1] : 0;
          outputData[i] = (inputData[newIndex] * 0.6 + prev * 0.4) * 0.9;
        }
        break;
        
      case 'energetic':
        // Add "punch" and some distortion
        for (let i = 0; i < outputData.length; i++) {
          // Add some beat effect every 0.25 seconds
          const beatEffect = i % (sampleRate / 4) < 1000 ? 1.2 : 1;
          outputData[i] = Math.tanh(inputData[i] * 1.5) * beatEffect;
        }
        break;
        
      case 'sad':
        // Lower pitch, add reverb-like effect
        for (let i = 0; i < outputData.length; i++) {
          const newIndex = Math.floor(i * 0.9) % inputData.length;
          // Simple delay/echo effect
          const echo = i > sampleRate * 0.3 ? inputData[i - Math.floor(sampleRate * 0.3)] * 0.3 : 0;
          outputData[i] = inputData[newIndex] * 0.7 + echo;
        }
        break;
        
      case 'angry':
        // Distortion and emphasis on bass
        for (let i = 0; i < outputData.length; i++) {
          // Hard clipping distortion
          const distorted = Math.sign(inputData[i]) * Math.sqrt(Math.abs(inputData[i]));
          // Emphasize low frequencies with a crude bass boost
          const bassBoost = i % 2 === 0 ? 1.3 : 1;
          outputData[i] = distorted * bassBoost;
        }
        break;
        
      default:
        // Default processing just copies the buffer
        for (let i = 0; i < outputData.length; i++) {
          outputData[i] = inputData[i];
        }
    }
  }
  
  // Convert buffer back to blob
  // In a real app, this would be the output from Magenta.js
  const offlineCtx = new OfflineAudioContext(
    outputBuffer.numberOfChannels, 
    outputBuffer.length, 
    outputBuffer.sampleRate
  );
  
  const source = offlineCtx.createBufferSource();
  source.buffer = outputBuffer;
  source.connect(offlineCtx.destination);
  source.start();
  
  // Render audio
  const renderedBuffer = await offlineCtx.startRendering();
  
  // Convert to WAV format
  const wavEncoder = await encodeWAV(renderedBuffer);
  
  // Simulate processing delay for realism
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return new Blob([wavEncoder], { type: 'audio/wav' });
};

// Simple WAV encoder for demo purposes
const encodeWAV = async (buffer: AudioBuffer): Promise<ArrayBuffer> => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2;
  const sampleRate = buffer.sampleRate;
  const result = new ArrayBuffer(44 + length);
  const view = new DataView(result);
  
  // RIFF chunk descriptor
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeUTFBytes(view, 8, 'WAVE');
  
  // FMT sub-chunk
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChan * 2, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true); // 16-bit
  
  // Data sub-chunk
  writeUTFBytes(view, 36, 'data');
  view.setUint32(40, length, true);
  
  // Write the PCM samples
  let offset = 44;
  const channelData = [];
  
  // Extract channels
  for (let i = 0; i < numOfChan; i++) {
    channelData.push(buffer.getChannelData(i));
  }
  
  // Interleave
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }
  
  return result;
};

const writeUTFBytes = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const MusicGenerator = ({ audioBlob, selectedMood }: MusicGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [processingStage, setProcessingStage] = useState<string>("waiting");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio URL from blob when component mounts or blob changes
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setOriginalAudioUrl(url);
      
      // Clean up when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);
  
  // Create audio element for playback control
  useEffect(() => {
    if (generatedMusicUrl && !audioRef.current) {
      const audio = new Audio(generatedMusicUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('play', () => setIsPlaying(true));
      audioRef.current = audio;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
        audioRef.current.removeEventListener('pause', () => setIsPlaying(false));
        audioRef.current.removeEventListener('play', () => setIsPlaying(true));
      }
    };
  }, [generatedMusicUrl]);

  const handleGenerateMusic = async () => {
    if (!audioBlob || !selectedMood) {
      toast.error("Missing requirements", {
        description: "Please record audio and select a mood first."
      });
      return;
    }

    setIsGenerating(true);
    setProcessingStage("analyzing");
    toast.info("Generating music", {
      description: "Creating your unique music track based on your mood..."
    });

    try {
      // First stage - analyzing audio
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Second stage - feature extraction
      setProcessingStage("extracting");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Third stage - generating music
      setProcessingStage("generating");
      
      // In a real application, this would call a service using Magenta.js and pyAudioAnalysis
      const generatedMusic = await generateMusicFromAudio(audioBlob, selectedMood);
      setGeneratedBlob(generatedMusic);
      
      // Create a URL for the generated music
      const musicUrl = URL.createObjectURL(generatedMusic);
      setGeneratedMusicUrl(musicUrl);
      
      toast.success("Music generated", {
        description: "Your custom track is ready to play and share!"
      });
    } catch (error) {
      console.error("Error generating music:", error);
      toast.error("Generation failed", {
        description: "There was an error generating your music. Please try again."
      });
    } finally {
      setIsGenerating(false);
      setProcessingStage("complete");
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleShare = async () => {
    if (!generatedMusicUrl) return;

    setIsSharing(true);
    
    try {
      // In a real application, this would create a shareable link
      if (navigator.share && generatedBlob) {
        const file = new File([generatedBlob], `${selectedMood}-music-creation.wav`, { type: 'audio/wav' });
        await navigator.share({
          title: `My ${selectedMood} Music Creation`,
          text: `Check out the music I created with Audio Emotion Scapes!`,
          files: [file]
        });
        toast.success("Shared successfully");
      } else {
        // Fallback for browsers that don't support the Web Share API
        toast.info("Sharing link copied", {
          description: "The link to your music has been copied to clipboard."
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Sharing failed", {
        description: "There was an error sharing your music. Please try again."
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = () => {
    if (!generatedMusicUrl || !selectedMood) return;
    
    const a = document.createElement('a');
    a.href = generatedMusicUrl;
    a.download = `${selectedMood}-music-creation-${new Date().toISOString()}.wav`;
    a.click();
    
    toast.success("Music downloaded", {
      description: "Your generated music has been saved to your device."
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Music Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {originalAudioUrl && (
          <div className="p-4 bg-secondary/10 rounded-md">
            <p className="mb-2 font-medium">Your Original Recording</p>
            <audio controls className="w-full" src={originalAudioUrl}></audio>
          </div>
        )}
        
        {!generatedMusicUrl ? (
          <div className="text-center p-6 border border-dashed rounded-md border-muted-foreground/50">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  {processingStage === "analyzing" && "Analyzing audio features..."}
                  {processingStage === "extracting" && "Extracting emotion patterns..."}
                  {processingStage === "generating" && `Creating your unique ${selectedMood} track...`}
                </p>
                <div className="w-full max-w-xs bg-secondary/30 h-2 rounded-full mt-2">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ 
                      width: processingStage === "analyzing" ? "33%" : 
                             processingStage === "extracting" ? "66%" : 
                             processingStage === "generating" ? "90%" : "0%" 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Simulating Magenta.js processing to create music based on your recording
                </p>
              </div>
            ) : (
              <>
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground/70" />
                <p className="mb-2">Ready to transform your recording into music</p>
                <p className="text-sm text-muted-foreground">
                  Our AI will generate a unique track based on your audio and selected {selectedMood} mood
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-secondary/20 rounded-md">
              <p className="mb-2 font-medium">Your {selectedMood} Music Creation</p>
              <audio 
                controls 
                className="w-full" 
                src={generatedMusicUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              ></audio>
              <p className="text-xs text-muted-foreground mt-2">
                This is a simulated audio transformation based on your recording mood.
                In a production app, we would use Magenta.js for more sophisticated music generation.
              </p>
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share className="h-4 w-4" />}
                Share Creation
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!generatedMusicUrl && (
          <Button 
            onClick={handleGenerateMusic} 
            disabled={isGenerating || !audioBlob || !selectedMood}
            className="w-full gap-2"
          >
            {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate Music
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MusicGenerator;
