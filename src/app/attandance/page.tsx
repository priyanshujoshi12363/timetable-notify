"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Award,
  Clock,
  Calculator,
  ThumbsUp,
  AlertTriangle,
  History,
  Trash2,
  RefreshCw
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  inputData: {
    present: number;
    total: number;
    target: number;
  };
  response: any;
  summary: string;
  currentPercentage: number;
  safeBunks: number;
}

export default function Home() {
  const [present, setPresent] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [target, setTarget] = useState<string>("75");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    loadFromLocalStorage();
  }, []);

  useEffect(() => {
    if (mounted) {
      saveToLocalStorage();
    }
  }, [history, mounted]);

  const loadFromLocalStorage = () => {
    try {
      const savedHistory = localStorage.getItem("attendanceHistory");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem("attendanceHistory", JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const handleCalculate = async () => {
    if (!present || !total) {
      setError("Please fill in all fields");
      return;
    }

    const presentNum = Number(present);
    const totalNum = Number(total);
    const targetNum = Number(target);

    if (presentNum < 0 || totalNum <= 0) {
      setError("Please enter valid positive numbers");
      return;
    }

    if (presentNum > totalNum) {
      setError("Attended classes cannot be more than total classes");
      return;
    }

    if (targetNum < 0 || targetNum > 100) {
      setError("Target percentage must be between 0 and 100");
      return;
    }

    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/attandance-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          present: presentNum,
          totalConducted: totalNum,
          targetPercentage: targetNum,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResult(data.data);
        
        const newRecord: AttendanceRecord = {
          id: Date.now().toString(),
          date: new Date().toLocaleString(),
          inputData: { present: presentNum, total: totalNum, target: targetNum },
          response: data.data,
          summary: data.data.summary,
          currentPercentage: Number(((presentNum / totalNum) * 100).toFixed(1)),
          safeBunks: data.data.bunkingInfo?.safeBunks || 0
        };
        
        setHistory(prev => {
          const exists = prev.some(item => 
            item.inputData.present === presentNum && 
            item.inputData.total === totalNum && 
            item.inputData.target === targetNum
          );

          let updated;
          if (exists) {
            const filtered = prev.filter(item => 
              !(item.inputData.present === presentNum && 
                item.inputData.total === totalNum && 
                item.inputData.target === targetNum)
            );
            updated = [newRecord, ...filtered].slice(0, 10);
          } else {
            updated = [newRecord, ...prev].slice(0, 10);
          }
          localStorage.setItem("attendanceHistory", JSON.stringify(updated));
          return updated;
        });
      } else {
        setError(data.message || "Calculation failed");
      }
    } catch (error) {
      setError("Failed to calculate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (record: AttendanceRecord) => {
    setPresent(record.inputData.present.toString());
    setTotal(record.inputData.total.toString());
    setTarget(record.inputData.target.toString());
    setResult(record.response);
    setShowHistory(false);
  };

  const clearHistory = () => {
    if (window.confirm("Clear all history?")) {
      setHistory([]);
      localStorage.removeItem("attendanceHistory");
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem("attendanceHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const currentPercentage = total && Number(total) > 0 
    ? ((Number(present) / Number(total)) * 100).toFixed(1) : "0";

  const getStatusColor = () => {
    if (!result) return "bg-gray-100 border-gray-200";
    if (result.target?.isAlreadyAchieved) return "bg-green-50 border-green-200";
    if (!result.target?.isAchievable) return "bg-red-50 border-red-200";
    return "bg-yellow-50 border-yellow-200";
  };

  const getStatusIcon = () => {
    if (!result) return <ThumbsUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />;
    if (result.target?.isAlreadyAchieved) return <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />;
    if (!result.target?.isAchievable) return <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />;
    return <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />;
  };

  // Prevent hydration mismatch by not rendering dynamic content until mounted
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Calculator className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Attendance Predictor
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 px-2">
            Find out exactly how many classes you can bunk!
          </p>
          {history.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
              <span className="text-xs sm:text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                {history.length}/10 saved
              </span>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full shadow-sm transition-all hover:shadow"
              >
                <History className="w-3 h-3 sm:w-4 sm:h-4" />
                {showHistory ? "Hide" : "View History"}
              </button>
            </div>
          )}
        </div>

        {/* Input Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-5 sm:p-8 mb-6 sm:mb-8 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Present Input */}
            <div className="space-y-1 sm:space-y-2">
              <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                Classes Attended
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g., 45"
                value={present}
                onChange={(e) => setPresent(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            {/* Total Conducted Input */}
            <div className="space-y-1 sm:space-y-2">
              <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                Total Classes
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g., 60"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            {/* Target Input */}
            <div className="space-y-1 sm:space-y-2">
              <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                Target (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="75"
                  value={target}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
                      setTarget(value);
                    }
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none pr-10 sm:pr-12"
                />
                <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm sm:text-base">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Current Attendance Display */}
          {total && Number(total) > 0 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-sm sm:text-base text-gray-700">Current Attendance:</span>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-blue-600">{currentPercentage}%</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={loading || !present || !total}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Calculating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                How Many Classes Can I Bunk? <span className="text-lg sm:text-xl">🏖️</span>
              </span>
            )}
          </button>
        </div>

        {/* History Section */}
        {showHistory && (
          <div className="mb-6 sm:mb-8 bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 animate-fade-in">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <History className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Recent Calculations {history.length > 0 ? `(${history.length}/10)` : ''}
              </h3>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  Clear All
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm sm:text-base">
                No history yet. Make some calculations!
              </p>
            ) : (
              <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto pr-1">
                {history.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => loadFromHistory(record)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-all group gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <span className="font-medium text-gray-500">{record.date}</span>
                        <span className="font-semibold whitespace-nowrap">
                          {record.inputData.present}/{record.inputData.total}
                        </span>
                        <span className="text-gray-600 whitespace-nowrap">
                          = {record.currentPercentage}%
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          T:{record.inputData.target}%
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          record.safeBunks > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {record.safeBunks} bunk
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {record.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        onClick={(e) => deleteHistoryItem(record.id, e)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Status Card */}
            <div className={`${getStatusColor()} border rounded-2xl p-4 sm:p-6`}>
              <div className="flex items-center gap-3 sm:gap-4">
                {getStatusIcon()}
                <p className="text-sm sm:text-base md:text-lg font-medium">{result.summary || "Analysis complete"}</p>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <StatCard
                icon={<Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
                label="Current %"
                value={`${result.currentStats?.currentPercentage || 0}%`}
              />
              <StatCard
                icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />}
                label="Classes Left"
                value={result.currentStats?.remainingLectures || 0}
              />
              <StatCard
                icon={<Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
                label="Need to Attend"
                value={result.bunkingInfo?.needToAttend || 0}
              />
              <StatCard
                icon={<ThumbsUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />}
                label="Safe Bunks"
                value={result.bunkingInfo?.safeBunks || 0}
                highlight={true}
              />
            </div>

            {/* Detailed Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                Your Bunking Plan
              </h3>

              <div className="space-y-4 sm:space-y-6">
                {/* Progress Bar */}
                {result.bunkingInfo && result.bunkingInfo.totalClassesLeft > 0 && (
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                      <span>Attend: {result.bunkingInfo.needToAttend}</span>
                      <span>Bunk: {result.bunkingInfo.safeBunks}</span>
                    </div>
                    <div className="w-full h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${(result.bunkingInfo.needToAttend / result.bunkingInfo.totalClassesLeft) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Key Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-green-50 rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Must Attend</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">
                      {result.bunkingInfo?.needToAttend || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      of {result.bunkingInfo?.totalClassesLeft || 0} left
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-orange-50 rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Can Bunk</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                      {result.bunkingInfo?.safeBunks || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      to reach {result.target?.percentage || 0}%
                    </p>
                  </div>
                </div>

                {/* Required Rate */}
                <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Required Attendance Rate</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {result.bunkingInfo?.requiredRateFromNow || 0}%
                  </p>
                  <p className="text-xs text-gray-500">of remaining classes</p>
                </div>

                {/* Weekly Plan */}
                <div className="p-3 sm:p-4 bg-purple-50 rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Weekly Plan</p>
                  <p className="text-base sm:text-lg font-semibold text-purple-700">
                    Attend {result.weeklyPlan?.needToAttendPerWeek || 0} per week
                  </p>
                  <p className="text-xs text-gray-500">
                    {result.weeklyPlan?.weeksLeft || 0} weeks • {result.weeklyPlan?.totalClassesPerWeek || 0}/week
                  </p>
                </div>

                {/* Tips */}
                {result.tips && result.tips.length > 0 && (
                  <div className="border-t pt-3 sm:pt-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">💡 Tips</p>
                    <ul className="space-y-1">
                      {result.tips.map((tip: string, index: number) => (
                        <li key={index} className="text-xs sm:text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Semester Info */}
                <div className="text-xs sm:text-sm text-gray-500 border-t pt-3 sm:pt-4">
                  <p>Total lectures: {result.semester?.maxLectures || 0}</p>
                  <p>Lectures/day: {result.semester?.lecturesPerDay || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

// Stat Card Component
const StatCard = ({ icon, label, value, highlight = false }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  highlight?: boolean;
}) => (
  <div className={`bg-white rounded-xl p-3 sm:p-6 shadow-lg border ${highlight ? 'border-orange-200 ring-2 ring-orange-100' : 'border-gray-100'}`}>
    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-3">
      {icon}
      <p className="text-xs sm:text-sm text-gray-600">{label}</p>
    </div>
    <p className={`text-xl sm:text-3xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>
      {value}
    </p>
  </div>
);