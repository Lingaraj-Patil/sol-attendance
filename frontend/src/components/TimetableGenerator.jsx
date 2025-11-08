import { useState } from 'react';
import { timetableAPI, courseAPI } from '../services/api';
import { Calendar, Loader2, CheckCircle, AlertCircle, Plus, Trash2, Save } from 'lucide-react';

const TimetableGenerator = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    semester: '',
    academicYear: new Date().getFullYear().toString(),
    timeLimit: 10,
    timeSlots: [],
    courses: [],
    faculty: [],
    rooms: [],
    studentGroups: []
  });

  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    name: '',
    credit_hours: '',
    course_track: 'Major',
    components: { theory: '', lab: '' },
    student_groups: [],
    lab_required: false
  });
  const [newFaculty, setNewFaculty] = useState({
    faculty_id: '',
    name: '',
    expertise: [],
    available_slots: [],
    max_hours_per_week: ''
  });
  const [newRoom, setNewRoom] = useState({
    room_id: '',
    type: '',
    capacity: '',
    available_slots: []
  });
  const [newStudentGroup, setNewStudentGroup] = useState({
    group_id: '',
    students: [],
    course_choices: {
      major: [],
      minor: [],
      skill: []
    }
  });

  const handleAddTimeSlot = () => {
    if (newTimeSlot && !formData.timeSlots.includes(newTimeSlot)) {
      setFormData({
        ...formData,
        timeSlots: [...formData.timeSlots, newTimeSlot]
      });
      setNewTimeSlot('');
    }
  };

  const handleAddCourse = () => {
    if (newCourse.course_code && newCourse.credit_hours) {
      const courseData = {
        course_code: newCourse.course_code,
        name: newCourse.name || newCourse.course_code,
        credit_hours: parseInt(newCourse.credit_hours),
        course_track: newCourse.course_track || 'Major',
        components: {
          theory: parseInt(newCourse.components.theory) || parseInt(newCourse.credit_hours),
          ...(newCourse.components.lab && { lab: parseInt(newCourse.components.lab) })
        },
        student_groups: newCourse.student_groups.length > 0 ? newCourse.student_groups : formData.studentGroups.map(g => g.group_id),
        ...(newCourse.lab_required && { lab_required: true })
      };
      setFormData({
        ...formData,
        courses: [...formData.courses, courseData]
      });
      setNewCourse({ 
        course_code: '', 
        name: '',
        credit_hours: '', 
        course_track: 'Major',
        components: { theory: '', lab: '' },
        student_groups: [],
        lab_required: false
      });
    }
  };

  const handleAddFaculty = () => {
    if (newFaculty.faculty_id) {
      const facultyData = {
        ...newFaculty,
        max_hours_per_week: parseInt(newFaculty.max_hours_per_week) || 20
      };
      setFormData({
        ...formData,
        faculty: [...formData.faculty, facultyData]
      });
      setNewFaculty({ 
        faculty_id: '', 
        name: '',
        expertise: [], 
        available_slots: [],
        max_hours_per_week: ''
      });
    }
  };

  const handleAddRoom = () => {
    if (newRoom.room_id && newRoom.capacity && newRoom.type) {
      // Ensure type is 'theory' or 'lab' as per API requirements
      const roomType = newRoom.type.toLowerCase() === 'lab' ? 'lab' : 'theory';
      setFormData({
        ...formData,
        rooms: [...formData.rooms, { 
          ...newRoom, 
          type: roomType,
          capacity: parseInt(newRoom.capacity) 
        }]
      });
      setNewRoom({ room_id: '', type: '', capacity: '', available_slots: [] });
    }
  };

  const handleAddStudentGroup = () => {
    if (newStudentGroup.group_id && newStudentGroup.students.length > 0) {
      setFormData({
        ...formData,
        studentGroups: [...formData.studentGroups, newStudentGroup]
      });
      setNewStudentGroup({ 
        group_id: '', 
        students: [], 
        course_choices: {
          major: [],
          minor: [],
          skill: []
        }
      });
    }
  };

  const handleRemove = (type, index) => {
    const updated = [...formData[type]];
    updated.splice(index, 1);
    setFormData({ ...formData, [type]: updated });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Prepare input data
      const inputData = {
        courses: formData.courses,
        faculty: formData.faculty,
        rooms: formData.rooms,
        student_groups: formData.studentGroups,
        time_slots: formData.timeSlots,
        time_limit: formData.timeLimit
      };

      // Validate first (optional - can skip if backend validates)
      try {
        await timetableAPI.validate(inputData);
      } catch (validateError) {
        console.warn('Validation warning:', validateError);
        // Continue anyway, backend will validate
      }

      // Generate and save via backend (backend calls external API and saves)
      const response = await timetableAPI.save({
        name: formData.name || `Timetable ${new Date().toISOString()}`,
        semester: formData.semester,
        academicYear: formData.academicYear,
        inputData
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Timetable generated and saved successfully!'
        });

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to generate timetable'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <Calendar className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-900">Generate Timetable</h2>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Timetable Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Semester"
            value={formData.semester}
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Academic Year"
            value={formData.academicYear}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            className="input-field"
          />
        </div>

        {/* Time Slots */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Slots</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              placeholder="e.g., Mon_09, Mon_10"
              value={newTimeSlot}
              onChange={(e) => setNewTimeSlot(e.target.value)}
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTimeSlot()}
            />
            <button
              onClick={handleAddTimeSlot}
              className="btn-primary flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.timeSlots.map((slot, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center space-x-2"
              >
                <span>{slot}</span>
                <button
                  onClick={() => handleRemove('timeSlots', idx)}
                  className="text-primary-600 hover:text-primary-800"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Courses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Courses</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Course Code *"
              value={newCourse.course_code}
              onChange={(e) => setNewCourse({ ...newCourse, course_code: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Course Name"
              value={newCourse.name}
              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Credit Hours *"
              value={newCourse.credit_hours}
              onChange={(e) => setNewCourse({ ...newCourse, credit_hours: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
            <select
              value={newCourse.course_track}
              onChange={(e) => setNewCourse({ ...newCourse, course_track: e.target.value })}
              className="input-field"
            >
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="Skill">Skill</option>
              <option value="Elective">Elective</option>
            </select>
            <input
              type="number"
              placeholder="Theory Hours"
              value={newCourse.components.theory}
              onChange={(e) => setNewCourse({ 
                ...newCourse, 
                components: { ...newCourse.components, theory: e.target.value }
              })}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Lab Hours (optional)"
              value={newCourse.components.lab}
              onChange={(e) => setNewCourse({ 
                ...newCourse, 
                components: { ...newCourse.components, lab: e.target.value }
              })}
              className="input-field"
            />
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newCourse.lab_required}
                onChange={(e) => setNewCourse({ ...newCourse, lab_required: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Lab Required</span>
            </label>
          </div>
          <button
            onClick={handleAddCourse}
            className="btn-primary flex items-center space-x-1 mb-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Course</span>
          </button>
          <div className="space-y-2">
            {formData.courses.map((course, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
              >
                <span className="text-sm">
                  <strong>{course.course_code}</strong> - {course.name || course.course_code} ({course.credit_hours} credits, {course.course_track})
                  {course.components?.lab && ` - Theory: ${course.components.theory}h, Lab: ${course.components.lab}h`}
                </span>
                <button
                  onClick={() => handleRemove('courses', idx)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Faculty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
            <input
              type="text"
              placeholder="Faculty ID *"
              value={newFaculty.faculty_id}
              onChange={(e) => setNewFaculty({ ...newFaculty, faculty_id: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Faculty Name"
              value={newFaculty.name}
              onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Expertise (comma-separated) *"
              value={newFaculty.expertise.join(', ')}
              onChange={(e) => setNewFaculty({
                ...newFaculty,
                expertise: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              })}
              className="input-field"
              required
            />
            <input
              type="number"
              placeholder="Max Hours/Week *"
              value={newFaculty.max_hours_per_week}
              onChange={(e) => setNewFaculty({ ...newFaculty, max_hours_per_week: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Available Slots (comma-separated) *"
              value={newFaculty.available_slots.join(', ')}
              onChange={(e) => setNewFaculty({
                ...newFaculty,
                available_slots: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              })}
              className="input-field w-full"
              required
            />
          </div>
          <button
            onClick={handleAddFaculty}
            className="btn-primary flex items-center space-x-1 mb-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Faculty</span>
          </button>
          <div className="space-y-2">
            {formData.faculty.map((fac, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
              >
                <span className="text-sm">
                  <strong>{fac.faculty_id}</strong> {fac.name && `- ${fac.name}`} - Expertise: {fac.expertise.join(', ')} (Max: {fac.max_hours_per_week}h/week)
                </span>
                <button
                  onClick={() => handleRemove('faculty', idx)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rooms</label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
            <input
              type="text"
              placeholder="Room ID *"
              value={newRoom.room_id}
              onChange={(e) => setNewRoom({ ...newRoom, room_id: e.target.value })}
              className="input-field"
              required
            />
            <select
              value={newRoom.type}
              onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Type *</option>
              <option value="theory">Theory</option>
              <option value="lab">Lab</option>
            </select>
            <input
              type="number"
              placeholder="Capacity *"
              value={newRoom.capacity}
              onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Available Slots (comma-separated) *"
              value={newRoom.available_slots.join(', ')}
              onChange={(e) => setNewRoom({
                ...newRoom,
                available_slots: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              })}
              className="input-field"
              required
            />
          </div>
          <button
            onClick={handleAddRoom}
            className="btn-primary flex items-center space-x-1 mb-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Room</span>
          </button>
          <div className="space-y-2">
            {formData.rooms.map((room, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
              >
                <span className="text-sm">
                  <strong>{room.room_id}</strong> - {room.type} (Capacity: {room.capacity})
                </span>
                <button
                  onClick={() => handleRemove('rooms', idx)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Student Groups */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Student Groups</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="Group ID *"
              value={newStudentGroup.group_id}
              onChange={(e) => setNewStudentGroup({ ...newStudentGroup, group_id: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Students (comma-separated) *"
              value={newStudentGroup.students.join(', ')}
              onChange={(e) => setNewStudentGroup({
                ...newStudentGroup,
                students: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              })}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Major Courses (comma-separated)"
              value={newStudentGroup.course_choices.major.join(', ')}
              onChange={(e) => setNewStudentGroup({
                ...newStudentGroup,
                course_choices: {
                  ...newStudentGroup.course_choices,
                  major: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                }
              })}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Minor Courses (comma-separated)"
              value={newStudentGroup.course_choices.minor.join(', ')}
              onChange={(e) => setNewStudentGroup({
                ...newStudentGroup,
                course_choices: {
                  ...newStudentGroup.course_choices,
                  minor: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                }
              })}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Skill Courses (comma-separated)"
              value={newStudentGroup.course_choices.skill.join(', ')}
              onChange={(e) => setNewStudentGroup({
                ...newStudentGroup,
                course_choices: {
                  ...newStudentGroup.course_choices,
                  skill: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                }
              })}
              className="input-field"
            />
          </div>
          <button
            onClick={handleAddStudentGroup}
            className="btn-primary flex items-center space-x-1 mb-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student Group</span>
          </button>
          <div className="space-y-2">
            {formData.studentGroups.map((group, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
              >
                <span className="text-sm">
                  <strong>{group.group_id}</strong> - Students: {group.students.length}
                  {group.course_choices.major.length > 0 && ` | Major: ${group.course_choices.major.join(', ')}`}
                  {group.course_choices.minor.length > 0 && ` | Minor: ${group.course_choices.minor.join(', ')}`}
                  {group.course_choices.skill.length > 0 && ` | Skill: ${group.course_choices.skill.join(', ')}`}
                </span>
                <button
                  onClick={() => handleRemove('studentGroups', idx)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Time Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
          <input
            type="number"
            value={formData.timeLimit}
            onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 10 })}
            className="input-field"
            min="1"
            max="300"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || formData.timeSlots.length === 0 || formData.courses.length === 0}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating Timetable...</span>
            </>
          ) : (
            <>
              <Calendar className="h-5 w-5" />
              <span>Generate Timetable</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TimetableGenerator;

