import React, { useState, useEffect } from "react";
import { Heart, Sparkles, BookOpen, FileSignature, ArrowLeft, RefreshCw, Moon, Star, Key, X, ExternalLink } from "lucide-react";
import { DiaryEntry, AnalysisResponse } from "./types";
import DiaryForm from "./components/DiaryForm";
import AnalysisDashboard from "./components/AnalysisDashboard";
import BreathingCoach from "./components/BreathingCoach";
import DiaryHistory from "./components/DiaryHistory";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI, Type } from "@google/genai";

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

  // API Key state for standalone client-side usage
  const [apiKey, setApiKey] = useState<string>("");
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>("");

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

  // Load entries and API key on mount
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem("maum_swim_entries");
      if (savedEntries) {
        const parsed = JSON.parse(savedEntries) as DiaryEntry[];
        setEntries(parsed);
        if (parsed.length > 0) {
          setSelectedEntry(parsed[0]);
          setIsWriting(false);
        }
      }

      // Check for custom stored API Key or fallback to build config env var
      const storedKey = localStorage.getItem("maum_swim_api_key");
      const defaultKey = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
      
      if (storedKey) {
        setApiKey(storedKey);
        setTempKey(storedKey);
      } else if (defaultKey) {
        setApiKey(defaultKey);
        setTempKey(defaultKey);
      } else {
        // Fallback for AI Studio inject sequence if applicable
        const envKey = (window as any).GEMINI_API_KEY || "";
        if (envKey) {
          setApiKey(envKey);
          setTempKey(envKey);
        }
      }
    } catch (e) {
      console.error("Initialization loading error", e);
    }
  }, []);

  // Save entries to localstorage
  const saveEntries = (newEntries: DiaryEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem("maum_swim_entries", JSON.stringify(newEntries));
  };

  // Save custom API key
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tempKey.trim();
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem("maum_swim_api_key", trimmed);
    } else {
      localStorage.removeItem("maum_swim_api_key");
    }
    setShowKeyModal(false);
  };

  const handleDiarySubmit = async (diaryText: string) => {
    // 1. Ensure API Key is configured
    const activeKey = apiKey || (import.meta as any).env.VITE_GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
    if (!activeKey || activeKey.trim() === "") {
      setShowKeyModal(true);
      setError("AI 분석과 따뜻한 공감을 받기 위해 우측 상단 'API 키 설정'에서 Google Gemini API Key를 등록해줘!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMsgIdx(0);

    try {
      // 2. Initialize client directly in browser (Pure SPA Mode)
      const ai = new GoogleGenAI({ apiKey: activeKey.trim() });

      const systemInstruction = `너는 청소년 정서 지원 웹 서비스 '마음쉼'의 다정하고 따뜻한 심리 상담 AI 전문가야.
학업, 진로, 인간관계로 지친 청소년들이 밤에 하루를 마무리하며 작성한 자유로운 일기를 읽고, 그들의 마음에 깊이 공감하며 감정 상태를 객관적으로 분석해 주는 역할을 해.

어조: 친구처럼 친근하면서도 깊은 위로를 주는 따뜻한 반말 (예: 그랬구나, 정말 속상했겠다, 힘들었지?, 고생 많았어, 언제나 네 편이야)
핵심 임무: 사용자의 글에서 감정의 키워드를 찾아내어 대시보드에 시각화할 수 있는 데이터와 공감 문장을 생성한다.

제한 사항:
- 감정 비율(percentage)의 총합은 반드시 100이어야 해.
- 청소년 사용자가 상처받거나 차갑게 느끼지 않도록 엄격한 진단조의 말투는 피하고, 오직 '공감과 수용'의 태도로 일관해줘.
- empathy_message는 3~4문장 내외로 따뜻한 위로의 편지 형태로 친근한 반말로 작성해줘.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: diaryText,
        config: {
          systemInstruction,
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
                        emotion: { type: Type.STRING, description: "감정 이름" },
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
                description: "청소년 사용자에게 깊이 공감하고 위로해 주는 따뜻하고 다정한 반말 편지 내용 (3~4문장 내외)"
              }
            },
            required: ["emotion_analysis", "empathy_message"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("마음 분석 결과가 비어있어. 다시 적어볼래?");
      }

      const parsedData: AnalysisResponse = JSON.parse(responseText);

      // Verify ratios and adjust if sum is not 100
      if (parsedData.emotion_analysis && parsedData.emotion_analysis.ratios) {
        const ratios = parsedData.emotion_analysis.ratios;
        const sum = ratios.reduce((acc, item) => acc + (item.percentage || 0), 0);
        if (sum !== 100 && ratios.length > 0) {
          const diff = 100 - sum;
          ratios[0].percentage = (ratios[0].percentage || 0) + diff;
        }
      }

      // Create new diary entry
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        date: getFormattedDate(),
        time: getFormattedTime(),
        content: diaryText,
        analysis: parsedData,
      };

      const updated = [newEntry, ...entries];
      saveEntries(updated);
      setSelectedEntry(newEntry);
      setIsWriting(false);
    } catch (err: any) {
      console.error("Direct Gemini API Analysis failed:", err);
      setError(
        err.message?.includes("API_KEY") || err.message?.includes("authentication") || err.message?.includes("key")
          ? "API 키가 만료되었거나 올바르지 않은 것 같아. 우측 상단 'API 키 설정'에서 유효한 Gemini 키인지 확인해줘!"
          : err.message || "마음을 분석하는 과정에서 잠시 문제가 발생했어. 다시 한 번 적어볼래?"
      );
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
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">Pure Client SPA</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">학업, 진로, 인간관계로 지친 밤, 조용히 쉬어가는 너만의 정원</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* API Key settings badge */}
            <button
              onClick={() => {
                setTempKey(apiKey);
                setShowKeyModal(true);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                apiKey
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
              }`}
              id="header_api_key_btn"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{apiKey ? "API 키 완료" : "API 키 필요"}</span>
            </button>

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
                  
                  <h3 className="text-sm font-bold text-gray-800 transition-all duration-500 min-h-[24px]">
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
                  <p className="text-xs text-red-500 mt-1.5 max-w-md leading-relaxed">
                    {error}
                  </p>
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => setError(null)}
                      className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-xs font-semibold hover:bg-purple-600 active:scale-95 transition-all"
                      id="error_retry_btn"
                    >
                      일기 다시 작성하기
                    </button>
                    {!apiKey && (
                      <button
                        onClick={() => setShowKeyModal(true)}
                        className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 active:scale-95 transition-all"
                        id="error_set_key_btn"
                      >
                        API 키 설정하기
                      </button>
                    )}
                  </div>
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

          {/* RIGHT: Supportive Care Columns (Breathing Guide, Logs) */}
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

      {/* API Key Setup Modal Dialog */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-purple-100 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-purple-500" />
                  Gemini API 키 설정
                </h3>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveApiKey} className="space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  마음쉼의 일기 감정 분석 및 다정한 답장 기능은 구글의 <strong>Gemini 3.5 Flash AI 모델</strong>을 통해 구동됩니다. 
                  <br />
                  설정하신 API 키는 브라우저 내부 로컬 스토리지에만 저장되어 안전합니다.
                </p>

                <div>
                  <label className="text-[11px] font-bold text-purple-600 block mb-1.5">Gemini API Key</label>
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="AI_지정_API_키를_입력해줘"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-purple-300 transition-all font-mono"
                    id="api_key_modal_input"
                  />
                </div>

                <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-purple-700">💡 아직 API 키가 없니?</span>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    구글 AI 스튜디오에서 단 10초 만에 무료로 발급받아 사용할 수 있어!
                  </p>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-purple-600 font-bold hover:underline flex items-center gap-1 self-start"
                  >
                    <span>무료 API 키 발급받기</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setTempKey("");
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    지우기
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    설정 저장하기
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Humble comforting footer statement */}
      <footer className="max-w-7xl mx-auto px-4 mt-12 text-center text-[11px] text-gray-400 font-medium">
        <p>© {new Date().getFullYear()} 마음쉼 (Maum-Swim) • 언제나 네 곁에 머물며 소중한 너의 감정을 응원해.</p>
      </footer>
    </div>
  );
}
