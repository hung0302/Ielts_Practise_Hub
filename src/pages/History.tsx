import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Clock, CheckCircle, Clock3 } from 'lucide-react';

interface TestSession {
  id: string;
  skill_type: string;
  test_type: string;
  status: string;
  total_score: number | null;
  duration_seconds: number | null;
  submitted_at: string;
  listening_submissions?: any;
  reading_submissions?: any;
  writing_submissions?: any;
}

export default function History() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('test_sessions')
      .select(`
        *,
        listening_submissions (
          score,
          time_taken,
          listening_questions ( title )
        ),
        reading_submissions (
          score,
          feedback,
          reading_questions ( title )
        ),
        writing_submissions (
          essay_text,
          task_response_score,
          coherence_score,
          lexical_resource_score,
          grammar_score,
          total_score,
          feedback,
          status,
          writing_questions ( title, task_type )
        )
      `)
      .eq('user_id', session.user.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
    } else if (data) {
      setSessions(data);
    }
    setLoading(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getTitle = (session: TestSession) => {
    if (session.skill_type === 'listening') {
      const sub = Array.isArray(session.listening_submissions) 
        ? session.listening_submissions[0] 
        : session.listening_submissions;
      if (sub?.listening_questions) return sub.listening_questions.title;
    }
    if (session.skill_type === 'reading') {
      const sub = Array.isArray(session.reading_submissions) 
        ? session.reading_submissions[0] 
        : session.reading_submissions;
      if (sub?.reading_questions) return sub.reading_questions.title;
    }
    if (session.skill_type === 'writing') {
      const sub = Array.isArray(session.writing_submissions) 
        ? session.writing_submissions[0] 
        : session.writing_submissions;
      if (sub?.writing_questions) return sub.writing_questions.title;
    }
    return 'Unknown Test';
  };

  const filteredSessions = activeFilter === 'all' 
    ? sessions 
    : sessions.filter(s => s.skill_type === activeFilter);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Lịch sử làm bài</h1>
          
          <div className="flex flex-wrap gap-2">
            {['all', 'listening', 'reading', 'writing', 'speaking'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {filter === 'all' ? 'Tất cả' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">
              {activeFilter === 'all' 
                ? 'Bạn chưa có bài làm nào.' 
                : `Bạn chưa có bài làm nào cho kỹ năng ${activeFilter}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div 
                  className="p-4 sm:p-6 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider
                        ${session.skill_type === 'listening' ? 'bg-blue-100 text-blue-700' :
                          session.skill_type === 'reading' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'}`}
                      >
                        {session.skill_type}
                      </span>
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {session.test_type === 'test' ? 'Test' : 'Practice'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{getTitle(session)}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDate(session.submitted_at)}</span>
                      <span className="flex items-center gap-1"><Clock3 className="w-4 h-4" /> {formatDuration(session.duration_seconds)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-48">
                    <div className="text-right">
                      {session.skill_type === 'writing' ? (
                        session.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded-full text-sm">
                            <Clock3 className="w-4 h-4" /> Đang chờ chấm
                          </span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-sm text-slate-500">Band Score</span>
                            <span className="text-2xl font-bold text-indigo-600">{session.total_score || 'N/A'}</span>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-slate-500">Score</span>
                          <span className="text-2xl font-bold text-indigo-600">{session.total_score || 0}</span>
                        </div>
                      )}
                    </div>
                    {expandedId === session.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === session.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50">
                        {session.skill_type === 'writing' && session.writing_submissions && (
                          <div className="space-y-6">
                            {(Array.isArray(session.writing_submissions) ? session.writing_submissions : [session.writing_submissions]).map((sub, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200">
                                <h4 className="font-bold text-slate-900 mb-2">
                                  {sub.writing_questions?.task_type?.replace('_', ' ').toUpperCase()}
                                </h4>
                                <div className="mb-4">
                                  <h5 className="text-sm font-medium text-slate-500 mb-1">Your Essay:</h5>
                                  <div className="p-3 bg-slate-50 rounded text-sm text-slate-700 whitespace-pre-wrap font-serif">
                                    {sub.essay_text || 'No content'}
                                  </div>
                                </div>
                                
                                {sub.status === 'graded' && (
                                  <div className="mt-4 pt-4 border-t border-slate-100">
                                    <h5 className="text-sm font-bold text-slate-900 mb-3">AI Feedback</h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                      <div className="bg-indigo-50 p-2 rounded text-center">
                                        <div className="text-xs text-indigo-600 font-medium">Task Response</div>
                                        <div className="text-lg font-bold text-indigo-900">{sub.task_response_score}</div>
                                      </div>
                                      <div className="bg-indigo-50 p-2 rounded text-center">
                                        <div className="text-xs text-indigo-600 font-medium">Coherence</div>
                                        <div className="text-lg font-bold text-indigo-900">{sub.coherence_score}</div>
                                      </div>
                                      <div className="bg-indigo-50 p-2 rounded text-center">
                                        <div className="text-xs text-indigo-600 font-medium">Lexical</div>
                                        <div className="text-lg font-bold text-indigo-900">{sub.lexical_resource_score}</div>
                                      </div>
                                      <div className="bg-indigo-50 p-2 rounded text-center">
                                        <div className="text-xs text-indigo-600 font-medium">Grammar</div>
                                        <div className="text-lg font-bold text-indigo-900">{sub.grammar_score}</div>
                                      </div>
                                    </div>
                                    <div className="text-sm text-slate-700 whitespace-pre-wrap bg-indigo-50/50 p-4 rounded-lg">
                                      {sub.feedback}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {(session.skill_type === 'listening' || session.skill_type === 'reading') && (
                          <div className="text-center py-4 text-slate-500">
                            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                            <p>Đã hoàn thành với {session.total_score} câu đúng.</p>
                            <p className="text-sm mt-1">Thời gian làm bài: {formatDuration(session.duration_seconds)}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
