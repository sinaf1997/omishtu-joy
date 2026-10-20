import React from 'react';
import { StaffRole } from '../types/auth.js';
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  UserCheck,
  CheckSquare,
  ClipboardCheck,
  Medal,
  CreditCard,
  Coins,
  Building2,
  BookMarked,
  Scale,
  Calculator,
  UserCog,
  Activity,
  TrendingUp,
  User,
} from 'lucide-react';

export type NavSection = 'OVERVIEW' | 'STUDENTS' | 'ACADEMICS' | 'FINANCE' | 'ADMIN' | 'ACCOUNT';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  section: NavSection;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: StaffRole[];
  sprint: number;
  isFunctional: boolean;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  // OVERVIEW
  {
    id: 'owner-dashboard',
    label: 'Dashboard',
    path: '/staff/owner',
    section: 'OVERVIEW',
    icon: LayoutDashboard,
    allowedRoles: ['owner'],
    sprint: 1,
    isFunctional: true,
  },
  {
    id: 'manager-dashboard',
    label: 'Dashboard',
    path: '/staff/manager',
    section: 'OVERVIEW',
    icon: LayoutDashboard,
    allowedRoles: ['manager'],
    sprint: 1,
    isFunctional: true,
  },
  {
    id: 'academics-dashboard',
    label: 'Dashboard',
    path: '/staff/academics',
    section: 'OVERVIEW',
    icon: LayoutDashboard,
    allowedRoles: ['academic_admin'],
    sprint: 1,
    isFunctional: true,
  },
  {
    id: 'trainer-dashboard',
    label: 'Dashboard',
    path: '/staff/trainer',
    section: 'OVERVIEW',
    icon: LayoutDashboard,
    allowedRoles: ['trainer'],
    sprint: 1,
    isFunctional: true,
  },
  {
    id: 'accountant-dashboard',
    label: 'Dashboard',
    path: '/staff/accounting',
    section: 'OVERVIEW',
    icon: LayoutDashboard,
    allowedRoles: ['accountant'],
    sprint: 1,
    isFunctional: true,
  },
  {
    id: 'reception-dashboard',
    label: 'Dashboard',
    path: '/staff/reception',
    section: 'OVERVIEW',
    icon: LayoutDashboard,
    allowedRoles: ['receptionist'],
    sprint: 1,
    isFunctional: true,
  },

  // STUDENTS
  {
    id: 'students-dir',
    label: 'Students',
    path: '/staff/students',
    section: 'STUDENTS',
    icon: Users,
    allowedRoles: ['owner', 'manager', 'receptionist', 'academic_admin'],
    sprint: 2,
    isFunctional: false,
  },
  {
    id: 'students-docs',
    label: 'Documents',
    path: '/staff/documents',
    section: 'STUDENTS',
    icon: FileText,
    allowedRoles: ['owner', 'manager', 'receptionist', 'academic_admin'],
    sprint: 2,
    isFunctional: false,
  },

  // ACADEMICS
  {
    id: 'academics-courses',
    label: 'Courses',
    path: '/staff/courses',
    section: 'ACADEMICS',
    icon: BookOpen,
    allowedRoles: ['owner', 'manager', 'academic_admin', 'trainer'],
    sprint: 3,
    isFunctional: false,
  },
  {
    id: 'academics-enrollments',
    label: 'Enrollments',
    path: '/staff/enrollments',
    section: 'ACADEMICS',
    icon: UserCheck,
    allowedRoles: ['owner', 'manager', 'academic_admin', 'receptionist'],
    sprint: 3,
    isFunctional: false,
  },
  {
    id: 'academics-attendance',
    label: 'Attendance',
    path: '/staff/attendance',
    section: 'ACADEMICS',
    icon: CheckSquare,
    allowedRoles: ['owner', 'manager', 'academic_admin', 'trainer'],
    sprint: 4,
    isFunctional: false,
  },
  {
    id: 'academics-grading',
    label: 'Grading',
    path: '/staff/grading',
    section: 'ACADEMICS',
    icon: ClipboardCheck,
    allowedRoles: ['owner', 'manager', 'academic_admin', 'trainer'],
    sprint: 4,
    isFunctional: false,
  },
  {
    id: 'academics-certificates',
    label: 'Certificates',
    path: '/staff/certificates',
    section: 'ACADEMICS',
    icon: Medal,
    allowedRoles: ['owner', 'manager', 'academic_admin'],
    sprint: 4,
    isFunctional: false,
  },

  // FINANCE
  {
    id: 'finance-fees',
    label: 'Fees & Payments',
    path: '/staff/fees',
    section: 'FINANCE',
    icon: CreditCard,
    allowedRoles: ['owner', 'manager', 'accountant', 'receptionist'],
    sprint: 5,
    isFunctional: false,
  },
  {
    id: 'finance-receivables',
    label: 'Receivables',
    path: '/staff/receivables',
    section: 'FINANCE',
    icon: Coins,
    allowedRoles: ['owner', 'manager', 'accountant'],
    sprint: 5,
    isFunctional: false,
  },
  {
    id: 'finance-payables',
    label: 'Payables & Vendors',
    path: '/staff/payables',
    section: 'FINANCE',
    icon: Building2,
    allowedRoles: ['owner', 'manager', 'accountant'],
    sprint: 6,
    isFunctional: false,
  },
  {
    id: 'finance-ledger',
    label: 'Ledger',
    path: '/staff/ledger',
    section: 'FINANCE',
    icon: BookMarked,
    allowedRoles: ['owner', 'manager', 'accountant'],
    sprint: 7,
    isFunctional: false,
  },
  {
    id: 'finance-reconciliation',
    label: 'Reconciliation',
    path: '/staff/reconciliation',
    section: 'FINANCE',
    icon: Scale,
    allowedRoles: ['owner', 'manager', 'accountant'],
    sprint: 7,
    isFunctional: false,
  },
  {
    id: 'finance-tax-budgets',
    label: 'Tax & Budgets',
    path: '/staff/tax-budgets',
    section: 'FINANCE',
    icon: Calculator,
    allowedRoles: ['owner', 'accountant'],
    sprint: 8,
    isFunctional: false,
  },

  // ADMIN
  {
    id: 'admin-users',
    label: 'Users & Roles',
    path: '/staff/owner/users',
    section: 'ADMIN',
    icon: UserCog,
    allowedRoles: ['owner'],
    sprint: 1,
    isFunctional: true,
  },
  {
    id: 'admin-audit',
    label: 'Audit Log',
    path: '/staff/audit-log',
    section: 'ADMIN',
    icon: Activity,
    allowedRoles: ['owner', 'manager'],
    sprint: 8,
    isFunctional: false,
  },
  {
    id: 'admin-analytics',
    label: 'Analytics',
    path: '/staff/analytics',
    section: 'ADMIN',
    icon: TrendingUp,
    allowedRoles: ['owner', 'manager'],
    sprint: 9,
    isFunctional: false,
  },

  // ACCOUNT
  {
    id: 'account-profile',
    label: 'My Profile',
    path: '/staff/profile',
    section: 'ACCOUNT',
    icon: User,
    allowedRoles: ['owner', 'receptionist', 'academic_admin', 'trainer', 'accountant', 'manager'],
    sprint: 1,
    isFunctional: true,
  },
];

export const NAV_SECTIONS: NavSection[] = [
  'OVERVIEW',
  'STUDENTS',
  'ACADEMICS',
  'FINANCE',
  'ADMIN',
  'ACCOUNT',
];

export function getNavItemsForRole(role: StaffRole): Record<NavSection, NavItem[]> {
  const grouped: Record<NavSection, NavItem[]> = {
    OVERVIEW: [],
    STUDENTS: [],
    ACADEMICS: [],
    FINANCE: [],
    ADMIN: [],
    ACCOUNT: [],
  };

  const allowed = NAVIGATION_ITEMS.filter((item) => item.allowedRoles.includes(role));

  for (const item of allowed) {
    grouped[item.section].push(item);
  }

  return grouped;
}
