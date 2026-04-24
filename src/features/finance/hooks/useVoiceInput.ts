import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SpeechRecognitionEventLike extends Event {
  results: {
    length: number;
    [index: number]: {
      isFinal?: boolean;
      length: number;
      [resultIndex: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  }
}

export interface UseVoiceInputResult {
  error: string;
  isListening: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
}

export function useVoiceInput(language = "en-US"): UseVoiceInputResult {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const SpeechRecognitionConstructor = useMemo(
    () =>
      typeof window === "undefined"
        ? undefined
        : window.SpeechRecognition ?? window.webkitSpeechRecognition,
    [],
  );

  const isSupported = Boolean(SpeechRecognitionConstructor);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionConstructor) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onresult = (event) => {
        const nextTranscript = Array.from({ length: event.results.length })
          .map((_, index) => event.results[index]?.[0]?.transcript?.trim() ?? "")
          .filter(Boolean)
          .join(" ")
          .trim();

        setTranscript(nextTranscript);
        setIsProcessing(false);
        setError(nextTranscript ? "" : "No speech was detected.");
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setIsProcessing(false);

        switch (event.error) {
          case "not-allowed":
          case "service-not-allowed":
            setError("Microphone permission was denied.");
            break;
          case "no-speech":
            setError("No speech was detected.");
            break;
          default:
            setError("Voice input could not be completed.");
            break;
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current = recognition;
    }

    setTranscript("");
    setError("");
    setIsProcessing(false);
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
      setError("Voice input could not be started.");
    }
  }, [SpeechRecognitionConstructor, language]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      setIsProcessing(true);
    }
  }, [isListening]);

  return {
    error,
    isListening,
    isProcessing,
    isSupported,
    startListening,
    stopListening,
    transcript,
  };
}
