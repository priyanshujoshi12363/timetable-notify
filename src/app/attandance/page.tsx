export default function AttendancePage() {
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Attendance
      </h2>

      <div className="bg-white rounded-2xl shadow p-6 text-center">
        <div className="text-4xl font-bold text-blue-600">
          82%
        </div>
        <p className="text-gray-500 mt-2">
          23 / 28 Sessions
        </p>
      </div>
    </div>
  );
}