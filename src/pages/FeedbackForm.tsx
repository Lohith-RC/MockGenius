import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle } from 'lucide-react';

export default function FeedbackForm() {
  const [category, setCategory] = useState<'interview' | 'resume' | 'general'>('interview');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, rating, comment })
      });

      if (response.ok) {
        setSuccess(true);
        setComment('');
        setRating(5);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-8 text-slate-100">
      {/* Intro banner */}
      <div className="glass-panel p-6 rounded-2xl space-y-1">
        <h3 className="font-bold text-white text-sm font-display">Submit Platform Feedback</h3>
        <p className="text-xs text-slate-400">Your ratings and reviews are shared directly with placement coordinators to optimize prep drives.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Feedback Details</h4>

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center space-x-1.5 font-semibold">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
            <span>Thank you! Your feedback has been received and logged.</span>
          </div>
        )}

        {/* Category Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Audit Category</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'interview', label: 'Mock Interviews' },
              { id: 'resume', label: 'Resume Scanning' },
              { id: 'general', label: 'General Quality' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id as any)}
                className={`p-3 text-xs font-semibold rounded-xl border text-center transition ${
                  category === cat.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating selection (Stars) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Rating Score</label>
          <div className="flex items-center space-x-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 w-fit">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition transform active:scale-95"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-800'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Comments & Suggestions</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked, or suggest areas where our AI models could improve evaluation granularity..."
            className="w-full h-36 p-3.5 border border-slate-800 rounded-xl text-xs bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none font-sans"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !comment.trim()}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20"
        >
          <Send className="w-4 h-4 text-white" />
          <span>{submitting ? 'Submitting...' : 'Send Review'}</span>
        </button>
      </form>
    </div>
  );
}
