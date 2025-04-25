
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Music, Share } from 'lucide-react';
import { type Mood } from './MoodSelector';
import { toast } from 'sonner';

type MusicGeneratorProps = {
  audioBlob?: Blob | null;
  selectedMood: Mood | null;
};

// Mock function to simulate music generation - in a real app, this would use Magenta or other ML models
const generateMusicFromAudio = async (audioBlob: Blob, mood: Mood): Promise<string> => {
  // This is a mock implementation
  // In a real app, we would:
  // 1. Send the audio to a backend service
  // 2. Process it with Magenta models based on the mood
  // 3. Return a URL to the generated music
  
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // For demo purposes, return a mock URL
  return `data:audio/mp3;base64,${btoa(`mock-music-${mood}-${Date.now()}`)}`;
};

const MusicGenerator = ({ audioBlob, selectedMood }: MusicGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

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
      // In a real application, this would call an actual service using Magenta
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

  const handleShare = async () => {
    if (!generatedMusicUrl) return;

    setIsSharing(true);
    
    try {
      // In a real application, this would create a shareable link or file
      // For now we'll simulate the sharing behavior
      
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: `My ${selectedMood} Music Creation`,
          text: `Check out the music I created with Audio Emotion Scapes!`,
          // url: generatedMusicUrl // In a real app, this would be a public URL
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Music Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedMusicUrl ? (
          <div className="text-center p-6 border border-dashed rounded-md border-muted-foreground/50">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating your unique track based on your {selectedMood} mood...</p>
              </div>
            ) : (
              <>
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground/70" />
                <p className="mb-2">Ready to transform your recording into music</p>
                <p className="text-sm text-muted-foreground">
                  Our AI will generate a unique track based on your audio and selected mood
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-secondary/20 rounded-md">
              <p className="mb-2 font-medium">Your {selectedMood} Music Creation</p>
              <audio controls className="w-full" src={generatedMusicUrl}></audio>
            </div>
            <div className="flex justify-center">
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
