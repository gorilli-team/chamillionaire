import { useState } from "react";

interface UseVoiceReturn {
  isSpeaking: boolean;
  currentMessage: string;
  highlightedIndex: number;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");

  const stopSpeaking = () => {
    setIsSpeaking(false);
    setCurrentMessage("");
    speechSynthesis.cancel();
  };

  const speak = (text: string) => {
    console.log("speaking", text);
    setCurrentMessage(text);
    setIsSpeaking(true);
    setHighlightedIndex(0);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9; // Slightly slower for better sync
    const voices = speechSynthesis.getVoices();
    const englishVoice =
      voices.find(
        (voice) => voice.lang.includes("en") && voice.name.includes("Google")
      ) || voices.find((voice) => voice.lang.includes("en"));
    utterance.voice = englishVoice || null;

    let currentWordIndex = 0;
    const words = text.split(" ");
    let currentPosition = 0;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        // Calculate the position of the current word group (2-3 words)
        const groupSize = Math.min(3, words.length - currentWordIndex);
        currentPosition =
          words.slice(0, currentWordIndex).join(" ").length +
          (currentWordIndex > 0 ? 1 : 0);
        setHighlightedIndex(currentPosition);
        currentWordIndex += groupSize;
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setHighlightedIndex(text.length);
    };

    speechSynthesis.speak(utterance);
  };

  return {
    isSpeaking,
    currentMessage,
    highlightedIndex,
    speak,
    stopSpeaking,
  };
}
