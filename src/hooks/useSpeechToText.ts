import { useState, useRef, useEffect, useCallback } from 'react';
import { cleanSpeechTranscript } from '../utils/speechCleanup';

export type SpeechStatus = 'idle' | 'recording' | 'stopping' | 'processing' | 'error';

interface UseSpeechToTextProps {
  onTranscriptReady: (transcript: string) => void;
  language?: string;
}

function normalizeChunk(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function useSpeechToText({ onTranscriptReady, language = 'id-ID' }: UseSpeechToTextProps) {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const finalChunksRef = useRef<string[]>([]);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const statusRef = useRef<SpeechStatus>('idle');
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const appendFinalChunkOnce = useCallback((chunk: string) => {
    const normalizedNew = normalizeChunk(chunk);
    if (!normalizedNew) return;

    const lastChunk = finalChunksRef.current[finalChunksRef.current.length - 1];
    const normalizedLast = normalizeChunk(lastChunk || '');

    if (normalizedLast === normalizedNew) return;
    if (normalizedLast.includes(normalizedNew)) return;
    if (normalizedNew.includes(normalizedLast) && normalizedLast.length > 10) {
      finalChunksRef.current[finalChunksRef.current.length - 1] = chunk;
      return;
    }

    finalChunksRef.current.push(chunk);
  }, []);

  const safelyRestartRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    restartTimeoutRef.current = setTimeout(() => {
      if (statusRef.current === 'recording' && !isManuallyStoppedRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.warn('Speech recognition restart skipped', error);
        }
      }
    }, 300);
  }, []);

  const finalizeTranscript = useCallback(() => {
    setStatus('processing');

    const rawTranscript = finalChunksRef.current.join(' ');
    const cleanedTranscript = cleanSpeechTranscript(rawTranscript);

    if (!cleanedTranscript) {
      setErrorMessage('Tidak ada suara yang terdeteksi.');
      setStatus('idle');
      return;
    }

    onTranscriptReady(cleanedTranscript);
    setStatus('idle');
  }, [onTranscriptReady]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    setStatus('stopping');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    } else {
      // In case it wasn't running but was "stopping"
      finalizeTranscript();
    }
  }, [finalizeTranscript]);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    finalChunksRef.current = [];
    isManuallyStoppedRef.current = false;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result.isFinal) continue;

          const transcript = result[0]?.transcript?.trim();
          if (!transcript) continue;

          appendFinalChunkOnce(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setErrorMessage('Izin mikrofon ditolak.');
          setStatus('error');
          isManuallyStoppedRef.current = true;
        } else if (event.error !== 'no-speech') {
           // Ignore no-speech internally, let it continue or wait
        }
      };

      recognition.onend = () => {
        if (isManuallyStoppedRef.current) {
          finalizeTranscript();
          return;
        }

        if (statusRef.current === 'recording') {
          safelyRestartRecognition();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setStatus('recording');

    } catch (err: any) {
      console.error("Failed to start speech recognition", err);
      setErrorMessage('Gagal memulai mikrofon.');
      setStatus('error');
    }
  }, [language, appendFinalChunkOnce, safelyRestartRecognition, finalizeTranscript]);

  useEffect(() => {
    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      } catch (e) {}
      recognitionRef.current = null;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    };
  }, []);

  return {
    status,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    setErrorMessage
  };
}
