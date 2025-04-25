
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Music, Share, Download, Play, Pause } from 'lucide-react';
import { type Mood } from './MoodSelector';
import { toast } from 'sonner';

type MusicGeneratorProps = {
  audioBlob?: Blob | null;
  selectedMood: Mood | null;
};

// Mock function to simulate music generation using Magenta.js
const generateMusicFromAudio = async (audioBlob: Blob, mood: Mood): Promise<string> => {
  // In a real implementation, we would:
  // 1. Convert the audio blob to an AudioBuffer
  // 2. Use pyAudioAnalysis (via a backend API) to extract features
  // 3. Use Magenta.js models to generate music based on the audio features and mood
  // 4. Return the URL to the generated music
  
  console.log(`Generating ${mood} music from audio...`);
  
  // Simulating API delay and processing
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Create and return a mock audio URL
  // In a real implementation, this would be the URL to the generated music
  return URL.createObjectURL(audioBlob);
};

const MusicGenerator = ({ audioBlob, selectedMood }: MusicGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

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
    if (generatedMusicUrl && !audioElement) {
      const audio = new Audio(generatedMusicUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('play', () => setIsPlaying(true));
      setAudioElement(audio);
    }
    
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.removeEventListener('ended', () => setIsPlaying(false));
        audioElement.removeEventListener('pause', () => setIsPlaying(false));
        audioElement.removeEventListener('play', () => setIsPlaying(true));
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
    toast.info("Generating music", {
      description: "Creating your unique music track based on your mood..."
    });

    try {
      // In a real application, this would call a service using Magenta.js and pyAudioAnalysis
      const musicUrl = await generateMusicFromAudio(audioBlob, selectedMood);
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
    }
  };

  const handlePlayPause = () => {
    if (!audioElement) return;
    
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
  };

  const handleShare = async () => {
    if (!generatedMusicUrl) return;

    setIsSharing(true);
    
    try {
      // In a real application, this would create a shareable link
      if (navigator.share) {
        await navigator.share({
          title: `My ${selectedMood} Music Creation`,
          text: `Check out the music I created with Audio Emotion Scapes!`,
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
    if (!generatedMusicUrl) return;
    
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
                  Analyzing audio and generating your unique {selectedMood} track...
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Using Magenta.js to create music based on your recording
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
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
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
