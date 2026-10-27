// ============================================================================
// STUDENT PORTAL MOCK DATA
// All fake/sample data for the student portal lives in this file.
// Real values for Student Name and Student ID are provided via AuthContext.
// ============================================================================

export interface DashboardStatCard {
  title: string;
  value: string;
  subtext: string;
  trend?: string;
  iconName: 'book' | 'check' | 'award' | 'creditCard';
}

export interface TodayClassItem {
  id: string;
  courseName: string;
  courseCode: string;
  trainer: string;
  room: string;
  time: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
}

export interface UpcomingClassItem {
  id: string;
  day: string;
  date: string;
  courseName: string;
  courseCode: string;
  time: string;
  room: string;
  trainer: string;
}

export interface AttendanceStreakInfo {
  currentDays: number;
  bestDays: number;
  message: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  category: 'Grade Released' | 'Schedule Update' | 'Campus Notice';
}

export interface StudentDashboardData {
  stats: DashboardStatCard[];
  todayClasses: TodayClassItem[];
  upcomingThisWeek: UpcomingClassItem[];
  streak: AttendanceStreakInfo;
  latestNotice: AnnouncementItem;
}

export interface StudentMembershipData {
  status: 'Active' | 'Completed' | 'Waitlisted';
  programName: string;
  cohort: string;
  enrolledCourses: string[];
  startDate: string;
  endDate: string;
  validUntil: string;
  totalTrainingHours: number;
  verificationToken: string;
  tuitionStatus: 'Paid in Full' | 'Partial' | 'Pending';
  cardIssueDate: string;
}

export interface TrainerAvailabilitySlot {
  day: string;
  hours: string;
  location: string;
}

export interface TrainerData {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  coursesTaught: string[];
  rating: number;
  reviewsCount: number;
  shortBio: string;
  email: string;
  officeHours: TrainerAvailabilitySlot[];
}

export interface MessageThreadItem {
  id: string;
  sender: 'student' | 'trainer';
  senderName: string;
  content: string;
  timestamp: string;
}

export interface MessageConversation {
  id: string;
  trainerId: string;
  trainerName: string;
  trainerRole: string;
  trainerInitials: string;
  unread: boolean;
  lastMessage: string;
  lastMessageTime: string;
  messages: MessageThreadItem[];
}

export interface HeatmapDay {
  date: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  status: 'present' | 'late' | 'absent' | 'no_class';
  note?: string;
}

export interface CourseAttendanceMetric {
  courseId: string;
  courseName: string;
  rate: number;
  attendedHours: number;
  totalHours: number;
}

export interface MonthlyAttendanceBar {
  month: string;
  rate: number;
  sessions: number;
}

export interface AttendanceConsistencyData {
  currentStreak: number;
  bestStreak: number;
  attendanceRate: number;
  totalSessionsAttended: number;
  totalSessionsScheduled: number;
  weeks: HeatmapDay[][]; // 12 weeks of days
  courseBreakdown: CourseAttendanceMetric[];
  monthlyTrend: MonthlyAttendanceBar[];
}

export interface TimetableSlot {
  id: string;
  time: string;
  courseName: string;
  courseCode: string;
  trainer: string;
  room: string;
  sessionType: 'Lecture' | 'Lab Session' | 'Workshop' | 'Review';
}

export interface TimetableDay {
  day: string;
  date: string;
  isToday?: boolean;
  slots: TimetableSlot[];
}

export interface ClassPlanData {
  currentWeekLabel: string;
  weekStart: string;
  weekEnd: string;
  days: TimetableDay[];
}

export interface CourseSession {
  sessionNumber: number;
  title: string;
  date: string;
  time: string;
  room: string;
  status: 'present' | 'absent' | 'late' | 'upcoming';
}

export interface StudentCourse {
  id: string;
  name: string;
  code: string;
  trainer: string;
  trainerInitials: string;
  schedule: string;
  room: string;
  progressPercent: number;
  attendanceRate: number;
  status: 'Active' | 'Completed' | 'Waitlisted';
  nextSession: string | null;
  syllabusOverview: string;
  sessions: CourseSession[];
}

export interface AssessmentRecord {
  id: string;
  name: string;
  type: 'Quiz' | 'Lab Assignment' | 'Midterm Exam' | 'Final Project';
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'Graded' | 'Pending';
  feedback?: string;
}

export interface ScoreTrendPoint {
  assessment: string;
  score: number;
  classAverage: number;
}

export interface CourseProgressDetail {
  courseId: string;
  courseName: string;
  courseCode: string;
  status: 'Active' | 'Completed';
  currentGradeLetter: string;
  currentGradePercent: number;
  completedAssessments: number;
  totalAssessments: number;
  classRank: string;
  passingScore: number;
  certificateEligible: boolean;
  certificateId?: string;
  certificateIssuedDate?: string;
  trend: ScoreTrendPoint[];
  assessments: AssessmentRecord[];
}

// ============================================================================
// DATA COLLECTIONS
// ============================================================================

export const MOCK_STUDENT_DASHBOARD: StudentDashboardData = {
  stats: [
    {
      title: 'Active Courses',
      value: '2 Courses',
      subtext: 'Full Stack & UI Systems',
      iconName: 'book',
    },
    {
      title: 'Attendance Rate',
      value: '95.2%',
      subtext: 'Above target (85%)',
      trend: '+2.1% this month',
      iconName: 'check',
    },
    {
      title: 'Average Grade',
      value: '91.4% (A)',
      subtext: 'Top 10% of cohort',
      trend: '+3.5% vs class avg',
      iconName: 'award',
    },
    {
      title: 'Pending Balance',
      value: '$0.00',
      subtext: 'Tuition fully cleared',
      iconName: 'creditCard',
    },
  ],
  todayClasses: [
    {
      id: 'today-1',
      courseName: 'Full Stack Web Development',
      courseCode: 'CS-301',
      trainer: 'Dr. Meron Tadesse',
      room: 'Lab B-204 (Mac Station 12)',
      time: '10:00 AM - 12:30 PM',
      status: 'Upcoming',
    },
    {
      id: 'today-2',
      courseName: 'UI/UX Design Systems Workshop',
      courseCode: 'DS-202',
      trainer: 'Senait Bekele',
      room: 'Design Studio A',
      time: '02:00 PM - 04:30 PM',
      status: 'Upcoming',
    },
  ],
  upcomingThisWeek: [
    {
      id: 'up-1',
      day: 'Wednesday',
      date: 'Oct 28',
      courseName: 'Full Stack Web Development',
      courseCode: 'CS-301',
      time: '10:00 AM - 12:30 PM',
      room: 'Lab B-204',
      trainer: 'Dr. Meron Tadesse',
    },
    {
      id: 'up-2',
      day: 'Thursday',
      date: 'Oct 29',
      courseName: 'UI/UX Design Systems Workshop',
      courseCode: 'DS-202',
      time: '02:00 PM - 04:30 PM',
      room: 'Design Studio A',
      trainer: 'Senait Bekele',
    },
    {
      id: 'up-3',
      day: 'Friday',
      date: 'Oct 30',
      courseName: 'Full Stack Capstone Code Review',
      courseCode: 'CS-301',
      time: '09:30 AM - 11:30 AM',
      room: 'Main Auditorium',
      trainer: 'Dr. Meron Tadesse',
    },
  ],
  streak: {
    currentDays: 16,
    bestDays: 24,
    message: "16-day streak! You have arrived on time for every scheduled class.",
  },
  latestNotice: {
    id: 'notice-1',
    title: 'Midterm Project Review Published',
    date: 'Yesterday at 4:30 PM',
    summary:
      'Full Stack Web Development Midterm scores have been posted. Your project received 94/100 with commendation for clean modular architecture.',
    category: 'Grade Released',
  },
};

export const MOCK_STUDENT_MEMBERSHIP: StudentMembershipData = {
  status: 'Active',
  programName: 'Diploma in Full Stack Software Engineering & Modern UI',
  cohort: 'Fall Cohort 2026-A',
  enrolledCourses: [
    'Full Stack Web Development (CS-301)',
    'UI/UX Design Systems (DS-202)',
    'Database Engineering & Cloud Foundations (DB-104)',
  ],
  startDate: 'September 15, 2026',
  endDate: 'December 20, 2026',
  validUntil: 'December 31, 2026',
  totalTrainingHours: 240,
  verificationToken: 'OTC-VERIFY-9A82B3C7E1-SECURE',
  tuitionStatus: 'Paid in Full',
  cardIssueDate: 'September 15, 2026',
};

export const MOCK_TRAINERS: TrainerData[] = [
  {
    id: 'tr-1',
    name: 'Dr. Meron Tadesse',
    initials: 'MT',
    specialty: 'Full Stack Architecture & Node.js',
    coursesTaught: ['Full Stack Web Development', 'Advanced Backend APIs'],
    rating: 4.9,
    reviewsCount: 38,
    shortBio:
      'Senior software engineer and academic lead with 12+ years building distributed cloud applications and mentoring engineers.',
    email: 'meron.t@omishtu-joy.edu',
    officeHours: [
      { day: 'Mondays', hours: '01:00 PM - 03:00 PM', location: 'Faculty Office 302' },
      { day: 'Wednesdays', hours: '02:30 PM - 04:30 PM', location: 'Lab B-204' },
      { day: 'Fridays', hours: '11:30 AM - 01:00 PM', location: 'Online via Meet' },
    ],
  },
  {
    id: 'tr-2',
    name: 'Senait Bekele',
    initials: 'SB',
    specialty: 'UI/UX Design & Design Systems',
    coursesTaught: ['UI/UX Design Systems Workshop', 'Interaction Prototyping'],
    rating: 4.8,
    reviewsCount: 42,
    shortBio:
      'Product design lead with experience at premier design agencies. Specializes in accessible interface tokens and responsive ergonomics.',
    email: 'senait.b@omishtu-joy.edu',
    officeHours: [
      { day: 'Tuesdays', hours: '10:00 AM - 12:00 PM', location: 'Design Studio A' },
      { day: 'Thursdays', hours: '04:30 PM - 06:00 PM', location: 'Design Studio A' },
    ],
  },
  {
    id: 'tr-3',
    name: 'Henok Abebe',
    initials: 'HA',
    specialty: 'Database Systems & Cloud Infra',
    coursesTaught: ['Database Engineering & Cloud Foundations', 'PostgreSQL Mastery'],
    rating: 4.9,
    reviewsCount: 29,
    shortBio:
      'Database administrator and DevOps practitioner passionate about query optimization, connection pooling, and ACID guarantees.',
    email: 'henok.a@omishtu-joy.edu',
    officeHours: [
      { day: 'Mondays', hours: '03:00 PM - 05:00 PM', location: 'Server Lab 101' },
      { day: 'Wednesdays', hours: '09:00 AM - 11:00 AM', location: 'Server Lab 101' },
    ],
  },
  {
    id: 'tr-4',
    name: 'Bethlehem Alemu',
    initials: 'BA',
    specialty: 'Frontend Engineering & React',
    coursesTaught: ['Frontend Fundamentals', 'State Architecture in React'],
    rating: 4.7,
    reviewsCount: 31,
    shortBio:
      'Frontend consultant specializing in TypeScript, modern bundlers, and performant web applications with zero layout shift.',
    email: 'bethlehem.a@omishtu-joy.edu',
    officeHours: [
      { day: 'Tuesdays', hours: '02:00 PM - 04:00 PM', location: 'Lab B-102' },
      { day: 'Fridays', hours: '03:00 PM - 05:00 PM', location: 'Virtual Consultation' },
    ],
  },
];

export const MOCK_MESSAGES_DATA: MessageConversation[] = [
  {
    id: 'conv-1',
    trainerId: 'tr-1',
    trainerName: 'Dr. Meron Tadesse',
    trainerRole: 'Full Stack Web Development Lead',
    trainerInitials: 'MT',
    unread: true,
    lastMessage: 'Great job on the JWT authentication middleware! Have you pushed the test suite?',
    lastMessageTime: '10:45 AM',
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'You',
        content: 'Hi Dr. Meron, I submitted PR #14 with the refreshed token rotation logic.',
        timestamp: 'Yesterday at 3:15 PM',
      },
      {
        id: 'msg-2',
        sender: 'trainer',
        senderName: 'Dr. Meron Tadesse',
        content: 'I pulled your branch and reviewed it. The token payload structure looks very clean and secure.',
        timestamp: 'Yesterday at 5:20 PM',
      },
      {
        id: 'msg-3',
        sender: 'trainer',
        senderName: 'Dr. Meron Tadesse',
        content: 'Great job on the JWT authentication middleware! Have you pushed the test suite?',
        timestamp: 'Today at 10:45 AM',
      },
    ],
  },
  {
    id: 'conv-2',
    trainerId: 'tr-2',
    trainerName: 'Senait Bekele',
    trainerRole: 'UI/UX Lead Instructor',
    trainerInitials: 'SB',
    unread: false,
    lastMessage: 'See you in the studio on Thursday! Remember to bring your typography sheet.',
    lastMessageTime: 'Oct 26',
    messages: [
      {
        id: 'msg-4',
        sender: 'student',
        senderName: 'You',
        content: 'Hello Senait, should we focus on desktop or mobile first for the dashboard wireframes?',
        timestamp: 'Oct 25 at 11:10 AM',
      },
      {
        id: 'msg-5',
        sender: 'trainer',
        senderName: 'Senait Bekele',
        content: 'Always mobile-first! Ensure the 375px width breakpoint is flawless with no horizontal scroll.',
        timestamp: 'Oct 25 at 1:40 PM',
      },
      {
        id: 'msg-6',
        sender: 'trainer',
        senderName: 'Senait Bekele',
        content: 'See you in the studio on Thursday! Remember to bring your typography sheet.',
        timestamp: 'Oct 26 at 9:15 AM',
      },
    ],
  },
  {
    id: 'conv-3',
    trainerId: 'tr-3',
    trainerName: 'Henok Abebe',
    trainerRole: 'Database Engineering Trainer',
    trainerInitials: 'HA',
    unread: false,
    lastMessage: 'The index explain plan you sent looks optimal. Keep up the thorough analysis.',
    lastMessageTime: 'Oct 23',
    messages: [
      {
        id: 'msg-7',
        sender: 'student',
        senderName: 'You',
        content: 'Hi Henok, I added a composite B-tree index on (student_id, created_at).',
        timestamp: 'Oct 23 at 2:00 PM',
      },
      {
        id: 'msg-8',
        sender: 'trainer',
        senderName: 'Henok Abebe',
        content: 'The index explain plan you sent looks optimal. Keep up the thorough analysis.',
        timestamp: 'Oct 23 at 4:10 PM',
      },
    ],
  },
];

// Helper to generate 12 weeks of heatmap days
function generate12WeeksHeatmap(): HeatmapDay[][] {
  const weeks: HeatmapDay[][] = [];
  const statusCycle: Array<'present' | 'present' | 'present' | 'late' | 'present'> = [
    'present',
    'present',
    'present',
    'late',
    'present',
  ];

  let dayCounter = 0;
  for (let w = 0; w < 12; w++) {
    const weekDays: HeatmapDay[] = [];
    for (let d = 0; d < 7; d++) {
      const isWeekend = d === 0 || d === 6; // Sunday or Saturday
      const dateNum = (w * 7 + d) % 30 + 1;
      const monthStr = w < 4 ? 'Aug' : w < 8 ? 'Sep' : 'Oct';
      const dateStr = `${monthStr} ${dateNum}`;

      if (isWeekend) {
        weekDays.push({
          date: dateStr,
          dayOfWeek: d,
          status: 'no_class',
          note: 'No session scheduled',
        });
      } else {
        dayCounter++;
        // Create an occasional late or absent to look authentic
        let status: 'present' | 'late' | 'absent' = 'present';
        if (dayCounter === 14) status = 'absent';
        else if (dayCounter % 9 === 0) status = 'late';
        else status = statusCycle[dayCounter % statusCycle.length];

        weekDays.push({
          date: dateStr,
          dayOfWeek: d,
          status,
          note: status === 'present' ? 'On time (100%)' : status === 'late' ? 'Arrived 10m late' : 'Excused absence',
        });
      }
    }
    weeks.push(weekDays);
  }
  return weeks;
}

export const MOCK_CONSISTENCY_DATA: AttendanceConsistencyData = {
  currentStreak: 16,
  bestStreak: 24,
  attendanceRate: 95.2,
  totalSessionsAttended: 42,
  totalSessionsScheduled: 44,
  weeks: generate12WeeksHeatmap(),
  courseBreakdown: [
    {
      courseId: 'CS-301',
      courseName: 'Full Stack Web Development',
      rate: 96.0,
      attendedHours: 72,
      totalHours: 75,
    },
    {
      courseId: 'DS-202',
      courseName: 'UI/UX Design Systems Workshop',
      rate: 94.4,
      attendedHours: 42,
      totalHours: 45,
    },
    {
      courseId: 'DB-104',
      courseName: 'Database Engineering Foundations',
      rate: 95.0,
      attendedHours: 38,
      totalHours: 40,
    },
  ],
  monthlyTrend: [
    { month: 'Jul', rate: 92.5, sessions: 12 },
    { month: 'Aug', rate: 94.0, sessions: 14 },
    { month: 'Sep', rate: 96.5, sessions: 16 },
    { month: 'Oct', rate: 95.2, sessions: 14 },
  ],
};

export const MOCK_CLASS_PLAN: ClassPlanData = {
  currentWeekLabel: 'Week 7 (Fall Session 2026)',
  weekStart: 'Oct 26, 2026',
  weekEnd: 'Nov 01, 2026',
  days: [
    {
      day: 'Monday',
      date: 'Oct 26',
      slots: [
        {
          id: 'slot-mon-1',
          time: '10:00 AM - 12:30 PM',
          courseName: 'Full Stack Web Development',
          courseCode: 'CS-301',
          trainer: 'Dr. Meron Tadesse',
          room: 'Lab B-204',
          sessionType: 'Lecture',
        },
      ],
    },
    {
      day: 'Tuesday',
      date: 'Oct 27',
      isToday: true,
      slots: [
        {
          id: 'slot-tue-1',
          time: '10:00 AM - 12:30 PM',
          courseName: 'Full Stack Web Development',
          courseCode: 'CS-301',
          trainer: 'Dr. Meron Tadesse',
          room: 'Lab B-204',
          sessionType: 'Lab Session',
        },
        {
          id: 'slot-tue-2',
          time: '02:00 PM - 04:30 PM',
          courseName: 'UI/UX Design Systems Workshop',
          courseCode: 'DS-202',
          trainer: 'Senait Bekele',
          room: 'Design Studio A',
          sessionType: 'Workshop',
        },
      ],
    },
    {
      day: 'Wednesday',
      date: 'Oct 28',
      slots: [
        {
          id: 'slot-wed-1',
          time: '10:00 AM - 12:30 PM',
          courseName: 'Full Stack Web Development',
          courseCode: 'CS-301',
          trainer: 'Dr. Meron Tadesse',
          room: 'Lab B-204',
          sessionType: 'Lab Session',
        },
      ],
    },
    {
      day: 'Thursday',
      date: 'Oct 29',
      slots: [
        {
          id: 'slot-thu-1',
          time: '02:00 PM - 04:30 PM',
          courseName: 'UI/UX Design Systems Workshop',
          courseCode: 'DS-202',
          trainer: 'Senait Bekele',
          room: 'Design Studio A',
          sessionType: 'Workshop',
        },
      ],
    },
    {
      day: 'Friday',
      date: 'Oct 30',
      slots: [
        {
          id: 'slot-fri-1',
          time: '09:30 AM - 11:30 AM',
          courseName: 'Capstone Project Evaluation',
          courseCode: 'CS-301',
          trainer: 'Dr. Meron Tadesse',
          room: 'Main Auditorium',
          sessionType: 'Review',
        },
      ],
    },
    {
      day: 'Saturday',
      date: 'Oct 31',
      slots: [],
    },
    {
      day: 'Sunday',
      date: 'Nov 01',
      slots: [],
    },
  ],
};

export const MOCK_STUDENT_COURSES: StudentCourse[] = [
  {
    id: 'course-1',
    name: 'Full Stack Web Development',
    code: 'CS-301',
    trainer: 'Dr. Meron Tadesse',
    trainerInitials: 'MT',
    schedule: 'Mon, Tue, Wed • 10:00 AM - 12:30 PM',
    room: 'Lab B-204',
    progressPercent: 70,
    attendanceRate: 96.0,
    status: 'Active',
    nextSession: 'Wednesday, Oct 28 at 10:00 AM',
    syllabusOverview:
      'Comprehensive full-stack engineering covering React 19, Node.js REST and GraphQL backends, TypeScript interfaces, relational schema modeling, and production deployment.',
    sessions: [
      {
        sessionNumber: 1,
        title: 'Modern TypeScript & ES Modules in Depth',
        date: 'Oct 05, 2026',
        time: '10:00 AM',
        room: 'Lab B-204',
        status: 'present',
      },
      {
        sessionNumber: 2,
        title: 'React Architecture, State Machines & Hooks',
        date: 'Oct 07, 2026',
        time: '10:00 AM',
        room: 'Lab B-204',
        status: 'present',
      },
      {
        sessionNumber: 3,
        title: 'REST API Design, Middleware & JWT Validation',
        date: 'Oct 12, 2026',
        time: '10:00 AM',
        room: 'Lab B-204',
        status: 'late',
      },
      {
        sessionNumber: 4,
        title: 'Database Migrations & Relational Joins',
        date: 'Oct 14, 2026',
        time: '10:00 AM',
        room: 'Lab B-204',
        status: 'present',
      },
      {
        sessionNumber: 5,
        title: 'Authentication & Role-Based Access Control',
        date: 'Oct 19, 2026',
        time: '10:00 AM',
        room: 'Lab B-204',
        status: 'present',
      },
      {
        sessionNumber: 6,
        title: 'Full Stack Integration & End-to-End Testing',
        date: 'Oct 21, 2026',
        time: '10:00 AM',
        room: 'Lab B-204',
        status: 'present',
      },
      {
        sessionNumber: 7,
        title: 'Performance Profiling & Bundle Optimization',
        date: 'Oct 28, 2026',
        time: '10:00 AM',
        room: 'Lab B-204',
        status: 'upcoming',
      },
    ],
  },
  {
    id: 'course-2',
    name: 'UI/UX Design Systems Workshop',
    code: 'DS-202',
    trainer: 'Senait Bekele',
    trainerInitials: 'SB',
    schedule: 'Tue, Thu • 02:00 PM - 04:30 PM',
    room: 'Design Studio A',
    progressPercent: 55,
    attendanceRate: 94.4,
    status: 'Active',
    nextSession: 'Thursday, Oct 29 at 02:00 PM',
    syllabusOverview:
      'Design tokens, Figma components, accessible WCAG contrast standards, dark theme design, and building resilient design system libraries.',
    sessions: [
      {
        sessionNumber: 1,
        title: 'Design Tokens & Semantic Variables',
        date: 'Oct 06, 2026',
        time: '02:00 PM',
        room: 'Studio A',
        status: 'present',
      },
      {
        sessionNumber: 2,
        title: 'Figma Auto-Layout & Component Variants',
        date: 'Oct 08, 2026',
        time: '02:00 PM',
        room: 'Studio A',
        status: 'present',
      },
      {
        sessionNumber: 3,
        title: 'Accessibility & WCAG AA Contrast Testing',
        date: 'Oct 13, 2026',
        time: '02:00 PM',
        room: 'Studio A',
        status: 'present',
      },
      {
        sessionNumber: 4,
        title: 'Interactive Prototyping & Motion Timing',
        date: 'Oct 20, 2026',
        time: '02:00 PM',
        room: 'Studio A',
        status: 'present',
      },
      {
        sessionNumber: 5,
        title: 'Dark Theme Color Engineering',
        date: 'Oct 29, 2026',
        time: '02:00 PM',
        room: 'Studio A',
        status: 'upcoming',
      },
    ],
  },
  {
    id: 'course-3',
    name: 'Foundations of Computer Science & Web Tech',
    code: 'CS-101',
    trainer: 'Henok Abebe',
    trainerInitials: 'HA',
    schedule: 'Completed Summer 2026',
    room: 'Main Lecture Hall 1',
    progressPercent: 100,
    attendanceRate: 98.0,
    status: 'Completed',
    nextSession: null,
    syllabusOverview:
      'Foundational algorithms, computational thinking, HTTP protocol, DOM structure, semantic HTML5, and responsive CSS grids.',
    sessions: [
      {
        sessionNumber: 1,
        title: 'Computing Fundamentals & Binary Systems',
        date: 'Jul 04, 2026',
        time: '09:00 AM',
        room: 'Hall 1',
        status: 'present',
      },
      {
        sessionNumber: 2,
        title: 'Semantic HTML & Web Standards',
        date: 'Jul 11, 2026',
        time: '09:00 AM',
        room: 'Hall 1',
        status: 'present',
      },
      {
        sessionNumber: 3,
        title: 'Modern CSS Flexbox & Grid Layouts',
        date: 'Jul 18, 2026',
        time: '09:00 AM',
        room: 'Hall 1',
        status: 'present',
      },
      {
        sessionNumber: 4,
        title: 'JavaScript Event Loop & DOM Manipulation',
        date: 'Jul 25, 2026',
        time: '09:00 AM',
        room: 'Hall 1',
        status: 'present',
      },
      {
        sessionNumber: 5,
        title: 'Final Capstone Project Evaluation',
        date: 'Aug 01, 2026',
        time: '09:00 AM',
        room: 'Hall 1',
        status: 'present',
      },
    ],
  },
];

export const MOCK_STUDENT_PROGRESS: CourseProgressDetail[] = [
  {
    courseId: 'CS-301',
    courseName: 'Full Stack Web Development',
    courseCode: 'CS-301',
    status: 'Active',
    currentGradeLetter: 'A',
    currentGradePercent: 92.5,
    completedAssessments: 4,
    totalAssessments: 6,
    classRank: 'Top 5% of class',
    passingScore: 70.0,
    certificateEligible: false, // Still active, certificate available upon completion
    trend: [
      { assessment: 'Quiz 1', score: 88, classAverage: 79 },
      { assessment: 'Lab 1', score: 94, classAverage: 82 },
      { assessment: 'Quiz 2', score: 91, classAverage: 80 },
      { assessment: 'Midterm', score: 97, classAverage: 84 },
    ],
    assessments: [
      {
        id: 'asm-1',
        name: 'TypeScript Interfaces & Generics Quiz',
        type: 'Quiz',
        date: 'Oct 08, 2026',
        score: 18,
        maxScore: 20,
        percentage: 90.0,
        status: 'Graded',
        feedback: 'Excellent grasp of union types and discriminated unions.',
      },
      {
        id: 'asm-2',
        name: 'Express REST Server & SQLite Database Lab',
        type: 'Lab Assignment',
        date: 'Oct 15, 2026',
        score: 47,
        maxScore: 50,
        percentage: 94.0,
        status: 'Graded',
        feedback: 'Good error middleware structure and parameter validation.',
      },
      {
        id: 'asm-3',
        name: 'Midterm Project: Secure Authentication Gateway',
        type: 'Midterm Exam',
        date: 'Oct 22, 2026',
        score: 97,
        maxScore: 100,
        percentage: 97.0,
        status: 'Graded',
        feedback: 'Outstanding submission. Token expiration and password salting implemented properly.',
      },
      {
        id: 'asm-4',
        name: 'State Management & Custom Hooks Evaluation',
        type: 'Quiz',
        date: 'Oct 25, 2026',
        score: 18,
        maxScore: 20,
        percentage: 90.0,
        status: 'Graded',
        feedback: 'Very clear separation of concerns in useAuth and useTheme.',
      },
      {
        id: 'asm-5',
        name: 'Full Stack Capstone Application',
        type: 'Final Project',
        date: 'Nov 12, 2026',
        score: 0,
        maxScore: 100,
        percentage: 0,
        status: 'Pending',
        feedback: 'Scheduled for end-of-term presentation.',
      },
    ],
  },
  {
    courseId: 'DS-202',
    courseName: 'UI/UX Design Systems Workshop',
    courseCode: 'DS-202',
    status: 'Active',
    currentGradeLetter: 'A-',
    currentGradePercent: 89.2,
    completedAssessments: 3,
    totalAssessments: 5,
    classRank: 'Top 15% of class',
    passingScore: 70.0,
    certificateEligible: false,
    trend: [
      { assessment: 'Design Audit', score: 85, classAverage: 78 },
      { assessment: 'Token Hierarchy', score: 92, classAverage: 81 },
      { assessment: 'Component Set', score: 90, classAverage: 83 },
    ],
    assessments: [
      {
        id: 'ds-asm-1',
        name: 'Design System Heuristic Evaluation',
        type: 'Quiz',
        date: 'Oct 09, 2026',
        score: 17,
        maxScore: 20,
        percentage: 85.0,
        status: 'Graded',
        feedback: 'Good observations on semantic naming patterns.',
      },
      {
        id: 'ds-asm-2',
        name: 'Color Palette & Semantic Token Architecture',
        type: 'Lab Assignment',
        date: 'Oct 16, 2026',
        score: 46,
        maxScore: 50,
        percentage: 92.0,
        status: 'Graded',
        feedback: 'Full coverage of dark theme values and accessible text contrast.',
      },
      {
        id: 'ds-asm-3',
        name: 'Accessible Interactive Component Library',
        type: 'Midterm Exam',
        date: 'Oct 23, 2026',
        score: 90,
        maxScore: 100,
        percentage: 90.0,
        status: 'Graded',
        feedback: 'Keyboard focus states and aria attributes are clean.',
      },
    ],
  },
  {
    courseId: 'CS-101',
    courseName: 'Foundations of Computer Science & Web Tech',
    courseCode: 'CS-101',
    status: 'Completed',
    currentGradeLetter: 'A+',
    currentGradePercent: 96.8,
    completedAssessments: 5,
    totalAssessments: 5,
    classRank: 'Top 2% of class',
    passingScore: 70.0,
    certificateEligible: true,
    certificateId: 'CERT-OTC-2026-CS101-0842',
    certificateIssuedDate: 'August 10, 2026',
    trend: [
      { assessment: 'HTML/CSS', score: 96, classAverage: 81 },
      { assessment: 'JS Syntax', score: 98, classAverage: 80 },
      { assessment: 'DOM Project', score: 95, classAverage: 82 },
      { assessment: 'Final Exam', score: 98, classAverage: 85 },
    ],
    assessments: [
      {
        id: 'c101-1',
        name: 'Semantic Web & Accessibility Baseline',
        type: 'Quiz',
        date: 'Jul 12, 2026',
        score: 20,
        maxScore: 20,
        percentage: 100.0,
        status: 'Graded',
        feedback: 'Perfect score on landmark elements and metadata.',
      },
      {
        id: 'c101-2',
        name: 'Responsive Flexbox Portfolio Page',
        type: 'Lab Assignment',
        date: 'Jul 19, 2026',
        score: 48,
        maxScore: 50,
        percentage: 96.0,
        status: 'Graded',
        feedback: 'Responsive breakpoint scaling looks great.',
      },
      {
        id: 'c101-3',
        name: 'Interactive DOM Task Manager',
        type: 'Midterm Exam',
        date: 'Jul 26, 2026',
        score: 95,
        maxScore: 100,
        percentage: 95.0,
        status: 'Graded',
        feedback: 'Efficient event delegation utilized.',
      },
      {
        id: 'c101-4',
        name: 'Algorithm Analysis & Complexity Quiz',
        type: 'Quiz',
        date: 'Jul 29, 2026',
        score: 19,
        maxScore: 20,
        percentage: 95.0,
        status: 'Graded',
        feedback: 'Well reasoned Big-O calculations.',
      },
      {
        id: 'c101-5',
        name: 'Final Capstone Project & Defense',
        type: 'Final Project',
        date: 'Aug 05, 2026',
        score: 98,
        maxScore: 100,
        percentage: 98.0,
        status: 'Graded',
        feedback: 'Distinction award granted. Course successfully completed.',
      },
    ],
  },
];
