// DO NOT LOG SECRETS
(async () => {
  const { GoogleGenAI, Type } = await import('@google/genai');
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key) {
    console.error('缺少 GEMINI_API_KEY 环境变量');
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey: key });

  const r1 = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: 'You are a productivity expert. Break down the following goal into 3 to 5 actionable tasks for 25-minute Pomodoro sessions. Goal: "搭建登陆页". Respond in Simplified Chinese. Keep titles under 10 words. Output JSON only.',
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });
  console.log('AI拆解结果:', r1.text || '');

  const r2 = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: '提供 3 句宁静休息相关的短句。请以 JSON 数组返回，仅包含字符串。',
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  console.log('引语结果:', r2.text || '');
  const fs = await import('fs');
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return s; } };
  const out = { breakdown: tryParse(r1.text || ''), quotes: tryParse(r2.text || '') };
  fs.writeFileSync('ai-test-output.json', JSON.stringify(out, null, 2), { encoding: 'utf-8' });
})().catch(e => {
  console.error('测试错误:', e?.message || e);
  process.exit(1);
});
