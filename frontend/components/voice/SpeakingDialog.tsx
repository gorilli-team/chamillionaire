import React, { useEffect, useState, useRef } from "react";

interface SpeakingDialogProps {
  isSpeaking: boolean;
  currentMessage: string;
  onClose: () => void;
}

export function SpeakingDialog({
  isSpeaking,
  currentMessage,
  onClose,
}: SpeakingDialogProps) {
  const [highlightPosition, setHighlightPosition] = useState(0);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [hasSpeechEnded, setHasSpeechEnded] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordGroupsRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);

  console.log("isSpeaking", isSpeaking);

  // Process the text into word groups (2-3 words each)
  useEffect(() => {
    if (!currentMessage) {
      wordGroupsRef.current = [];
      return;
    }

    const words = currentMessage.split(" ");
    const wordGroups = [];
    let i = 0;

    while (i < words.length) {
      // Create groups of 2-3 words
      const groupSize = Math.min(2, words.length - i);
      const group = words.slice(i, i + groupSize).join(" ");
      wordGroups.push(group);
      i += groupSize;
    }

    wordGroupsRef.current = wordGroups;
  }, [currentMessage]);

  // Create word index map for highlighting
  const createWordIndexMap = () => {
    if (!currentMessage) return new Map();

    const words = currentMessage.split(" ");
    const map = new Map();
    let charIndex = 0;

    for (let i = 0; i < words.length; i++) {
      map.set(charIndex, Math.floor(i / 2)); // Map to word group index (2 words per group)
      charIndex += words[i].length + 1; // +1 for space
    }

    return map;
  };

  // Reset state when message changes
  useEffect(() => {
    setHighlightPosition(0);
    setIsHighlighting(false);
    setHasSpeechEnded(false);
    isSpeakingRef.current = false;
  }, [currentMessage]);

  // Start or stop speech based on isSpeaking prop
  useEffect(() => {
    if (!isSpeaking || !currentMessage || hasSpeechEnded) {
      // Stop speech if speaking flag turns off
      if (window.speechSynthesis && speechSynthRef.current) {
        window.speechSynthesis.cancel();
        setIsHighlighting(false);
      }
      return;
    }

    // Prevent multiple speech instances
    if (isSpeakingRef.current) return;

    // Start speaking when component is active
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Cancel any previous speech
      window.speechSynthesis.cancel();

      // Create word index map for highlighting
      const wordIndexMap = createWordIndexMap();

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(currentMessage);
      utterance.rate = 1.0; // Normal speech rate
      speechSynthRef.current = utterance;
      isSpeakingRef.current = true;

      // Set up event handlers for speech progress
      utterance.onstart = () => {
        setIsHighlighting(true);
        setHasSpeechEnded(false);
      };

      utterance.onend = () => {
        setIsHighlighting(false);
        setHasSpeechEnded(true);
        isSpeakingRef.current = false;
      };

      utterance.onboundary = (event) => {
        // Skip non-word boundaries
        if (event.name !== "word") return;

        const charIndex = event.charIndex;
        // Find which word group contains this character index
        const groupIndex = wordIndexMap.get(charIndex) || 0;

        if (
          groupIndex !== undefined &&
          groupIndex < wordGroupsRef.current.length
        ) {
          setHighlightPosition(groupIndex);
        }
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      // Clean up speech when component unmounts or changes
      if (window.speechSynthesis && speechSynthRef.current) {
        window.speechSynthesis.cancel();
        isSpeakingRef.current = false;
      }
    };
  }, [isSpeaking, currentMessage, hasSpeechEnded]);

  // Don't render if not speaking or already finished speaking
  if (!isSpeaking || !currentMessage) return null;

  // Render the text with the current group highlighted
  return (
    <div className="fixed bottom-8 right-8 max-w-md w-full bg-white rounded-xl shadow-2xl p-6 border border-black/10">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
          🦎
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-black/70 mb-2">
            AI Assistant Update
          </h3>
          <p className="text-sm leading-relaxed">
            {wordGroupsRef.current.map((group, index) => (
              <span
                key={index}
                className={
                  isHighlighting && index === highlightPosition
                    ? "bg-indigo-500 text-white px-1 rounded"
                    : "text-black/60"
                }
              >
                {group}
                {index < wordGroupsRef.current.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
        </div>
        <button onClick={onClose} className="text-black/40 hover:text-black/60">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
