import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Headphones, PlayCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ListeningTest } from '../types/listening';

export default function ListeningSelection() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<'practice' | 'test'>('practice');
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<ListeningTest[]>([]);

  useEffect(() => {
    const fetchTests = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('listening_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tests:', error);
      } else if (data) {
        const formattedTests: ListeningTest[] = data.map(item => ({
          id: item.id,
          title: item.title,
          audio_url_1: item.audio_url_1,
          audio_url_2: item.audio_url_2,
          audio_url_3: item.audio_url_3,
          content: typeof item.question_content === 'string' ? JSON.parse(item.question_content) : item.question_content,
          correct_answers: typeof item.correct_answer === 'string' ? JSON.parse(item.correct_answer) : item.correct_answer,
        }));
        setTests(formattedTests);
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
            Listening Practice Library
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select a test and choose your mode. Practice mode allows audio control, while Test mode simulates real exam conditions.
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
          {tests.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              No listening tests available yet.
            </div>
          ) : (
            tests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                    <Headphones className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{test.title}</h3>
                </div>
                <div className="mt-auto pt-6 flex gap-3">
                  <button
                    onClick={() => navigate(`/skill/listening/${test.id}?mode=${selectedMode}`)}
                    className="flex-1 inline-flex justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
                  >
                    {selectedMode === 'practice' ? (
                      <><PlayCircle className="w-4 h-4 mr-2" /> Start Practice</>
                    ) : (
                      <><Clock className="w-4 h-4 mr-2" /> Start Test</>
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
