
import React, { useState, useEffect, useCallback, useRef } from 'react';
import CircularTimer from './components/CircularTimer';
import TaskList from './components/TaskList';
import SettingsModal from './components/SettingsModal';
import { TimerMode, Task, Language, QuoteCache, QuoteData } from './types';
import { fetchQuoteBatch } from './services/geminiService';

const DEFAULT_TIMES = {
  [TimerMode.WORK]: 25,
  [TimerMode.SHORT_BREAK]: 5,
  [TimerMode.LONG_BREAK]: 15,
};

const INITIAL_QUOTES: QuoteCache = {
  [TimerMode.WORK]: [
    { text: "万物静观皆自得，四时佳兴与人同。", isLiked: false },
    { text: "宁静致远，淡泊明志。", isLiked: false },
    { text: "博观而约取，厚积而薄发。", isLiked: false },
    { text: "不积跬步，无以至千里。", isLiked: false },
    { text: "欲穷千里目，更上一层楼。", isLiked: false },
    { text: "非淡泊无以明志，非宁静无以致远。", isLiked: false },
    { text: "学向勤中得，萤窗万卷书。", isLiked: false }
  ],
  [TimerMode.SHORT_BREAK]: [
    { text: "闲看庭前花开花落，漫随天外云卷云舒。", isLiked: false },
    { text: "偷得浮生半日闲。", isLiked: false },
    { text: "晚来天欲雪，能饮一杯无？", isLiked: false },
    { text: "采菊东篱下，悠然见南山。", isLiked: false },
    { text: "小楼一夜听春雨，深巷明朝卖杏花。", isLiked: false },
    { text: "春风得意马蹄疾，一日看尽长安花。", isLiked: false },
    { text: "回首向来萧瑟处，也无风雨也无晴。", isLiked: false }
  ],
  [TimerMode.LONG_BREAK]: [
    { text: "行到水穷处，坐看云起时。", isLiked: false },
    { text: "明月松间照，清泉石上流。", isLiked: false },
    { text: "结庐在人境，而无车马喧。", isLiked: false },
    { text: "莫听穿林打叶声，何妨吟啸且徐行。", isLiked: false },
    { text: "众里寻他千百度，蓦然回首，那人却在，灯火珊珊处。", isLiked: false },
    { text: "此地有崇山岭，茂林修竹。", isLiked: false },
    { text: "人生如逆旅，我亦是行人。", isLiked: false }
  ]
};

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
       const saved = localStorage.getItem('flow_pomodoro_theme');
       return saved === 'dark' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('flow_pomodoro_lang');
    return (saved as Language) || Language.ZH;
  });

  const [assistantName, setAssistantName] = useState(() => {
    return localStorage.getItem('flow_pomodoro_assistant_name') || '梦玉';
  });

  const [assistantRole, setAssistantRole] = useState(() => {
    return localStorage.getItem('flow_pomodoro_assistant_role') || (language === Language.ZH ? '小宠物' : 'pet');
  });

  const [quoteCache, setQuoteCache] = useState<QuoteCache>(() => {
    const saved = localStorage.getItem('flow_pomodoro_quotes_cache');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          [TimerMode.WORK]: parsed[TimerMode.WORK] || INITIAL_QUOTES[TimerMode.WORK],
          [TimerMode.SHORT_BREAK]: parsed[TimerMode.SHORT_BREAK] || INITIAL_QUOTES[TimerMode.SHORT_BREAK],
          [TimerMode.LONG_BREAK]: parsed[TimerMode.LONG_BREAK] || INITIAL_QUOTES[TimerMode.LONG_BREAK],
        };
      } catch (e) {
        return INITIAL_QUOTES;
      }
    }
    return INITIAL_QUOTES;
  });

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('flow_pomodoro_theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('flow_pomodoro_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('flow_pomodoro_assistant_name', assistantName);
  }, [assistantName]);

  useEffect(() => {
    localStorage.setItem('flow_pomodoro_assistant_role', assistantRole);
  }, [assistantRole]);

  useEffect(() => {
    localStorage.setItem('flow_pomodoro_quotes_cache', JSON.stringify(quoteCache));
  }, [quoteCache]);

  const [customTimes, setCustomTimes] = useState<Record<TimerMode, number>>(() => {
    try {
        const saved = localStorage.getItem('zen_pomodoro_settings');
        return saved ? JSON.parse(saved) : DEFAULT_TIMES;
    } catch { return DEFAULT_TIMES; }
  });

  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
  const [timeLeft, setTimeLeft] = useState(() => customTimes[TimerMode.WORK] * 60);
  const [isActive, setIsActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState<{show: boolean, text: string, mode: TimerMode}>({ show: false, text: '', mode: TimerMode.WORK });
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);

  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const playCrystalPing = (freq: number, startTime: number, volume: number, decay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.001); 
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay); 

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + decay + 0.1);
      };

      const now = ctx.currentTime;
      playCrystalPing(2637, now, 0.12, 0.4);
      playCrystalPing(2637 * 1.5, now + 0.02, 0.04, 0.3); 
      playCrystalPing(2637 * 2.618, now + 0.04, 0.02, 0.2); 
      
    } catch (e) {
      console.warn("Audio Context blocked");
    }
  }, []);

  const getRandomQuote = useCallback(() => {
    const pool = quoteCache[mode];
    if (pool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setCurrentQuoteIndex(randomIndex);
  }, [mode, quoteCache]);

  const handleRefreshQuotes = async () => {
    if (isRefreshingQuote) return;
    setIsRefreshingQuote(true);
    try {
      const newQuotes = await fetchQuoteBatch(mode, language);
      if (newQuotes.length > 0) {
        setQuoteCache(prev => ({
          ...prev,
          [mode]: [
            ...prev[mode].filter(q => q.isLiked),
            ...newQuotes.map(text => ({ text, isLiked: false }))
          ].slice(0, 20)
        }));
        const poolSize = quoteCache[mode].length;
        setCurrentQuoteIndex(Math.floor(Math.random() * poolSize));
      }
    } catch (err) {
      console.error("Refresh failed even with fallbacks", err);
    } finally {
      setIsRefreshingQuote(false);
    }
  };

  const toggleLikeQuote = () => {
    const pool = [...quoteCache[mode]];
    const q = pool[currentQuoteIndex];
    if (!q) return;
    const updatedQuote = { ...q, isLiked: !q.isLiked };
    pool[currentQuoteIndex] = updatedQuote;
    setQuoteCache(prev => ({ ...prev, [mode]: pool }));
  };

  useEffect(() => {
    getRandomQuote();
  }, [mode, getRandomQuote]);

  const playGentleNotification = useCallback((targetMode: TimerMode, lang: Language, name: string, role: string) => {
    const isZH = lang === Language.ZH;
    let speechText = "";
    let toastText = "";
    
    const identity = isZH ? `您个${role}${name}` : `your ${role} ${name}`;

    switch(targetMode) {
      case TimerMode.WORK:
        speechText = isZH ? `主人，${identity}提醒您，专注结束啦，喝杯水休息一下吧。` : `Master, ${identity} reminds you that focus session is finished. Time for a break.`;
        toastText = isZH ? "专注结束啦，休息一下吧" : "Focus session completed!";
        break;
      case TimerMode.SHORT_BREAK:
        speechText = isZH ? `主人，${identity}提醒您，短休结束啦，进入下一次专注吧。` : `Master, ${identity} reminds you that short break is over. Let's get back to work.`;
        toastText = isZH ? "短休结束啦，开始专注吧" : "Short break ended!";
        break;
      case TimerMode.LONG_BREAK:
        speechText = isZH ? `主人，${identity}提醒您，长休结束啦，辛苦啦。` : `Master, ${identity} reminds you that long break is over. You've done great.`;
        toastText = isZH ? "长休结束啦，精力充沛！" : "Long break ended!";
        break;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = isZH ? 'zh-CN' : 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
    setNotification({ show: true, text: toastText, mode: targetMode });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 8000);
  }, []);

  const handleTimerComplete = useCallback(() => {
    setIsActive(false);
    playGentleNotification(mode, language, assistantName, assistantRole);
    
    // Auto-increment pomodoro count for active task
    if (mode === TimerMode.WORK) {
      if (activeTaskId) {
        setTasks(prev => prev.map(t => 
          t.id === activeTaskId 
            ? { ...t, completedPomodoros: t.completedPomodoros + 1 } 
            : t
        ));
      }

      const nextCount = completedWorkSessions + 1;
      setCompletedWorkSessions(nextCount);
      const nextMode = nextCount >= 4 ? TimerMode.LONG_BREAK : TimerMode.SHORT_BREAK;
      setMode(nextMode);
      setTimeLeft(customTimes[nextMode] * 60);
      if(nextCount >= 4) setCompletedWorkSessions(0);
    } else {
      setMode(TimerMode.WORK);
      setTimeLeft(customTimes[TimerMode.WORK] * 60);
    }
  }, [mode, activeTaskId, completedWorkSessions, customTimes, playGentleNotification, language, assistantName, assistantRole]);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, handleTimerComplete]);

  const toggleTimer = () => {
    if (!isActive) {
      playChime();
    }
    setIsActive(!isActive);
  };
  
  const resetTimer = () => { setTimeLeft(customTimes[mode] * 60); setIsActive(false); };
  const switchModeManual = (newMode: TimerMode) => { setMode(newMode); setTimeLeft(customTimes[newMode] * 60); setIsActive(false); };

  const handleTaskToggle = (id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? {...t, completed: !t.completed} : t);
      return [...updated];
    });
  };

  const t = {
    work: language === Language.ZH ? '专注' : 'Focus',
    short: language === Language.ZH ? '短休' : 'Short',
    long: language === Language.ZH ? '长休' : 'Long',
    remind: language === Language.ZH ? `${assistantRole}${assistantName}提醒主人` : `${assistantName}`,
    focusing: language === Language.ZH ? '专注中' : 'Focusing',
    shortBreaking: language === Language.ZH ? '小憩中' : 'Resting',
    longBreaking: language === Language.ZH ? '撒欢中' : 'Chilling',
    waiting: language === Language.ZH ? '等候指令' : 'Idle',
  };

  const getTimerLabel = () => {
    if (!isActive) return t.waiting;
    if (mode === TimerMode.WORK) return t.focusing;
    if (mode === TimerMode.SHORT_BREAK) return t.shortBreaking;
    return t.longBreaking;
  };

  const currentQuote: QuoteData = quoteCache[mode][currentQuoteIndex] || quoteCache[mode][0] || { text: "", isLiked: false };

  return (
    <div className="min-h-screen flex flex-col items-center pt-12 pb-12 px-4 transition-colors duration-500 dark:bg-morandi-darkBase">
      {notification.show && (
        <div className="fixed top-12 z-[100] animate-bounce px-4 w-full flex justify-center">
            <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border-opacity-30 ${notification.mode === TimerMode.WORK ? 'border-morandi-work' : notification.mode === TimerMode.SHORT_BREAK ? 'border-morandi-break' : 'border-morandi-long'}`}>
                <div className={`h-3 w-3 rounded-full animate-pulse ${notification.mode === TimerMode.WORK ? 'bg-morandi-work' : notification.mode === TimerMode.SHORT_BREAK ? 'border-morandi-break' : 'border-morandi-long'}`}></div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t.remind}</span>
                  <span className="font-semibold text-morandi-text-primary dark:text-white">{notification.text}</span>
                </div>
            </div>
        </div>
      )}

      <div className="absolute top-6 right-6 flex gap-3">
          <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-full bg-white/40 dark:bg-white/5 text-gray-400 hover:text-morandi-work transition-all shadow-sm border border-white/20">
            {isDark ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>}
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-3 rounded-full bg-white/40 dark:bg-white/5 text-gray-400 hover:text-morandi-work transition-all shadow-sm border border-white/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
      </div>

      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="drop-shadow-sm filter contrast-125">
                <path d="M12 21C16.9706 21 21 17.5 21 12.5C21 7.5 17 4 12 4C7 4 3 7.5 3 12.5C3 17.5 7.02944 21 12 21Z" fill="#E66F66" />
                <path d="M12 2V5M12 5C13.5 5 15 3.5 15 3.5M12 5C10.5 5 9 3.5 9 3.5" stroke="#4A7156" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-2xl font-bold text-morandi-text-primary dark:text-gray-100 tracking-tight">FlowPomodoro</h1>
        </div>
        
        <div className="group relative px-10 py-5 bg-white/30 dark:bg-white/5 rounded-[2rem] backdrop-blur-sm border border-white/10 inline-flex flex-col items-center min-w-[280px] transition-all hover:scale-[1.02]">
            <p onClick={getRandomQuote} className="text-sm font-medium text-gray-500/80 dark:text-gray-400 italic cursor-pointer select-none hover:text-morandi-text-primary dark:hover:text-gray-200 transition-colors leading-relaxed px-2">
              “{currentQuote.text}”
            </p>
            
            <div className="absolute -top-3 -right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleLikeQuote(); }} 
                    className={`h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-ios-btn flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${currentQuote.isLiked ? 'text-red-500' : 'text-gray-400'}`}
                    title={language === Language.ZH ? '喜欢' : 'Like'}
                >
                   <svg className="w-4 h-4" fill={currentQuote.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleRefreshQuotes(); }} 
                    disabled={isRefreshingQuote} 
                    className={`h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-ios-btn flex items-center justify-center transition-all hover:scale-110 active:scale-90 text-gray-400 ${isRefreshingQuote ? 'animate-spin' : ''}`}
                    title={language === Language.ZH ? '刷新' : 'Refresh'}
                >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>
        </div>
      </header>

      <div className="bg-gray-200/50 dark:bg-black/40 backdrop-blur-md p-1 rounded-full flex relative mb-8 w-fit border border-white/10">
        <button onClick={() => switchModeManual(TimerMode.WORK)} className={`relative z-10 px-6 py-2 text-sm font-medium transition-colors ${mode === TimerMode.WORK ? 'text-morandi-text-primary dark:text-white bg-white dark:bg-gray-700 rounded-full shadow-ios-btn' : 'text-gray-500'}`}>{t.work}</button>
        <button onClick={() => switchModeManual(TimerMode.SHORT_BREAK)} className={`relative z-10 px-6 py-2 text-sm font-medium transition-colors ${mode === TimerMode.SHORT_BREAK ? 'text-morandi-text-primary dark:text-white bg-white dark:bg-gray-700 rounded-full shadow-ios-btn' : 'text-gray-500'}`}>{t.short}</button>
        <button onClick={() => switchModeManual(TimerMode.LONG_BREAK)} className={`relative z-10 px-6 py-2 text-sm font-medium transition-colors ${mode === TimerMode.LONG_BREAK ? 'text-morandi-text-primary dark:text-white bg-white dark:bg-gray-700 rounded-full shadow-ios-btn' : 'text-gray-500'}`}>{t.long}</button>
      </div>

      <div className="mb-4 scale-105">
          <CircularTimer timeLeft={timeLeft} totalTime={customTimes[mode] * 60} mode={mode} isActive={isActive} label={getTimerLabel()} />
      </div>

      <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((dot) => (
            <div key={dot} className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${dot <= completedWorkSessions ? 'bg-morandi-work shadow-[0_0_8px_rgba(230,111,102,0.5)] scale-110' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
          ))}
      </div>

      <div className="flex items-center justify-center gap-8 mb-10">
          <button onClick={resetTimer} className="h-14 w-14 rounded-full bg-white dark:bg-gray-800 shadow-ios-btn border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-morandi-work transition-all flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button onClick={toggleTimer} className={`h-20 w-20 rounded-full bg-white dark:bg-gray-800 shadow-ios-float border border-gray-100 dark:border-gray-700 transition-all flex items-center justify-center ${mode === TimerMode.WORK ? 'text-morandi-work' : mode === TimerMode.SHORT_BREAK ? 'text-morandi-break' : 'text-morandi-long'}`}>
            {isActive ? <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-9 h-9 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
          </button>
      </div>

      <TaskList tasks={tasks} setTasks={setTasks} activeTaskId={activeTaskId} setActiveTaskId={setActiveTaskId} currentMode={mode} language={language} onToggle={handleTaskToggle} />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={customTimes} 
        language={language}
        assistantName={assistantName}
        assistantRole={assistantRole}
        onSave={(s, l, name, role) => { 
          setCustomTimes(s); 
          setLanguage(l);
          setAssistantName(name);
          setAssistantRole(role);
          if(!isActive) setTimeLeft(s[mode]*60); 
          setIsSettingsOpen(false); 
        }} 
      />
    </div>
  );
};

export default App;
