import { useState, useEffect } from 'react';
import {
  Users,
  Video,
  FileText,
  BarChart3,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck,
  Star,
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { DashboardMetrics, StudentFeedback, ResumeTemplate } from '../types.js';
import { api } from '../lib/api.js';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('');
  
  // Selected detail modal/sheet state
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentInterviews, setStudentInterviews] = useState<any[]>([]);
  const [studentResume, setStudentResume] = useState<any | null>(null);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'feedbacks' | 'activity' | 'templates'>('students');

  // Template management
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<ResumeTemplate | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', fileContent: '' });

  const fetchAdminData = () => {
    setLoading(true);
    const query = new URLSearchParams({
      search,
      branch: branchFilter,
      minScore: scoreFilter
    }).toString();

    Promise.all([
      api.get('/api/admin/metrics').then((res) => res.json()),
      api.get(`/api/admin/students?${query}`).then((res) => res.json()),
      api.get('/api/admin/feedbacks').then((res) => res.json()),
      api.get('/api/resume/templates').then((res) => res.json())
    ])
      .then(([metricsData, studentsData, feedbacksData, templatesData]) => {
        if (metricsData.success && metricsData.metrics) {
          setMetrics(metricsData.metrics);
        }
        if (studentsData.success && studentsData.students) {
          setStudents(studentsData.students);
        }
        if (feedbacksData.success && feedbacksData.feedbacks) {
          setFeedbacks(feedbacksData.feedbacks);
        }
        if (templatesData.success && templatesData.templates) {
          setTemplates(templatesData.templates);
        }
      })
      .catch((err) => console.error('Failed to load admin logs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, [search, branchFilter, scoreFilter]);

  // Load student detail data when a student is selected
  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setLoadingStudentDetail(true);
    setStudentInterviews([]);
    setStudentResume(null);

    try {
      const [interviewsRes, resumeRes] = await Promise.all([
        api.get(`/api/admin/student/${student.id}/interviews`).then(r => r.json()),
        api.get(`/api/admin/student/${student.id}/resume`).then(r => r.json())
      ]);
      if (interviewsRes.success) setStudentInterviews(interviewsRes.interviews);
      if (resumeRes.success) setStudentResume(resumeRes.analysis);
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setLoadingStudentDetail(false);
    }
  };

  // Template CRUD handlers
  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.fileContent) return;
    try {
      const res = await api.post('/api/admin/templates', newTemplate);
      const data = await res.json();
      if (data.success) {
        setTemplates([...templates, data.template]);
        setShowNewTemplate(false);
        setNewTemplate({ name: '', description: '', fileContent: '' });
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    try {
      const res = await api.put(`/api/admin/templates/${editingTemplate.id}`, {
        name: editingTemplate.name,
        description: editingTemplate.description,
        fileContent: editingTemplate.fileContent
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(templates.map(t => t.id === editingTemplate.id ? data.template : t));
        setEditingTemplate(null);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await api.delete(`/api/admin/templates/${id}`);
      const data = await res.json();
      if (data.success) {
        setTemplates(templates.filter(t => t.id !== id));
      }
    } catch (err) { console.error(err); }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#020617]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Compiling coordinator parameters...</p>
        </div>
      </div>
    );
  }

  // Calculate max for chart scaling
  const maxWeeklyCount = metrics ? Math.max(...metrics.weeklyInterviews.map(w => w.count), 1) : 1;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 text-slate-100">
      {/* Metrics Row */}
      {metrics && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-2xl flex items-center justify-between bg-gradient-to-br from-slate-800/40 to-violet-900/10 border border-violet-500/10">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Total Students</span>
              <span className="block text-3xl font-extrabold text-white tracking-tight font-display">{metrics.totalStudents}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-400 flex items-center justify-center border border-violet-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-2xl flex items-center justify-between bg-gradient-to-br from-slate-800/40 to-indigo-900/10 border border-indigo-500/10">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Mocks Completed</span>
              <span className="block text-3xl font-extrabold text-white tracking-tight font-display">{metrics.totalInterviews}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Video className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-2xl flex items-center justify-between bg-gradient-to-br from-slate-800/40 to-cyan-900/10 border border-cyan-500/10">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Average ATS Score</span>
              <span className="block text-3xl font-extrabold text-white tracking-tight font-display">{metrics.avgATSScore}%</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-6 rounded-2xl flex items-center justify-between bg-gradient-to-br from-slate-800/40 to-emerald-900/10 border border-emerald-500/10">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Avg Interview Score</span>
              <span className="block text-3xl font-extrabold text-white tracking-tight font-display">{metrics.avgInterviewScore}%</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      {metrics && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Interviews Bar Chart */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Weekly Interview Activity</h4>
            <div className="flex items-end justify-between h-40 gap-2">
              {metrics.weeklyInterviews.map((day) => (
                <div key={day.name} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <span className="text-[9px] font-bold text-violet-400 font-mono">{day.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-violet-600 to-indigo-400 rounded-t-lg transition-all duration-500 min-h-[4px]"
                    style={{ height: `${Math.max((day.count / maxWeeklyCount) * 100, 4)}%` }}
                  />
                  <span className="text-[9px] text-slate-500 font-mono font-bold">{day.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Branch Distribution Pie-style chart */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Branch Distribution</h4>
            {metrics.branchDistribution.length > 0 ? (
              <div className="space-y-3">
                {metrics.branchDistribution.map((b, idx) => {
                  const totalStudents = metrics.branchDistribution.reduce((s, x) => s + x.count, 0);
                  const pct = totalStudents > 0 ? Math.round((b.count / totalStudents) * 100) : 0;
                  const colors = ['bg-violet-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                  return (
                    <div key={b.branch} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-medium">{b.branch}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{b.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors[idx % colors.length]} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-8 text-center">No branch data available yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Main Tabs Selection */}
      <div className="border-b border-slate-800/60 flex space-x-4 sm:space-x-6 text-sm font-semibold text-slate-400 overflow-x-auto">
        {(['students', 'feedbacks', 'activity', 'templates'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 transition whitespace-nowrap ${
              activeTab === tab ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent hover:text-white'
            }`}
          >
            {tab === 'students' ? `Students (${students.length})` :
             tab === 'feedbacks' ? `Reviews (${feedbacks.length})` :
             tab === 'templates' ? `Templates (${templates.length})` :
             'Activity'}
          </button>
        ))}
      </div>

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="glass-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students by name, email..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-800 rounded-xl bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="p-2 border border-slate-800 bg-slate-950/60 text-slate-100 text-xs rounded-xl focus:outline-none focus:border-indigo-500"
              >
                <option value="all" className="bg-slate-900 text-slate-100">All Branches</option>
                <option value="Computer Science" className="bg-slate-900 text-slate-100">Computer Science</option>
                <option value="Information Technology" className="bg-slate-900 text-slate-100">Information Technology</option>
                <option value="Electronics & Communication" className="bg-slate-900 text-slate-100">Electronics</option>
                <option value="Mechanical Engineering" className="bg-slate-900 text-slate-100">Mechanical</option>
              </select>

              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="p-2 border border-slate-800 bg-slate-950/60 text-slate-100 text-xs rounded-xl focus:outline-none focus:border-indigo-500"
              >
                <option value="" className="bg-slate-900 text-slate-100">All ATS Scores</option>
                <option value="85" className="bg-slate-900 text-slate-100">Excellent (85+)</option>
                <option value="75" className="bg-slate-900 text-slate-100">Good (75+)</option>
                <option value="60" className="bg-slate-900 text-slate-100">Medium (60+)</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-slate-800/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">Student Info</th>
                    <th className="p-4">Placement Focus</th>
                    <th className="p-4 text-center">ATS Score</th>
                    <th className="p-4 text-center">Mocks Taken</th>
                    <th className="p-4 text-center">Latest Performance</th>
                    <th className="p-4 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-900/20 transition">
                      <td className="p-4 pl-6">
                        <div className="flex items-center space-x-3">
                          <img
                            src={student.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-800"
                          />
                          <div>
                            <span className="block font-bold text-white">{student.name}</span>
                            <span className="block text-[10px] text-slate-500 font-medium mt-0.5">{student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="block font-semibold text-slate-300">{student.targetRole || 'Not Set'}</span>
                        <span className="block text-[10px] text-indigo-400 font-bold uppercase mt-1">
                          {student.branch || 'PROFILE INCOMPLETE'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {student.resumeScore ? (
                          <span className={`font-bold font-mono text-xs ${
                            student.resumeScore >= 80 ? 'text-emerald-400' : 'text-indigo-400'
                          }`}>
                            {student.resumeScore}%
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-semibold italic">Not Scanned</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold font-mono text-slate-300">
                        {student.interviewsCompleted}
                      </td>
                      <td className="p-4 text-center">
                        {student.latestInterviewScore ? (
                          <div>
                            <span className="block font-bold font-mono text-xs text-emerald-400">
                              {student.latestInterviewScore}%
                            </span>
                            <span className="block text-[9px] text-slate-500 truncate mt-0.5 max-w-[120px]">
                              {student.latestInterviewRole}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-semibold italic">None taken</span>
                        )}
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button
                          onClick={() => handleSelectStudent(student)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-0.5"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-12 text-slate-500 italic">
                        No students found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACKS TAB */}
      {activeTab === 'feedbacks' && (
        <div className="grid md:grid-cols-2 gap-6">
          {feedbacks.map((f) => (
            <div key={f.id} className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 font-display">
                    {f.userName[0]}
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs font-display">{f.userName}</h5>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Category: {f.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= f.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                "{f.comment}"
              </p>

              <span className="block text-[9px] text-slate-500 text-right">
                {new Date(f.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}

          {feedbacks.length === 0 && (
            <div className="md:col-span-2 text-center p-12 text-slate-500 italic">
              No feedback comments submitted yet.
            </div>
          )}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && metrics && (
        <div className="glass-card p-6 rounded-2xl space-y-6 max-w-xl mx-auto">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Activity Logs</h4>

          <div className="space-y-6">
            {metrics.recentActivity.map((act) => (
              <div key={act.id} className="flex space-x-3 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-slate-300 font-medium">
                    <strong className="text-white">{act.userName}</strong> {act.detail}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {new Date(act.timestamp).toLocaleTimeString()} • {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-white text-sm font-display">Manage Resume Templates</h4>
            <button
              onClick={() => setShowNewTemplate(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Template</span>
            </button>
          </div>

          {/* New Template Form */}
          {showNewTemplate && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-bold text-white text-xs">Create New Template</h5>
                <button onClick={() => setShowNewTemplate(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Template name..."
                className="w-full p-3 border border-slate-800 rounded-xl text-xs bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Description..."
                className="w-full p-3 border border-slate-800 rounded-xl text-xs bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                value={newTemplate.fileContent}
                onChange={(e) => setNewTemplate({ ...newTemplate, fileContent: e.target.value })}
                placeholder="Template content (markdown format)..."
                className="w-full h-40 p-3 border border-slate-800 rounded-xl text-xs font-mono bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={handleAddTemplate}
                disabled={!newTemplate.name || !newTemplate.fileContent}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Template</span>
              </button>
            </div>
          )}

          {/* Templates list */}
          <div className="grid md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="glass-card rounded-2xl p-6 space-y-4">
                {editingTemplate?.id === template.id ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="w-full p-2 border border-slate-800 rounded-lg text-xs bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={editingTemplate.description}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                      className="w-full p-2 border border-slate-800 rounded-lg text-xs bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                      value={editingTemplate.fileContent}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, fileContent: e.target.value })}
                      className="w-full h-32 p-2 border border-slate-800 rounded-lg text-xs font-mono bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <div className="flex space-x-2">
                      <button onClick={handleUpdateTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1">
                        <Save className="w-3.5 h-3.5" /><span>Save</span>
                      </button>
                      <button onClick={() => setEditingTemplate(null)} className="bg-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-white text-xs font-display">{template.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{template.description}</p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">{template.downloadCount} downloads</span>
                    </div>
                    <div className="flex space-x-2 pt-2 border-t border-slate-800/40">
                      <button
                        onClick={() => setEditingTemplate({ ...template })}
                        className="text-[10px] font-bold text-slate-300 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /><span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /><span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STUDENT DETAIL SIDE SHEET */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xl bg-[#020617]/95 border-l border-slate-800/80 h-screen shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto text-slate-100">
            <div className="space-y-6">
              {/* Sheet header */}
              <div className="flex justify-between items-start border-b border-slate-800/60 pb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedStudent.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                    alt={selectedStudent.name}
                    className="w-12 h-12 rounded-full border border-slate-800 object-cover"
                  />
                  <div>
                    <h3 className="font-extrabold text-white text-sm leading-tight font-display">{selectedStudent.name}</h3>
                    <p className="text-xs text-indigo-400 font-bold mt-1 uppercase">{selectedStudent.branch || 'Branch Profile Pending'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl transition"
                >
                  Close
                </button>
              </div>

              {/* Focus competencies */}
              <div className="space-y-4">
                <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Academic Focus</h5>
                <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Target Role:</span>
                    <span className="text-xs font-semibold text-slate-200">{selectedStudent.targetRole || 'Not Declared'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Listed Skills:</span>
                    <span className="text-xs font-semibold text-slate-200">{selectedStudent.skills?.join(', ') || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Projects list:</span>
                    <span className="text-xs font-semibold text-slate-200">{selectedStudent.projects?.join(', ') || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Resume Detail */}
              <div className="space-y-4 pt-2">
                <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Resume Analysis</h5>
                {loadingStudentDetail ? (
                  <p className="text-xs text-slate-500 italic">Loading...</p>
                ) : studentResume ? (
                  <div className="border border-slate-800/60 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <div>
                          <span className="block text-xs font-bold text-white">{studentResume.fileName}</span>
                          <span className="block text-[9px] text-slate-500 mt-0.5">
                            Scanned on {new Date(studentResume.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        {studentResume.atsScore}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">Skills Found:</span>
                      <div className="flex flex-wrap gap-1">
                        {studentResume.skills.map((s: string, i: number) => (
                          <span key={i} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">{s}</span>
                        ))}
                      </div>
                    </div>
                    {studentResume.missingSections.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-400">Missing Sections:</span>
                        <p className="text-[10px] text-slate-400">{studentResume.missingSections.join(', ')}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No resume uploaded.</p>
                )}
              </div>

              {/* Interview History Detail */}
              <div className="space-y-4 pt-2">
                <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Interview Reports ({studentInterviews.length})</h5>
                {loadingStudentDetail ? (
                  <p className="text-xs text-slate-500 italic">Loading...</p>
                ) : studentInterviews.length > 0 ? (
                  <div className="space-y-3">
                    {studentInterviews.map((interview: any) => (
                      <div key={interview.id} className="border border-slate-800/60 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">{interview.jobRole}</span>
                          {interview.overallScore && (
                            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {interview.overallScore}%
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                          <span>{interview.answers?.length || 0}/{interview.questions?.length || 0} answered</span>
                        </div>
                        {interview.status === 'completed' && interview.answers && (
                          <div className="pt-2 border-t border-slate-800/40 space-y-2">
                            {interview.answers.slice(0, 2).map((qa: any, idx: number) => (
                              <div key={idx} className="text-[10px] text-slate-400">
                                <span className="font-bold text-slate-300">Q{idx + 1}:</span> {qa.question.substring(0, 60)}...
                                {qa.evaluation && <span className="text-indigo-400 ml-1">({qa.evaluation.score}/10)</span>}
                              </div>
                            ))}
                            {interview.answers.length > 2 && (
                              <span className="text-[9px] text-slate-500 italic">+{interview.answers.length - 2} more questions</span>
                            )}
                          </div>
                        )}
                        {interview.feedbackText && (
                          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/40 leading-relaxed">
                            "{interview.feedbackText.substring(0, 120)}..."
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No interviews completed.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedStudent(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition mt-8"
            >
              Close Assessment Sheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
