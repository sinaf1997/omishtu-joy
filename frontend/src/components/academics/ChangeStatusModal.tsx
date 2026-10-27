import React, { useState } from 'react';
import { Course, CourseStatus } from '../../types/courses.js';
import { updateCourseStatusApi } from '../../api/courses.js';
import { CourseStatusBadge } from './CourseStatusBadge.js';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

interface ChangeStatusModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  draft: ['open', 'cancelled'],
  open: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Draft',
  open: 'Open for Enrollment',
  in_progress: 'In Progress (Active Classes)',
  completed: 'Completed (Archived)',
  cancelled: 'Cancelled',
};

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  course,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const allowedMoves = ALLOWED_TRANSITIONS[course.status] || [];
  const [selectedStatus, setSelectedStatus] = useState<CourseStatus | ''>(
    allowedMoves[0] || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setLoading(true);
    setError(null);

    try {
      await updateCourseStatusApi(course.id, selectedStatus);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to update course status';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Change Course Status</h3>
            <p className="text-xs text-muted-foreground">
              {course.code} &bull; {course.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm py-2 px-3 bg-muted/40 rounded-lg border border-border">
            <span className="text-muted-foreground">Current Status</span>
            <CourseStatusBadge status={course.status} />
          </div>

          {allowedMoves.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg">
              No further status transitions are available for this course.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Target Status <span className="text-destructive">*</span>
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as CourseStatus)}
                  className="w-full h-10 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {allowedMoves.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                {selectedStatus === 'open' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Opening the course allows receptionists to enroll students into this cohort.
                  </p>
                )}
                {selectedStatus === 'cancelled' && (
                  <p className="text-xs text-destructive/80 mt-1">
                    Warning: Cancelling will mark this cohort as cancelled.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-secondary/80 hover:bg-secondary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedStatus}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Transition
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
