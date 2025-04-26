import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Music, Share, Download, Play, Pause, List } from 'lucide-react';
import { type Mood } from './MoodSelector';
import { toast } from 'sonner';

// Custom error types
class MoodNotFoundException extends Error {
  constructor() {
    super("No mood selection found. Please select a mood.");
    this.name = "MoodNotFoundException";
  }
}

class SongGeneratorException extends Error {
  constructor() {
    super("Error in generating the song. Please try again.");
    this.name = "SongGeneratorException";
  }
}

class SaveSongException extends Error {
  constructor() {
    super("Failed to save the song. Please check your storage settings.");
    this.name = "SaveSongException";
  }
}

// Types
type VoiceInput = {
  blob: Blob;
  duration: number;
  type: string;
};

type MoodInput = {
  mood: Mood;
  intensity: number;
};

type GeneratedSong = {
  id: string;
  title: string;
  duration: number;
  moodType: Mood;
  blob: Blob;
  url: string;
  createdAt: Date;
};

type MusicGeneratorProps = {
  audioBlob?: Blob | null;
  selectedMood: Mood | null;
};

// Simulated music generation using Web Audio API
const generateMusicFromAudio = async (audioBlob: Blob, mood: Mood): Promise<Blob> => {
  console.log(`Generating ${mood} music from audio...`);
  
  const audioContext = new AudioContext();
  const originalBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
  const duration = originalBuffer.duration;
  const sampleRate = originalBuffer.sampleRate;
  
  const outputBuffer = audioContext.createBuffer(
    originalBuffer.numberOfChannels,
    originalBuffer.length,
    sampleRate
  );
  
  for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
    const inputData = originalBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);
    
    switch (mood) {
      case 'happy':
        // Increase tempo and pitch for happy mood
        for (let i = 0; i < outputData.length; i++) {
          const newIndex = Math.floor(i * 1.15) % inputData.length;
          outputData[i] = inputData[newIndex] * 0.8 + (Math.random() * 0.1 - 0.05);
        }
        break;
        
      case 'calm':
        // Enhanced calm mood processing with proper reverb, softening, and smoother transitions
        
        // Apply more sophisticated reverb and smoothing for calm mood
        const reverbTime = 0.7; // reverb time in seconds
        const decay = Math.exp(-3.0 / (sampleRate * reverbTime));
        let reverbBuffer = new Float32Array(Math.ceil(reverbTime * sampleRate));
        
        // Create a smooth fade-in at the beginning
        const fadeInSamples = Math.floor(sampleRate * 0.5); // 0.5 second fade in
        
        // Low-pass filter parameters for smooth, warmer sound
        const filterStrength = 0.85;
        
        // Previous samples for smoother transitions
        let prev1 = 0, prev2 = 0, prev3 = 0;
        
        for (let i = 0; i < outputData.length; i++) {
          // Slow down by stretching (using a slower index)
          const newIndex = Math.floor(i * 0.8) % inputData.length;
          
          // Get base sample with gentle amplitude reduction
          let sample = inputData[newIndex] * 0.5;
          
          // Apply fade-in at the beginning
          if (i < fadeInSamples) {
            sample *= (i / fadeInSamples);
          }
          
          // Apply low-pass filter for warmer sound (reduce harsh frequencies)
          sample = (sample * (1 - filterStrength)) + (prev1 * filterStrength * 0.7) + 
                   (prev2 * filterStrength * 0.2) + (prev3 * filterStrength * 0.1);
          prev3 = prev2;
          prev2 = prev1;
          prev1 = sample;
          
          // Create reverb effect
          if (i % 500 === 0) { // Update reverb buffer occasionally to create gentle movement
            for (let j = 0; j < reverbBuffer.length; j++) {
              reverbBuffer[j] = 0;
            }
          }
          
          // Apply the reverb
          let reverbSample = 0;
          if (i > 0) {
            // Update the reverb buffer
            for (let j = 0; j < reverbBuffer.length - 1; j++) {
              reverbBuffer[j] = reverbBuffer[j + 1] * decay;
              reverbSample += reverbBuffer[j];
            }
            reverbBuffer[reverbBuffer.length - 1] = sample;
            reverbSample += sample;
            
            // Normalize reverb to avoid clipping
            reverbSample *= 0.2;
          }
          
          // Combine direct sound with reverb
          outputData[i] = sample * 0.6 + reverbSample * 0.4;
          
          // Add a very subtle modulation to avoid "dead" sound
          if (i % 8000 < 4000) { // Very slow gentle wave
            outputData[i] *= 1.0 + (0.05 * Math.sin(i / 8000 * Math.PI));
          }
          
          // Ensure we don't clip
          outputData[i] = Math.max(-0.9, Math.min(0.9, outputData[i]));
        }
        break;
        
      case 'energetic':
        // Increase tempo, add beats, enhance high frequencies for energetic mood
        for (let i = 0; i < outputData.length; i++) {
          // Add a rhythmic beat effect
          const beatEffect = (i % Math.floor(sampleRate / 3)) < Math.floor(sampleRate / 12) ? 1.4 : 1;
          const newIndex = Math.floor(i * 1.2) % inputData.length;
          
          // Apply light distortion for more energy
          const distorted = Math.tanh(inputData[newIndex] * 1.25);
          outputData[i] = distorted * beatEffect;
        }
        break;
        
      case 'sad':
        // Slow tempo, add echo, lower pitch for sad mood
        for (let i = 0; i < outputData.length; i++) {
          const newIndex = Math.floor(i * 0.85) % inputData.length;
          const echo = i > sampleRate * 0.45 ? inputData[i - Math.floor(sampleRate * 0.45)] * 0.35 : 0;
          outputData[i] = inputData[newIndex] * 0.7 + echo;
        }
        break;
        
      case 'angry':
        // Distort sound, add bass emphasis, irregular beats for angry mood
        for (let i = 0; i < outputData.length; i++) {
          // Heavy distortion with clipping
          const distorted = Math.sign(inputData[i]) * Math.pow(Math.abs(inputData[i]), 0.7);
          
          // Add irregular beats
          const irregularBeat = ((i + Math.floor(i / 1.7)) % Math.floor(sampleRate / 2)) < Math.floor(sampleRate / 8) ? 1.6 : 1;
          
          // Enhance bass frequencies
          const bassBoost = i % 3 === 0 ? 1.4 : 1;
          outputData[i] = distorted * bassBoost * irregularBeat;
        }
        break;
        
      default:
        // Just copy the input if no mood specified
        for (let i = 0; i < outputData.length; i++) {
          outputData[i] = inputData[i];
        }
    }
  }
  
  const offlineCtx = new OfflineAudioContext(
    outputBuffer.numberOfChannels, 
    outputBuffer.length, 
    outputBuffer.sampleRate
  );
  
  const source = offlineCtx.createBufferSource();
  source.buffer = outputBuffer;
  source.connect(offlineCtx.destination);
  source.start();
  
  const renderedBuffer = await offlineCtx.startRendering();
  
  const wavEncoder = await encodeWAV(renderedBuffer);
  
  // Reduced simulation delay to improve user experience
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return new Blob([wavEncoder], { type: 'audio/wav' });
};

const encodeWAV = async (buffer: AudioBuffer): Promise<ArrayBuffer> => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2;
  const sampleRate = buffer.sampleRate;
  const result = new ArrayBuffer(44 + length);
  const view = new DataView(result);
  
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeUTFBytes(view, 8, 'WAVE');
  
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChan * 2, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);
  
  writeUTFBytes(view, 36, 'data');
  view.setUint32(40, length, true);
  
  let offset = 44;
  const channelData = [];
  
  for (let i = 0; i < numOfChan; i++) {
    channelData.push(buffer.getChannelData(i));
  }
  
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
  const [generatedSongs, setGeneratedSongs] = useState<GeneratedSong[]>([]);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setOriginalAudioUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
      audioRef.current.removeEventListener('pause', () => setIsPlaying(false));
      audioRef.current.removeEventListener('play', () => setIsPlaying(true));
    }
    
    if (generatedMusicUrl) {
      const audio = new Audio(generatedMusicUrl);
      
      const handleEnded = () => setIsPlaying(false);
      const handlePause = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('play', handlePlay);
      
      audioRef.current = audio;
      
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.removeEventListener('pause', handlePause);
          audioRef.current.removeEventListener('play', handlePlay);
        }
      };
    }
  }, [generatedMusicUrl]);
  
  useEffect(() => {
    if (audioElementRef.current) {
      const element = audioElementRef.current;
      const handleVisiblePlay = () => setIsPlaying(true);
      const handleVisiblePause = () => setIsPlaying(false);
      const handleVisibleEnded = () => setIsPlaying(false);
      
      element.addEventListener('play', handleVisiblePlay);
      element.addEventListener('pause', handleVisiblePause);
      element.addEventListener('ended', handleVisibleEnded);
      
      return () => {
        element.removeEventListener('play', handleVisiblePlay);
        element.removeEventListener('pause', handleVisiblePause);
        element.removeEventListener('ended', handleVisibleEnded);
      };
    }
  }, []);

  const getMoodSelection = (): MoodInput => {
    if (!selectedMood) {
      throw new MoodNotFoundException();
    }
    
    return {
      mood: selectedMood,
      intensity: 0.8
    };
  };

  const processOutput = async (voice: VoiceInput, mood: MoodInput): Promise<GeneratedSong> => {
    try {
      const generatedMusic = await generateMusicFromAudio(voice.blob, mood.mood);
      const musicUrl = URL.createObjectURL(generatedMusic);
      
      const song: GeneratedSong = {
        id: `song-${Date.now().toString(36)}`,
        title: `${mood.mood} Creation ${new Date().toLocaleTimeString()}`,
        duration: voice.duration,
        moodType: mood.mood,
        blob: generatedMusic,
        url: musicUrl,
        createdAt: new Date()
      };
      
      return song;
    } catch (error) {
      console.error("Error in processOutput:", error);
      throw new SongGeneratorException();
    }
  };

  const saveSongOption = async (song: GeneratedSong): Promise<boolean> => {
    try {
      setGeneratedSongs(prev => [song, ...prev].slice(0, 10));
      return true;
    } catch (error) {
      console.error("Error in saveSongOption:", error);
      throw new SaveSongException();
    }
  };

  const handleGenerateMusic = async () => {
    if (!audioBlob || !selectedMood) {
      toast.error("Missing requirements", {
        description: "Please record audio and select a mood first."
      });
      return;
    }

    if (generatedMusicUrl) {
      URL.revokeObjectURL(generatedMusicUrl);
      setGeneratedMusicUrl(null);
    }

    setIsGenerating(true);
    setProcessingStage("analyzing");
    toast.info("Generating music", {
      description: "Creating your unique music track based on your mood..."
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStage("extracting");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStage("generating");
      
      const moodInput = getMoodSelection();
      
      const voiceInput: VoiceInput = {
        blob: audioBlob,
        duration: 30,
        type: audioBlob.type
      };
      
      const song = await processOutput(voiceInput, moodInput);
      
      await saveSongOption(song);
      setGeneratedBlob(song.blob);
      
      setGeneratedMusicUrl(song.url);
      
      toast.success("Music generated", {
        description: "Your custom track is ready to play and share!"
      });
    } catch (error) {
      if (error instanceof MoodNotFoundException || 
          error instanceof SongGeneratorException ||
          error instanceof SaveSongException) {
        toast.error(error.name, {
          description: error.message
        });
      } else {
        console.error("Error generating music:", error);
        toast.error("Generation failed", {
          description: "There was an error generating your music. Please try again."
        });
      }
    } finally {
      setIsGenerating(false);
      setProcessingStage("complete");
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !generatedMusicUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        if (!audioRef.current.src || audioRef.current.src !== generatedMusicUrl) {
          audioRef.current.src = generatedMusicUrl;
          audioRef.current.load();
        }
        
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(err => {
              console.error('Error playing audio:', err);
              toast.error("Playback error", {
                description: "Could not play the audio. Please try again."
              });
            });
        }
      } catch (err) {
        console.error('Error setting up audio playback:', err);
        toast.error("Audio setup error", {
          description: "There was a problem setting up audio playback."
        });
      }
    }
  };

  const handleShare = async () => {
    if (!generatedBlob) {
      toast.error("Nothing to share", { 
        description: "Please generate music first."
      });
      return;
    }

    setIsSharing(true);
    
    try {
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([generatedBlob], `${selectedMood}-music-creation.wav`, { 
            type: 'audio/wav' 
          });
          
          const shareData = {
            title: `My ${selectedMood} Music Creation`,
            text: `Check out the music I created with Audio Emotion Scapes!`
          };
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              ...shareData,
              files: [file]
            });
          } else {
            await navigator.share(shareData);
          }
          
          toast.success("Shared successfully");
        } catch (err) {
          console.error("Web Share API error:", err);
          await navigator.clipboard.writeText("Your music has been generated! (This is a demo link)");
          toast.info("Sharing link copied", {
            description: "The link to your music has been copied to clipboard."
          });
        }
      } else {
        await navigator.clipboard.writeText("Your music has been generated! (This is a demo link)");
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
    if (!generatedMusicUrl || !selectedMood) {
      toast.error("Nothing to download", {
        description: "Please generate music first."
      });
      return;
    }
    
    try {
      const a = document.createElement('a');
      a.href = generatedMusicUrl;
      a.download = `${selectedMood}-music-creation-${new Date().toISOString()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("Music downloaded", {
        description: "Your generated music has been saved to your device."
      });
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Download failed", {
        description: "There was an error downloading your music. Please try again."
      });
    }
  };

  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
  };

  const playSongFromPlaylist = (song: GeneratedSong) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (generatedMusicUrl) {
      URL.revokeObjectURL(generatedMusicUrl);
    }
    
    const audio = new Audio(song.url);
    
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    
    audioRef.current = audio;
    
    try {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setGeneratedMusicUrl(song.url);
            setGeneratedBlob(song.blob);
            
            if (audioElementRef.current && audioElementRef.current.src !== song.url) {
              audioElementRef.current.src = song.url;
              audioElementRef.current.load();
            }
            
            toast.info("Now playing", {
              description: `Playing ${song.title}`
            });
          })
          .catch(err => {
            console.error('Error playing audio from playlist:', err);
            toast.error("Playback error", {
              description: "Could not play the selected song. Please try again."
            });
          });
      }
    } catch (err) {
      console.error('Error setting up playlist audio:', err);
      toast.error("Audio setup error", {
        description: "There was a problem setting up audio playback."
      });
    }
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
            <audio 
              controls 
              className="w-full" 
              src={originalAudioUrl}
              onError={(e) => {
                console.error("Error with original audio playback:", e);
              }}
            ></audio>
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
                ref={audioElementRef}
                controls 
                className="w-full" 
                src={generatedMusicUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error("Error with generated audio playback:", e);
                  toast.error("Audio playback issue", {
                    description: "There was a problem playing the generated audio. Please try regenerating or download the file instead."
                  });
                }}
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
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={togglePlaylist}
              >
                <List className="h-4 w-4" />
                {showPlaylist ? "Hide Playlist" : "Show Playlist"}
              </Button>
            </div>
            
            {showPlaylist && (
              <div className="mt-4 border rounded-md">
                <div className="p-3 bg-secondary/10 border-b font-medium">Generated Song Playlist</div>
                <div className="max-h-60 overflow-y-auto">
                  {generatedSongs.length > 0 ? (
                    <ul className="divide-y">
                      {generatedSongs.map((song) => (
                        <li key={song.id} className="p-3 hover:bg-secondary/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{song.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {song.moodType} • {new Date(song.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => playSongFromPlaylist(song)}
                              className="h-8 w-8 p-0"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No songs generated yet. Create more songs to build your playlist.
                    </div>
                  )}
                </div>
              </div>
            )}
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
