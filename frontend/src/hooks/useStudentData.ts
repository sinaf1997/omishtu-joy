import { useState, useEffect, useCallback } from 'react';
import {
  StudentDashboardData,
  StudentMembershipData,
  TrainerData,
  MessageConversation,
  AttendanceConsistencyData,
  ClassPlanData,
  StudentCourse,
  CourseProgressDetail,
  MOCK_STUDENT_DASHBOARD,
  MOCK_STUDENT_MEMBERSHIP,
  MOCK_TRAINERS,
  MOCK_MESSAGES_DATA,
  MOCK_CONSISTENCY_DATA,
  MOCK_CLASS_PLAN,
  MOCK_STUDENT_COURSES,
  MOCK_STUDENT_PROGRESS,
} from '../data/mock/student.js';

/**
 * Hook for Student Dashboard data
 */
export function useStudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setData(MOCK_STUDENT_DASHBOARD);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

/**
 * Hook for Student Membership & ID Card data
 */
export function useStudentMembership() {
  const [data, setData] = useState<StudentMembershipData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setData(MOCK_STUDENT_MEMBERSHIP);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

/**
 * Hook for Browsing Trainers
 */
export function useTrainers() {
  const [data, setData] = useState<TrainerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setData(MOCK_TRAINERS);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

/**
 * Hook for Student Messages (Inbox & local thread state)
 */
export function useStudentMessages() {
  const [conversations, setConversations] = useState<MessageConversation[]>(MOCK_MESSAGES_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConversations(MOCK_MESSAGES_DATA);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (!content.trim()) return;

    const newMsg = {
      id: `msg-local-${Date.now()}`,
      sender: 'student' as const,
      senderName: 'You',
      content: content.trim(),
      timestamp: 'Just now',
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId || c.trainerId === conversationId) {
          return {
            ...c,
            lastMessage: content.trim(),
            lastMessageTime: 'Just now',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );
  }, []);

  return { conversations, loading, error, sendMessage };
}

/**
 * Hook for Attendance Consistency & Streak data
 */
export function useStudentConsistency() {
  const [data, setData] = useState<AttendanceConsistencyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setData(MOCK_CONSISTENCY_DATA);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

/**
 * Hook for Class Plan Timetable
 */
export function useClassPlan() {
  const [data, setData] = useState<ClassPlanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setData(MOCK_CLASS_PLAN);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

/**
 * Hook for Student Enrolled Courses (Active, Completed, Waitlisted)
 */
export function useStudentClasses() {
  const [data, setData] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setData(MOCK_STUDENT_COURSES);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

/**
 * Hook for Student Progress, Grades & Assessment Scores
 */
export function useStudentProgress() {
  const [data, setData] = useState<CourseProgressDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setData(MOCK_STUDENT_PROGRESS);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}
