import React from "react";
import { Smile, MessageSquareQuote, Heart, ShieldAlert, Award } from "lucide-react";
import { AnalysisResponse } from "../types";
import { motion } from "motion/react";

interface AnalysisDashboardProps {
  analysis: AnalysisResponse;
  dateStr?: string;
}

// Function to map emotions to custom styling, descriptions, and icons/emojis
const getEmotionMeta = (emotion: string) => {
  const normalized = emotion.trim().replace(/\s+/g, "");
  
  if (normalized.includes("불안") || normalized.includes("걱정")) {
    return {
      emoji: "🌀",
      color: "from-blue-400 to-indigo-500",
      textColor: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
      comment: "마음속 소용돌이를 달래줄 따뜻한 숨결이 필요해.",
    };
  }
  if (normalized.includes("지침") || normalized.includes("무기력") || normalized.includes("피로")) {
    return {
      emoji: "☁️",
      color: "from-slate-400 to-indigo-400",
      textColor: "text-slate-700",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-100",
      comment: "지금은 가만히 멈춰서 보송보송 쉴 준비가 된 때야.",
    };
  }
  if (normalized.includes("외로움") || normalized.includes("소외") || normalized.includes("쓸쓸")) {
    return {
      emoji: "🌙",
      color: "from-purple-400 to-purple-600",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      comment: "어두운 밤에도 달님은 언제나 너의 길을 비춰줄 거야.",
    };
  }
  if (normalized.includes("슬픔") || normalized.includes("우울") || normalized.includes("눈물")) {
    return {
      emoji: "💧",
      color: "from-sky-400 to-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      comment: "마음껏 눈물 흘려도 괜찮아, 맑은 무지개가 비칠 거야.",
    };
  }
  if (normalized.includes("분노") || normalized.includes("화") || normalized.includes("짜증") || normalized.includes("억울")) {
    return {
      emoji: "⚡",
      color: "from-amber-400 to-rose-500",
      textColor: "text-rose-700",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-100",
      comment: "불쑥 솟구친 불꽃도 너를 지키고 싶었던 정당한 울림이야.",
    };
  }
  if (normalized.includes("뿌듯") || normalized.includes("성취") || normalized.includes("자랑")) {
    return {
      emoji: "✨",
      color: "from-yellow-400 to-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      comment: "스스로를 대견해하는 너의 마음이 별처럼 반짝이네.",
    };
  }
  if (normalized.includes("평온") || normalized.includes("편안") || normalized.includes("안정")) {
    return {
      emoji: "🍃",
      color: "from-emerald-400 to-teal-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      comment: "살랑이는 풀잎처럼 한없이 맑고 편안한 호흡이야.",
    };
  }
  if (normalized.includes("행복") || normalized.includes("기쁨") || normalized.includes("설렘")) {
    return {
      emoji: "🌸",
      color: "from-pink-400 to-rose-400",
      textColor: "text-pink-700",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-100",
      comment: "네 마음에 따스한 봄날의 꽃봉오리가 활짝 피었구나.",
    };
  }

  // Default fallback
  return {
    emoji: "🧸",
    color: "from-purple-400 to-indigo-400",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    comment: "소중한 너의 감정을 조용히 보듬어줄게.",
  };
};

export default function AnalysisDashboard({ analysis, dateStr }: AnalysisDashboardProps) {
  const { emotion_analysis, empathy_message } = analysis;
  const primaryEmotion = emotion_analysis.primary_emotion;
  const primaryMeta = getEmotionMeta(primaryEmotion);

  return (
    <div className="flex flex-col gap-6">
      {/* Primary Emotion Indicator Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl p-6 border ${primaryMeta.bgColor} ${primaryMeta.borderColor} shadow-sm flex flex-col md:flex-row items-center gap-5`}
      >
        <div className="w-20 h-20 shrink-0 rounded-2xl bg-white shadow-xs flex items-center justify-center text-4xl border border-gray-100">
          {primaryMeta.emoji}
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {dateStr || "오늘 밤"}의 주된 감정
            </span>
            <span className="text-xs text-gray-400 font-mono">Prescription</span>
          </div>
          <h3 className="text-xl font-extrabold text-gray-800 mt-1 flex items-center justify-center md:justify-start gap-1">
            <span className={`${primaryMeta.textColor}`}>{primaryEmotion}</span>
            <span>을 마음껏 느끼는 중</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1.5 font-medium leading-relaxed">
            {primaryMeta.comment}
          </p>
        </div>
      </motion.div>

      {/* Empathy Letter Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative bg-[#fcf9f2] rounded-3xl p-6 md:p-8 border-2 border-dashed border-amber-200/60 shadow-lg flex flex-col"
      >
        {/* Ribbon decoration */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-400 text-white font-medium text-[10px] px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <Heart className="w-3 h-3 fill-current animate-pulse" />
          <span>마음쉼 편지</span>
        </div>

        {/* Vintage line decorations */}
        <div className="flex items-center justify-between border-b border-amber-200/30 pb-3 mb-4 text-xs text-amber-800/60">
          <span>발신: 너를 아끼는 마음쉼 선생님</span>
          <span className="font-serif">Dear. 고마운 너에게</span>
        </div>

        {/* Empathy message using handwriting font Gaegu */}
        <div className="text-lg md:text-xl text-gray-800 font-hand leading-loose tracking-wide select-none min-h-[100px] whitespace-pre-line bg-transparent">
          {empathy_message}
        </div>

        <div className="flex items-center justify-end mt-4 border-t border-amber-200/30 pt-3 gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
          <p className="text-[11px] font-hand text-amber-800/60">오늘 밤, 편안히 눈을 감고 쉴 수 있기를 바라며</p>
        </div>
      </motion.div>

      {/* Ratios Emotional Spectrum Chart */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-purple-100 shadow-md"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Smile className="w-4.5 h-4.5 text-purple-500" />
              나의 감정 비율 스펙트럼
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">내 마음에 들어와 앉은 감정들의 점유율이야.</p>
          </div>
          <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md font-semibold border border-purple-100">
            총합 100%
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {emotion_analysis.ratios.map((ratio, index) => {
            const meta = getEmotionMeta(ratio.emotion);
            return (
              <div key={index} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-gray-700">
                    <span className="text-sm">{meta.emoji}</span>
                    <span>{ratio.emotion}</span>
                  </div>
                  <span className={`font-mono font-bold ${meta.textColor}`}>{ratio.percentage}%</span>
                </div>
                {/* Custom animated progress bar wrapper */}
                <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ratio.percentage}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: index * 0.15 }}
                    className={`h-full rounded-full bg-gradient-to-r ${meta.color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Emotion Balance Insight Card */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-start gap-2.5 text-xs text-gray-500">
          <ShieldAlert className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            여러 감정이 섞여 있는 것은 <strong>마음이 건강하게 작용하고 있다는 신호</strong>야. 마음의 수많은 파도들을 거부하지 말고, "아, 내가 지금 이런 감정들을 모두 느끼고 있구나" 하고 조용히 안아주자.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
