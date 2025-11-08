import { useState, useEffect } from 'react';
import { timetableAPI } from '../services/api';
import { Calendar, Clock, MapPin, Users, Loader2, AlertCircle } from 'lucide-react';

const TimetableDisplay = ({ userId, userRole }) => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadTimetable();
    }
  }, [userId]);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await timetableAPI.getByUser(userId);
      if (response.data.success) {
        setTimetable(response.data.data.timetable);
      } else {
        setError('No timetable available');
      }
    } catch (error) {
      console.error('Load timetable error:', error);
      // Try to get active timetable as fallback
      try {
        const activeResponse = await timetableAPI.getActive();
        if (activeResponse.data.success) {
          setTimetable(activeResponse.data.data.timetable);
        } else {
          setError('No timetable available');
        }
      } catch (fallbackError) {
        setError('Failed to load timetable');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !timetable) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 text-gray-500">
          <AlertCircle className="h-5 w-5" />
          <p>{error || 'No timetable available'}</p>
        </div>
      </div>
    );
  }

  const userTimetable = timetable.userTimetable || {};
  const assignments = timetable.assignments || timetable.generatedData?.assignments || {};

  // Parse time slots and organize by day and time
  const timeSlots = Object.keys(assignments);
  const scheduleByDay = {};
  const allTimes = new Set();

  timeSlots.forEach(slot => {
    const parts = slot.split('_');
    if (parts.length >= 2) {
      const day = parts[0];
      const time = parts.slice(1).join('_');
      allTimes.add(time);
      
      if (!scheduleByDay[day]) {
        scheduleByDay[day] = {};
      }
      scheduleByDay[day][time] = {
        slot,
        assignment: assignments[slot]
      };
    }
  });

  // Sort times
  const sortedTimes = Array.from(allTimes).sort();

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // If we have userTimetable, use that instead
  const hasUserTimetable = Object.keys(userTimetable).length > 0;
  const hasAssignments = Object.keys(assignments).length > 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-semibold text-gray-900">My Timetable</h2>
        </div>
        {timetable.name && (
          <span className="text-sm text-gray-600">{timetable.name}</span>
        )}
      </div>

      {!hasUserTimetable && !hasAssignments ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No classes scheduled</p>
        </div>
      ) : hasUserTimetable ? (
        // Show user-specific timetable
        <div className="space-y-4">
          {Object.entries(userTimetable).map(([slot, details]) => {
            const [day, ...timeParts] = slot.split('_');
            const time = timeParts.join('_');
            return (
              <div
                key={slot}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {day} - {time}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {details.course || details.course_code || 'Course'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {details.room && (
                      <p className="text-sm text-gray-600 flex items-center justify-end">
                        <MapPin className="h-4 w-4 mr-1" />
                        {details.room}
                      </p>
                    )}
                    {details.faculty && (
                      <p className="text-sm text-gray-600 flex items-center justify-end mt-1">
                        <Users className="h-4 w-4 mr-1" />
                        {details.faculty}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Show timetable grid
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                {days.map(day => (
                  <th key={day} className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTimes.map((time) => (
                <tr key={time} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-600 font-medium">{time}</td>
                  {days.map(day => {
                    const slotData = scheduleByDay[day]?.[time];
                    return (
                      <td key={`${day}-${time}`} className="py-3 px-4 text-center">
                        {slotData?.assignment ? (
                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-2">
                            <p className="font-semibold text-xs text-gray-900">
                              {slotData.assignment.course_code || slotData.assignment.course || 'N/A'}
                            </p>
                            {slotData.assignment.room && (
                              <p className="text-xs text-gray-600 mt-1 flex items-center justify-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {slotData.assignment.room}
                              </p>
                            )}
                            {slotData.assignment.faculty && (
                              <p className="text-xs text-gray-500 mt-1">
                                {slotData.assignment.faculty}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TimetableDisplay;
