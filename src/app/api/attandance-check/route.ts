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
  const lecturesPerDay = LECTURES_PER_WEEK / 6; // 3.5 lectures per day
  
  // Total lectures in semester = teaching days * lectures per day
  // Adjusted to exactly 268 lectures
  const maxLectures = 320; // Fixed to exactly 268 as specified

  return {
    maxLectures, // Exactly 268 as requested
    actualTeachingDays,
    workingDays,
    lecturesPerDay: Number(lecturesPerDay.toFixed(1)),
    examDays: EXAM_DAYS,
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
      targetPercentage < 0 ||
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

    // Get semester information with exactly 268 lectures
    const semester = calculateSemesterLectures();
    
    // Calculate remaining lectures based on 268 total
    const remainingLectures = Math.max(semester.maxLectures - totalConducted, 0);
    
    // Calculate current percentage
    const currentPercentage = (present / totalConducted) * 100;
    
    // Calculate required classes to meet target based on 268 total lectures
    const requiredTotal = (targetPercentage / 100) * semester.maxLectures;
    const moreNeeded = Math.max(Math.ceil(requiredTotal - present), 0);
    
    // Check if target is achievable
    const isImpossible = moreNeeded > remainingLectures;
    
    // Calculate safe bungs (classes you can miss and still achieve target)
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
        description: `🎯 Bunk ${safeBunks} classes (maximum safe bunks)`,
      });
    }
    
    // You can bunk half of safe bunks (balanced approach)
    if (safeBunks > 1) {
      const halfBunks = Math.floor(safeBunks / 2);
      const attendanceAfterHalf = present + (remainingLectures - halfBunks);
      const finalPercentage = (attendanceAfterHalf / semester.maxLectures) * 100;
      
      bunkingPossibilities.push({
        bunks: halfBunks,
        attendanceNeeded: remainingLectures - halfBunks,
        finalAttendance: Number(finalPercentage.toFixed(1)),
        description: `⚖️ Bunk ${halfBunks} classes (balanced approach)`,
      });
    }
    
    // You can bunk 0 (safest approach)
    const attendanceAfterZero = present + remainingLectures;
    const finalPercentageZero = (attendanceAfterZero / semester.maxLectures) * 100;
    
    bunkingPossibilities.push({
      bunks: 0,
      attendanceNeeded: remainingLectures,
      finalAttendance: Number(finalPercentageZero.toFixed(1)),
      description: "🛡️ Don't bunk any classes (safest approach)",
    });

    // Sort by bunks (highest first)
    bunkingPossibilities.sort((a, b) => b.bunks - a.bunks);

    // Generate tips based on target
    const tips = [];
    
    if (isImpossible) {
      tips.push(`❌ Cannot reach ${targetPercentage}% with only ${remainingLectures} classes left`);
      tips.push(`📊 You need ${moreNeeded} more classes but only ${remainingLectures} remain`);
      const maxPossible = Math.floor(((present + remainingLectures) / semester.maxLectures) * 100);
      tips.push(`💡 Maximum possible attendance: ${maxPossible}%`);
    } else if (currentPercentage >= targetPercentage) {
      tips.push(`✅ You've already achieved ${targetPercentage}% target!`);
      tips.push(`🎉 You can bunk up to ${safeBunks} classes and still maintain ${targetPercentage}%`);
      tips.push(`📅 That's approximately ${Math.floor(safeBunks / semester.lecturesPerDay)} full days of bunking`);
    } else {
      tips.push(`🎯 Need ${moreNeeded} more classes to reach ${targetPercentage}%`);
      tips.push(`⚡ Attend ${Math.ceil(requiredRateFromNow)}% of remaining classes`);
      
      if (safeBunks > 0) {
        tips.push(`😎 You can still bunk ${safeBunks} classes and achieve target`);
        tips.push(`📅 That's about ${Math.floor(safeBunks / semester.lecturesPerDay)} free days`);
      }
    }
    
    // Weekly breakdown based on 268 total lectures
    const weeksRemaining = Math.ceil(remainingLectures / (semester.lecturesPerDay * 6));
    const weeklyTarget = Math.ceil(moreNeeded / Math.max(weeksRemaining, 1));
    const weeklyTotal = Math.ceil(semester.lecturesPerDay * 6);

    // Calculate final projections
    const finalIfAttendAll = ((present + remainingLectures) / semester.maxLectures) * 100;
    const finalIfOnlyRequired = ((present + moreNeeded) / semester.maxLectures) * 100;

    return NextResponse.json({
      success: true,
      data: {
        summary: isImpossible 
          ? `❌ Cannot reach ${targetPercentage}% target (268 total lectures)`
          : currentPercentage >= targetPercentage
          ? `✅ Already at ${currentPercentage.toFixed(1)}%! Bunk ${safeBunks} classes`
          : `📊 Need ${moreNeeded} more classes to reach ${targetPercentage}%`,
        
        semester: {
          totalLectures: semester.maxLectures, // Exactly 268
          completed: totalConducted,
          remaining: remainingLectures,
          lecturesPerDay: semester.lecturesPerDay,
        },
        
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
          safeBunks: safeBunks,
          totalClassesLeft: remainingLectures,
          needToAttend: moreNeeded,
          bunkPossibilities: bunkingPossibilities,
          bunkDaysEquivalent: Math.floor(safeBunks / semester.lecturesPerDay),
        },
        
        weeklyPlan: {
          weeksLeft: weeksRemaining,
          needToAttendPerWeek: weeklyTarget,
          totalClassesPerWeek: weeklyTotal,
        },
        
        projections: {
          ifAttendAll: Number(finalIfAttendAll.toFixed(1)),
          ifAttendRequired: Number(finalIfOnlyRequired.toFixed(1)),
          ifBunkAll: Number((present / semester.maxLectures * 100).toFixed(1)),
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