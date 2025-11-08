import Timetable from '../models/Timetable.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import axios from 'axios';

const TIMETABLE_API_URL = 'https://timetable-generator-4.onrender.com';

const buildMockTimetableInput = () => ({
  time_slots: [
    'Mon_09', 'Mon_10', 'Mon_11', 'Mon_12',
    'Tue_09', 'Tue_10', 'Tue_11', 'Tue_12',
    'Wed_09', 'Wed_10', 'Wed_11', 'Wed_12',
    'Thu_09', 'Thu_10', 'Thu_11', 'Thu_12',
    'Fri_09', 'Fri_10', 'Fri_11', 'Fri_12'
  ],
  time_limit: 10,
  courses: [
    {
      course_code: 'DSA',
      name: 'Data Structures & Algorithms',
      credit_hours: 4,
      course_track: 'Major',
      components: { theory: 3, lab: 1 },
      student_groups: ['G1'],
      possible_faculty: ['F001', 'F004'],
      lab_required: true
    },
    {
      course_code: 'OS',
      name: 'Operating Systems',
      credit_hours: 3,
      course_track: 'Major',
      components: { theory: 3 },
      student_groups: ['G1', 'G2'],
      possible_faculty: ['F002', 'F003'],
      lab_required: false
    },
    {
      course_code: 'DBMS',
      name: 'Database Management Systems',
      credit_hours: 3,
      course_track: 'Major',
      components: { theory: 3 },
      student_groups: ['G2'],
      possible_faculty: ['F004', 'F005'],
      lab_required: false
    }
  ],
  faculty: [
    {
      faculty_id: 'F001',
      name: 'Dr. Alpha',
      expertise: ['DSA', 'SSP'],
      available_slots: [
        'Mon_09', 'Mon_10', 'Tue_09', 'Wed_09', 'Thu_09'
      ],
      max_hours_per_week: 10
    },
    {
      faculty_id: 'F002',
      name: 'Dr. Beta',
      expertise: ['OS', 'ML'],
      available_slots: [
        'Mon_11', 'Mon_12', 'Tue_11', 'Tue_12', 'Wed_10', 'Wed_11', 'Thu_11'
      ],
      max_hours_per_week: 12
    },
    {
      faculty_id: 'F003',
      name: 'Dr. Gamma',
      expertise: ['OS', 'SSP'],
      available_slots: [
        'Tue_09', 'Tue_10', 'Wed_09', 'Thu_09', 'Fri_09'
      ],
      max_hours_per_week: 8
    },
    {
      faculty_id: 'F004',
      name: 'Dr. Delta',
      expertise: ['DSA', 'ML', 'DBMS'],
      available_slots: [
        'Mon_09', 'Mon_10', 'Tue_10', 'Wed_10', 'Wed_11', 'Thu_10'
      ],
      max_hours_per_week: 12
    },
    {
      faculty_id: 'F005',
      name: 'Dr. Epsilon',
      expertise: ['DBMS', 'SSP'],
      available_slots: [
        'Mon_11', 'Tue_11', 'Wed_11', 'Thu_11', 'Fri_11'
      ],
      max_hours_per_week: 10
    }
  ],
  rooms: [
    {
      room_id: 'R101',
      type: 'theory',
      capacity: 60,
      available_slots: [
        'Mon_09', 'Mon_10', 'Mon_11', 'Mon_12',
        'Tue_09', 'Tue_10', 'Tue_11', 'Tue_12',
        'Wed_09', 'Wed_10', 'Wed_11', 'Wed_12',
        'Thu_09', 'Thu_10', 'Thu_11', 'Thu_12',
        'Fri_09', 'Fri_10', 'Fri_11', 'Fri_12'
      ]
    },
    {
      room_id: 'LAB1',
      type: 'lab',
      capacity: 32,
      available_slots: [
        'Mon_11', 'Mon_12', 'Tue_11', 'Tue_12',
        'Wed_11', 'Wed_12', 'Thu_11', 'Thu_12', 'Fri_11'
      ]
    }
  ],
  student_groups: [
    {
      group_id: 'G1',
      program: 'B.Tech CS',
      semester: '3',
      students: ['S001', 'S002', 'S003', 'S004'],
      course_choices: {
        major: ['DSA', 'OS', 'CN'],
        minor: ['ML'],
        skill: ['SSP']
      }
    },
    {
      group_id: 'G2',
      program: 'B.Tech CS',
      semester: '3',
      students: ['S005', 'S006', 'S007', 'S008'],
      course_choices: {
        major: ['DBMS', 'OS', 'ML'],
        minor: ['SSP'],
        skill: ['SE']
      }
    }
  ]
});

// Auto-generate timetable from user data
export const autoGenerateTimetable = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { name, semester, academicYear, timeLimit } = req.body;

    // Get admin with college information
    const admin = await User.findById(adminId).populate('college.coursesOffered', 'name courseName code courseCode credits description isActive');
    
    if (!admin || !admin.college || !admin.college.collegeUniqueId) {
      return res.status(400).json({
        success: false,
        message: 'Admin college not registered. Please register your college first.'
      });
    }

    const collegeUniqueId = admin.college.collegeUniqueId;

    // Get students and teachers from this college (availability optional - will use defaults if not set)
    const students = await User.find({ 
      role: 'student', 
      isActive: true,
      collegeUniqueId: collegeUniqueId
    }).select('name email availability interests preferredTimeSlots maxCourses coursePreferences collegeUniqueId Program');

    const teachers = await User.find({ 
      role: 'teacher', 
      isActive: true,
      collegeUniqueId: collegeUniqueId
    }).select('name email availability interests department experience workingHour collegeUniqueId');

    // Get courses from admin's college
    const courses = admin.college.coursesOffered 
      ? admin.college.coursesOffered.filter(c => c.isActive !== false)
      : [];

    // Detailed error messages
    if (students.length === 0 && teachers.length === 0 && courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient data. Need at least one student, one teacher, and one course in your college.',
        details: {
          students: 0,
          teachers: 0,
          courses: 0,
          collegeUniqueId: collegeUniqueId
        }
      });
    }

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No students found in your college. Students need to register and connect to your college first.',
        details: {
          students: 0,
          teachers: teachers.length,
          courses: courses.length,
          collegeUniqueId: collegeUniqueId
        }
      });
    }

    if (teachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No teachers found in your college. Teachers need to register and connect to your college first.',
        details: {
          students: students.length,
          teachers: 0,
          courses: courses.length,
          collegeUniqueId: collegeUniqueId
        }
      });
    }

    if (courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active courses found in your college. Please add courses to your college first.',
        details: {
          students: students.length,
          teachers: teachers.length,
          courses: 0,
          collegeUniqueId: collegeUniqueId
        }
      });
    }

    // Generate default time slots if no availability data exists
    // Standard academic time slots: Mon-Fri, 9 AM to 5 PM
    const defaultTimeSlots = [
      'Mon_09', 'Mon_10', 'Mon_11', 'Mon_12', 'Mon_14', 'Mon_15', 'Mon_16', 'Mon_17',
      'Tue_09', 'Tue_10', 'Tue_11', 'Tue_12', 'Tue_14', 'Tue_15', 'Tue_16', 'Tue_17',
      'Wed_09', 'Wed_10', 'Wed_11', 'Wed_12', 'Wed_14', 'Wed_15', 'Wed_16', 'Wed_17',
      'Thu_09', 'Thu_10', 'Thu_11', 'Thu_12', 'Thu_14', 'Thu_15', 'Thu_16', 'Thu_17',
      'Fri_09', 'Fri_10', 'Fri_11', 'Fri_12', 'Fri_14', 'Fri_15', 'Fri_16', 'Fri_17'
    ];

    // Collect all unique time slots from user availability, or use defaults
    const allTimeSlots = new Set();
    
    // Validate time slot format: "Day_Hour" (e.g., "Mon_09", "Tue_14")
    const isValidTimeSlot = (slot) => {
      if (typeof slot !== 'string') return false;
      const parts = slot.split('_');
      if (parts.length !== 2) return false;
      const day = parts[0];
      const hour = parts[1];
      const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const validHours = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
      return validDays.includes(day) && validHours.includes(hour);
    };
    
    // Add time slots from students who have availability data
    students.forEach(s => {
      if (s.availability && Array.isArray(s.availability) && s.availability.length > 0) {
        s.availability.forEach(slot => {
          if (isValidTimeSlot(slot)) {
            allTimeSlots.add(slot);
          } else {
            console.warn(`⚠️  Invalid time slot format from student ${s._id}: ${slot}`);
          }
        });
      }
    });
    
    // Add time slots from teachers who have availability data
    teachers.forEach(t => {
      if (t.availability && Array.isArray(t.availability) && t.availability.length > 0) {
        t.availability.forEach(slot => {
          if (isValidTimeSlot(slot)) {
            allTimeSlots.add(slot);
          } else {
            console.warn(`⚠️  Invalid time slot format from teacher ${t._id}: ${slot}`);
          }
        });
      }
    });

    // If no availability data found, use default time slots
    if (allTimeSlots.size === 0) {
      defaultTimeSlots.forEach(slot => allTimeSlots.add(slot));
      console.log('⚠️  No availability data found. Using default time slots:', Array.from(allTimeSlots));
    }

    // Create faculty ID mapping (F001, F002, etc.) for consistent formatting
    const facultyIdMap = new Map();
    teachers.forEach((teacher, index) => {
      facultyIdMap.set(teacher._id.toString(), `F${String(index + 1).padStart(3, '0')}`);
    });

    // Create student ID mapping (S001, S002, etc.) for consistent formatting
    const studentIdMap = new Map();
    students.forEach((student, index) => {
      studentIdMap.set(student._id.toString(), `S${String(index + 1).padStart(3, '0')}`);
    });

    // Create course code to course mapping for easier lookup
    const courseCodeMap = new Map();
    courses.forEach(course => {
      const courseCode = course.code || course.courseCode;
      if (courseCode) {
        courseCodeMap.set(courseCode.toUpperCase(), course);
      }
    });

    // Group students by program and semester for better grouping
    // This creates logical groups instead of one group per student
    const studentGroupsMap = new Map();
    let groupCounter = 1;
    
    students.forEach((student) => {
      const program = student.Program || 'B.Tech CS';
      const studentSemester = semester || '3';
      const groupKey = `${program}_${studentSemester}`;
      
      if (!studentGroupsMap.has(groupKey)) {
        studentGroupsMap.set(groupKey, {
          group_id: `G${String(groupCounter).padStart(3, '0')}`,
          program: program,
          semester: studentSemester,
          students: [],
          course_choices: { major: [], minor: [], skill: [] }
        });
        groupCounter++;
      }
      
      const group = studentGroupsMap.get(groupKey);
      const studentId = studentIdMap.get(student._id.toString());
      if (studentId) {
        group.students.push(studentId);
      }
    });

    // Prepare input data for timetable generator (matching API schema exactly)
    let inputData = {
      time_slots: Array.from(allTimeSlots).sort(),
      time_limit: Math.round(timeLimit) || 10, // Must be integer for ML API
      courses: courses.map((course, courseIndex) => {
        const courseCode = (course.code || course.courseCode || '').toUpperCase();
        const courseName = course.name || course.courseName || courseCode || 'Unnamed Course';
        const creditHours = course.credits || 3;
        
        if (!courseCode) {
          console.warn('⚠️  Course missing code:', course._id);
        }
        
        // Get all student groups that should take this course
        // Find groups where at least one student has this course in preferences
        const relevantGroupIds = [];
        students.forEach(student => {
          const prefs = student.coursePreferences || [];
          const hasPreference = prefs.some(cp => {
            const prefCode = (cp.courseCode || cp.course_code || '').toUpperCase();
            return prefCode === courseCode;
          });
          
          if (hasPreference || (!prefs.length && course.isActive)) {
            // Find which group this student belongs to
            const program = student.Program || 'B.Tech CS';
            const studentSemester = semester || '3';
            const groupKey = `${program}_${studentSemester}`;
            const group = studentGroupsMap.get(groupKey);
            if (group && !relevantGroupIds.includes(group.group_id)) {
              relevantGroupIds.push(group.group_id);
            }
          }
        });
        
        // Ensure at least one group is assigned - use all groups if none match
        const assignedGroups = relevantGroupIds.length > 0 
          ? relevantGroupIds 
          : Array.from(studentGroupsMap.values()).map(g => g.group_id);
        
        // Find possible faculty for this course based on expertise matching course code
        const possibleFaculty = teachers
          .filter(teacher => {
            // Check if teacher's interests/expertise matches this course code
            const expertise = teacher.interests || [];
            const department = teacher.department || '';
            
            // Match if expertise contains course code or course code contains expertise item
            return expertise.some(exp => {
              const expUpper = exp.toUpperCase();
              return expUpper === courseCode || 
                     courseCode.includes(expUpper) || 
                     expUpper.includes(courseCode);
            }) || (department && courseCode.includes(department.toUpperCase()));
          })
          .map(teacher => facultyIdMap.get(teacher._id.toString()))
          .filter(Boolean); // Remove any undefined values
        
        // If no faculty matches, assign all faculty (let ML model decide)
        const finalPossibleFaculty = possibleFaculty.length > 0 
          ? possibleFaculty 
          : Array.from(facultyIdMap.values());
        
        // Ensure all numeric values are integers (ML API requires integers, not floats)
        const creditHoursInt = Math.max(1, Math.round(creditHours) || 3);
        // Theory hours should be at least 1, and if credits > 3, leave room for lab
        let theoryHours = creditHoursInt;
        let labHours = 0;
        
        if (creditHoursInt > 3) {
          // If more than 3 credits, split: theory gets credits-1, lab gets 1
          theoryHours = Math.max(2, creditHoursInt - 1);
          labHours = 1;
        } else {
          // If 3 or less credits, all theory
          theoryHours = Math.max(1, creditHoursInt);
        }
        
        // Build components object - ensure theory is always present and is an integer
        const components = {
          theory: Math.round(theoryHours)
        };
        if (labHours > 0) {
          components.lab = Math.round(labHours);
        }
        
        return {
          course_code: courseCode || `COURSE_${course._id}`,
          name: courseName,
          credit_hours: Math.round(creditHoursInt), // Must be integer
          course_track: 'Major',
          components: components, // Ensure theory is always an integer
          student_groups: assignedGroups,
          possible_faculty: finalPossibleFaculty, // Add possible_faculty as per API docs
          lab_required: creditHoursInt > 3 || false
        };
      }),
      faculty: teachers.map((teacher, index) => {
        const facultyId = facultyIdMap.get(teacher._id.toString()) || `F${String(index + 1).padStart(3, '0')}`;
        
        // Map teacher expertise to course codes - expertise should match course codes exactly
        let expertise = [];
        if (teacher.interests && Array.isArray(teacher.interests) && teacher.interests.length > 0) {
          // Try to match interests to actual course codes
          expertise = teacher.interests
            .map(interest => {
              // Find matching course code
              const matchingCourse = Array.from(courseCodeMap.keys()).find(code => 
                code === interest.toUpperCase() || 
                code.includes(interest.toUpperCase()) ||
                interest.toUpperCase().includes(code)
              );
              return matchingCourse || interest.toUpperCase();
            })
            .filter(Boolean);
        }
        
        // If no expertise found, use department or default
        if (expertise.length === 0) {
          if (teacher.department) {
            // Try to match department to course codes
            const matchingCourse = Array.from(courseCodeMap.keys()).find(code => 
              code.includes(teacher.department.toUpperCase())
            );
            expertise = matchingCourse ? [matchingCourse] : [teacher.department.toUpperCase()];
          } else {
            // Default: assign all course codes (let ML model decide)
            expertise = Array.from(courseCodeMap.keys());
          }
        }
        
        return {
          faculty_id: facultyId, // Format: F001, F002, etc.
          name: teacher.name || `Teacher ${index + 1}`,
          expertise: expertise, // Must match course codes exactly
          available_slots: (teacher.availability && Array.isArray(teacher.availability) && teacher.availability.length > 0)
            ? teacher.availability 
            : Array.from(allTimeSlots),
          max_hours_per_week: Math.round(teacher.workingHour) || 20 // Must be integer
        };
      }),
      rooms: [
        {
          room_id: 'R101',
          type: 'theory',
          capacity: Math.round(60), // Ensure integer
          available_slots: Array.from(allTimeSlots)
        },
        {
          room_id: 'LAB1',
          type: 'lab',
          capacity: Math.round(32), // Ensure integer
          available_slots: Array.from(allTimeSlots)
        }
      ],
      student_groups: Array.from(studentGroupsMap.values()).map(group => {
        // Collect all course preferences from students in this group
        const allMajorCourses = new Set();
        
        students.forEach(student => {
          const program = student.Program || 'B.Tech CS';
          const studentSemester = semester || '3';
          const groupKey = `${program}_${studentSemester}`;
          
          if (groupKey === `${group.program}_${group.semester}`) {
            // This student belongs to this group
            if (student.coursePreferences && student.coursePreferences.length > 0) {
              student.coursePreferences.forEach(cp => {
                const code = (cp.courseCode || cp.course_code || '').toUpperCase();
                if (code) allMajorCourses.add(code);
              });
            } else {
              // If no preferences, add all courses up to maxCourses
              const maxCourses = student.maxCourses || courses.length;
              courses.slice(0, maxCourses).forEach(c => {
                const code = (c.code || c.courseCode || '').toUpperCase();
                if (code) allMajorCourses.add(code);
              });
            }
          }
        });
        
        // If no courses found, assign all available courses
        if (allMajorCourses.size === 0 && courses.length > 0) {
          courses.forEach(c => {
            const code = (c.code || c.courseCode || '').toUpperCase();
            if (code) allMajorCourses.add(code);
          });
        }
        
        return {
          group_id: group.group_id,
          program: group.program,
          semester: group.semester,
          students: group.students, // Array of student IDs (S001, S002, etc.)
          course_choices: {
            major: Array.from(allMajorCourses),
            minor: [],
            skill: []
          }
        };
      })
    };

    // Validate and normalize time slots format
    const validatedTimeSlots = inputData.time_slots
      .filter(slot => {
        const parts = slot.split('_');
        if (parts.length !== 2) return false;
        const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const validHours = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
        return validDays.includes(parts[0]) && validHours.includes(parts[1]);
      })
      .sort();
    
    if (validatedTimeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid time slots available. Time slots must be in format "Day_Hour" (e.g., "Mon_09", "Tue_14").'
      });
    }
    
    // Update inputData with validated time slots
    inputData.time_slots = validatedTimeSlots;
    
    // Validate input data before sending
    if (!inputData.time_slots || inputData.time_slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No time slots available. Cannot generate timetable.'
      });
    }
    
    if (!inputData.courses || inputData.courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No courses available. Cannot generate timetable.'
      });
    }
    
    if (!inputData.faculty || inputData.faculty.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No faculty available. Cannot generate timetable.'
      });
    }
    
    if (!inputData.student_groups || inputData.student_groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No student groups available. Cannot generate timetable.'
      });
    }
    
    // STEP 1: Validate and fix student groups FIRST (courses reference group IDs)
    // Get valid course codes once for efficiency
    const validCourseCodesForGroups = inputData.courses.map(c => c.course_code).filter(Boolean);
    const groupsToRemove = new Set();
    
    for (let i = 0; i < inputData.student_groups.length; i++) {
      const group = inputData.student_groups[i];
      
      // Validate required fields
      if (!group.group_id) {
        return res.status(400).json({
          success: false,
          message: `Student group missing group_id: ${JSON.stringify(group)}`
        });
      }
      
      // Validate and filter students array
      if (!group.students || !Array.isArray(group.students) || group.students.length === 0) {
        console.warn(`⚠️  Student group ${group.group_id} has no students, will be removed`);
        groupsToRemove.add(group.group_id);
        continue;
      }
      
      // Ensure students array contains valid student IDs
      const validStudents = group.students.filter(sid => {
        const isValid = typeof sid === 'string' && sid.startsWith('S') && sid.length >= 4;
        if (!isValid) {
          console.warn(`⚠️  Invalid student ID in group ${group.group_id}: ${sid}`);
        }
        return isValid;
      });
      
      if (validStudents.length === 0) {
        console.warn(`⚠️  Student group ${group.group_id} has no valid students, will be removed`);
        groupsToRemove.add(group.group_id);
        continue;
      }
      
      // Update with valid students
      group.students = validStudents;
      
      // Ensure course_choices structure exists
      if (!group.course_choices) {
        group.course_choices = { major: [], minor: [], skill: [] };
      }
      if (!Array.isArray(group.course_choices.major)) {
        group.course_choices.major = [];
      }
      if (!Array.isArray(group.course_choices.minor)) {
        group.course_choices.minor = [];
      }
      if (!Array.isArray(group.course_choices.skill)) {
        group.course_choices.skill = [];
      }
      
      // Fix missing course choices
      if (group.course_choices.major.length === 0) {
        console.warn('⚠️  Student group missing course choices, assigning all courses:', group.group_id);
        if (validCourseCodesForGroups.length > 0) {
          group.course_choices.major = [...validCourseCodesForGroups];
        } else {
          return res.status(400).json({
            success: false,
            message: `Student group ${group.group_id} has no course choices and no courses are available.`
          });
        }
      }
      
      // Ensure course_choices.major contains valid course codes only
      group.course_choices.major = group.course_choices.major
        .map(code => typeof code === 'string' ? code.toUpperCase() : code)
        .filter(code => validCourseCodesForGroups.includes(code));
      
      if (group.course_choices.major.length === 0) {
        // If no valid courses after filtering, assign all available
        if (validCourseCodesForGroups.length > 0) {
          group.course_choices.major = [...validCourseCodesForGroups];
        } else {
          return res.status(400).json({
            success: false,
            message: `Student group ${group.group_id} has no valid course choices available.`
          });
        }
      }
    }
    
    // Remove invalid groups after iteration
    if (groupsToRemove.size > 0) {
      inputData.student_groups = inputData.student_groups.filter(
        g => !groupsToRemove.has(g.group_id)
      );
      console.log(`⚠️  Removed ${groupsToRemove.size} invalid student group(s)`);
    }
    
    // Final check: ensure we have at least one valid student group
    if (inputData.student_groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid student groups available. Each group must have at least one student with valid course choices.'
      });
    }
    
    // Get valid group IDs for course validation (after student groups are validated)
    const validGroupIds = new Set(inputData.student_groups.map(g => g.group_id));
    
    // STEP 2: Validate each course has required fields and valid references
    for (const course of inputData.courses) {
      if (!course.course_code) {
        return res.status(400).json({
          success: false,
          message: `Course missing course_code: ${JSON.stringify(course)}`
        });
      }
      if (!course.components || !course.components.theory) {
        return res.status(400).json({
          success: false,
          message: `Course missing components.theory: ${JSON.stringify(course)}`
        });
      }
      if (!course.student_groups || !Array.isArray(course.student_groups) || course.student_groups.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Course ${course.course_code} has no student groups assigned`
        });
      }
      
      // Validate that all referenced group IDs exist
      const invalidGroups = course.student_groups.filter(gid => !validGroupIds.has(gid));
      if (invalidGroups.length > 0) {
        console.warn(`⚠️  Course ${course.course_code} references invalid group IDs: ${invalidGroups.join(', ')}`);
        // Remove invalid group references
        course.student_groups = course.student_groups.filter(gid => validGroupIds.has(gid));
        
        // If no valid groups remain, assign all valid groups
        if (course.student_groups.length === 0) {
          console.warn(`⚠️  Course ${course.course_code} has no valid groups, assigning all groups`);
          course.student_groups = Array.from(validGroupIds);
        }
      }
      
      // Validate possible_faculty exists and contains valid faculty IDs
      if (!course.possible_faculty || !Array.isArray(course.possible_faculty) || course.possible_faculty.length === 0) {
        console.warn(`⚠️  Course ${course.course_code} has no possible_faculty, assigning all faculty`);
        // Assign all faculty if none specified
        const allFacultyIds = inputData.faculty.map(f => f.faculty_id).filter(Boolean);
        course.possible_faculty = allFacultyIds.length > 0 ? allFacultyIds : [];
      } else {
        // Validate faculty IDs exist
        const validFacultyIds = new Set(inputData.faculty.map(f => f.faculty_id));
        course.possible_faculty = course.possible_faculty.filter(fid => validFacultyIds.has(fid));
        if (course.possible_faculty.length === 0) {
          const allFacultyIds = inputData.faculty.map(f => f.faculty_id).filter(Boolean);
          course.possible_faculty = allFacultyIds;
        }
      }
    }
    
    // STEP 3: Validate faculty expertise matches course codes
    const validCourseCodes = inputData.courses.map(c => c.course_code).filter(Boolean);
    for (const faculty of inputData.faculty) {
      if (!faculty.faculty_id) {
        return res.status(400).json({
          success: false,
          message: `Faculty missing faculty_id: ${JSON.stringify(faculty)}`
        });
      }
      
      // Ensure expertise contains valid course codes (case-insensitive comparison)
      if (faculty.expertise && Array.isArray(faculty.expertise)) {
        faculty.expertise = faculty.expertise
          .map(exp => exp.toUpperCase())
          .filter(exp => validCourseCodes.includes(exp));
      }
      
      if (!faculty.expertise || faculty.expertise.length === 0) {
        console.warn(`⚠️  Faculty ${faculty.faculty_id} has no matching expertise, assigning all courses`);
        // Assign all course codes if no expertise matches
        faculty.expertise = [...validCourseCodes];
      }
      
      // Ensure max_hours_per_week is a positive integer
      if (!faculty.max_hours_per_week || faculty.max_hours_per_week < 1) {
        faculty.max_hours_per_week = 20; // Default
      }
      faculty.max_hours_per_week = Math.round(Math.max(1, faculty.max_hours_per_week));
    }
    
    // Log input data for debugging
    console.log('📤 Sending data to ML API:', {
      time_slots_count: inputData.time_slots.length,
      courses_count: inputData.courses.length,
      faculty_count: inputData.faculty.length,
      student_groups_count: inputData.student_groups.length,
      rooms_count: inputData.rooms.length,
      time_limit: inputData.time_limit,
      sample_course: {
        course_code: inputData.courses[0]?.course_code,
        name: inputData.courses[0]?.name,
        credit_hours: inputData.courses[0]?.credit_hours,
        components: inputData.courses[0]?.components,
        student_groups: inputData.courses[0]?.student_groups,
        possible_faculty: inputData.courses[0]?.possible_faculty,
        lab_required: inputData.courses[0]?.lab_required
      },
      sample_faculty: {
        faculty_id: inputData.faculty[0]?.faculty_id,
        name: inputData.faculty[0]?.name,
        expertise: inputData.faculty[0]?.expertise,
        available_slots_count: inputData.faculty[0]?.available_slots?.length,
        max_hours_per_week: inputData.faculty[0]?.max_hours_per_week
      },
      sample_group: {
        group_id: inputData.student_groups[0]?.group_id,
        program: inputData.student_groups[0]?.program,
        semester: inputData.student_groups[0]?.semester,
        students: inputData.student_groups[0]?.students,
        course_choices: inputData.student_groups[0]?.course_choices
      }
    });

    // Call external timetable generator API (with mock fallback if needed)
    let generatedData;
    let usedMockData = false;
    let fallbackReason = null;

    const callGenerateApi = async (payload, label = 'primary') => {
      console.log(`🌐 Calling ML API (${label}):`, `${TIMETABLE_API_URL}/api/generate`);
      const response = await axios.post(`${TIMETABLE_API_URL}/api/generate`, payload, {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ ML API response received (${label}):`, {
        has_assignments: !!response.data?.assignments,
        has_faculty_timetables: !!response.data?.faculty_timetables,
        has_student_timetables: !!response.data?.student_timetables,
        violations_count: response.data?.violations?.length || 0
      });
      return response.data;
    };

    const shouldUseMockFallback = (errorMessage) => {
      if (!errorMessage || typeof errorMessage !== 'string') return false;
      const normalized = errorMessage.toLowerCase();
      return normalized.includes('no feasible student timetable') ||
             normalized.includes('no feasible timetable') ||
             normalized.includes('no feasible assignment');
    };

    try {
      generatedData = await callGenerateApi(inputData);
    } catch (apiError) {
      // Log full error details
      console.error('❌ External API error:', {
        message: apiError.message,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        url: `${TIMETABLE_API_URL}/api/generate`,
        code: apiError.code
      });
      
      // Log the actual request data that failed (for debugging)
      console.error('❌ Failed request data summary:', {
        time_slots: inputData.time_slots.length,
        courses: inputData.courses.length,
        faculty: inputData.faculty.length,
        student_groups: inputData.student_groups.length,
        rooms: inputData.rooms.length
      });
      
      // Log sample data to see structure
      if (inputData.courses.length > 0) {
        console.error('❌ Sample course:', JSON.stringify(inputData.courses[0], null, 2));
      }
      if (inputData.faculty.length > 0) {
        console.error('❌ Sample faculty:', JSON.stringify(inputData.faculty[0], null, 2));
      }
      if (inputData.student_groups.length > 0) {
        console.error('❌ Sample student group:', JSON.stringify(inputData.student_groups[0], null, 2));
      }
      
      // Provide detailed error message
      let errorMessage = 'Failed to generate timetable from external API';
      let errorDetails = null;
      
      if (apiError.response?.data) {
        // Try to extract meaningful error message
        if (apiError.response.data.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response.data.error) {
          errorMessage = apiError.response.data.error;
        } else if (typeof apiError.response.data === 'string') {
          errorMessage = apiError.response.data;
        } else if (apiError.response.data.detail) {
          errorMessage = apiError.response.data.detail;
        } else {
          errorMessage = 'ML API returned an error. Check details for more information.';
        }
        errorDetails = apiError.response.data;
        console.error('❌ ML API error details:', JSON.stringify(errorDetails, null, 2));
      } else if (apiError.code === 'ECONNREFUSED') {
        errorMessage = 'ML API service is unavailable. The service may be down or unreachable.';
      } else if (apiError.code === 'ETIMEDOUT') {
        errorMessage = 'ML API request timed out. The timetable generation is taking too long.';
      } else if (apiError.code === 'ENOTFOUND') {
        errorMessage = 'ML API host not found. Please check the API URL configuration.';
      } else if (apiError.response?.status === 400) {
        errorMessage = 'Invalid data format sent to ML API. ' + (errorMessage !== 'Failed to generate timetable from external API' ? errorMessage : '');
      } else if (apiError.response?.status === 500) {
        // For 500 errors, try to get more details
        const apiErrorMsg = apiError.response.data?.message || 
                           apiError.response.data?.error || 
                           apiError.response.data?.detail ||
                           'Internal server error in ML API';
        errorMessage = `ML API server error: ${apiErrorMsg}`;
        console.error('❌ ML API 500 error - Full response:', JSON.stringify(apiError.response.data, null, 2));
      }

      const canFallback = shouldUseMockFallback(errorMessage);
      
      if (canFallback) {
        fallbackReason = errorMessage;
        console.warn('⚠️ Attempting mock data fallback due to infeasible timetable with real data.');
        const mockInputData = buildMockTimetableInput();
        try {
          generatedData = await callGenerateApi(mockInputData, 'mock');
          usedMockData = true;
          inputData = mockInputData;
          console.warn('⚠️ Timetable generated using mock dataset. Please review real data completeness.');
        } catch (mockError) {
          console.error('❌ Mock data generation failed:', {
            message: mockError.message,
            status: mockError.response?.status,
            data: mockError.response?.data
          });
          return res.status(apiError.response?.status || 500).json({
            success: false,
            message: 'Unable to generate timetable from real data, and mock fallback also failed.',
            error: mockError.message,
            details: {
              primaryError: errorDetails || errorMessage,
              mockError: mockError.response?.data || mockError.message
            },
            status: mockError.response?.status || apiError.response?.status || null,
            code: mockError.code || apiError.code || null
          });
        }
      } else {
        return res.status(apiError.response?.status || 500).json({
          success: false,
          message: errorMessage,
          error: apiError.message,
          details: errorDetails,
          status: apiError.response?.status || null,
          code: apiError.code || null
        });
      }
    }

    // Save timetable to database
    const timetable = new Timetable({
      name: name || `Auto-Generated Timetable ${new Date().toISOString()}`,
      semester,
      academicYear,
      inputData,
      generatedData,
      assignments: generatedData.assignments || {},
      facultyTimetables: generatedData.faculty_timetables || {},
      studentTimetables: generatedData.student_timetables || {},
      violations: generatedData.violations || [],
      metadata: {
        ...(generatedData.metadata || {}),
        fallbackUsed: usedMockData,
        fallbackReason: fallbackReason || null
      },
      createdBy: adminId,
      isActive: true // Auto-activate
    });

    // Deactivate other timetables
    await Timetable.updateMany(
      { _id: { $ne: timetable._id } },
      { $set: { isActive: false } }
    );

    await timetable.save();

    res.json({
      success: true,
      message: usedMockData
        ? 'Timetable generated using fallback sample data because real data was insufficient for a feasible schedule.'
        : 'Timetable auto-generated successfully from user data',
      data: { 
        timetable,
        summary: {
          students: students.length,
          teachers: teachers.length,
          courses: courses.length,
          timeSlots: inputData.time_slots.length,
          collegeUniqueId: collegeUniqueId,
          fallbackUsed: usedMockData,
          fallbackReason,
          dataset: usedMockData ? 'mock' : 'real'
        }
      }
    });
  } catch (error) {
    console.error('Auto-generate timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-generate timetable',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Generate timetable using external API
export const generateTimetable = async (req, res) => {
  try {
    const { inputData, name, semester, academicYear } = req.body;
    const adminId = req.user._id;

    // Validate input
    if (!inputData) {
      return res.status(400).json({
        success: false,
        message: 'Input data is required'
      });
    }

    // Call external timetable generator API
    let generatedData;
    try {
      const response = await axios.post(`${TIMETABLE_API_URL}/api/generate`, inputData, {
        timeout: 120000 // 120 seconds timeout for large timetables
      });
      generatedData = response.data;
    } catch (apiError) {
      console.error('External API error:', apiError);
      return res.status(500).json({
        success: false,
        message: apiError.response?.data?.message || 'Failed to generate timetable from external API',
        error: apiError.message
      });
    }

    // Save timetable to database
    const timetable = new Timetable({
      name: name || `Timetable ${new Date().toISOString()}`,
      semester,
      academicYear,
      inputData,
      generatedData,
      assignments: generatedData.assignments || {},
      facultyTimetables: generatedData.faculty_timetables || {},
      studentTimetables: generatedData.student_timetables || {},
      violations: generatedData.violations || [],
      metadata: generatedData.metadata || {},
      createdBy: adminId
    });

    await timetable.save();

    res.json({
      success: true,
      message: 'Timetable generated successfully',
      data: { timetable }
    });
  } catch (error) {
    console.error('Generate timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to generate timetable',
      error: error.message
    });
  }
};

// Validate timetable input
export const validateTimetableInput = async (req, res) => {
  try {
    const { inputData } = req.body;

    if (!inputData) {
      return res.status(400).json({
        success: false,
        message: 'Input data is required'
      });
    }

    const response = await axios.post(`${TIMETABLE_API_URL}/api/validate`, inputData);

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Validate timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Validation failed',
      error: error.message
    });
  }
};

// Get all timetables
export const getTimetables = async (req, res) => {
  try {
    const { isActive } = req.query;
    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const timetables = await Timetable.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      data: { timetables }
    });
  } catch (error) {
    console.error('Get timetables error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetables',
      error: error.message
    });
  }
};

// Get active timetable
export const getActiveTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ isActive: true })
      .populate('createdBy', 'name email');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'No active timetable found'
      });
    }

    res.json({
      success: true,
      data: { timetable }
    });
  } catch (error) {
    console.error('Get active timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active timetable',
      error: error.message
    });
  }
};

// Get timetable by ID
export const getTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findById(id)
      .populate('createdBy', 'name email');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    res.json({
      success: true,
      data: { timetable }
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetable',
      error: error.message
    });
  }
};

// Get timetable for user (student or teacher)
export const getUserTimetable = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;

    // Verify user can access this timetable
    // Allow access if userId matches user's ID or user is admin
    const userIdStr = userId.toString();
    const userIdStr2 = user._id?.toString() || user.id?.toString();
    
    if (userIdStr !== userIdStr2 && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get active timetable (or most recent if none is active)
    let timetable = await Timetable.findOne({ isActive: true });
    
    // If no active timetable, get the most recent one
    if (!timetable) {
      timetable = await Timetable.findOne().sort({ createdAt: -1 });
    }

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'No timetable found. Please contact your administrator to generate a timetable.'
      });
    }

    // Get user-specific timetable
    let userTimetable = null;
    
    if (targetUser.role === 'student') {
      // Find student in student_timetables (check multiple formats)
      const studentId = targetUser._id.toString();
      const studentEmail = targetUser.email;
      const studentName = targetUser.name;
      
      // Try multiple lookup strategies
      userTimetable = timetable.studentTimetables?.[studentId] 
        || timetable.generatedData?.student_timetables?.[studentId]
        || timetable.generatedData?.student_timetables?.[studentEmail]
        || timetable.generatedData?.student_timetables?.[studentName]
        || Object.entries(timetable.generatedData?.student_timetables || {}).find(
            ([key, value]) => value?.student_id === studentId || 
                             value?.student_id === studentEmail ||
                             value?.student_id === studentName
          )?.[1]
        || null;
    } else if (targetUser.role === 'teacher') {
      // Find teacher in faculty_timetables (check multiple formats)
      const facultyId = targetUser._id.toString();
      const facultyEmail = targetUser.email;
      const facultyName = targetUser.name;
      
      // Try multiple lookup strategies
      userTimetable = timetable.facultyTimetables?.[facultyId]
        || timetable.generatedData?.faculty_timetables?.[facultyId]
        || timetable.generatedData?.faculty_timetables?.[facultyEmail]
        || timetable.generatedData?.faculty_timetables?.[facultyName]
        || Object.values(timetable.generatedData?.faculty_timetables || {}).find(
            (faculty) => faculty?.faculty_id === facultyId ||
                        faculty?.faculty_id === facultyEmail ||
                        faculty?.faculty_id === facultyName ||
                        faculty?.faculty_id === targetUser.email ||
                        faculty?.faculty_id === targetUser.name
          )
        || null;
    }

    res.json({
      success: true,
      data: {
        timetable: {
          ...timetable.toObject(),
          userTimetable
        }
      }
    });
  } catch (error) {
    console.error('Get user timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user timetable',
      error: error.message
    });
  }
};

// Update timetable
export const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, semester, academicYear } = req.body;

    const timetable = await Timetable.findById(id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // If setting this timetable as active, deactivate others
    if (isActive === true) {
      await Timetable.updateMany(
        { _id: { $ne: id } },
        { $set: { isActive: false } }
      );
    }

    if (name) timetable.name = name;
    if (isActive !== undefined) timetable.isActive = isActive;
    if (semester) timetable.semester = semester;
    if (academicYear) timetable.academicYear = academicYear;

    await timetable.save();

    res.json({
      success: true,
      message: 'Timetable updated successfully',
      data: { timetable }
    });
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating timetable',
      error: error.message
    });
  }
};

// Delete timetable
export const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findById(id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    await timetable.deleteOne();

    res.json({
      success: true,
      message: 'Timetable deleted successfully'
    });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting timetable',
      error: error.message
    });
  }
};
