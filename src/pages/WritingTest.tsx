import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle, Loader2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { WritingQuestion } from '../types/writing';

export default function WritingTest() {
  const { title } = useParams<{ title: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'practice';
  const taskId = searchParams.get('taskId');
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<WritingQuestion[]>([]);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [timer, setTimer] = useState(0);
  const [testStarted, setTestStarted] = useState(mode !== 'test');
  const [countdown, setCountdown] = useState(3);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
      } else {
        navigate('/auth');
      }
      setAuthLoading(false);
    });
  }, [navigate]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!title) return;
      
      const { data, error } = await supabase
        .from('writing_questions')
        .select('*')
        .eq('title', decodeURIComponent(title))
        .order('task_type', { ascending: true }); // task_1 before task_2

      if (error) {
        console.error('Error fetching questions:', error);
      } else if (data && data.length > 0) {
        const filtered = taskId ? data.filter(q => q.id === taskId) : data;
        setQuestions(filtered);
        
        if (mode === 'test') {
          if (filtered.length === 1) {
            setTimer(filtered[0].task_type === 'task_1' ? 1200 : 2400); // 20 or 40 mins
          } else {
            setTimer(3600); // 60 mins
          }
        } else {
          setTimer(0);
        }

        // Initialize answers
        const initialAnswers: Record<string, string> = {};
        filtered.forEach(q => initialAnswers[q.id] = '');
        setAnswers(initialAnswers);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [title]);

  useEffect(() => {
    if (!questions.length || authLoading) return;

    let interval: NodeJS.Timeout;

    if (mode === 'test' && !testStarted) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setTestStarted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (testStarted && !isSubmitted && !isSubmitting) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (mode === 'test') {
            if (prev <= 1) {
              clearInterval(interval);
              handleSubmit();
              return 0;
            }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [testStarted, mode, isSubmitted, isSubmitting, questions.length, authLoading]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleSubmit = () => {
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);

    if (userId) {
      try {
        const totalTime = mode === 'test' 
          ? (questions.length === 1 ? (questions[0].task_type === 'task_1' ? 1200 : 2400) : 3600) 
          : 0;
        const duration = mode === 'test' ? totalTime - timer : timer;

        // Create session
        const { data: testSession, error: sessionError } = await supabase
          .from('test_sessions')
          .insert({
            user_id: userId,
            skill_type: 'writing',
            test_type: mode,
            status: 'pending',
            duration_seconds: duration,
            submitted_at: new Date().toISOString()
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Save submissions
        const submissions = questions.map(q => ({
          session_id: testSession.id,
          question_id: q.id,
          essay_text: answers[q.id] || '',
          status: 'pending'
        }));

        const { error: submissionError } = await supabase
          .from('writing_submissions')
          .insert(submissions);
        
        if (submissionError) throw submissionError;

        // Simulate AI grading delay
        setTimeout(() => {
          setIsSubmitting(false);
          setIsSubmitted(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 3000);

      } catch (err: any) {
        console.error('Error saving results:', err);
        alert(`Lỗi khi lưu kết quả: ${err.message}`);
        setIsSubmitting(false);
      }
    } else {
      alert("Bạn chưa đăng nhập! Kết quả sẽ không được lưu vào database.");
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="p-12 text-center text-slate-600">Test not found.</div>;
  }

  const activeQuestion = questions[activeTaskIndex];
  const wordCount = answers[activeQuestion.id]?.trim().split(/\s+/).filter(w => w.length > 0).length || 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pb-24">
      {/* Header / Sticky Top Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/skill/writing')} className="text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 truncate">{decodeURIComponent(title || '')}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${mode === 'test' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {mode === 'test' ? 'Test Mode' : 'Practice Mode'}
            </span>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 text-slate-700 font-mono text-lg font-medium bg-slate-100 px-3 py-1.5 rounded-md">
              <Clock className="w-5 h-5 text-slate-500" />
              {formatTime(timer)}
            </div>
            {!isSubmitted && !isSubmitting && (
              <button
                onClick={handleSubmit}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pre-test Countdown Overlay */}
      {mode === 'test' && !testStarted && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Test starts in</h2>
            <div className="text-6xl font-mono font-bold text-indigo-600 mb-6">{countdown}</div>
            <p className="text-sm text-slate-600 mb-6">
              You will have {questions.length === 1 ? (questions[0].task_type === 'task_1' ? '20' : '40') : '60'} minutes to complete the writing test.
            </p>
            <button
              onClick={() => setCountdown(1)}
              className="px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Skip Countdown
            </button>
          </div>
        </div>
      )}

      {/* Submitting / AI Grading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Đang gửi bài...</h2>
            <p className="text-slate-600">
              Bài viết của bạn đang được gửi đến A.I. để chấm điểm. Vui lòng đợi trong giây lát.
            </p>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Submit Test?</h2>
            <p className="text-slate-600 mb-8">
              Are you sure you want to submit your answers? You won't be able to change them later.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Split Layout */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Results Banner */}
        {isSubmitted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Nộp bài thành công!</h2>
            <p className="text-emerald-700 font-medium mb-6">
              Bài viết của bạn đã được ghi nhận và đang chờ A.I. chấm điểm. Bạn có thể xem lại kết quả trong phần lịch sử sau.
            </p>
            <button
              onClick={() => navigate('/skill/writing')}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50 transition-all"
            >
              Back to Library
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side: Prompt */}
          <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8">
            {/* Task Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 mb-6 hide-scrollbar shrink-0">
              <div className="flex space-x-8 px-2">
                {questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setActiveTaskIndex(index)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTaskIndex === index
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {q.task_type.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: activeQuestion.prompt.replace(/\n/g, '<br/>') }} />
              
              {activeQuestion.image_url && (
                <div className="mt-6 border border-slate-200 rounded-lg p-2 bg-slate-50">
                  <img 
                    src={activeQuestion.image_url} 
                    alt="Task illustration" 
                    className="w-full h-auto rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Writing Area */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Your Essay</h3>
                <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                  wordCount < (activeQuestion.task_type === 'task_1' ? 150 : 250) 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {wordCount} words
                </div>
              </div>
              <textarea
                value={answers[activeQuestion.id]}
                onChange={(e) => handleAnswerChange(activeQuestion.id, e.target.value)}
                disabled={isSubmitted || isSubmitting}
                placeholder="Start writing here..."
                className="flex-1 w-full resize-none border-0 bg-slate-50 p-4 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                style={{ minHeight: '400px' }}
              />
              <div className="mt-4 text-xs text-slate-500 flex justify-between">
                <span>Minimum requirement: {activeQuestion.task_type === 'task_1' ? '150' : '250'} words</span>
                <span>Auto-saving...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
