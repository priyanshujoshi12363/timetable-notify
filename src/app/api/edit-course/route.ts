// app/api/edit-course/route.ts (for App Router)
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/utils/db';
import UserDevice from '@/models/student';
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { branch, course, division } = body;

    if (!branch || !course || !division) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Update the subscription - use returnDocument: 'after' instead of new: true
    const updatedSubscription = await UserDevice.findByIdAndUpdate(
      id,
      { 
        branch, 
        course, 
        division,
        updatedAt: new Date()
      },
      { 
        returnDocument: 'after', // This replaces new: true
        runValidators: true 
      }
    );

    if (!updatedSubscription) {
      return NextResponse.json(
        { success: false, message: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      data: updatedSubscription
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}