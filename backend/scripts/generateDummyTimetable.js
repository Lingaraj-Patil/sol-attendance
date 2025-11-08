import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import Timetable from '../models/Timetable.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

dotenv.config();

// Generate dummy timetable data based on existing database records
const generateDummyTimetable = async () => {
  try {
    await connectDB();
    console.log('📚 Generating dummy timetable data...');

    // Get all active students
    const students = await User.find({ role: 'student', isActive: true })
      .select('_id name email enrolledCourses')
      .populate('enrolledCourses', 'name code');
    
    // Get all active teachers
    const teachers = await User.find({ role: 'teacher', isActive: true })
      .select('_id name email');
    
    // Get all active courses
    const courses = await Course.find({ isActive: true })
      .select('_id name code teacher instructor students')
      .populate('teacher', 'name email')
      .populate('instructor', 'name email')
      .populate('students', 'name email');

    console.log(`Found ${students.length} students, ${teachers.length} teachers, ${courses.length} courses`);

    if (students.length === 0 || teachers.length === 0 || courses.length === 0) {
      console.log('⚠️  Not enough data to generate timetable. Need at least 1 student, 1 teacher, and 1 course.');
      process.exit(0);
    }

    // Standard time slots (Mon-Fri, 9 AM to 5 PM)
    const timeSlots = [
      'Mon_09', 'Mon_10', 'Mon_11', 'Mon_12', 'Mon_14', 'Mon_15', 'Mon_16', 'Mon_17',
      'Tue_09', 'Tue_10', 'Tue_11', 'Tue_12', 'Tue_14', 'Tue_15', 'Tue_16', 'Tue_17',
      'Wed_09', 'Wed_10', 'Wed_11', 'Wed_12', 'Wed_14', 'Wed_15', 'Wed_16', 'Wed_17',
      'Thu_09', 'Thu_10', 'Thu_11', 'Thu_12', 'Thu_14', 'Thu_15', 'Thu_16', 'Thu_17',
      'Fri_09', 'Fri_10', 'Fri_11', 'Fri_12', 'Fri_14', 'Fri_15', 'Fri_16', 'Fri_17'
    ];

    // Create assignments (time slot -> course assignment)
    const assignments = {};
    const studentTimetables = {};
    const facultyTimetables = {};

    // Initialize faculty timetables
    teachers.forEach(teacher => {
      facultyTimetables[teacher._id.toString()] = {};
    });

    // Initialize student timetables
    students.forEach(student => {
      studentTimetables[student._id.toString()] = {};
    });

    // Assign courses to time slots
    let slotIndex = 0;
    const rooms = ['R101', 'R102', 'R103', 'LAB1', 'LAB2'];
    let roomIndex = 0;

    courses.forEach((course, courseIndex) => {
      // Each course gets 2-3 time slots per week
      const slotsPerCourse = Math.min(3, Math.floor(timeSlots.length / courses.length) || 2);
      
      for (let i = 0; i < slotsPerCourse && slotIndex < timeSlots.length; i++) {
        const slot = timeSlots[slotIndex];
        const teacher = course.teacher || course.instructor;
        const teacherId = teacher?._id?.toString() || teachers[courseIndex % teachers.length]._id.toString();
        
        // Create assignment
        assignments[slot] = {
          course_code: course.code || `COURSE${courseIndex + 1}`,
          course: course.name,
          faculty_id: teacherId,
          faculty: teacher?.name || teachers[courseIndex % teachers.length].name,
          room: rooms[roomIndex % rooms.length],
          student_groups: course.students?.map(s => s._id.toString()) || []
        };

        // Add to faculty timetable
        if (facultyTimetables[teacherId]) {
          facultyTimetables[teacherId][slot] = {
            course_code: course.code || `COURSE${courseIndex + 1}`,
            course: course.name,
            room: rooms[roomIndex % rooms.length],
            student_groups: course.students?.map(s => s._id.toString()) || []
          };
        }

        // Add to student timetables (for students enrolled in this course)
        if (course.students && course.students.length > 0) {
          course.students.forEach(student => {
            const studentId = student._id?.toString() || student.toString();
            if (studentTimetables[studentId]) {
              studentTimetables[studentId][slot] = {
                course_code: course.code || `COURSE${courseIndex + 1}`,
                course: course.name,
                room: rooms[roomIndex % rooms.length],
                faculty: teacher?.name || teachers[courseIndex % teachers.length].name
              };
            }
          });
        } else {
          // If no students assigned, assign to first few students
          const studentsToAssign = students.slice(0, Math.min(5, students.length));
          studentsToAssign.forEach(student => {
            const studentId = student._id.toString();
            if (studentTimetables[studentId]) {
              studentTimetables[studentId][slot] = {
                course_code: course.code || `COURSE${courseIndex + 1}`,
                course: course.name,
                room: rooms[roomIndex % rooms.length],
                faculty: teacher?.name || teachers[courseIndex % teachers.length].name
              };
            }
          });
        }

        slotIndex++;
        roomIndex++;
      }
    });

    // Create input data structure
    const inputData = {
      time_slots: timeSlots,
      time_limit: 10,
      courses: courses.map((course, index) => ({
        course_code: course.code || `COURSE${index + 1}`,
        name: course.name,
        credit_hours: course.credits || 3,
        course_track: 'Major',
        components: { theory: course.credits > 3 ? course.credits - 1 : course.credits || 3, lab: course.credits > 3 ? 1 : 0 },
        student_groups: ['G1'],
        possible_faculty: [(course.teacher || course.instructor)?._id?.toString() || teachers[index % teachers.length]._id.toString()],
        lab_required: (course.credits || 3) > 3
      })),
      faculty: teachers.map((teacher, index) => ({
        faculty_id: teacher._id.toString(),
        name: teacher.name,
        expertise: courses.filter(c => 
          (c.teacher?._id?.toString() === teacher._id.toString()) || 
          (c.instructor?._id?.toString() === teacher._id.toString())
        ).map(c => c.code || `COURSE${index + 1}`),
        available_slots: timeSlots,
        max_hours_per_week: 20
      })),
      rooms: rooms.map((room, index) => ({
        room_id: room,
        type: room.startsWith('LAB') ? 'lab' : 'theory',
        capacity: room.startsWith('LAB') ? 32 : 60,
        available_slots: timeSlots
      })),
      student_groups: [{
        group_id: 'G1',
        program: 'B.Tech CS',
        semester: '3',
        students: students.slice(0, Math.min(10, students.length)).map(s => s._id.toString()),
        course_choices: {
          major: courses.map(c => c.code || `COURSE${courses.indexOf(c) + 1}`),
          minor: [],
          skill: []
        }
      }]
    };

    // Create generated data structure
    const generatedData = {
      assignments,
      faculty_timetables: facultyTimetables,
      student_timetables: studentTimetables,
      violations: [],
      metadata: {
        generated_at: new Date().toISOString(),
        total_courses: courses.length,
        total_students: students.length,
        total_teachers: teachers.length,
        total_slots: Object.keys(assignments).length
      }
    };

    // Deactivate existing timetables
    await Timetable.updateMany({}, { $set: { isActive: false } });

    // Create new timetable
    const timetable = new Timetable({
      name: 'Dummy Timetable - Auto Generated',
      semester: '3',
      academicYear: '2024-2025',
      inputData,
      generatedData,
      assignments,
      facultyTimetables: facultyTimetables,
      studentTimetables: studentTimetables,
      violations: [],
      metadata: {
        ...generatedData.metadata,
        isDummy: true,
        generatedBy: 'script'
      },
      createdBy: teachers[0]?._id || new mongoose.Types.ObjectId(),
      isActive: true
    });

    await timetable.save();

    console.log('✅ Dummy timetable generated successfully!');
    console.log(`   - Timetable ID: ${timetable._id}`);
    console.log(`   - Total assignments: ${Object.keys(assignments).length}`);
    console.log(`   - Students with schedules: ${Object.keys(studentTimetables).length}`);
    console.log(`   - Teachers with schedules: ${Object.keys(facultyTimetables).length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating dummy timetable:', error);
    process.exit(1);
  }
};

generateDummyTimetable();

