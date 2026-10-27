import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainers } from '../../hooks/useStudentData.js';
import { TrainerData } from '../../data/mock/student.js';
import { Card, CardContent, CardFooter } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { SampleDataBadge } from '../../components/student/SampleDataBadge.js';
import { CardSkeleton } from '../../components/student/SkeletonLoader.js';
import { EmptyState } from '../../components/student/EmptyState.js';
import {
  Users,
  Search,
  Star,
  MessageSquare,
  Eye,
  Calendar,
  Clock,
  MapPin,
  X,
  Mail,
  GraduationCap,
} from 'lucide-react';

export const BrowseTrainersPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: trainers, loading, error, reload } = useTrainers();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerData | null>(null);

  // Extract distinct specialties for the filter buttons
  const specialties = useMemo(() => {
    const set = new Set<string>();
    trainers.forEach((t) => {
      set.add(t.specialty.split('&')[0].trim());
    });
    return ['All', ...Array.from(set)];
  }, [trainers]);

  // Filter trainers based on search query and specialty
  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.coursesTaught.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSpecialty =
        selectedSpecialty === 'All' || t.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());

      return matchesSearch && matchesSpecialty;
    });
  }, [trainers, searchQuery, selectedSpecialty]);

  const handleMessageTrainer = (trainer: TrainerData) => {
    navigate(`/student/messages?trainerId=${trainer.id}`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Browse Faculty & Trainers
            </h1>
            <SampleDataBadge />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Meet your instructors, check office hours availability, and start a 1-on-1 consultation thread.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reload}>Retry</Button>
        </div>
      )}

      {/* 2. Filters & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by instructor name, subject, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 bg-card border-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground text-xs"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSpecialty === spec
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Trainers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
        </div>
      ) : filteredTrainers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No trainers found"
          description={`No instructor matching "${searchQuery || selectedSpecialty}". Try broadening your search.`}
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedSpecialty('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrainers.map((trainer) => (
            <Card
              key={trainer.id}
              className="border-border bg-card flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm"
            >
              <CardContent className="p-6 space-y-4">
                {/* Trainer Avatar & Name */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-secondary text-primary font-bold flex items-center justify-center text-sm shrink-0 border border-border shadow-inner">
                      {trainer.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground leading-tight">
                        {trainer.name}
                      </h3>
                      <p className="text-xs text-primary font-medium mt-0.5">
                        {trainer.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full text-xs font-semibold text-foreground">
                    <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                    <span>{trainer.rating}</span>
                  </div>
                </div>

                {/* Short Bio */}
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {trainer.shortBio}
                </p>

                {/* Courses Taught */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Courses Taught
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {trainer.coursesTaught.map((c, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px]">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>

              {/* Card Footer Actions: View & Message */}
              <CardFooter className="p-4 border-t border-border bg-secondary/20 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTrainer(trainer)}
                  className="flex-1 text-xs gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>View Details</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleMessageTrainer(trainer)}
                  className="flex-1 text-xs gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Message</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 4. Trainer Details Dialog */}
      {selectedTrainer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trainer-details-title"
        >
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTrainer(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-secondary text-primary font-bold flex items-center justify-center text-lg shrink-0 border border-border">
                {selectedTrainer.initials}
              </div>
              <div>
                <h3 id="trainer-details-title" className="text-xl font-bold text-foreground">
                  {selectedTrainer.name}
                </h3>
                <p className="text-xs text-primary font-medium">{selectedTrainer.specialty}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                    {selectedTrainer.rating} ({selectedTrainer.reviewsCount} reviews)
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {selectedTrainer.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Biography & Academic Background
              </h4>
              <p className="text-xs text-foreground leading-relaxed">
                {selectedTrainer.shortBio}
              </p>
            </div>

            {/* Courses */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Training Modules
              </h4>
              <div className="space-y-1.5">
                {selectedTrainer.coursesTaught.map((c, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg border border-border bg-secondary/30 text-xs font-medium text-foreground flex items-center gap-2"
                  >
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Availability / Office Hours */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Weekly Consultation & Office Hours</span>
              </h4>
              <div className="space-y-2">
                {selectedTrainer.officeHours.map((slot, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1"
                  >
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{slot.day}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{slot.hours}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {slot.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTrainer(null)}
                className="flex-1 text-xs"
              >
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const t = selectedTrainer;
                  setSelectedTrainer(null);
                  handleMessageTrainer(t);
                }}
                className="flex-1 text-xs gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Open Direct Message</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
