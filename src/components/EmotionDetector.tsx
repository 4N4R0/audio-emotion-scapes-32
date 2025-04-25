
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Brain } from 'lucide-react';
import { type Mood } from './MoodSelector';
import { toast } from 'sonner';

type EmotionDetectorProps = {
  audioBlob?: Blob | null;
  onEmotionDetected: (mood: Mood) => void;
};

// Mock function to simulate emotion detection - in a real app, this would use ML models
const detectEmotionFromAudio = async (audioBlob: Blob): Promise<Mood> => {
  // This is a mock implementation
  // In a real app, this would:
  // 1. Send the audio to a backend service or use a local ML model
  // 2. Analyze the audio for emotional content
  // 3. Return the detected emotion
  
  // Simulating processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For demo purposes, return a random mood
  const moods: Mood[] = ['happy', 'calm', 'energetic', 'sad', 'angry'];
  return moods[Math.floor(Math.random() * moods.length)];
};

const EmotionDetector = ({ audioBlob, onEmotionDetected }: EmotionDetectorProps) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<Mood | null>(null);

  const handleDetectEmotion = async () => {
    if (!audioBlob) {
      toast.error("No audio recording", {
        description: "Please record audio first to detect emotions."
      });
      return;
    }

    setIsDetecting(true);
    toast.info("Analyzing audio", {
      description: "Detecting emotions in your recording..."
    });

    try {
      // In a real application, this would call an actual AI service
      const mood = await detectEmotionFromAudio(audioBlob);
      setDetectedEmotion(mood);
      onEmotionDetected(mood);
      toast.success("Emotion detected", {
        description: `We detected a ${mood} mood in your recording.`
      });
    } catch (error) {
      console.error("Error detecting emotion:", error);
      toast.error("Detection failed", {
        description: "There was an error analyzing your audio. Please try again."
      });
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Emotion Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6 border border-dashed rounded-md border-muted-foreground/50">
          {isDetecting ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing your audio to detect emotions...</p>
            </div>
          ) : (
            <>
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/70" />
              <p className="mb-2">{detectedEmotion 
                ? `Detected mood: ${detectedEmotion}` 
                : "Let AI analyze your recording"}
              </p>
              <p className="text-sm text-muted-foreground">
                Our emotion detection AI will analyze your voice and sounds to suggest a matching mood
              </p>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleDetectEmotion} 
          disabled={isDetecting || !audioBlob}
          variant={detectedEmotion ? "secondary" : "default"}
          className="w-full gap-2"
        >
          {isDetecting && <Loader2 className="h-4 w-4 animate-spin" />}
          {detectedEmotion ? "Detect Again" : "Detect Emotion"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmotionDetector;
