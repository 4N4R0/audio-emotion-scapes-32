
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

// Simulated SER toolkit using Web Audio API for basic analysis
const detectEmotionFromAudio = async (audioBlob: Blob): Promise<{ mood: Mood; confidence: number }> => {
  // This simulates what a real SER toolkit would do with machine learning
  console.log("Analyzing audio for emotional content...");
  
  // Create an audio context to analyze the audio
  const audioContext = new AudioContext();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Get audio data for analysis
  const channelData = audioBuffer.getChannelData(0);
  
  // Simplified audio feature extraction
  // In a real implementation, we would:
  // 1. Calculate MFCC (Mel-frequency cepstral coefficients)
  // 2. Extract pitch and energy features
  // 3. Feed these into a pre-trained model
  
  // Calculate simple energy metrics
  let totalEnergy = 0;
  let highFreqEnergy = 0;
  let lowFreqEnergy = 0;
  const sampleLength = channelData.length;
  
  // Simple energy calculation
  for (let i = 0; i < sampleLength; i++) {
    const value = channelData[i];
    totalEnergy += value * value;
    
    // Crude frequency splitting (real implementations use FFT)
    if (i % 2 === 0) {
      highFreqEnergy += value * value;
    } else {
      lowFreqEnergy += value * value;
    }
  }
  
  // Normalize energies
  totalEnergy /= sampleLength;
  highFreqEnergy = highFreqEnergy / (sampleLength / 2);
  lowFreqEnergy = lowFreqEnergy / (sampleLength / 2);
  
  // Simple rule-based classification
  // In real ML models, these would be learned weights and thresholds
  const energyRatio = highFreqEnergy / (lowFreqEnergy + 0.0001);
  
  console.log("Audio analysis:", { 
    totalEnergy, 
    highFreqEnergy, 
    lowFreqEnergy, 
    energyRatio 
  });
  
  // For demo purposes, determine mood based on simple audio features
  // High energy + high frequency = energetic/angry
  // High energy + low frequency = happy
  // Low energy + high frequency = sad
  // Low energy + low frequency = calm
  
  let mood: Mood;
  let confidence = 0.7; // Base confidence
  
  if (totalEnergy > 0.01) {
    if (energyRatio > 1.1) {
      // High energy and high frequency components
      mood = Math.random() > 0.5 ? 'energetic' : 'angry';
      confidence = 0.7 + (energyRatio - 1) * 0.2;
    } else {
      // High energy but lower frequency
      mood = 'happy';
      confidence = 0.7 + totalEnergy * 5;
    }
  } else {
    if (energyRatio > 1.1) {
      // Low energy but higher frequency components
      mood = 'sad';
      confidence = 0.7 + (energyRatio - 1) * 0.2;
    } else {
      // Low energy and low frequency
      mood = 'calm';
      confidence = 0.7 + (1 - energyRatio) * 0.2;
    }
  }
  
  // Cap confidence at 0.95
  confidence = Math.min(confidence, 0.95);
  
  // Add some randomness to make it feel more realistic
  if (Math.random() < 0.2) {
    const moods: Mood[] = ['happy', 'calm', 'energetic', 'sad', 'angry'];
    const currentIndex = moods.indexOf(mood);
    const availableMoods = moods.filter((_, index) => index !== currentIndex);
    mood = availableMoods[Math.floor(Math.random() * availableMoods.length)];
    confidence = 0.6 + Math.random() * 0.2;
  }
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return { mood, confidence };
};

const EmotionDetector = ({ audioBlob, onEmotionDetected }: EmotionDetectorProps) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<Mood | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const handleDetectEmotion = async () => {
    if (!audioBlob) {
      toast.error("No audio recording", {
        description: "Please record audio first to detect emotions."
      });
      return;
    }

    setIsDetecting(true);
    toast.info("Analyzing audio", {
      description: "Detecting emotions in your recording using SER toolkit simulation..."
    });

    try {
      // In a real application, this would call an actual SER toolkit
      const result = await detectEmotionFromAudio(audioBlob);
      setDetectedEmotion(result.mood);
      setConfidence(result.confidence);
      onEmotionDetected(result.mood);
      toast.success("Emotion detected", {
        description: `We detected a ${result.mood} mood in your recording with ${Math.round(result.confidence * 100)}% confidence.`
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
              <p className="text-xs text-muted-foreground/70">
                Extracting audio features and processing with SER model
              </p>
            </div>
          ) : (
            <>
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/70" />
              {detectedEmotion ? (
                <>
                  <p className="mb-2 font-medium">Detected mood: {detectedEmotion}</p>
                  {confidence && (
                    <div className="w-full bg-secondary/30 h-2 rounded-full mt-2 mb-4">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${confidence * 100}%` }}
                      ></div>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {confidence && `${Math.round(confidence * 100)}% confidence score`}
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-2">Let AI analyze your recording</p>
                  <p className="text-sm text-muted-foreground">
                    Our emotion detection simulates a SER toolkit to analyze your voice and sounds
                  </p>
                </>
              )}
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
