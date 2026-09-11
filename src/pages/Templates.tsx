import { useState, useEffect } from 'react';
import { Download, Copy, Check, FileText } from 'lucide-react';
import { ResumeTemplate } from '../types.js';
import { api } from '../lib/api.js';

export default function Templates() {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);

  useEffect(() => {
    api.get('/api/resume/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.templates) {
          setTemplates(data.templates);
          setSelectedTemplate(data.templates[0] || null);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (template: ResumeTemplate) => {
    navigator.clipboard.writeText(template.fileContent);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (template: ResumeTemplate) => {
    // Increment download on server
    try {
      await api.post(`/api/resume/templates/${template.id}/download`);
      // Update local templates counter
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, downloadCount: t.downloadCount + 1 } : t))
      );

      // Trigger a raw text file download
      const element = document.createElement('a');
      const file = new Blob([template.fileContent], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${template.name.replace(/\s+/g, '_')}_Template.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#020617]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Loading ATS-vetted frameworks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100">
      {/* Intro banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-sm font-display">ATS-Optimized Templates</h3>
          <p className="text-xs text-slate-400">Industry-vetted text frameworks designed to bypass parsers and prioritize tech competencies.</p>
        </div>
        <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
          100% Parsing Guard
        </span>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Templates selector side */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Available Layouts</h4>

          <div className="space-y-4">
            {templates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`border p-5 rounded-2xl cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-white text-xs font-display">{template.name}</h5>
                      <span className="text-[9px] font-mono text-slate-500">
                        {template.downloadCount} downloads
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  <div className="flex space-x-2 mt-4 pt-3 border-t border-slate-800/40 justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(template);
                      }}
                      aria-label={`Copy ${template.name} markdown to clipboard`}
                      className="text-[10px] font-bold text-slate-300 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                    >
                      {copiedId === template.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(template);
                      }}
                      aria-label={`Download ${template.name} text file`}
                      className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Download .txt</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Preview Side */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-3">
            <h4 className="font-bold text-white text-xs flex items-center space-x-1.5 font-display">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Live Layout Preview</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-500">
              {selectedTemplate ? selectedTemplate.name : ''}
            </span>
          </div>

          {selectedTemplate ? (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 h-[450px] overflow-y-auto">
              <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedTemplate.fileContent}
              </pre>
            </div>
          ) : (
            <div className="h-[450px] flex items-center justify-center text-slate-500 text-xs">
              Select a template to view formatting details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
