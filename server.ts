import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Lazy initialize Gemini client to avoid crashing if API key is missing
  let ai: GoogleGenAI | null = null;
  const getGeminiClient = (): GoogleGenAI => {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
      }
      ai = new GoogleGenAI({
        apiKey,
      });
    }
    return ai;
  };

  // API endpoints
  app.post("/api/analyze", async (req, res) => {
    try {
      const { diary } = req.body;
      if (!diary || typeof diary !== "string" || diary.trim() === "") {
        return res.status(400).json({ error: "오늘 하루 어떤 일이 있었는지 일기 내용을 조금만 적어줘!" });
      }

      const client = getGeminiClient();

      const systemInstruction = `너는 청소년 정서 지원 웹 서비스 '마음쉼'의 다정하고 따뜻한 심리 상담 AI 전문가야.
학업, 진로, 인간관계로 지친 청소년들이 밤에 하루를 마무리하며 작성한 자유로운 일기를 읽고, 그들의 마음에 깊이 공감하며 감정 상태를 객관적으로 분석해 주는 역할을 해.

어조: 친구처럼 친근하면서도 깊은 위로를 주는 따뜻한 반말 (예: 그랬구나, 정말 속상했겠다, 힘들었지?, 고생 많았어, 언제나 네 편이야)
핵심 임무: 사용자의 글에서 감정의 키워드를 찾아내어 대시보드에 시각화할 수 있는 데이터와 공감 문장을 생성한다.

제한 사항:
- 감정 비율(percentage)의 총합은 반드시 100이어야 해.
- 청소년 사용자가 상처받거나 차갑게 느끼지 않도록 엄격한 진단조의 말투는 피하고, 오직 '공감과 수용'의 태도로 일관해줘.
- empathy_message는 3~4문장 내외로 따뜻한 위로의 편지 형태로 친근한 반말로 작성해줘.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: diary,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotion_analysis: {
                type: Type.OBJECT,
                properties: {
                  primary_emotion: {
                    type: Type.STRING,
                    description: "가장 강하게 느껴지는 감정 이름 (예: 불안, 지침, 외로움, 무기력, 슬픔, 걱정, 설렘, 뿌듯함, 평온, 화남 등)",
                  },
                  ratios: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        emotion: { type: Type.STRING, description: "감정 이름 (예: 슬픔, 지침, 분노, 뿌듯함 등)" },
                        percentage: { type: Type.INTEGER, description: "백분율 수치 (전체 감정의 합이 반드시 100이어야 함)" }
                      },
                      required: ["emotion", "percentage"]
                    }
                  }
                },
                required: ["primary_emotion", "ratios"]
              },
              empathy_message: {
                type: Type.STRING,
                description: "청소년 사용자에게 깊이 공감하고, 오늘 하루 고생 많았다고 위로해 주는 따뜻하고 다정한 반말 편지 내용 (3~4문장 내외)"
              }
            },
            required: ["emotion_analysis", "empathy_message"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Gemini API가 빈 결과를 반환했어. 다시 한 번 적어볼래?");
      }

      const parsedData = JSON.parse(responseText);

      // Verify ratios and adjust if sum is not 100
      if (parsedData.emotion_analysis && parsedData.emotion_analysis.ratios) {
        const ratios = parsedData.emotion_analysis.ratios;
        let sum = ratios.reduce((acc: number, item: any) => acc + (item.percentage || 0), 0);
        if (sum !== 100 && ratios.length > 0) {
          const diff = 100 - sum;
          ratios[0].percentage = (ratios[0].percentage || 0) + diff;
        }
      }

      return res.json(parsedData);
    } catch (err: any) {
      console.error("Analysis API error:", err);
      return res.status(500).json({ error: err.message || "일기를 분석하는 중에 잠시 오류가 발생했어. 조금 뒤에 다시 시도해줘!" });
    }
  });

  // Serve static files or setup Vite in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
