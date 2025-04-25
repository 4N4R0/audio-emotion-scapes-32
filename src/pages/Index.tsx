
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Headphones, Mic, Share2 } from 'lucide-react';
import AudioRecorder from '@/components/AudioRecorder';
import MoodSelector, { type Mood } from '@/components/MoodSelector';
import MusicGenerator from '@/components/MusicGenerator';
import EmotionDetector from '@/components/EmotionDetector';
import { toast } from 'sonner';

const Index = () => {
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [aiSuggestedMood, setAiSuggestedMood] = useState<Mood | null>(null);
  const [activeTab, setActiveTab] = useState('record');

  const handleRecordingComplete = (blob: Blob) => {
    setRecordingBlob(blob);
    setActiveTab('mood');
    toast.success("Audio recorded", {
      description: "Now select a mood for your music generation"
    });
  };

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    // Automatically move to generate tab when mood is selected
    setActiveTab('generate');
  };

  const handleEmotionDetected = (mood: Mood) => {
    setAiSuggestedMood(mood);
    // Don't automatically select it, but suggest it
    toast.info("AI mood suggestion", {
      description: `Based on your audio, we suggest a '${mood}' mood. You can use this or choose another.`
    });
  };

  // Function to format file size
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get recording metadata
  const recordingInfo = recordingBlob ? {
    size: formatFileSize(recordingBlob.size),
    type: recordingBlob.type,
    lastModified: new Date().toLocaleString()
  } : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with dynamic mood gradient */}
      <header className={`p-6 ${selectedMood ? `mood-gradient-${selectedMood}` : 'bg-primary/10'}`}>
        <div className="container">
          <h1 className="text-2xl md:text-4xl font-bold text-center">
            Audio Emotion Scapes
          </h1>
          <p className="text-center mt-2 max-w-xl mx-auto">
            Transform your voice recordings into unique music tracks based on emotions
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-4xl py-8 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="record" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Record</span>
            </TabsTrigger>
            <TabsTrigger value="mood" className="flex items-center gap-2" disabled={!recordingBlob}>
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Select Mood</span>
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2" disabled={!selectedMood || !recordingBlob}>
              <Headphones className="h-4 w-4" />
              <span className="hidden sm:inline">Generate</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Tab Content */}
          <TabsContent value="record" className="space-y-8">
            <div className="prose max-w-none dark:prose-invert mb-6">
              <h2 className="text-2xl font-bold">Record Your Audio</h2>
              <p>
                Record at least 30 seconds of audio. You can record your voice, ambient sounds,
                beatboxing, or any audio that expresses your current mood.
              </p>
            </div>
            
            <AudioRecorder onRecordingComplete={handleRecordingComplete} minRecordingTime={30} />
            
            {recordingInfo && (
              <div className="text-sm text-muted-foreground">
                <p>Recording saved: {recordingInfo.type} ({recordingInfo.size})</p>
                <p>Created: {recordingInfo.lastModified}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mood" className="space-y-8">
            <div className="prose max-w-none dark:prose-invert mb-6">
              <h2 className="text-2xl font-bold">Choose Your Mood</h2>
              <p>
                Select a mood for your music generation or let our AI detect the emotion in your recording.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MoodSelector 
                  selectedMood={selectedMood}
                  onMoodSelect={handleMoodSelect}
                  aiSuggestedMood={aiSuggestedMood}
                />
              </div>
              <div>
                <EmotionDetector 
                  audioBlob={recordingBlob}
                  onEmotionDetected={handleEmotionDetected}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="generate" className="space-y-8">
            <div className="prose max-w-none dark:prose-invert mb-6">
              <h2 className="text-2xl font-bold">Generate Your Music</h2>
              <p>
                Transform your audio into a unique music track based on your selected {selectedMood} mood.
              </p>
              <p className="text-sm text-muted-foreground">
                This demonstration uses simulated AI functionality. In a production app, it would 
                use Magenta.js for music generation and pyAudioAnalysis for audio feature extraction.
              </p>
            </div>
            
            <MusicGenerator 
              audioBlob={recordingBlob}
              selectedMood={selectedMood}
            />
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="bg-background py-6 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Audio Emotion Scapes - Transform your emotions into music</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
