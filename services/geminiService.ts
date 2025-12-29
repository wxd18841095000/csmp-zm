
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const API_KEY = process.env.API_KEY;
const MODEL_NAME = 'gemini-3-flash-preview';

export class SubtitleService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async analyzeAudio(base64Audio: string, mimeType: string): Promise<AnalysisResult> {
    const prompt = `
      你现在是一个高精度字幕转录专家。
      请执行以下任务：
      1. 理解音频内容，提供一份逐点列出的内容摘要。
      2. 提取稿件中所有你觉得不确定、容易出错的“专有名词”或“核心词汇”。
      3. 提供完整的原始转录文稿。

      请务必使用 JSON 格式返回，包含以下字段：
      - summary: 字符串数组，每条是一点摘要。
      - uncertainTerms: 字符串数组，待确认的词汇。
      - fullTranscript: 完整的原始转录内容。
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Audio, mimeType } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.ARRAY, items: { type: Type.STRING } },
            uncertainTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
            fullTranscript: { type: Type.STRING }
          },
          required: ["summary", "uncertainTerms", "fullTranscript"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as AnalysisResult;
  }

  async formatSubtitles(confirmedText: string): Promise<string[]> {
    const prompt = `
      你现在是“短视频字幕格式化专家”。
      请严格按照以下规则处理给出的文稿，并直接输出结果。

      【格式化规则】
      1. 严格清洗口水词：删除所有无意义的“呃”、“啊”、“那个”、“就是”、“然后”、“嗯”、“嘛”、“哼”、“哈”、“呢”等。对“呢”字保持高度敏感，如“所以呢”必须改为“所以”。
      2. 标点与停顿：只保留“？”和“！”。删除所有其他标点。在语义停顿处统一使用“两个半角空格”分隔。
      3. 字幕规则：每一条字幕严格限制为 1 行，每行不超过 32 个汉字。
      4. 智能断句：在自然语义停顿处拆分长句。
      5. 风格统一：数字统一为阿拉伯数字；英文缩写大写（如 AI, API）；非人类实体统一用“TA”。

      【文稿内容】
      ${confirmedText}

      请直接按行输出格式化后的字幕，不要包含任何解释或标题。
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ parts: [{ text: prompt }] }]
    });

    const text = response.text || '';
    return text.split('\n').filter(line => line.trim().length > 0);
  }
}
