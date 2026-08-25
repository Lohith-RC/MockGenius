import React, { useState, useEffect } from 'react';
import {
  Video,
  Award,
  ChevronRight,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Mic,
  MicOff,
  CornerDownLeft,
  ArrowLeft,
  BookOpen,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { MockInterview as InterviewType, AnswerEvaluation } from '../types.js';

interface MockInterviewProps {
  interviewId: string;
  onNavigate: (view: string) => void;
}

export default function MockInterview({ interviewId, onNavigate }: MockInterviewProps) {
  const [interview, setInterview] = useState<InterviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  useEffect(() => {
    // Load active interview
    fetch(`/api/interview/${interviewId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.interview) {
          setInterview(data.interview);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [interviewId]);

  // Handle Recording Timer simulation
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      // Populate with realistic transcript speech simulation based on active question
      const currentQ = interview ? interview.questions[interview.currentQuestionIndex] : '';
      let simulatedSpeech = '';

      if (currentQ.toLowerCase().includes('scaling')) {
        simulatedSpeech = "To scale database queries, we generally distinguish between vertical scaling, which is upgrading resources on a single node, and horizontal scaling, which involves adding shards or replicas. PostgreSQL can be vertically scaled easily, but horizontal scaling typically requires tools like PgBouncer or Citus extension for distributing tables across nodes.";
      } else if (currentQ.toLowerCase().includes('project')) {
        simulatedSpeech = "In my web portfolio project, I designed a multi-view schema using React. To optimize data flow and minimize deep prop drilling, I established a global context state that handles auth details and logs user preferences cleanly. I also built Express routes acting as an API layer to safely proxy key database transactions.";
      } else if (currentQ.toLowerCase().includes('conflict')) {
        simulatedSpeech = "If a peer disagrees with my architectural decisions, I prioritize active listening and objectivity. I would set up a short collaborative review, compare trade-offs, evaluate metrics, and seek a consensus. If needed, we can test both prototypes in sandboxes or consult senior engineers for direction.";
      } else {
        simulatedSpeech = "In my engineering curriculum, I focus deeply on scalability and modular design. When building applications, I make sure code segments have high cohesion and low coupling, ensuring APIs return highly parseable JSON objects and security filters block unauthorized requests securely.";
      }

      setCurrentAnswer((prev) => (prev ? prev + ' ' + simulatedSpeech : simulatedSpeech));
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/interview/${interviewId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: currentAnswer })
      });

      if (!response.ok) {
        throw new Error('Failed to post answer evaluation.');
      }

      const data = await response.json();
      if (data.success && data.interview) {
        setInterview(data.interview);
        setLastEvaluation(data.currentEvaluation || null);
        setCurrentAnswer('');
      }
    } catch (err) {
      console.error(err);
      alert('Error evaluating answer, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#020617]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Generating placement prompt sequences...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 bg-[#020617] text-slate-100">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h4 className="font-bold text-white font-display">Interview Session Not Found</h4>
        <button
          onClick={() => onNavigate('interview-prep')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
        >
          Return to Preparation Home
        </button>
      </div>
    );
  }

  const isCompleted = interview.status === 'completed';
  const qCount = interview.questions.length;
  const currentIdx = interview.currentQuestionIndex;
  const activeQuestion = interview.questions[currentIdx];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100">
      {/* Back button */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <button
          onClick={() => onNavigate('interview-prep')}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Interview Session</span>
        </button>
        <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">
          Session ID: {interviewId.toUpperCase()}
        </span>
      </div>

      {!isCompleted ? (
        /* ACTIVE INTERVIEW LAYOUT */
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Active Question Panel */}
          <div className="lg:col-span-8 space-y-6">
            {/* Progress indicator */}
            <div className="glass-card rounded-2xl p-6 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span>QUESTION PROGRESS</span>
                <span>{currentIdx + 1} of {qCount}</span>
              </div>
              <div className="w-full bg-slate-950/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / qCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Screen */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="inline-flex items-center space-x-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">
                Active Placement Question
              </div>

              <h4 className="text-lg sm:text-xl font-bold text-white leading-snug font-display">
                "{activeQuestion}"
              </h4>

              {/* Text Input Block */}
              <div className="space-y-3 pt-4">
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                  <span>YOUR EXPLAINED ANSWER</span>
                  {isRecording && (
                    <span className="text-red-400 flex items-center space-x-1 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Recording: {recordingSeconds}s</span>
                    </span>
                  )}
                </div>

                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Provide your structured, detailed engineering answer here. Be precise and state technologies where possible..."
                  className="w-full h-44 p-4 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 leading-relaxed bg-slate-950/60 text-slate-100 resize-none font-sans"
                />

                {/* Simulated Speech helper */}
                <div className="flex justify-between items-center pt-1.5">
                  <button
                    onClick={handleToggleRecording}
                    className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition ${
                      isRecording
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                        : 'bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4 text-red-400" />
                        <span>Stop Voice Dictation</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-slate-400" />
                        <span>Simulate Voice Dictation</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={submitting || !currentAnswer.trim()}
                    className="inline-flex items-center space-x-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-violet-600/20"
                  >
                    <span>Submit & Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Question Feedback sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel text-slate-300 rounded-2xl p-6 space-y-4">
              <h5 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider font-mono">Last Question evaluation</h5>
              {lastEvaluation ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <span className="text-slate-400">Score Earned:</span>
                    <span className="font-mono font-bold text-indigo-400 text-sm">
                      {lastEvaluation.score} / 10
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block">Assessor Review:</span>
                    <p className="text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800/60">
                      {lastEvaluation.feedback}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/60 text-center">
                      <span className="block text-[10px] text-slate-500">Tech Score</span>
                      <span className="font-bold font-mono text-white text-xs">{lastEvaluation.technicalScore}/10</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/60 text-center">
                      <span className="block text-[10px] text-slate-500">Comm Score</span>
                      <span className="font-bold font-mono text-white text-xs">{lastEvaluation.communicationScore}/10</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 space-y-2">
                  <Video className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-[10px]">Submit your first answer to unlock immediate AI scoring breakdowns.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* COMPLETED PLACEMENT READINESS REPORT CARD */
        <div className="space-y-8">
          {/* Header overall congratulations card */}
          <div className="bg-gradient-to-br from-violet-950/20 via-indigo-950/10 to-slate-950 border border-slate-800/60 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-transparent rounded-full blur-3xl -mr-24 -mt-24" />
            
            <div className="relative max-w-3xl space-y-4">
              <div className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Placement Readiness Assessment Compiled</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
                AI Placement Evaluation Report
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {interview.feedbackText}
              </p>
            </div>
          </div>

          {/* 4 Score dials row */}
          <div className="grid sm:grid-cols-4 gap-6">
            {/* Overall Percentage */}
            <div className="glass-card p-6 rounded-2xl text-center space-y-3">
              <span className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Overall Placement Ready</span>
              <span className="text-4xl font-extrabold text-indigo-400 font-mono block">{interview.overallScore}%</span>
              <span className="block text-[9px] text-slate-400">Combined percentile metric</span>
            </div>

            {/* Technical Accuracy */}
            <div className="glass-card p-6 rounded-2xl text-center space-y-3">
              <span className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Technical Accuracy</span>
              <span className="text-4xl font-extrabold text-indigo-300 font-mono block">{interview.technicalScore}%</span>
              <span className="block text-[9px] text-slate-400">Core software theory matches</span>
            </div>

            {/* Communication accuracy */}
            <div className="glass-card p-6 rounded-2xl text-center space-y-3">
              <span className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Communication Structure</span>
              <span className="text-4xl font-extrabold text-emerald-400 font-mono block">{interview.communicationScore}%</span>
              <span className="block text-[9px] text-slate-400">Wording and articulation index</span>
            </div>

            {/* Confidence metric */}
            <div className="glass-card p-6 rounded-2xl text-center space-y-3">
              <span className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Confidence & Clarity</span>
              <span className="text-4xl font-extrabold text-indigo-400 font-mono block">{interview.confidenceScore}%</span>
              <span className="block text-[9px] text-slate-400">Composure and delivery metrics</span>
            </div>
          </div>

          {/* Suggestions and Full Q&A details */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Concrete suggestions checklist */}
            <div className="lg:col-span-5 glass-card rounded-2xl p-6 space-y-6 h-fit">
              <div className="border-b border-slate-800/40 pb-3">
                <h4 className="font-bold text-white text-sm font-display">Critical Placement Improvements</h4>
              </div>
              <div className="space-y-3">
                {interview.suggestions && interview.suggestions.map((item, i) => (
                  <div key={i} className="flex items-start space-x-2.5 text-xs text-slate-300 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Full logs with evaluations */}
            <div className="lg:col-span-7 glass-card rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800/40 pb-3 flex justify-between items-center">
                <h4 className="font-bold text-white text-sm font-display">Individual Assessment Logs</h4>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Question Breakdown</span>
              </div>

              <div className="space-y-6">
                {interview.answers.map((item, idx) => (
                  <div key={idx} className="space-y-3 bg-slate-900/40 p-4 border border-slate-800/60 rounded-xl">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-white leading-tight max-w-[80%] font-display">
                        Q{idx + 1}: "{item.question}"
                      </span>
                      {item.evaluation && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-md">
                          {item.evaluation.score}/10
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Your Answer:</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans italic bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                        "{item.answer}"
                      </p>
                    </div>

                    {item.evaluation && (
                      <div className="space-y-2 pt-1 border-t border-slate-800/40 text-[11px] text-slate-400">
                        <span className="font-bold text-slate-300 block">Assessor Review:</span>
                        <p className="leading-relaxed">{item.evaluation.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
