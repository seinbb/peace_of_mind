import React, { useState, useEffect } from "react";
import { Heart, Sparkles, BookOpen, FileSignature, ArrowLeft, RefreshCw, Moon, Star } from "lucide-react";
import { DiaryEntry, AnalysisResponse } from "./types";
import DiaryForm from "./components/DiaryForm";
import AnalysisDashboard from "./components/AnalysisDashboard";
import BreathingCoach from "./components/BreathingCoach";
import DiaryHistory from "./components/DiaryHistory";
import { motion, AnimatePresence } from "motion/react";

// Mock helper to format dates beautifully in Korean
const getFormattedDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const day = days[d.getDay()];
  return `${year}년 ${month}월 ${date}일 (${day})`;
};

const getFormattedTime = () => {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "오후" : "오전";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? "0" + minutes : minutes;
  return `${ampm} ${hours}:${minStr}`;
};

export default function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isWriting, setIsWriting] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState<number>(0);

  const loadingMessages = [
    "너의 이야기를 귀담아듣고 있는 중이야...",
    "마음의 감정 키워드를 조심스레 헤아리는 중이야...",
    "다정하고 솔직한 위로의 편지를 적어내리는 중이야...",
    "오늘 밤 너의 마음이 한결 가벼워지기를 기대하며..."
  ];

  // Rotate loading messages
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Load from localstorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("maum_swim_entries");
      if (saved) {
        const parsed = JSON.parse(saved) as DiaryEntry[];
        setEntries(parsed);
        if (parsed.length > 0) {
          setSelectedEntry(parsed[0]);
          setIsWriting(false);
        }
      }
    } catch (e) {
      console.error("Local storage loading error", e);
    }
  }, []);

  // Save to localstorage
  const saveEntries = (newEntries: DiaryEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem("maum_swim_entries", JSON.stringify(newEntries));
  };

  const handleDiarySubmit = async (diaryText: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingMsgIdx(0);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diary: diaryText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "알 수 없는 에러가 발생했어." }));
        throw new Error(errData.error || "서버 응답 오류가 발생했어.");
      }

      const result: AnalysisResponse = await response.json();

      // Create new diary entry
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        date: getFormattedDate(),
        time: getFormattedTime(),
        content: diaryText,
        analysis: result,
      };

      const updated = [newEntry, ...entries];
      saveEntries(updated);
      setSelectedEntry(newEntry);
      setIsWriting(false);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "마음을 분석하는 과정에서 잠시 문제가 발생했어. 다시 시도해볼래?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    saveEntries(updated);

    if (selectedEntry?.id === id) {
      if (updated.length > 0) {
        setSelectedEntry(updated[0]);
      } else {
        setSelectedEntry(null);
        setIsWriting(true);
      }
    }
  };

  const handleSelectEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setIsWriting(false);
  };

  const startNewDiary = () => {
    setIsWriting(true);
    setSelectedEntry(null);
  };

  return (
    <div className="min-h-screen calm-bg pb-12 font-sans text-gray-800 transition-colors relative overflow-hidden selection:bg-purple-100 selection:text-purple-900">
      
      {/* Decorative background stars */}
      <div className="absolute top-10 left-10 text-purple-300 opacity-20 pointer-events-none">
        <Moon className="w-12 h-12 fill-current" />
      </div>
      <div className="absolute top-24 right-16 text-purple-400 opacity-20 pointer-events-none">
        <Star className="w-6 h-6 fill-current animate-pulse" />
      </div>
      <div className="absolute bottom-16 left-1/4 text-purple-300 opacity-20 pointer-events-none">
        <Star className="w-5 h-5 fill-current" />
      </div>

      {/* Main Header */}
      <header className="max-w-7xl mx-auto px-4 pt-6 pb-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-md rounded-3xl p-5 border border-purple-100/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-purple-100">
              <Heart className="w-5.5 h-5.5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black tracking-tight text-gray-900 font-sans">마음쉼</h1>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">AI Counselor</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">학업, 진로, 인간관계로 지친 밤, 조용히 쉬어가는 너만의 정원</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isWriting && (
              <button
                onClick={startNewDiary}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 shadow-purple-100"
                id="header_new_diary_btn"
              >
                <FileSignature className="w-3.5 h-3.5" />
                <span>오늘 일기 쓰기</span>
              </button>
            )}
            {entries.length > 0 && isWriting && (
              <button
                onClick={() => {
                  if (entries.length > 0) {
                    setSelectedEntry(entries[0]);
                    setIsWriting(false);
                  }
                }}
                className="px-4 py-2 bg-white/80 hover:bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                id="header_view_past_btn"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>지난 기록 보기</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 mt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Writing or Analysis Dashboard (Main Action Card) */}
          <section className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-[500px]">
            <AnimatePresence mode="wait">
              {isLoading ? (
                // Beautiful immersive Full-Page Loading state inside the card area
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white/90 backdrop-blur-md rounded-3xl p-10 border border-purple-100 shadow-md flex flex-col items-center justify-center flex-1 min-h-[450px] text-center"
                >
                  <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                    {/* Concentric glowing pulse circles */}
                    <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-purple-300 opacity-20"></span>
                    <span className="animate-ping absolute inline-flex h-24 w-24 rounded-full bg-purple-200 opacity-15"></span>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-100 z-10 animate-bounce">
                      <Heart className="w-8 h-8 fill-current" />
                    </div>
                  </div>
                  
                  <h3 className="text-md font-bold text-gray-800 transition-all duration-500 min-h-[24px]">
                    {loadingMessages[loadingMsgIdx]}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 max-w-sm">
                    오늘 힘겹게 털어놓아 준 너의 진심 어린 마음에 보답하기 위해 다정한 손편지와 분석을 차분히 엮어내고 있어. 잠시 숨을 고르며 기다려줘.
                  </p>
                  
                  <div className="mt-8 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </motion.div>
              ) : error ? (
                // Elegant Error fallback display
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white/95 rounded-3xl p-8 border border-red-100 shadow-md flex flex-col items-center justify-center flex-1 text-center"
                >
                  <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800">잠시 숨고르기 오류</h3>
                  <p className="text-xs text-gray-500 mt-1.5 max-w-md leading-relaxed">
                    {error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-5 px-5 py-2.5 bg-purple-500 text-white rounded-xl text-xs font-semibold hover:bg-purple-600 active:scale-95 transition-all"
                    id="error_retry_btn"
                  >
                    일기 다시 작성하기
                  </button>
                </motion.div>
              ) : isWriting ? (
                // Writing Mode
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1"
                >
                  <DiaryForm onSubmit={handleDiarySubmit} isLoading={isLoading} />
                </motion.div>
              ) : selectedEntry ? (
                // Analysis Dashboard Mode
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 space-y-4"
                >
                  <div className="flex items-center justify-between pb-1">
                    <button
                      onClick={startNewDiary}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:text-purple-600 hover:border-purple-200 shadow-2xs transition-colors flex items-center gap-1"
                      id="back_to_write_btn"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>새 일기 작성하기</span>
                    </button>
                    <div className="text-right text-[11px] text-gray-400 font-medium">
                      기록 시각: {selectedEntry.date} {selectedEntry.time}
                    </div>
                  </div>

                  <AnalysisDashboard analysis={selectedEntry.analysis} dateStr={selectedEntry.date} />

                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-purple-100/50 shadow-2xs">
                    <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">내가 썼던 일기 내용</h5>
                    <p className="text-xs text-gray-600 leading-relaxed max-h-[120px] overflow-y-auto whitespace-pre-wrap break-all pr-1">
                      {selectedEntry.content}
                    </p>
                  </div>
                </motion.div>
              ) : (
                // Empty state if there's no selected entry and not writing (highly unlikely, but safe fallback)
                <div className="bg-white/95 rounded-3xl p-10 text-center flex flex-col items-center justify-center flex-1 border border-purple-100">
                  <p className="text-xs text-gray-400">아직 등록된 오늘의 마음이 없네.</p>
                  <button onClick={startNewDiary} className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-xl text-xs font-semibold hover:bg-purple-600 transition-colors">
                    새 일기 작성하기
                  </button>
                </div>
              )}
            </AnimatePresence>
          </section>

          {/* RIGHT: Supportive Care Columns (Breathing Guide, Sounds, Logs) */}
          <section className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* Calming Breathing Guide Card */}
            <BreathingCoach />

            {/* List and History search log of previous entries */}
            <DiaryHistory
              entries={entries}
              selectedId={selectedEntry?.id || null}
              onSelectEntry={handleSelectEntry}
              onDeleteEntry={handleDeleteEntry}
            />

          </section>
        </div>
      </main>

      {/* Humble comforting footer statement */}
      <footer className="max-w-7xl mx-auto px-4 mt-12 text-center text-[11px] text-gray-400 font-medium">
        <p>© {new Date().getFullYear()} 마음쉼 (Maum-Swim) • 언제나 네 곁에 머물며 소중한 너의 감정을 응원해.</p>
      </footer>
    </div>
  );
}
