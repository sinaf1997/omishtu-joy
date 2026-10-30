import React, { useState } from 'react';
import { removeWaitlistEntryApi } from '../../api/enrollments.js';
import { AlertCircle, Loader2, X } from 'lucide-react';

interface RejectWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  waitlistId: string;
  studentName: string;
  courseTitle?: string;
  onSuccess: () => void;
}

export const RejectWaitlistModal: React.FC<RejectWaitlistModalProps> = ({
  isOpen,
  onClose,
  waitlistId,
  studentName,
  courseTitle,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (cleanReason.length < 3) {
      setError('Please provide a rejection reason of at least 3 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await removeWaitlistEntryApi(waitlistId, cleanReason);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to reject waitlist request'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-waitlist-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl text-card-foreground">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="reject-waitlist-title" className="text-lg font-semibold text-foreground mb-1">
          Reject Student Request
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Reject waitlist placement for <span className="font-semibold text-foreground">{studentName}</span>
          {courseTitle ? ` in ${courseTitle}` : ''}. The student will see this reason in their portal.
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reject-reason" className="block text-xs font-medium text-foreground mb-1.5">
              Reason for Rejection <span className="text-destructive">*</span>
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Incompatible schedule slot, cohort prerequisite missing, or administrative constraint..."
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
              maxLength={255}
              required
            />
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
              <span>Must be between 3 and 255 characters.</span>
              <span>{reason.length} / 255</span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 3}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Reject Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
