import React, { useState } from "react";
import { PenTool, Sparkles, HeartHandshake, AlertCircle } from "lucide-react";
import { WritingPrompt } from "../types";

interface DiaryFormProps {
  onSubmit: (diaryText: string) => void;
  isLoading: boolean;
}

const HELPER_PROMPTS: WritingPrompt[] = [
  { id: "p1", text: "오늘 친구나 가족과의 관계에서 마음에 걸렸던 일이나 말 한마디가 있었니?", category: "relationship" },
  { id: "p2", text: "공부나 학업 계획, 앞으로의 미래 때문에 유난히 불안하고 부담을 느꼈던 점이 있어?", category: "study" },
  { id: "p3", text: "오늘 하루 나를 소소하게라도 미소 짓게 만들거나 소중했던 순간이 있었니?", category: "general" },
  { id: "p4", text: "주변 사람들이나 SNS를 보며 나 혼자만 뒤처지는 것 같아 마음이 쓸쓸했었는지 궁금해.", category: "career" },
];

export default function DiaryForm({ onSubmit, isLoading }: DiaryFormProps) {
  const [diaryText, setDiaryText] = useState<string>("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (diaryText.trim()) {
      onSubmit(diaryText);
    }
  };

  const handlePromptClick = (prompt: WritingPrompt) => {
    setSelectedPrompt(prompt.id);
    // Ask if they want to append or replace if there's already content, or simply append
    if (diaryText.trim() === "") {
      setDiaryText(`Q. ${prompt.text}\n\n`);
    } else {
      setDiaryText((prev) => `${prev}\n\n[질문] ${prompt.text}\n`);
    }
  };

  const wordCount = diaryText.trim().length;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-purple-100 shadow-md flex flex-col h-full">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 bg-purple-500 rounded-xl text-white shadow-sm">
          <PenTool className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">나의 하루 흘려보내기</h2>
          <p className="text-xs text-gray-500 mt-0.5">누구에게도 말하지 못했던 마음의 응어리들을 자유롭게 적어봐.</p>
        </div>
      </div>

      {/* Helper prompts */}
      <div className="mb-5">
        <label className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          글쓰기가 어려울 땐, 이 질문들에 답해봐
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {HELPER_PROMPTS.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => handlePromptClick(prompt)}
              className={`text-left p-3 rounded-2xl text-xs transition-all border ${
                selectedPrompt === prompt.id
                  ? "bg-purple-50/80 border-purple-200 text-purple-700 shadow-xs"
                  : "bg-gray-50/50 border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200"
              }`}
              id={`prompt_${prompt.id}`}
            >
              {prompt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Diary inputs */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
        <div className="flex-1 relative">
          <textarea
            value={diaryText}
            onChange={(e) => setDiaryText(e.target.value)}
            disabled={isLoading}
            placeholder="오늘 하루 어떤 감정을 느꼈니? 성적 때문에 불안했거나, 친구의 서운한 행동이 신경 쓰였거나, 혹은 반대로 뿌듯했던 일까지 모두 괜찮아. 정돈되지 않은 생각이어도 다정히 들어줄게."
            className="w-full h-full min-h-[220px] p-4 rounded-2xl bg-gray-50/80 border border-gray-200 focus:border-purple-300 focus:ring-1 focus:ring-purple-100 focus:outline-none transition-all text-sm text-gray-700 leading-relaxed placeholder:text-gray-400 resize-none"
            id="diary_input_textarea"
          />
          <div className="absolute bottom-3 right-4 text-[10px] text-gray-400 bg-white/95 px-1.5 py-0.5 rounded-full border border-gray-100">
            {wordCount}자 작성 중
          </div>
        </div>

        {/* Informative advice */}
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-purple-50/30 p-3 rounded-2xl border border-purple-100/50">
          <HeartHandshake className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            마음쉼 상담 AI는 너를 혼내거나 진단하지 않아. 모든 슬픔과 서운함, 소외감도 <strong>너의 소중한 감정의 일부</strong>야. 언제든지 온전히 네 마음을 털어놓으렴.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || wordCount < 5}
          className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
            isLoading || wordCount < 5
              ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-purple-500 hover:bg-purple-600 active:scale-[0.99] text-white shadow-purple-200"
          }`}
          id="diary_submit_btn"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>마음 들여다보는 중...</span>
            </>
          ) : (
            <>
              <span>일기 봉인하고 공감받기</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
