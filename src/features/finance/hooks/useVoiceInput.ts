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

function getSpeechErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "دسترسی به میکروفون رد شد. لطفاً مجوز میکروفون را در تنظیمات دستگاه فعال کنید.";
    case "audio-capture":
      return "میکروفون در دسترس نیست. لطفاً مجوز میکروفون را بررسی کنید.";
    case "no-speech":
      return "صدایی تشخیص داده نشد. دوباره امتحان کنید.";
    case "network":
      return "برای تشخیص گفتار به اینترنت نیاز است. اتصال اینترنت را بررسی کنید.";
    case "aborted":
      return "ضبط صدا لغو شد.";
    case "language-not-supported":
      return "زبان انتخاب‌شده پشتیبانی نمی‌شود.";
    default:
      return `خطا در ورودی صوتی (${errorCode}). دوباره امتحان کنید.`;
  }
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
      setError("ورودی صوتی در این مرورگر/دستگاه پشتیبانی نمی‌شود.");
      return;
    }

    // Always create a fresh instance to avoid stale state after errors
    recognitionRef.current?.stop();
    recognitionRef.current = null;

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
      setError(nextTranscript ? "" : "صدایی تشخیص داده نشد.");
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setIsProcessing(false);
      setError(getSpeechErrorMessage(event.error));
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsProcessing(false);
    };

    recognitionRef.current = recognition;

    setTranscript("");
    setError("");
    setIsProcessing(false);
    setIsListening(true);

    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`خطا در شروع ضبط صدا: ${msg}`);
      recognitionRef.current = null;
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
