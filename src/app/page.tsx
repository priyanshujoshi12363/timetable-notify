"use client";

import { useState, useEffect, useRef } from "react";
import { generateFCMToken } from "@/lib/getfcmtoken";
import { 
  ChevronDown, Bell, BookOpen, GitBranch, Layers, 
  CheckCircle, Edit2, ChevronRight, Calendar, Clock, 
  MapPin, Users, Loader2, AlertCircle, Sun,
  X, Save, GraduationCap, Coffee, BookMarked, PartyPopper,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Moon, Sparkles, School, CalendarDays, Database, Zap,
  Trash2
} from "lucide-react";

interface TimetableSlot {
  time: string;
  subject: string | null;
  faculty: string | null;
  room: string | null;
  batches: Array<{
    batch: string;
    subject: string;
    faculty: string;
    room: string;
  }>;
}

interface TimetableData {
  day: string;
  slots: TimetableSlot[];
  isToday?: boolean;
  lastFetched?: number; // timestamp for cache invalidation
}

interface SubscriptionData {
  _id: string;
  fcmToken: string;
  branch: string;
  course: string;
  division: string;
  semester: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_PREFIX = "timetable_cache_";

// Days configuration with icons and colors
const DAYS = [
  { name: "Monday", icon: BookOpen, color: "from-blue-500 to-cyan-500", bgLight: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
  { name: "Tuesday", icon: School, color: "from-emerald-500 to-teal-500", bgLight: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600" },
  { name: "Wednesday", icon: GraduationCap, color: "from-violet-500 to-purple-500", bgLight: "bg-violet-50", border: "border-violet-200", text: "text-violet-600" },
  { name: "Thursday", icon: BookMarked, color: "from-amber-500 to-orange-500", bgLight: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
  { name: "Friday", icon: Sparkles, color: "from-rose-500 to-pink-500", bgLight: "bg-rose-50", border: "border-rose-200", text: "text-rose-600" },
  { name: "Saturday", icon: Coffee, color: "from-indigo-500 to-purple-500", bgLight: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600" },
  { name: "Sunday", icon: PartyPopper, color: "from-gray-500 to-slate-500", bgLight: "bg-gray-50", border: "border-gray-200", text: "text-gray-600" },
];

export default function NotificationPage() {
  const [branch, setBranch] = useState("CSE");
  const [course, setCourse] = useState("AIML");
  const [division, setDivision] = useState("");
  const [semester, setSemester] = useState(2);
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [timetableError, setTimetableError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [cachedDays, setCachedDays] = useState<Set<string>>(new Set());
  
  // Edit form state
  const [editBranch, setEditBranch] = useState("CSE");
  const [editCourse, setEditCourse] = useState("AIML");
  const [editDivision, setEditDivision] = useState("");
  const [editSemester, setEditSemester] = useState(2);
  
  const divisions = Array.from({ length: 30 }, (_, i) => `2CSE AIML ${i + 1}`);
  const semesters = [2];
  
  // Get today's day name
  const getTodayDay = () => {
    const today = new Date().getDay();
    const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dayMap[today];
  };

  // Get current day info
  const todayDay = getTodayDay();

  // Generate cache key for a specific day
  const getCacheKey = (div: string, day: string) => {
    return `${CACHE_PREFIX}${div}_${day}`;
  };

  // Save timetable to localStorage cache
  const saveToCache = (div: string, day: string, data: TimetableData) => {
    try {
      const cacheData = {
        ...data,
        lastFetched: Date.now()
      };
      localStorage.setItem(getCacheKey(div, day), JSON.stringify(cacheData));
      setCachedDays(prev => new Set(prev).add(day));
      console.log(`💾 Cached ${day}'s timetable`);
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  };

  // Load timetable from cache
  const loadFromCache = (div: string, day: string): TimetableData | null => {
    try {
      const cached = localStorage.getItem(getCacheKey(div, day));
      if (!cached) return null;

      const data = JSON.parse(cached) as TimetableData & { lastFetched?: number };
      
      // Check if cache is still valid (within 24 hours)
      if (data.lastFetched && Date.now() - data.lastFetched < CACHE_DURATION) {
        console.log(`📦 Loaded ${day}'s timetable from cache`);
        return data;
      } else {
        // Cache expired, remove it
        localStorage.removeItem(getCacheKey(div, day));
        console.log(`⌛ Cache expired for ${day}`);
        return null;
      }
    } catch (error) {
      console.error("Error loading from cache:", error);
      return null;
    }
  };

  // Clear all cached timetables for a division
  const clearCacheForDivision = (div: string) => {
    try {
      DAYS.forEach(day => {
        localStorage.removeItem(getCacheKey(div, day.name));
      });
      setCachedDays(new Set());
      console.log("🗑️ Cleared cache for division:", div);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  };

  // Clear ALL data (for delete account)
  const clearAllData = () => {
    try {
      // Clear all localStorage
      localStorage.clear();
      
      // Reset all state
      setDivision("");
      setSemester(2);
      setEditDivision("");
      setEditSemester(2);
      setSubscriptionData(null);
      setTimetable(null);
      setCachedDays(new Set());
      setIsSaved(false);
      setIsEditing(true);
      setSelectedDay("");
      
      console.log("🗑️ All data cleared from localStorage");
    } catch (error) {
      console.error("Error clearing all data:", error);
    }
  };

  // Check which days are cached
  const checkCachedDays = (div: string) => {
    const cached = new Set<string>();
    DAYS.forEach(day => {
      const cacheKey = getCacheKey(div, day.name);
      if (localStorage.getItem(cacheKey)) {
        cached.add(day.name);
      }
    });
    setCachedDays(cached);
    return cached;
  };

  // Load saved subscription from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedSubscription = localStorage.getItem("userSubscription");
    if (savedSubscription) {
      try {
        const parsedData = JSON.parse(savedSubscription);
        if (parsedData._id) {
          setSubscriptionData(parsedData);
          setBranch(parsedData.branch);
          setCourse(parsedData.course);
          setDivision(parsedData.division);
          setSemester(parsedData.semester);
          
          // Set edit form values
          setEditBranch(parsedData.branch);
          setEditCourse(parsedData.course);
          setEditDivision(parsedData.division);
          setEditSemester(parsedData.semester);
        } else {
          setBranch(parsedData.branch);
          setCourse(parsedData.course);
          setDivision(parsedData.division);
          setSemester(parsedData.semester);
          
          // Set edit form values
          setEditBranch(parsedData.branch);
          setEditCourse(parsedData.course);
          setEditDivision(parsedData.division);
          setEditSemester(parsedData.semester);
        }
        setIsSaved(true);
        setIsEditing(false);
        
        // Check cached days
        checkCachedDays(parsedData.division);
        
        // Try to load today from cache first
        const today = getTodayDay();
        setSelectedDay(today);
        
        const cachedToday = loadFromCache(parsedData.division, today);
        if (cachedToday) {
          setTimetable(cachedToday);
        } else {
          // If not in cache, fetch from API
          fetchTimetableForDay(parsedData.division, today);
        }
      } catch (error) {
        console.error("Error parsing saved subscription:", error);
      }
    }
  }, []);

  // Fetch timetable when division or selected day changes
  useEffect(() => {
    if (isSaved && division && selectedDay) {
      // Check cache first
      const cached = loadFromCache(division, selectedDay);
      if (cached) {
        setTimetable(cached);
        setTimetableError(null);
      } else {
        // If not in cache, fetch from API
        fetchTimetableForDay(division, selectedDay);
      }
    }
  }, [division, selectedDay, isSaved]);

  // Fetch timetable for specific day
  const fetchTimetableForDay = async (div: string, day: string, forceRefresh = false) => {
    // If not forcing refresh, check cache first
    if (!forceRefresh) {
      const cached = loadFromCache(div, day);
      if (cached) {
        setTimetable(cached);
        setTimetableError(null);
        return;
      }
    }

    setTimetableLoading(true);
    setTimetableError(null);
    try {
      console.log(`🌐 Fetching ${day} from API:`, div);
      const response = await fetch(`/api/timetable?division=${encodeURIComponent(div)}&day=${day}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch timetable");
      }
      
      console.log("Timetable data received:", data);
      setTimetable(data);
      
      // Save to cache after successful fetch
      saveToCache(div, day, data);
      
    } catch (error: any) {
      console.error("Error fetching timetable:", error);
      setTimetableError(error.message || `Could not load ${day}'s schedule`);
      setTimetable(null);
    } finally {
      setTimetableLoading(false);
    }
  };

  // Refresh a specific day (force fetch from API)
  const handleRefreshDay = (day: string) => {
    fetchTimetableForDay(division, day, true);
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!subscriptionData?._id) {
      // If no subscription data, just clear local storage
      clearAllData();
      alert("Local data cleared successfully!");
      return;
    }

    if (!confirm("Are you sure you want to delete your account? This will permanently remove your data from the server and clear all local data. This action cannot be undone.")) {
      return;
    }

    setDeleteLoading(true);

    try {
      console.log("🗑️ Deleting account with ID:", subscriptionData._id);
      
      const response = await fetch(`/api/delete?userId=${subscriptionData._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Clear all local data regardless of response
      clearAllData();
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message || "Account deleted successfully!");
      } else {
        // Still show success since we cleared local data
        alert("Local data cleared. Note: Server deletion may have failed.");
      }
      
    } catch (error) {
      console.error("Error deleting account:", error);
      // Still clear local data
      clearAllData();
      alert("Local data cleared. Network error occurred while deleting from server.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!division) {
      alert("Please select a division");
      return;
    }

    setLoading(true);

    try {
      const token = await generateFCMToken();

      if (!token) {
        setLoading(false);
        alert("Notification permission denied. Please enable notifications in your device settings.");
        return;
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch,
          course,
          division,
          semester,
          fcmToken: token,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem("userSubscription", JSON.stringify(data.data));
        setSubscriptionData(data.data);
        
        // Set edit form values
        setEditBranch(data.data.branch);
        setEditCourse(data.data.course);
        setEditDivision(data.data.division);
        setEditSemester(data.data.semester);

        // Clear any old cache for new division
        clearCacheForDivision(division);

        // Set today as selected and fetch timetable
        const today = getTodayDay();
        setSelectedDay(today);
        await fetchTimetableForDay(division, today);

        setIsEditing(false);
        setIsSaved(true);
      } else {
        alert(data.message || "Failed to save subscription");
      }
    } catch (error) {
      console.error("Error saving subscription:", error);
      alert("An error occurred while saving. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!subscriptionData?._id || !editDivision) {
      alert("Please select a division");
      return;
    }
    
    setEditLoading(true);
    
    try {
      const response = await fetch(`/api/edit-course?id=${subscriptionData._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch: editBranch,
          course: editCourse,
          division: editDivision,
          semester: editSemester,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedData = {
          ...subscriptionData,
          branch: editBranch,
          course: editCourse,
          division: editDivision,
          semester: editSemester,
          updatedAt: new Date().toISOString(),
        };
        
        localStorage.setItem("userSubscription", JSON.stringify(updatedData));
        setSubscriptionData(updatedData);
        
        // Update main state
        setBranch(editBranch);
        setCourse(editCourse);
        setDivision(editDivision);
        setSemester(editSemester);
        
        // Clear cache for old division and set up for new one
        clearCacheForDivision(division);
        
        // Set today as selected and fetch new timetable
        const today = getTodayDay();
        setSelectedDay(today);
        await fetchTimetableForDay(editDivision, today);
        
        // Close modal
        setShowEditModal(false);
      } else {
        alert(data.message || "Failed to update subscription");
      }
    } catch (error) {
      console.error("Error editing subscription:", error);
      alert("An error occurred while updating. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDaySelect = (day: string) => {
    setSelectedDay(day);
    // No need to fetch here, useEffect will handle it with cache check
  };

  const handlePrevWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Populate edit form with current values
    setEditBranch(branch);
    setEditCourse(course);
    setEditDivision(division);
    setEditSemester(semester);
    setShowEditModal(true);
  };

  const handleModalClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditModal(false);
  };

  const handleModalOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      setShowEditModal(false);
    }
  };

  const formatTime = (time: string) => {
    return time.replace('-', ' - ');
  };

  const isToday = (day: string) => {
    return day === todayDay;
  };

  const getDayIcon = (dayName: string) => {
    const day = DAYS.find(d => d.name === dayName);
    return day?.icon || Calendar;
  };

  const getDayColor = (dayName: string) => {
    const day = DAYS.find(d => d.name === dayName);
    return day?.color || "from-gray-500 to-slate-500";
  };

  const getDayBgLight = (dayName: string) => {
    const day = DAYS.find(d => d.name === dayName);
    return day?.bgLight || "bg-gray-50";
  };

  const getDayBorder = (dayName: string) => {
    const day = DAYS.find(d => d.name === dayName);
    return day?.border || "border-gray-200";
  };

  const getDayText = (dayName: string) => {
    const day = DAYS.find(d => d.name === dayName);
    return day?.text || "text-gray-600";
  };

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 px-3 sm:py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center bg-white/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Stay updated with your academic activities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 px-3 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
        
        {/* Header with Delete Button */}
        <div className="flex justify-between items-center backdrop-blur-sm bg-white/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Notifications
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                Stay updated with your academic activities
              </p>
            </div>
          </div>
          
          {/* Delete Account Button */}
          <button
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className="p-2 sm:p-3 bg-red-500 hover:bg-red-600 rounded-lg sm:rounded-xl shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 group relative"
            title="Delete Account"
          >
            {deleteLoading ? (
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
            
            {/* Tooltip */}
            <span className="absolute -bottom-8 right-0 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Delete Account
            </span>
          </button>
        </div>

        {/* Subscription Card */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white shadow-xl border border-gray-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          
          <div className="p-4 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Subscription Details</h2>
              </div>
              
              {/* Show User ID if exists */}
              {subscriptionData && (
                <span className="text-xs text-gray-400">
                  ID: {subscriptionData._id.substring(0, 8)}...
                </span>
              )}
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Branch and Course - First row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600">
                    <GitBranch className="w-3 h-3 sm:w-4 sm:h-4" />
                    Branch
                  </label>
                  <div className="relative">
                    <select
                      disabled={!isEditing}
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className={`w-full appearance-none rounded-lg sm:rounded-xl border ${
                        isEditing 
                          ? 'border-gray-200 hover:border-blue-300 focus:border-blue-500 cursor-pointer' 
                          : 'border-gray-100 cursor-default bg-gray-50'
                      } bg-white px-3 sm:px-4 py-2.5 sm:py-3.5 pr-8 sm:pr-10 text-sm sm:text-base text-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:text-gray-500`}
                    >
                      <option>CSE</option>
                    </select>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    Course
                  </label>
                  <div className="relative">
                    <select
                      disabled={!isEditing}
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className={`w-full appearance-none rounded-lg sm:rounded-xl border ${
                        isEditing 
                          ? 'border-gray-200 hover:border-blue-300 focus:border-blue-500 cursor-pointer' 
                          : 'border-gray-100 cursor-default bg-gray-50'
                      } bg-white px-3 sm:px-4 py-2.5 sm:py-3.5 pr-8 sm:pr-10 text-sm sm:text-base text-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:text-gray-500`}
                    >
                      <option>AIML</option>
                    </select>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Division and Semester - Second row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600">
                    <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                    Division
                  </label>
                  <div className="relative">
                    <select
                      disabled={!isEditing}
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className={`w-full appearance-none rounded-lg sm:rounded-xl border ${
                        isEditing 
                          ? 'border-gray-200 hover:border-blue-300 focus:border-blue-500 cursor-pointer' 
                          : 'border-gray-100 cursor-default bg-gray-50'
                      } bg-white px-3 sm:px-4 py-2.5 sm:py-3.5 pr-8 sm:pr-10 text-sm sm:text-base text-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:text-gray-500`}
                    >
                      <option value="">Select division</option>
                      {divisions.map((div) => (
                        <option key={div} value={div}>{div}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600">
                    <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                    Semester
                  </label>
                  <div className="relative">
                    <select
                      disabled={!isEditing}
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className={`w-full appearance-none rounded-lg sm:rounded-xl border ${
                        isEditing 
                          ? 'border-gray-200 hover:border-blue-300 focus:border-blue-500 cursor-pointer' 
                          : 'border-gray-100 cursor-default bg-gray-50'
                      } bg-white px-3 sm:px-4 py-2.5 sm:py-3.5 pr-8 sm:pr-10 text-sm sm:text-base text-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:text-gray-500`}
                    >
                      {semesters.map((sem) => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Save button */}
              {isEditing && (
                <div className="pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading || !division}
                    className="group relative w-full overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed touch-manipulation"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Save Subscription</span>
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Section with Day Selector and Cache Indicator */}
        {isSaved && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header with Edit Button and Cache Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 bg-gradient-to-r ${getDayColor(selectedDay || todayDay)} rounded-lg shadow-lg`}>
                  {selectedDay && (() => {
                    const Icon = getDayIcon(selectedDay);
                    return <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                    {selectedDay === todayDay ? "Today's Schedule" : `${selectedDay}'s Schedule`}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                    <span>{division} • Sem {semester}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-200 text-sm sm:text-base w-full sm:w-auto touch-manipulation group"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    Edit
                  </span>
                </button>
              </div>
            </div>

            {/* Cool Day Selector with Cache Indicators */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  Select Day
                  <span className="text-xs font-normal text-gray-400 ml-2">
                    {cachedDays.size}/7 days cached
                  </span>
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevWeek}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={weekOffset <= 0}
                  >
                    <ChevronLeft className={`w-4 h-4 ${weekOffset <= 0 ? 'text-gray-300' : 'text-gray-600'}`} />
                  </button>
                  <span className="text-xs text-gray-500 px-2">
                    Week {Math.abs(weekOffset) + 1}
                  </span>
                  <button
                    onClick={handleNextWeek}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => {
                  const DayIcon = day.icon;
                  const isActive = selectedDay === day.name;
                  const isToday = day.name === todayDay;
                  const isCached = cachedDays.has(day.name);
                  
                  return (
                    <button
                      key={day.name}
                      onClick={() => handleDaySelect(day.name)}
                      className={`group relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? `bg-gradient-to-br ${day.color} text-white shadow-lg scale-105`
                          : `${day.bgLight} hover:shadow-md border-2 ${day.border} hover:scale-105`
                      }`}
                    >
                      {isToday && !isActive && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-white text-[10px]">📅</span>
                        </span>
                      )}
                      {isCached && !isActive && (
                        <span className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Zap className="w-2 h-2 text-white" />
                        </span>
                      )}
                      <DayIcon className={`w-5 h-5 mb-2 ${
                        isActive ? 'text-white' : day.text
                      }`} />
                      <span className={`text-[10px] font-medium ${
                        isActive ? 'text-white' : 'text-gray-600'
                      }`}>
                        {day.name.slice(0, 3)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {timetableLoading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl shadow-xl">
                <div className="relative">
                  <Loader2 className="w-10 h-10 sm:w-14 sm:h-14 text-blue-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-4">Loading schedule...</p>
              </div>
            ) : timetableError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col items-center text-center">
                  <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mb-3" />
                  <h4 className="text-sm sm:text-base font-semibold text-red-800 mb-2">Oops! Something went wrong</h4>
                  <p className="text-xs sm:text-sm text-red-600 mb-4">{timetableError}</p>
                  <button
                    onClick={() => fetchTimetableForDay(division, selectedDay, true)}
                    className="text-xs sm:text-sm bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : timetable && timetable.slots && timetable.slots.length > 0 ? (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
                <div className={`p-3 sm:p-4 bg-gradient-to-r ${getDayColor(selectedDay)} flex items-center justify-between`}>
                  <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    {selectedDay && (() => {
                      const Icon = getDayIcon(selectedDay);
                      return <Icon className="w-4 h-4 sm:w-5 sm:h-5" />;
                    })()}
                    {selectedDay}'s Classes
                    {selectedDay === todayDay && (
                      <span className="text-xs bg-white/30 text-white px-2 py-0.5 rounded-full ml-2">
                        Today
                      </span>
                    )}
                  </h4>
                  {cachedDays.has(selectedDay) && (
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Cached
                    </span>
                  )}
                </div>
                
                <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                  {timetable.slots.map((slot, index) => {
                    const isHoliday = slot.subject === "HOLIDAY";
                    const isLibrary = slot.subject === "LIBRARY/SELF STUDY";
                    const hasBatches = slot.batches && slot.batches.length > 0;
                    
                    return (
                      <div
                        key={index}
                        className={`group relative overflow-hidden rounded-lg sm:rounded-xl border-2 ${
                          isHoliday 
                            ? 'border-gray-200 bg-gray-50' 
                            : isLibrary 
                            ? 'border-amber-200 bg-amber-50/50'
                            : hasBatches
                            ? 'border-purple-200 bg-purple-50/50'
                            : 'border-blue-200 bg-blue-50/30 hover:border-blue-300'
                        } transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5`}
                      >
                        {/* Time header */}
                        <div className={`px-3 sm:px-4 py-2 sm:py-3 border-b ${
                          isHoliday 
                            ? 'bg-gray-100 border-gray-200' 
                            : isLibrary 
                            ? 'bg-amber-100/50 border-amber-200'
                            : hasBatches
                            ? 'bg-purple-100/50 border-purple-200'
                            : 'bg-blue-100/50 border-blue-200'
                        } flex items-center gap-2`}>
                          <Clock className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            isHoliday ? 'text-gray-500' : isLibrary ? 'text-amber-600' : hasBatches ? 'text-purple-600' : 'text-blue-600'
                          }`} />
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">
                            {formatTime(slot.time)}
                          </span>
                          {isHoliday && (
                            <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                              Holiday
                            </span>
                          )}
                          {isLibrary && (
                            <span className="ml-auto text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
                              Self Study
                            </span>
                          )}
                        </div>

                        <div className="p-3 sm:p-4">
                          {hasBatches ? (
                            <div className="space-y-2 sm:space-y-3">
                              {slot.batches.map((batch, idx) => (
                                <div key={idx} className="flex flex-wrap items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-purple-100/70 rounded-lg text-xs sm:text-sm border border-purple-200">
                                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-600 text-white text-xs font-medium rounded-full shadow-sm">
                                    Batch {batch.batch}
                                  </span>
                                  <span className="font-bold text-gray-800">{batch.subject}</span>
                                  {batch.faculty && (
                                    <span className="text-gray-600 flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-full">
                                      <Users className="w-3 h-3" />
                                      {batch.faculty}
                                    </span>
                                  )}
                                  {batch.room && (
                                    <span className="text-gray-600 flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-full">
                                      <MapPin className="w-3 h-3" />
                                      {batch.room}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : slot.subject && !isHoliday && !isLibrary ? (
                            // Single class
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                              <span className="font-bold text-gray-800 text-base">{slot.subject}</span>
                              {slot.faculty && (
                                <span className="text-gray-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                                  <Users className="w-3 h-3" />
                                  {slot.faculty}
                                </span>
                              )}
                              {slot.room && (
                                <span className="text-gray-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                                  <MapPin className="w-3 h-3" />
                                  Room {slot.room}
                                </span>
                              )}
                            </div>
                          ) : isHoliday ? (
                            // Holiday
                            <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm">
                              <PartyPopper className="w-5 h-5" />
                              <span className="font-medium">No classes • Holiday</span>
                            </div>
                          ) : isLibrary ? (
                            // Library/Self Study
                            <div className="flex items-center gap-2 text-amber-600 text-xs sm:text-sm">
                              <BookMarked className="w-5 h-5" />
                              <span className="font-medium">Self Study • Library Time</span>
                            </div>
                          ) : (
                            // Free slot
                            <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                              <Coffee className="w-5 h-5" />
                              <span className="font-medium">Free Period</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl shadow-xl">
                <div className={`p-4 rounded-full ${getDayBgLight(selectedDay)} mb-4`}>
                  {selectedDay && (() => {
                    const Icon = getDayIcon(selectedDay);
                    return <Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${getDayText(selectedDay)}`} />;
                  })()}
                </div>
                {selectedDay === "Sunday" ? (
                  <>
                    <PartyPopper className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 mb-3" />
                    <p className="text-sm sm:text-base font-medium text-gray-700 mb-2">It's Sunday! 🎉</p>
                    <p className="text-xs sm:text-sm text-gray-500">No classes scheduled. Enjoy your day off!</p>
                  </>
                ) : (
                  <>
                    <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mb-3" />
                    <p className="text-sm sm:text-base font-medium text-gray-700 mb-2">No Classes Scheduled</p>
                    <p className="text-xs sm:text-sm text-gray-500">There are no classes on {selectedDay}</p>
                  </>
                )}
                {cachedDays.has(selectedDay) && (
                  <button
                    onClick={() => handleRefreshDay(selectedDay)}
                    className="mt-4 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                  >
                    <Database className="w-3 h-3" />
                    Refresh from server
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Edit Modal */}
        {showEditModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={handleModalOverlayClick}
          >
            <div 
              className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-in fade-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">Edit Subscription</h3>
                </div>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Branch</label>
                    <select
                      value={editBranch}
                      onChange={(e) => setEditBranch(e.target.value)}
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option>CSE</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Course</label>
                    <select
                      value={editCourse}
                      onChange={(e) => setEditCourse(e.target.value)}
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option>AIML</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Division</label>
                    <select
                      value={editDivision}
                      onChange={(e) => setEditDivision(e.target.value)}
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Select division</option>
                      {divisions.map((div) => (
                        <option key={div} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Semester</label>
                    <select
                      value={editSemester}
                      onChange={(e) => setEditSemester(Number(e.target.value))}
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {semesters.map((sem) => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-gray-100 flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors touch-manipulation"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={editLoading || !editDivision}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl text-xs sm:text-sm text-white font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}