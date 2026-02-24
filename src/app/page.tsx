"use client";

import { useState, useEffect, useRef } from "react";
import { generateFCMToken } from "@/lib/getfcmtoken";
import { 
  ChevronDown, Bell, BookOpen, GitBranch, Layers, 
  CheckCircle, Edit2, ChevronRight, Calendar, Clock, 
  MapPin, Users, Loader2, AlertCircle, Database, Sun,
  X, Save, GraduationCap
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

export default function NotificationPage() {
  const [branch, setBranch] = useState("CSE");
  const [course, setCourse] = useState("AIML");
  const [division, setDivision] = useState("");
  const [semester, setSemester] = useState(2);
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Refs for button elements
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  
  // Edit form state
  const [editBranch, setEditBranch] = useState("CSE");
  const [editCourse, setEditCourse] = useState("AIML");
  const [editDivision, setEditDivision] = useState("");
  const [editSemester, setEditSemester] = useState(2);
  
  const divisions = Array.from({ length: 30 }, (_, i) => `2CSE AIML ${i + 1}`);
  const semesters = [1, 2];
  
  // Get today's day name
  const getTodayDay = () => {
    const today = new Date().getDay();
    const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dayMap[today];
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
        
        // Fetch timetable for the saved division
        fetchTimetable(parsedData.division);
      } catch (error) {
        console.error("Error parsing saved subscription:", error);
      }
    }
  }, []);

  // Fetch timetable data for today
  const fetchTimetable = async (div: string) => {
    setTimetableLoading(true);
    try {
      // Fetch data for today only
      const response = await fetch(`/api/timetable?division=${encodeURIComponent(div)}`);
      if (response.ok) {
        const data = await response.json();
        setTimetable(data);
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setTimetableLoading(false);
    }
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior and stop propagation
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

        // Fetch today's timetable
        await fetchTimetable(division);

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
        // Update localStorage with new data
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
        
        // Fetch new timetable
        await fetchTimetable(editDivision);
        
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
    // Close modal when clicking overlay
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      setShowEditModal(false);
    }
  };

  const formatTime = (time: string) => {
    return time.replace('-', ' - ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        
        {/* Header */}
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
                    ref={saveButtonRef}
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

        {/* Today's Timetable Section */}
        {isSaved && (
          <div className="space-y-3 sm:space-y-4">
            {/* Today's Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg">
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                    Today's Schedule
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {getTodayDay()} • {division} • Sem {semester}
                  </p>
                </div>
              </div>
              
              {/* Edit Button */}
              <button
                ref={editButtonRef}
                type="button"
                onClick={handleEditClick}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2 bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-200 text-sm sm:text-base w-full sm:w-auto touch-manipulation"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Edit Subscription
                </span>
              </button>
            </div>

            {/* Timetable Display */}
            {timetableLoading ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-16 bg-white rounded-xl sm:rounded-2xl shadow-xl">
                <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600 animate-spin mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm text-gray-500">Loading today's schedule...</p>
              </div>
            ) : timetable ? (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                  <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    {timetable.day}'s Classes
                  </h4>
                </div>
                
                <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                  {timetable.slots.map((slot, index) => (
                    <div
                      key={index}
                      className="group relative overflow-hidden rounded-lg sm:rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg"
                    >
                      {/* Time header */}
                      <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 flex items-center gap-2">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {formatTime(slot.time)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-3 sm:p-4">
                        {slot.batches && slot.batches.length > 0 ? (
                          // Multiple batches
                          <div className="space-y-2 sm:space-y-3">
                            {slot.batches.map((batch, idx) => (
                              <div key={idx} className="flex flex-wrap items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-blue-50/50 rounded-lg text-xs sm:text-sm">
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                                  B{batch.batch}
                                </span>
                                <span className="font-semibold text-gray-800">{batch.subject}</span>
                                {batch.faculty && (
                                  <span className="text-gray-600 flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {batch.faculty}
                                  </span>
                                )}
                                {batch.room && (
                                  <span className="text-gray-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {batch.room}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : slot.subject ? (
                          // Single class
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                            <span className="font-semibold text-gray-800">{slot.subject}</span>
                            {slot.faculty && (
                              <span className="text-gray-600 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {slot.faculty}
                              </span>
                            )}
                            {slot.room && (
                              <span className="text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {slot.room}
                              </span>
                            )}
                          </div>
                        ) : (
                          // Free slot
                          <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>No class scheduled • Self Study</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 sm:py-16 bg-white rounded-xl sm:rounded-2xl shadow-xl">
                <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm text-gray-500">No timetable available for today</p>
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
              className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-auto"
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