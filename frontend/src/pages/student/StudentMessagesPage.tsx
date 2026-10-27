import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStudentMessages } from '../../hooks/useStudentData.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { SampleDataBadge } from '../../components/student/SampleDataBadge.js';
import { EmptyState } from '../../components/student/EmptyState.js';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Info,
} from 'lucide-react';

export const StudentMessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const trainerIdParam = searchParams.get('trainerId');

  const { conversations, sendMessage } = useStudentMessages();
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [mobileViewingThread, setMobileViewingThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize selected conversation
  useEffect(() => {
    if (conversations.length > 0) {
      if (trainerIdParam) {
        const found = conversations.find((c) => c.trainerId === trainerIdParam);
        if (found) {
          setActiveConvId(found.id);
          setMobileViewingThread(true);
          return;
        }
      }
      if (!activeConvId) {
        setActiveConvId(conversations[0].id);
      }
    }
  }, [conversations, trainerIdParam, activeConvId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConvId, mobileViewingThread]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    sendMessage(activeConvId, inputText);
    setInputText('');
  };

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    setMobileViewingThread(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Preview Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Instructor Messages
            </h1>
            <SampleDataBadge />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Direct communication with your course instructors and faculty mentors.
          </p>
        </div>
      </div>

      {/* Preview Notice Banner */}
      <div className="p-3 rounded-xl bg-accent/60 border border-border text-foreground text-xs flex items-center gap-2.5">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1">
          <strong>Messaging is a preview:</strong> Messages you send are kept in your local session state and are not persisted to a live server yet.
        </span>
      </div>

      {/* 2. Two-Pane Messaging Shell */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm flex h-[620px]">
        {/* Left Pane: Conversation List */}
        <aside
          className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col shrink-0 bg-card ${
            mobileViewingThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Inbox ({conversations.length})</span>
            </h3>
            <span className="text-[11px] text-muted-foreground font-medium">Active Fall Cohort</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'hover:bg-secondary/40 text-muted-foreground'
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-secondary text-primary font-bold flex items-center justify-center text-xs shrink-0 border border-border mt-0.5">
                    {conv.trainerInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {conv.trainerName}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {conv.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate font-medium">
                      {conv.trainerRole}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unread && (
                    <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Pane: Message Thread & Composer */}
        <main
          className={`flex-1 flex flex-col min-w-0 bg-background/50 ${
            !mobileViewingThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Thread Header */}
              <div className="h-16 px-4 sm:px-6 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileViewingThread(false)}
                    className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                    aria-label="Back to conversations list"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="h-9 w-9 rounded-full bg-secondary text-primary font-bold flex items-center justify-center text-xs shrink-0">
                    {activeConversation.trainerInitials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {activeConversation.trainerName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {activeConversation.trainerRole}
                    </p>
                  </div>
                </div>

                <Badge variant="subtle" className="text-[10px] shrink-0">
                  Online for Consultation
                </Badge>
              </div>

              {/* Messages Bubble List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {activeConversation.messages.map((msg) => {
                  const isStudent = msg.sender === 'student';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[10px] text-muted-foreground">
                        <span className="font-semibold">{msg.senderName}</span>
                        <span>&bull;</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                          isStudent
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-card border border-border text-foreground rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 border-t border-border bg-card flex items-center gap-2 shrink-0"
              >
                <Input
                  type="text"
                  placeholder={`Reply to ${activeConversation.trainerName}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 text-xs h-10 bg-background border-border"
                />
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={!inputText.trim()}
                  className="h-10 px-4 gap-1.5 rounded-lg shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <EmptyState
                icon={MessageSquare}
                title="Select a Conversation"
                description="Choose an instructor from the left pane to view consultation messages or start a new thread."
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
