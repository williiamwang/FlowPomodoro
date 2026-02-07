
import { GoogleGenAI, Type } from "@google/genai";
import { TaskBreakdownResponse, Language, TimerMode } from '../types';

const getAI = () => {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) return null as any;
  try {
    return new GoogleGenAI({ apiKey: key });
  } catch {
    return null as any;
  }
};

const getResponseText = async (response: any): Promise<string | null> => {
  const t = response?.text;
  if (typeof t === 'function') {
    try { return await t(); } catch { return null; }
  }
  if (typeof t === 'string') return t;
  const rt = response?.response?.text;
  if (typeof rt === 'function') {
    try { return await rt(); } catch { return null; }
  }
  if (typeof rt === 'string') return rt;
  return null;
};

const cleanTitle = (s: string): string => {
  let x = s || '';
  x = x.replace(/```/g, '');
  x = x.replace(/\bjson\b/gi, '');
  x = x.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');
  x = x.replace(/^[\d]+\s*[\.\)\-:]\s*/, '');
  x = x.replace(/^[\-\*\u2022]\s*/, '');
  x = x.replace(/\s+/g, ' ').trim();
  return x;
};

const extractTasks = (raw: string, lang: Language): string[] => {
  const text = raw?.trim() || '';
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map(v => cleanTitle(String(v))).filter(v => v.length > 0);
    }
    if (parsed && Array.isArray((parsed as any).tasks)) {
      return (parsed as any).tasks.map((v: any) => cleanTitle(String(v))).filter((v: string) => v.length > 0);
    }
  } catch {}
  const byLine = text.split(/\r?\n/).map(v => cleanTitle(v)).filter(v => v.length > 1);
  if (byLine.length >= 3) return byLine.slice(0, 8);
  const delimiters = lang === Language.ZH ? /[，。,；;]/ : /[,.;]/;
  const parts = text.split(delimiters).map(v => cleanTitle(v)).filter(v => v.length > 1);
  return parts.slice(0, 8);
};

const logProvider = (name: string) => {
  try { console.log('AI provider:', name); } catch {}
};

const localBreakdown = (goal: string, lang: Language): string[] => {
  const g = goal.trim();
  const isZH = lang === Language.ZH;
  const baseZH = ["明确需求", "拆分模块", "搭建环境", "实现核心流程", "测试与优化"];
  const baseEN = ["Clarify requirements", "Split modules", "Setup environment", "Implement core flow", "Test and refine"];
  const arr = isZH ? baseZH : baseEN;
  if (g.length > 0) return arr.slice(0, 5);
  return arr.slice(0, 3);
};

const FALLBACK_QUOTES = {
  [TimerMode.WORK]: {
    [Language.ZH]: [
      "万物静观皆自得，四时佳兴与人同。",
      "宁静致远，淡泊明志。",
      "博观而约取，厚积而薄发。",
      "不积跬步，无以至千里。",
      "欲穷千里目，更上一层楼。",
      "非淡泊无以明志，非宁静无以致远。",
      "学向勤中得，萤窗万卷书。"
    ],
    [Language.EN]: [
      "Concentrate every minute like a Roman.",
      "The soul becomes dyed with the color of its thoughts.",
      "Deep work is the superpower of the 21st century.",
      "Silence is a source of great strength.",
      "He who has a why to live can bear almost any how.",
      "First, have a definite, clear practical ideal.",
      "Focus is a matter of deciding what things you're not going to do."
    ]
  },
  [TimerMode.SHORT_BREAK]: {
    [Language.ZH]: [
      "闲看庭前花开花落，漫随天外云卷云舒。",
      "偷得浮生半日闲。",
      "晚来天欲雪，能饮一杯无？",
      "采菊东篱下，悠然见南山。",
      "小楼一夜听春雨，深巷明朝卖杏花。",
      "春风得意马蹄疾，一日看尽长安花。",
      "回首向来萧瑟处，也无风雨也无晴。",
    ],
    [Language.EN]: [
      "The time to relax is when you don't have time for it.",
      "Almost everything will work again if you unplug it for a few minutes.",
      "Rest is not idleness, and to lie sometimes on the grass.",
      "Calm mind brings inner strength and self-confidence.",
      "Within you, there is a stillness and a sanctuary.",
      "Relaxation is a physical state that the mind follows.",
      "Take a deep breath. It's just a bad day, not a bad life."
    ]
  },
  [TimerMode.LONG_BREAK]: {
    [Language.ZH]: [
      "行到水穷处，坐看云起时。",
      "明月松间照，清泉石上流。",
      "结庐在人境，而无车马喧。",
      "莫听穿林打叶声，何妨吟啸且徐行。",
      "众里寻他千百度，蓦然回首，那人却在，灯火珊珊处。",
      "此地有崇山峻岭，茂林修竹。",
      "人生如逆旅，我亦是行人。"
    ],
    [Language.EN]: [
      "In the mountains, there are no expectations.",
      "Nature does not hurry, yet everything is accomplished.",
      "The poetry of the earth is never dead.",
      "Deep breaths are like little love notes to your body.",
      "Sometimes the most productive thing you can do is relax.",
      "Wisdom comes with winters.",
      "Your mind will answer most questions if you learn to relax and wait."
    ]
  }
};

const SYSTEM_PROMPTS = {
  [TimerMode.WORK]: {
    [Language.ZH]: "挑选7句意境深远、关于专注、勤学、宁静致远的中国古诗词（如唐诗宋词）。要求：每句完整，不带作者名，文字优美，适合专注状态。",
    [Language.EN]: "Provide 7 deep, focus-oriented ancient Stoic or philosophical quotes. Requirements: Short, impactful, full sentences."
  },
  [TimerMode.SHORT_BREAK]: {
    [Language.ZH]: "挑选7句意境悠闲、关于小憩、赏花、听雨、片刻宁静的中国古诗词。要求：每句完整，不带作者名，文字空灵，适合短休。",
    [Language.EN]: "Provide 7 peaceful, relaxing short quotes about taking a breath and finding calm."
  },
  [TimerMode.LONG_BREAK]: {
    [Language.ZH]: "挑选7句意境旷达、关于放慢节奏、回归自然、心无挂碍的中国古诗词。要求：每句完整，不带作者名，文字舒展，适合长休恢复精力。",
    [Language.EN]: "Provide 7 profound, expansive quotes about freedom, nature, and deep rejuvenation."
  }
};

export const breakDownTaskWithAI = async (goal: string, lang: Language): Promise<string[]> => {
  try {
    const isZH = lang === Language.ZH;
    const ai = getAI();
    if (!ai) {
      const delimiters = lang === Language.ZH ? /[，。,；;]/ : /[,.;]/;
      const parts = goal.split(delimiters).map(p => p.trim()).filter(p => p.length > 2);
      if (parts.length > 1) {
        return parts;
      }
      return localBreakdown(goal, lang);
    }
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a productivity expert. Break down the following goal into 3 to 5 actionable tasks for 25-minute Pomodoro sessions. 
      Goal: "${goal}". 
      Respond in ${isZH ? 'Simplified Chinese' : 'English'}. 
      Keep titles under 10 words. Output JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of subtasks."
            }
          }
        }
      }
    });

    const text = await getResponseText(response);
    if (text) {
      const items = extractTasks(text, lang);
      if (items.length) { logProvider('GEMINI'); return items; }
      return localBreakdown(goal, lang);
    }
    return localBreakdown(goal, lang);
  } catch (error: any) {
    console.error("Gemini breakdown error:", error);
    const delimiters = lang === Language.ZH ? /[，。,；;]/ : /[,.;]/;
    const parts = goal.split(delimiters).map(p => p.trim()).filter(p => p.length > 2);
    if (parts.length > 1) { logProvider('LOCAL'); return parts; }
    logProvider('LOCAL'); return localBreakdown(goal, lang);
  }
};
export const fetchQuoteBatch = async (mode: TimerMode, lang: Language): Promise<string[]> => {
  try {
    const prompt = SYSTEM_PROMPTS[mode][lang];
    const ai = getAI();
    if (!ai) {
      const pool = FALLBACK_QUOTES[mode][lang];
      logProvider('LOCAL'); return [...pool].sort(() => Math.random() - 0.5);
    }
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${prompt} 请以JSON数组格式返回，仅包含字符串。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = await getResponseText(response);
    if (text) {
      try {
        const list = JSON.parse(text) as string[];
        logProvider('GEMINI'); return list.map(s => s.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim());
      } catch {
        const pool = FALLBACK_QUOTES[mode][lang];
        return [...pool].sort(() => Math.random() - 0.5);
      }
    }
  } catch (error: any) {
    console.warn("Gemini quote fetch error:", error.message);
    // Shuffle and return fallbacks on error (likely 429)
    const pool = FALLBACK_QUOTES[mode][lang];
    return [...pool].sort(() => Math.random() - 0.5);
  }
  return FALLBACK_QUOTES[mode][lang];
};
