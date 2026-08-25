import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ResumeAnalysis } from '../types.js';

/**
 * Extract text from a PDF file using pdf.js loaded via CDN.
 * This avoids bundling issues with pdfjs-dist worker files.
 */
async function extractPdfText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        // Dynamically load pdf.js from CDN
        const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs' as any);
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs';

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const textParts: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(' ');
          textParts.push(pageText);
        }

        const fullText = textParts.join('\n\n').trim();
        resolve(fullText || '[PDF contained no extractable text. The document may be image-based.]');
      } catch (err) {
        console.warn('PDF.js extraction failed, using fallback:', err);
        resolve(`[Could not extract text from this PDF. Please paste your resume text manually below.]`);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export default function ResumeAnalyzer() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractingPdf, setExtractingPdf] = useState(false);

  useEffect(() => {
    // Fetch active resume evaluation on load
    fetch('/api/resume/my-analysis')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.analysis) {
          setAnalysis(data.analysis);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    const fileName = selectedFile.name.toLowerCase();

    if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      // Read plain text directly
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setResumeText(text);
      };
      reader.readAsText(selectedFile);
    } else if (fileName.endsWith('.pdf')) {
      // Real PDF text extraction
      setExtractingPdf(true);
      try {
        const text = await extractPdfText(selectedFile);
        setResumeText(text);
      } catch (err) {
        console.error('PDF extraction error:', err);
        setResumeText('');
        setError('Could not extract text from PDF. Please paste your resume text manually below.');
      } finally {
        setExtractingPdf(false);
      }
    } else {
      setError('Unsupported file format. Please upload a PDF, TXT, or MD file.');
    }
  };

  const handleSubmitAnalysis = async () => {
    if (!resumeText.trim()) {
      setError('Please upload a resume file or paste your resume text to analyze.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file ? file.name : 'Pasted_Resume_Text.pdf',
          resumeText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to parse and evaluate resume.');
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error('Analysis payload error.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during resume evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResumeText('');
    setAnalysis(null);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 text-slate-100">
      {/* Introduction banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-sm font-display">ATS Optimizer & Advisor</h3>
          <p className="text-xs text-slate-400">Scan skills density, structure layouts, detect inconsistencies, and generate optimal improvements powered by Gemini AI.</p>
        </div>
        <div className="flex space-x-2">
          {analysis && (
            <button
              onClick={handleReset}
              className="text-xs border border-slate-700 hover:bg-slate-900 text-slate-300 font-semibold px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Scan New</span>
            </button>
          )}
        </div>
      </div>

      {!analysis ? (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Upload Widget */}
          <div className="lg:col-span-6 space-y-6">
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Upload Document</h4>

              {/* Drag and Drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  dragActive ? 'border-indigo-500 bg-indigo-950/40' : 'border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 bg-slate-900/60 text-slate-400 flex items-center justify-center rounded-xl border border-slate-800">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">
                      {extractingPdf ? 'Extracting PDF text...' : file ? file.name : 'Select or drag & drop resume'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Supports PDF (text extraction), TXT, or MD formats
                    </span>
                  </div>
                </div>
              </div>

              {/* Text Area for manual text pasting */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">Or Paste Resume Text</label>
                  {file && (
                    <button
                      onClick={() => { setFile(null); setResumeText(''); }}
                      className="text-[10px] text-red-400 hover:underline font-bold"
                    >
                      Clear File
                    </button>
                  )}
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste raw skills, education history, and certifications here..."
                  className="w-full h-44 p-3 border border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed bg-slate-950/60 text-slate-100"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center space-x-1.5 font-medium">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleSubmitAnalysis}
                disabled={loading || extractingPdf}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Resume Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Guidelines Right Panel */}
          <div className="lg:col-span-6 glass-card rounded-2xl p-6 space-y-6">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Resume Best Practices</h4>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white">Avoid Visual Elements</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Graphics, charts, and complex columns look aesthetic but often confuse ATS parser scrapers. Use standard single-column layouts instead.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white">Match Keywords Density</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">ATS screening engines look for explicit skills declarations. Check that technologies like SQL, TypeScript, and Docker are explicitly named.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white">Use Action Verbs</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Begin experience bullets with robust action keywords (e.g., Developed, Lead, Engineered, Optimized) rather than passive responsibility terms.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white">Quantify Achievements</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Include measurable impact metrics (e.g., "improved load time by 25%", "managed team of 4 engineers") to stand out.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ANALYSIS RESULTS RENDERING */
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Top Score Callout Left */}
          <div className="lg:col-span-4 space-y-6">
            {/* Score circle card */}
            <div className="glass-card rounded-3xl p-6 text-center space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent -z-10" />

              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Estimated Score</span>

              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="62" className="stroke-slate-900" strokeWidth="8" fill="none" />
                  <circle
                    cx="72"
                    cy="72"
                    r="62"
                    className="stroke-violet-500"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="390"
                    strokeDashoffset={390 - (390 * analysis.atsScore) / 100}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                </svg>
                <div className="text-center">
                  <span className="text-4xl font-extrabold text-white font-mono block">{analysis.atsScore}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">ATS Index</span>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-xs text-white">
                  {analysis.atsScore >= 85 ? 'Highly Optimistic Profile' : analysis.atsScore >= 70 ? 'Good – Needs Refinement' : 'Needs Optimization'}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  {analysis.atsScore >= 85
                    ? 'Your resume is well-optimized for ATS systems. Minor tweaks can push it to perfection.'
                    : 'Follow the recommendations below to improve your ATS compatibility and reach 85+ ranking thresholds.'}
                </p>
              </div>
            </div>

            {/* Missing sections */}
            {analysis.missingSections.length > 0 && (
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider font-mono">Missing Sections</h4>
                <div className="space-y-2">
                  {analysis.missingSections.map((section, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 text-xs text-slate-300">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>{section}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grammar warning */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider font-mono">Layout & Grammar Audits</h4>
              {analysis.grammarIssues.length > 0 ? (
                <div className="space-y-3">
                  {analysis.grammarIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-xs text-slate-300 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs p-3 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No grammar or style errors detected!</span>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions & Keywords Right */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                <h4 className="font-bold text-white text-sm font-display">Actionable Placement Suggestions</h4>
                <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">AI Checklist</span>
              </div>

              <div className="space-y-3">
                {analysis.suggestions.map((sug, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs text-slate-300">
                    <div className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold flex-shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="leading-relaxed">{sug}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyword screening matches */}
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="font-bold text-white text-sm font-display">Key Software Engineering Term Density</h4>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {analysis.keywords.map((kw, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <span className="text-xs font-semibold text-slate-300 font-mono">{kw.keyword}</span>
                    <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      kw.match ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                      {kw.match ? 'Detected' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add / Remove categories */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
                <h5 className="font-bold text-xs text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Recommend to Include</span>
                </h5>
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysis.improvementsToAdd.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-4">
                <h5 className="font-bold text-xs text-amber-400 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Outdated/Remove Suggestions</span>
                </h5>
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysis.improvementsToRemove.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
