export interface EmotionRatio {
  emotion: string;
  percentage: number;
}

export interface EmotionAnalysis {
  primary_emotion: string;
  ratios: EmotionRatio[];
}

export interface AnalysisResponse {
  emotion_analysis: EmotionAnalysis;
  empathy_message: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  time: string;
  content: string;
  analysis: AnalysisResponse;
}

export interface WritingPrompt {
  id: string;
  text: string;
  category: "study" | "relationship" | "career" | "general";
}
