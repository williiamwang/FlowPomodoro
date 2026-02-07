
import React, { useState, useEffect } from 'react';
import { TimerMode, Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Record<TimerMode, number>;
  language: Language;
  assistantName: string;
  assistantRole: string;
  onSave: (newSettings: Record<TimerMode, number>, lang: Language, assistantName: string, assistantRole: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, language, assistantName, assistantRole, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [localLanguage, setLocalLanguage] = useState(language);
  const [localAssistantName, setLocalAssistantName] = useState(assistantName);
  const [localAssistantRole, setLocalAssistantRole] = useState(assistantRole);

  useEffect(() => {
    setLocalSettings(settings);
    setLocalLanguage(language);
    setLocalAssistantName(assistantName);
    setLocalAssistantRole(assistantRole);
  }, [settings, language, assistantName, assistantRole, isOpen]);

  if (!isOpen) return null;

  const handleChange = (mode: TimerMode, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 120) {
      setLocalSettings(prev => ({ ...prev, [mode]: numValue }));
    }
  };

  const isZH = localLanguage === Language.ZH;

  const t = {
    title: isZH ? '计时器设置' : 'Settings',
    work: isZH ? '专注时长 (分钟)' : 'Focus (min)',
    short: isZH ? '短休息时长 (分钟)' : 'Short Break (min)',
    long: isZH ? '长休息时长 (分钟)' : 'Long Break (min)',
    lang: isZH ? '语言设置' : 'Language',
    assistant: isZH ? '名字' : 'Name',
    assistantRole: isZH ? '播报身份' : 'Role',
    save: isZH ? '保存设置' : 'Save Changes',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/20 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50 dark:border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-morandi-text-primary dark:text-gray-100">{t.title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          {/* Identity Settings */}
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block ml-1">{t.assistantRole}</label>
                <input 
                  type="text" 
                  value={localAssistantRole} 
                  onChange={(e) => setLocalAssistantRole(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-morandi-work/30 transition-all outline-none text-morandi-text-primary dark:text-gray-100 font-medium text-sm"
                  placeholder={isZH ? "例：小宠物" : "Role..."}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block ml-1">{t.assistant}</label>
                <input 
                  type="text" 
                  value={localAssistantName} 
                  onChange={(e) => setLocalAssistantName(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-morandi-work/30 transition-all outline-none text-morandi-text-primary dark:text-gray-100 font-medium text-sm"
                  placeholder={isZH ? "输入名字..." : "Name..."}
                />
              </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-morandi-work"></span>{t.work}
                </label>
                <span className="text-xs font-mono text-gray-400">{localSettings[TimerMode.WORK]} min</span>
            </div>
            <input type="range" min="1" max="90" value={localSettings[TimerMode.WORK]} onChange={(e) => handleChange(TimerMode.WORK, e.target.value)} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-morandi-work" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-morandi-break"></span>{t.short}
                </label>
                <span className="text-xs font-mono text-gray-400">{localSettings[TimerMode.SHORT_BREAK]} min</span>
            </div>
            <input type="range" min="1" max="30" value={localSettings[TimerMode.SHORT_BREAK]} onChange={(e) => handleChange(TimerMode.SHORT_BREAK, e.target.value)} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-morandi-break" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-morandi-long"></span>{t.long}
                </label>
                <span className="text-xs font-mono text-gray-400">{localSettings[TimerMode.LONG_BREAK]} min</span>
            </div>
            <input type="range" min="5" max="60" value={localSettings[TimerMode.LONG_BREAK]} onChange={(e) => handleChange(TimerMode.LONG_BREAK, e.target.value)} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-morandi-long" />
          </div>

          <div className="pt-2">
             <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-3">{t.lang}</label>
             <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl relative">
                <button onClick={() => setLocalLanguage(Language.ZH)} className={`flex-1 py-2 text-xs font-bold rounded-xl z-10 transition-all ${localLanguage === Language.ZH ? 'bg-white dark:bg-gray-700 text-morandi-text-primary dark:text-white shadow-sm' : 'text-gray-400'}`}>中文</button>
                <button onClick={() => setLocalLanguage(Language.EN)} className={`flex-1 py-2 text-xs font-bold rounded-xl z-10 transition-all ${localLanguage === Language.EN ? 'bg-white dark:bg-gray-700 text-morandi-text-primary dark:text-white shadow-sm' : 'text-gray-400'}`}>English</button>
             </div>
          </div>
        </div>

        <div className="mt-8">
          <button onClick={() => onSave(localSettings, localLanguage, localAssistantName, localAssistantRole)} className="w-full py-3.5 rounded-xl bg-morandi-text-primary dark:bg-gray-700 text-white font-medium shadow-lg hover:bg-gray-800 transition-all active:scale-[0.98]">{t.save}</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
