"use client";

import { useState, useEffect, useRef } from "react";
import { generateFCMToken } from "@/lib/getfcmtoken";
import { ChevronDown, Bell, BookOpen, GitBranch, Layers, CheckCircle, Edit2, ChevronRight } from "lucide-react";

export default function NotificationPage() {
  const [course, setCourse] = useState("B.Tech");
  const [branch, setBranch] = useState("CSE-AIML");
  const [division, setDivision] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const divisions = Array.from({ length: 30 }, (_, i) => i + 1);
  
  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const notifications = [
    {
      id: 1,
      title: "Attendance updated",
      message: "Your attendance has been updated to Present for Mathematics class.",
      time: "2 hours ago",
      type: "attendance",
      read: false
    },
    {
      id: 2,
      title: "Class rescheduled",
      message: "Physics lecture moved to 2:00 PM in Room 203.",
      time: "5 hours ago",
      type: "schedule",
      read: true
    },
    {
      id: 3,
      title: "Assignment deadline",
      message: "Computer Networks assignment due tomorrow.",
      time: "1 day ago",
      type: "assignment",
      read: true
    }
  ];

  const handleSave = async () => {
    if (!division) return;

    setLoading(true);

    const token = await generateFCMToken();

    if (!token) {
      setLoading(false);
      return;
    }

    await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course,
        branch,
        division: `Division ${division}`,
        fcmToken: token,
      }),
    });

    setIsEditing(false);
    setIsSaved(true);
    setLoading(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsSaved(false);
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'attendance':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'schedule':
        return <Bell className="w-5 h-5 text-amber-500" />;
      case 'assignment':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Don't render animations until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Static placeholder while mounting */}
          <div className="flex justify-between items-center bg-white/30 p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-sm text-gray-500 mt-1">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header with glass morphism effect */}
        <div className="flex justify-between items-center backdrop-blur-sm bg-white/30 p-6 rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Notifications
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Stay updated with your academic activities
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={handleEdit}
              className="group flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-200"
            >
              <Edit2 className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                Edit Subscription
              </span>
            </button>
          )}
        </div>

        {/* Subscription Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100">
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          
          <div className="p-8">
            {/* Card header */}
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Subscription Details</h2>
              {isSaved && (
                <span className="ml-3 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full border border-emerald-200">
                  Active
                </span>
              )}
            </div>

            {/* Form fields */}
            <div className="space-y-6">
              {/* Course */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  Course Name
                </label>
                <div className="relative">
                  <select
                    disabled={!isEditing}
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    onFocus={() => setActiveDropdown('course')}
                    onBlur={() => setActiveDropdown(null)}
                    className={`w-full appearance-none rounded-xl border ${
                      isEditing 
                        ? 'border-gray-200 hover:border-blue-300 focus:border-blue-500 cursor-pointer' 
                        : 'border-gray-100 cursor-default'
                    } bg-white px-4 py-3.5 pr-10 text-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500`}
                  >
                    <option className="py-2">B.Tech</option>
                  </select>
                  <ChevronDown 
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                      isEditing ? 'text-gray-400' : 'text-gray-300'
                    } ${activeDropdown === 'course' ? 'rotate-180 text-blue-500' : ''}`} 
                  />
                  {activeDropdown === 'course' && isEditing && (
                    <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500/20"></div>
                  )}
                </div>
              </div>

              {/* Branch and Division grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <GitBranch className="w-4 h-4" />
                    Branch
                  </label>
                  <div className="relative">
                    <select
                      disabled={!isEditing}
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      onFocus={() => setActiveDropdown('branch')}
                      onBlur={() => setActiveDropdown(null)}
                      className={`w-full appearance-none rounded-xl border ${
                        isEditing 
                          ? 'border-gray-200 hover:border-blue-300 focus:border-blue-500 cursor-pointer' 
                          : 'border-gray-100 cursor-default'
                      } bg-white px-4 py-3.5 pr-10 text-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500`}
                    >
                      <option className="py-2">CSE-AIML</option>
                    </select>
                    <ChevronDown 
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                        isEditing ? 'text-gray-400' : 'text-gray-300'
                      } ${activeDropdown === 'branch' ? 'rotate-180 text-blue-500' : ''}`} 
                    />
                    {activeDropdown === 'branch' && isEditing && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500/20"></div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Layers className="w-4 h-4" />
                    Division
                  </label>
                  <div className="relative">
                    <select
                      disabled={!isEditing}
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      onFocus={() => setActiveDropdown('division')}
                      onBlur={() => setActiveDropdown(null)}
                      className={`w-full appearance-none rounded-xl border ${
                        isEditing 
                          ? 'border-gray-200 hover:border-blue-300 focus:border-blue-500 cursor-pointer' 
                          : 'border-gray-100 cursor-default'
                      } bg-white px-4 py-3.5 pr-10 text-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500`}
                    >
                      <option value="" className="py-2 text-gray-400">Select division</option>
                      {divisions.map((d) => (
                        <option key={d} value={d} className="py-2 hover:bg-blue-50">
                          Division {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown 
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                        isEditing ? 'text-gray-400' : 'text-gray-300'
                      } ${activeDropdown === 'division' ? 'rotate-180 text-blue-500' : ''}`} 
                    />
                    {activeDropdown === 'division' && isEditing && (
                      <>
                        <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500/20"></div>
                        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Save button */}
              {isEditing && (
                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading || !division}
                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 transition-transform group-hover:scale-110 duration-300" />
                          <span>Save Subscription</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications section */}
        <div className="space-y-4">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">Recent Notifications</h3>
              <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                {notifications.filter(n => !n.read).length} new
              </span>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-all duration-300 hover:scale-105">
              Mark all as read
            </button>
          </div>

          {/* Notifications list */}
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group relative overflow-hidden rounded-xl bg-white p-5 shadow-md hover:shadow-lg transition-all duration-300 border-l-4 hover:scale-[1.02] hover:translate-x-1 ${
                  !notification.read 
                    ? 'border-l-blue-600 bg-gradient-to-r from-blue-50/50 to-white' 
                    : 'border-l-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                    !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold transition-colors duration-300 ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors duration-300">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}