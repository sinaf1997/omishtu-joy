import React from 'react';
import {
  LayoutDashboard,
  IdCard,
  User,
  Users,
  MessageSquare,
  TrendingUp,
  CalendarDays,
  Compass,
  BookOpen,
  Award,
} from 'lucide-react';

export interface StudentNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  isReal?: boolean;
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    id: 'student-dashboard',
    label: 'Dashboard',
    path: '/student/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'student-membership',
    label: 'Membership',
    path: '/student/membership',
    icon: IdCard,
  },
  {
    id: 'student-profile',
    label: 'Profile',
    path: '/student/profile',
    icon: User,
    isReal: true,
  },
  {
    id: 'student-trainers',
    label: 'Browse Trainers',
    path: '/student/trainers',
    icon: Users,
  },
  {
    id: 'student-messages',
    label: 'Messages',
    path: '/student/messages',
    icon: MessageSquare,
  },
  {
    id: 'student-consistency',
    label: 'Consistency',
    path: '/student/consistency',
    icon: TrendingUp,
  },
  {
    id: 'student-class-plan',
    label: 'Class Plan',
    path: '/student/class-plan',
    icon: CalendarDays,
    isReal: true,
  },
  {
    id: 'student-courses',
    label: 'Browse Courses',
    path: '/student/courses',
    icon: Compass,
    isReal: true,
  },
  {
    id: 'student-classes',
    label: 'Classes',
    path: '/student/classes',
    icon: BookOpen,
    isReal: true,
  },
  {
    id: 'student-progress',
    label: 'Progress & Report',
    path: '/student/progress',
    icon: Award,
  },
];
