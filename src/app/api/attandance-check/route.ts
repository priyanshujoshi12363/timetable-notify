import { NextRequest, NextResponse } from "next/server";

type AttendanceRequest = {
  present: number;
  totalConducted: number;
  targetPercentage: number;
};

function calculateSemesterLectures() {
  const SEM_START = new Date("2025-01-20");
  const SEM_END = new Date("2025-05-20");
  const LECTURES_PER_WEEK = 21;
  const EXAM_DAYS = 40;

  let workingDays = 0;
  const current = new Date(SEM_START);

  while (current <= SEM_END) {
    // Exclude Sundays (0) from working days
    if (current.getDay() !== 0) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  const actualTeachingDays = Math.max(workingDays - EXAM_DAYS, 0);
  // Average lectures per day (21 lectures / 6 days)
  const lecturesPerDay = LECTURES_PER_WEEK / 6;
  const maxLectures = Math.floor(actualTeachingDays * lecturesPerDay);

  return {
    maxLectures,
    actualTeachingDays,
    lecturesPerDay: Number(lecturesPerDay.toFixed(1)),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: AttendanceRequest = await req.json();
    const { present, totalConducted, targetPercentage } = body;

    // Input validation
    if (
      present < 0 ||
      totalConducted <= 0 ||
      present > totalConducted ||
      targetPercentage <= 0 ||
      targetPercentage > 100
    ) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid input values. Please check your numbers." 
        },
        { status: 400 }
      );
    }

    // Get semester information
    const semester = calculateSemesterLectures();
    
    // Calculate remaining lectures
    const remainingLectures = Math.max(semester.maxLectures - totalConducted, 0);
    
    // Calculate current percentage
    const currentPercentage = (present / totalConducted) * 100;
    
    // Calculate required classes to meet target
    const requiredTotal = (targetPercentage / 100) * semester.maxLectures;
    const moreNeeded = Math.max(Math.ceil(requiredTotal - present), 0);
    
    // Check if target is achievable
    const isImpossible = moreNeeded > remainingLectures;
    
    // Calculate safe bunks (classes you can miss and still achieve target)
    const safeBunks = Math.max(remainingLectures - moreNeeded, 0);
    
    // Calculate required attendance rate from now
    const requiredRateFromNow = remainingLectures > 0 
      ? (moreNeeded / remainingLectures) * 100 
      : 0;

    // Calculate different bunking possibilities based on target
    const bunkingPossibilities = [];
    
    // You can bunk all safe bunks and still achieve target
    if (safeBunks > 0) {
      bunkingPossibilities.push({
        bunks: safeBunks,
        attendanceNeeded: remainingLectures - safeBunks,
        finalAttendance: targetPercentage,
        description: `Bunk ${safeBunks} classes, attend ${remainingLectures - safeBunks} more`,
      });
    }
    
    // You can bunk half of safe bunks (safer approach)
    if (safeBunks > 1) {
      const halfBunks = Math.floor(safeBunks / 2);
      const attendanceAfterHalf = present + (remainingLectures - halfBunks);
      const finalPercentage = (attendanceAfterHalf / semester.maxLectures) * 100;
      
      bunkingPossibilities.push({
        bunks: halfBunks,
        attendanceNeeded: remainingLectures - halfBunks,
        finalAttendance: Number(finalPercentage.toFixed(1)),
        description: `Bunk ${halfBunks} classes (conservative approach)`,
      });
    }
    
    // You can bunk 0 (safest approach)
    const attendanceAfterZero = present + remainingLectures;
    const finalPercentageZero = (attendanceAfterZero / semester.maxLectures) * 100;
    
    bunkingPossibilities.push({
      bunks: 0,
      attendanceNeeded: remainingLectures,
      finalAttendance: Number(finalPercentageZero.toFixed(1)),
      description: "Don't bunk any classes (safest approach)",
    });

    // Generate tips based on target
    const tips = [];
    
    if (isImpossible) {
      tips.push(`❌ Cannot reach ${targetPercentage}% with remaining ${remainingLectures} classes`);
      tips.push(`📊 You need ${moreNeeded} more classes but only ${remainingLectures} left`);
      tips.push("💡 Consider lowering your target percentage");
    } else if (currentPercentage >= targetPercentage) {
      tips.push(`✅ You've already achieved ${targetPercentage}% target!`);
      tips.push(`🎉 You can bunk up to ${safeBunks} classes and still maintain ${targetPercentage}%`);
      tips.push(`📅 That's approximately ${Math.floor(safeBunks / semester.lecturesPerDay)} days of bunking`);
    } else {
      tips.push(`🎯 Need ${moreNeeded} more classes to reach ${targetPercentage}%`);
      tips.push(`⚡ Attend ${Math.ceil(requiredRateFromNow)}% of remaining classes`);
      
      if (safeBunks > 0) {
        tips.push(`😎 You can still bunk ${safeBunks} classes and achieve target`);
        tips.push(`📅 That's about ${Math.floor(safeBunks / semester.lecturesPerDay)} free days`);
      }
    }
    
    // Weekly breakdown
    const weeksRemaining = Math.ceil(remainingLectures / semester.lecturesPerDay);
    const weeklyTarget = Math.ceil(moreNeeded / weeksRemaining);

    return NextResponse.json({
      success: true,
      data: {
        summary: isImpossible 
          ? `❌ Cannot reach ${targetPercentage}% target`
          : currentPercentage >= targetPercentage
          ? `✅ You've already reached ${targetPercentage}%! Bunk ${safeBunks} classes safely`
          : `📊 Need ${moreNeeded} more classes to reach ${targetPercentage}%`,
        
        currentStats: {
          present,
          totalConducted,
          currentPercentage: Number(currentPercentage.toFixed(1)),
          remainingLectures,
        },
        
        target: {
          percentage: targetPercentage,
          classesNeeded: moreNeeded,
          isAchievable: !isImpossible,
          isAlreadyAchieved: currentPercentage >= targetPercentage,
        },
        
        bunkingInfo: {
          safeBunks: safeBunks, // This is what user wants - how many they can bunk!
          totalClassesLeft: remainingLectures,
          needToAttend: moreNeeded,
          bunkPossibilities: bunkingPossibilities,
        },
        
        weeklyPlan: {
          weeksLeft: weeksRemaining,
          needToAttendPerWeek: weeklyTarget,
          totalClassesPerWeek: Math.ceil(semester.lecturesPerDay * 6),
        },
        
        tips: tips,
      },
    });

  } catch (error) {
    console.error("Attendance calculation error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error occurred while calculating attendance" 
      },
      { status: 500 }
    );
  }
}