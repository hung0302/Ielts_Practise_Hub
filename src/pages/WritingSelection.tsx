import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Edit3, PlayCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { WritingQuestion } from '../types/writing';

export default function WritingSelection() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<'practice' | 'test'>('practice');
  const [loading, setLoading] = useState(true);
  const [testGroups, setTestGroups] = useState<{ title: string; questions: WritingQuestion[] }[]>([]);

  useEffect(() => {
    const fetchTests = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('writing_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tests:', error);
      } else if (data) {
        // Group by title
        const groups: Record<string, WritingQuestion[]> = {};
        data.forEach((q: WritingQuestion) => {
          if (!groups[q.title]) {
            groups[q.title] = [];
          }
          groups[q.title].push(q);
        });

        const formattedGroups = Object.keys(groups).map(title => ({
          title,
          questions: groups[title]
        }));
        
        setTestGroups(formattedGroups);
      }
      setLoading(false);
    };

    fetchTests();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Writing Practice Library
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select a test and choose your mode. Practice mode allows you to take your time, while Test mode simulates real exam conditions.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-white p-1 rounded-lg shadow-sm ring-1 ring-slate-200 inline-flex">
            <button
              onClick={() => setSelectedMode('practice')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                selectedMode === 'practice'
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Practice Mode
            </button>
            <button
              onClick={() => setSelectedMode('test')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                selectedMode === 'test'
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Test Mode
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testGroups.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              No writing tests available yet.
            </div>
          ) : (
            testGroups.map((group, index) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                    <Edit3 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
                </div>
                <div className="text-sm text-slate-500 mb-4">
                  Includes: {group.questions.map(q => q.task_type.replace('_', ' ').toUpperCase()).join(', ')}
                </div>
                <div className="mt-auto pt-6 flex flex-col gap-2">
                  <button
                    onClick={() => navigate(`/skill/writing/${encodeURIComponent(group.title)}?mode=${selectedMode}`)}
                    className="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
                  >
                    {selectedMode === 'practice' ? (
                      <><PlayCircle className="w-4 h-4 mr-2" /> Full Practice</>
                    ) : (
                      <><Clock className="w-4 h-4 mr-2" /> Full Test (60m)</>
                    )}
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {group.questions.map(q => (
                      <button
                        key={q.id}
                        onClick={() => navigate(`/skill/writing/${encodeURIComponent(group.title)}?mode=${selectedMode}&taskId=${q.id}`)}
                        className="inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-xs font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50 transition-all"
                      >
                        {q.task_type.replace('_', ' ').toUpperCase()} Only
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
