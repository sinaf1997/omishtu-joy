import React, { useState } from 'react';
import { dropEnrollmentApi } from '../../api/enrollments.js';
import { AlertCircle, Loader2, X } from 'lucide-react';

interface DropEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollmentId: string | null;
  studentName: string;
  courseTitle: string;
  onSuccess: () => void;
}

export const DropEnrollmentModal: React.FC<DropEnrollmentModalProps> = ({
  isOpen,
  onClose,
  enrollmentId,
  studentName,
  courseTitle,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !enrollmentId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please provide a valid drop reason (at least 3 characters).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await dropEnrollmentApi(enrollmentId, reason.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to drop student enrollment.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drop-enrollment-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl text-card-foreground">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="drop-enrollment-title" className="text-lg font-semibold mb-1 text-foreground">
          Drop Student Enrollment
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Dropping will revoke active access to this course and release capacity.
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium text-foreground">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Course:</span>
              <span className="font-medium text-foreground">{courseTitle}</span>
            </div>
          </div>

          <div>
            <label htmlFor="drop-reason" className="block text-sm font-medium mb-1.5 text-foreground">
              Reason for Dropping <span className="text-destructive">*</span>
            </label>
            <textarea
              id="drop-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule clash with personal job, medical reasons, student request..."
              required
              disabled={loading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 3}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Drop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
