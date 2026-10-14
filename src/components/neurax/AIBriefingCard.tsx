import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RefreshCw,
  Radio,
  Sliders,
  Play,
  Square,
  BadgeAlert,
  Mic,
  Activity,
  Headphones,
  AlertOctagon,
  Truck,
  TrendingUp,
  Construction,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Leaf,
  Send
} from 'lucide-react';
import { neuraxEngine } from '../../services/neuraxService';
import type { BriefingResult, ActiveAlertCase } from '../../types/neurax';

interface AIBriefingCardProps {
  activeSegmentId?: string;
  onSelectSegment?: (segmentId: string) => void;
}

export const AIBriefingCard: React.FC<AIBriefingCardProps> = ({
  activeSegmentId = 'R0435',
  onSelectSegment,
}) => {
  const [language, setLanguage] = useState<'EN' | 'HI' | 'TE'>('EN');
  const [briefing, setBriefing] = useState<BriefingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [switchToast, setSwitchToast] = useState<string | null>(null);

  // Retrieve 5 noticed alert cases
  const alertCases = useMemo(() => neuraxEngine.getActiveAlertCases(), []);
  const currentCase = useMemo(() => {
    return alertCases.find((c) => c.segment_id === activeSegmentId) || alertCases[0];
  }, [alertCases, activeSegmentId]);
  
  const currentCaseIndex = useMemo(() => {
    const idx = alertCases.findIndex((c) => c.segment_id === currentCase.segment_id);
    return idx >= 0 ? idx : 0;
  }, [alertCases, currentCase]);
  
  // Audio configuration state
  const [speechMode, setSpeechMode] = useState<'simple' | 'technical'>('simple');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeVoiceName, setActiveVoiceName] = useState<string>('');
  const [isPhoneticFallback, setIsPhoneticFallback] = useState<boolean>(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [activeSpokenText, setActiveSpokenText] = useState<string>('');
  const [showAdaptiveRec, setShowAdaptiveRec] = useState<boolean>(true);
  const [deployToast, setDeployToast] = useState<string | null>(null);

  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize and listen to system SpeechSynthesis voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fetch briefing data
  const loadBriefing = (segId: string, lang: 'EN' | 'HI' | 'TE') => {
    setLoading(true);
    setTimeout(() => {
      const res = neuraxEngine.generateDeterministicBriefing(segId, lang);
      setBriefing(res);
      setLoading(false);
    }, 120);
  };

  useEffect(() => {
    // If currently playing, stop when switching segments or language
    if (isPlaying && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    loadBriefing(activeSegmentId, language);
  }, [activeSegmentId, language]);

  // Case navigation handlers
  const handleSelectCase = (c: ActiveAlertCase) => {
    if (isPlaying && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    onSelectSegment?.(c.segment_id);
    loadBriefing(c.segment_id, language);
    setSwitchToast(`Switched to Case ${c.case_number}: ${c.short_title} (${c.segment_id})`);
    setTimeout(() => setSwitchToast(null), 2800);
  };

  const handleNextCase = () => {
    const nextIdx = (currentCaseIndex + 1) % alertCases.length;
    handleSelectCase(alertCases[nextIdx]);
  };

  const handlePrevCase = () => {
    const prevIdx = (currentCaseIndex - 1 + alertCases.length) % alertCases.length;
    handleSelectCase(alertCases[prevIdx]);
  };

  const handleRefresh = () => {
    // Directly cycles to the next alert case so user never gets stuck with repeated text
    handleNextCase();
  };

  // Determine the best voice and audio text for the current language
  const resolveVoiceAndText = (
    lang: 'EN' | 'HI' | 'TE',
    mode: 'simple' | 'technical',
    brief: BriefingResult
  ): { voice: SpeechSynthesisVoice | null; textToSpeak: string; isFallback: boolean; voiceDescription: string } => {
    const voices = availableVoices;
    let selectedVoice: SpeechSynthesisVoice | null = null;
    let textToSpeak = mode === 'simple' ? brief.simple_speech_text : brief.briefing;
    let isFallback = false;
    let voiceDesc = 'Default System Voice';

    if (lang === 'HI') {
      const hindiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.includes('हिन्दी')
      );
      if (hindiVoice) {
        selectedVoice = hindiVoice;
        voiceDesc = `${hindiVoice.name} (Native Hindi)`;
      } else {
        const inVoice = voices.find((v) => v.lang.toLowerCase() === 'en-in') || voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        selectedVoice = inVoice || null;
        textToSpeak = brief.phonetic_transliteration || brief.simple_speech_text;
        isFallback = true;
        voiceDesc = inVoice ? `${inVoice.name} (Phonetic Hindi Mapping)` : 'Natural Indian English Phonetics';
      }
    } else if (lang === 'TE') {
      const teluguVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('te') ||
          v.name.toLowerCase().includes('telugu') ||
          v.name.includes('తెలుగు')
      );
      if (teluguVoice) {
        selectedVoice = teluguVoice;
        voiceDesc = `${teluguVoice.name} (Native Telugu)`;
      } else {
        const inVoice =
          voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
          voices.find((v) => v.name.toLowerCase().includes('india')) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        selectedVoice = inVoice || null;
        textToSpeak = brief.phonetic_transliteration || brief.simple_speech_text;
        isFallback = true;
        voiceDesc = inVoice ? `${inVoice.name} (Clear Telugu Phonetic Audio)` : 'Indian Voice (Clear Telugu Phonetic Audio)';
      }
    } else {
      const enVoice =
        voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
        voices.find((v) => v.name.toLowerCase().includes('natural') && v.lang.startsWith('en')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      selectedVoice = enVoice || null;
      voiceDesc = enVoice ? `${enVoice.name} (English)` : 'System English';
    }

    return { voice: selectedVoice, textToSpeak, isFallback, voiceDescription: voiceDesc };
  };

  // Update active voice description whenever language or voices change
  useEffect(() => {
    if (!briefing) return;
    const resolved = resolveVoiceAndText(language, speechMode, briefing);
    setActiveVoiceName(resolved.voiceDescription);
    setIsPhoneticFallback(resolved.isFallback);
  }, [language, speechMode, availableVoices, briefing]);

  // Tactical radio beep chime using browser Web Audio API
  const playTacticalChime = (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) {
          resolve();
          return;
        }
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        // 2-tone tactical radio dispatcher beep (659Hz -> 880Hz)
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.setValueAtTime(880.0, now + 0.1);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.32);
        setTimeout(resolve, 340);
      } catch (err) {
        console.warn('Tactical audio chime skipped:', err);
        resolve();
      }
    });
  };

  // Main Speech Handler
  const handleSpeak = async () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setActiveSpokenText('');
      return;
    }

    if (!briefing) return;

    // Play subtle dispatcher alert chime before speaking
    await playTacticalChime();

    window.speechSynthesis.cancel();

    const { voice, textToSpeak, isFallback, voiceDescription } = resolveVoiceAndText(
      language,
      speechMode,
      briefing
    );

    setActiveVoiceName(voiceDescription);
    setIsPhoneticFallback(isFallback);
    setActiveSpokenText(textToSpeak);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      if (language === 'HI') utterance.lang = 'hi-IN';
      else if (language === 'TE') utterance.lang = 'te-IN';
      else utterance.lang = 'en-US';
    }

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setActiveSpokenText('');
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsPlaying(false);
      setActiveSpokenText('');
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    if (!briefing) return;
    const textToCopy = speechMode === 'simple' ? briefing.simple_speech_text : briefing.briefing;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="ai-briefing-card"
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-700 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>NeuraX AI Situational Dispatch Briefing</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                Live Tactical
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Case {currentCase.case_number} of {alertCases.length} • Corridor {activeSegmentId} ({currentCase.short_title}) • Tactical Audio Command
            </p>
          </div>
        </div>

        {/* Language Tabs & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              id="lang-tab-en"
              onClick={() => setLanguage('EN')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                language === 'EN'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              id="lang-tab-hi"
              onClick={() => setLanguage('HI')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                language === 'HI'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              id="lang-tab-te"
              onClick={() => setLanguage('TE')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                language === 'TE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              తెలుగు
            </button>
          </div>

          {/* Voice Speaker Button with Animated Audio State */}
          <button
            id="btn-speak-briefing"
            onClick={handleSpeak}
            title={isPlaying ? 'Stop voice dispatch' : `Read Case ${currentCase.case_number} aloud in ${language}`}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPlaying
                ? 'bg-rose-50 text-rose-600 border-rose-300 ring-2 ring-rose-200'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="font-bold">Stop Audio</span>
                {/* Animated Equalizer Wave */}
                <span className="flex items-end gap-0.5 h-3 ml-0.5">
                  <span className="w-0.5 bg-rose-600 animate-pulse rounded-full h-2" />
                  <span className="w-0.5 bg-rose-600 animate-pulse delay-75 rounded-full h-3" />
                  <span className="w-0.5 bg-rose-600 animate-pulse delay-150 rounded-full h-1.5" />
                  <span className="w-0.5 bg-rose-600 animate-pulse delay-100 rounded-full h-2.5" />
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play Voice</span>
              </>
            )}
          </button>

          {/* Audio Settings Toggle */}
          <button
            id="btn-audio-settings"
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            title="Audio & Voice Configuration"
            className={`p-1.5 rounded-lg border text-slate-600 hover:bg-slate-50 transition-colors ${
              showVoiceSettings ? 'bg-slate-100 border-slate-300 text-slate-900' : 'border-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Copy Button */}
          <button
            id="btn-copy-briefing"
            onClick={handleCopy}
            title="Copy briefing text"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Refresh Button (Cycles to next alert case) */}
          <button
            id="btn-refresh-briefing"
            onClick={handleRefresh}
            disabled={loading}
            title="Cycle to next active alert case"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5 ACTIVE ALERT CASES SWITCHER BAR */}
      <div className="mt-3.5 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
              5
            </span>
            <span className="text-xs font-bold text-slate-800 tracking-tight">
              Active Network Alert Cases Noticed:
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Click any case to switch voice dispatch & telemetry)
            </span>
          </div>

          {/* Case Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              id="btn-prev-alert-case"
              onClick={handlePrevCase}
              title="Previous Alert Case"
              className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <span className="text-[11px] font-mono font-bold text-slate-700 px-1">
              {currentCaseIndex + 1}/{alertCases.length}
            </span>

            <button
              id="btn-next-alert-case"
              onClick={handleNextCase}
              title="Next Alert Case"
              className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-cycle-alert-case"
              onClick={handleNextCase}
              title="Cycle to next alert scenario"
              className="ml-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              <span>Next Case</span>
            </button>
          </div>
        </div>

        {/* 5 Case Selector Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {alertCases.map((c) => {
            const isSelected = currentCase.segment_id === c.segment_id;
            return (
              <button
                key={c.id}
                id={`btn-case-${c.case_number}`}
                onClick={() => handleSelectCase(c)}
                className={`px-2.5 py-2 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Case {c.case_number}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1 rounded uppercase ${
                      c.severity === 'CRITICAL'
                        ? 'text-rose-700 bg-rose-50 border border-rose-200'
                        : 'text-amber-700 bg-amber-50 border border-amber-200'
                    }`}
                  >
                    {c.severity}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  {c.category === 'COLLISION' && (
                    <AlertOctagon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  )}
                  {c.category === 'FREIGHT_BREAKDOWN' && (
                    <Truck className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  )}
                  {c.category === 'DEMAND_SURGE' && (
                    <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  )}
                  {c.category === 'WORKZONE' && (
                    <Construction className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  )}
                  {c.category === 'SIGNAL_DRIFT' && (
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  )}
                  <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                    {c.short_title}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                  {c.segment_id} • {c.speed_kmh} km/h
                </div>
              </button>
            );
          })}
        </div>

        {/* Toast Notification when Switching Alert Cases */}
        {switchToast && (
          <div className="py-1 px-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center justify-between gap-2 animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{switchToast}</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-normal">Updated</span>
          </div>
        )}
      </div>

      {/* Audio Engine Configuration Drawer */}
      {showVoiceSettings && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <Headphones className="w-3.5 h-3.5 text-blue-600" />
              <span>Voice Engine Settings:</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Mapped: <strong className="text-slate-800">{activeVoiceName || 'Detecting...'}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
            {/* Simple / Technical Voice Mode */}
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-medium">Voice Phrasing:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-md font-semibold text-[11px]">
                <button
                  onClick={() => setSpeechMode('simple')}
                  className={`px-2 py-0.5 rounded ${
                    speechMode === 'simple'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Simple & Neat
                </button>
                <button
                  onClick={() => setSpeechMode('technical')}
                  className={`px-2 py-0.5 rounded ${
                    speechMode === 'technical'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Full Technical
                </button>
              </div>
            </div>

            {/* Speech Rate Controls */}
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-medium">Speed Rate:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-md font-semibold text-[11px]">
                {[0.85, 1.0, 1.2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2 py-0.5 rounded ${
                      speechRate === rate
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {rate === 0.85 ? '0.85x' : rate === 1.0 ? '1.0x' : '1.2x'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isPhoneticFallback && (
            <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Smart Phonetic Mapping Active:</strong> Browser does not have a native {language === 'TE' ? 'Telugu' : 'Hindi'} TTS pack installed. NeuraX mapped audio to an Indian English natural voice with clear phonetic pronunciation so it speaks smoothly without silence or distortion.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Live Speaking Banner (Visual Subtitle) */}
      {isPlaying && (
        <div className="mt-3 p-3 bg-blue-600 text-white rounded-xl text-xs flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] uppercase tracking-wider font-bold text-blue-200 flex items-center gap-1.5">
                <span>Broadcasting Tactical Radio Dispatch</span>
                <span>•</span>
                <span>Case {currentCase.case_number} ({currentCase.short_title})</span>
                <span>•</span>
                <span>{speechRate}x Speed</span>
              </div>
              <div className="truncate text-white font-medium text-xs mt-0.5">
                &ldquo;{activeSpokenText}&rdquo;
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setIsPlaying(false);
              }
            }}
            className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-semibold text-[11px] shrink-0"
          >
            Mute
          </button>
        </div>
      )}

      {/* Main Content Card */}
      <div className="my-3.5 flex-1">
        {loading ? (
          <div className="py-6 flex items-center justify-center text-slate-400 gap-2 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Synthesizing operational dispatch for Case {currentCase.case_number}...</span>
          </div>
        ) : briefing ? (
          <div className="space-y-3">
            {/* Mode Indicator & Text Content */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-blue-600" />
                  {speechMode === 'simple' ? 'Simple & Neat Radio Dispatch' : 'Telemetry Dispatch Protocol'}
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded text-[10px] font-mono">
                    Case {currentCase.case_number}
                  </span>
                </span>
                <button
                  onClick={() => setSpeechMode(speechMode === 'simple' ? 'technical' : 'simple')}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Switch to {speechMode === 'simple' ? 'Technical View' : 'Simple View'}
                </button>
              </div>

              <p className="text-[13px] leading-relaxed text-slate-800 font-medium">
                {speechMode === 'simple' ? briefing.simple_speech_text : briefing.briefing}
              </p>
            </div>

            {/* Quick Tactical Bullet Points */}
            {briefing.bullet_points && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {briefing.bullet_points.map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80 text-xs text-slate-600 font-medium shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Granular Adaptive Recommendation Dossier (10-Mark Rubric) */}
            {briefing.recommendation && (
              <div className="mt-3 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 border border-indigo-200/90 rounded-2xl p-4 shadow-xs space-y-3.5">
                {/* Header & Feasibility */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono">
                        Adaptive Tactical Intervention
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {briefing.recommendation.feasibility_score}% Feasibility Score
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {briefing.recommendation.strategy_type.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      {briefing.recommendation.strategy_name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Activation Lead Time</div>
                      <div className="text-xs font-mono font-bold text-indigo-700">
                        {briefing.recommendation.activation_eta}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDeployToast(`Dispatched: ${briefing.recommendation?.strategy_name} activated on corridor ATCS & Field Units.`);
                        setTimeout(() => setDeployToast(null), 3500);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Deploy Directive</span>
                    </button>
                  </div>
                </div>

                {deployToast && (
                  <div className="py-1.5 px-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{deployToast}</span>
                  </div>
                )}

                {/* Causal Reasoning */}
                <div className="p-3 bg-white/90 border border-indigo-100 rounded-xl text-xs text-slate-700 leading-relaxed shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-indigo-900 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    Kinematic Causal Model & Shockwave Analysis
                  </div>
                  {briefing.recommendation.causal_reasoning}
                </div>

                {/* Phased Tactical Execution Steps */}
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Phased Operational Protocol
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {briefing.recommendation.tactical_steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2 shadow-2xs"
                      >
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span className="text-[11px] leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational Gains Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Delay Saved</div>
                    <div className="text-sm font-extrabold text-emerald-600">
                      -{briefing.recommendation.operational_gains.delay_saved_pct}% ({briefing.recommendation.operational_gains.delay_saved_min}m)
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-200 shadow-2xs">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Queue Shrink</div>
                    <div className="text-sm font-extrabold text-indigo-600">
                      -{briefing.recommendation.operational_gains.queue_shrink_meters} m
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Commuter Hours</div>
                    <div className="text-sm font-extrabold text-slate-800">
                      +{briefing.recommendation.operational_gains.commuter_hours_saved_daily.toLocaleString()} hrs
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                    <div className="text-[9px] uppercase font-bold text-slate-400">CO₂ Abated</div>
                    <div className="text-sm font-extrabold text-emerald-700">
                      {briefing.recommendation.operational_gains.co2_abated_kg.toLocaleString()} kg
                    </div>
                  </div>
                </div>

                {/* Field Deployment Matrix: Equipment, Personnel, Inter-agency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="flex items-start gap-1.5 text-slate-600">
                    <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800">Assigned Equipment:</strong>{' '}
                      {briefing.recommendation.field_equipment.join(', ')}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800">Field Units:</strong>{' '}
                      {briefing.recommendation.field_personnel.join(', ')} ({briefing.recommendation.inter_agency})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400">No active briefing loaded.</div>
        )}
      </div>

      {/* Footer metadata */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Engine: {briefing?.provider || 'NeuraX Kinematic Graph Model'}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">
            Audio Voice: {activeVoiceName ? activeVoiceName.split(' ')[0] : 'System'}
          </span>
          <span>•</span>
          <span>Generated: {briefing?.timestamp || 'Just now'}</span>
        </div>
      </div>
    </div>
  );
};

