import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, RotateCw, Volume2, Clock, AlertCircle, Loader2, CheckCircle2, XCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ListeningTest as ListeningTestType } from '../types/listening';

export default function ListeningTest() {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'practice';
  const navigate = useNavigate();

  const [test, setTest] = useState<ListeningTestType | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Timer state
  const [timer, setTimer] = useState(0); // Count up for practice, count down for test
  const [countdown, setCountdown] = useState(10); // 10s countdown before test starts
  const [testStarted, setTestStarted] = useState(mode === 'practice');
  const [authLoading, setAuthLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(true);

  // Answers state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setAuthLoading(false);
      }
    });
  }, [navigate]);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) return;
      
      const { data, error } = await supabase
        .from('listening_questions')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) {
        console.error('Error fetching test:', error);
      } else if (data) {
        setTest({
          id: data.id,
          title: data.title,
          audio_url_1: data.audio_url_1,
          audio_url_2: data.audio_url_2,
          audio_url_3: data.audio_url_3,
          content: typeof data.question_content === 'string' ? JSON.parse(data.question_content) : data.question_content,
          correct_answers: typeof data.correct_answer === 'string' ? JSON.parse(data.correct_answer) : data.correct_answer,
        });
      }
      setTestLoading(false);
    };

    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (!test || authLoading) return;

    let interval: NodeJS.Timeout;

    if (mode === 'test' && !testStarted) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTestStarted(true);
            setTimer(40 * 60); // 40 minutes for test
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.error("Auto-play blocked", e));
              setIsPlaying(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (testStarted) {
      interval = setInterval(() => {
        setTimer((prev) => (mode === 'test' ? Math.max(0, prev - 1) : prev + 1));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [mode, testStarted, test, authLoading]);

  // Reset audio when section changes
  useEffect(() => {
    if (audioRef.current && test) {
      audioRef.current.pause();
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
      
      // Auto-play in test mode if test has started and not submitted
      if (mode === 'test' && testStarted && !isSubmitted) {
        audioRef.current.play().catch(e => console.error("Auto-play blocked", e));
        setIsPlaying(true);
      }
    }
  }, [activeSectionIndex, test, mode, testStarted, isSubmitted]);

  if (authLoading || testLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!test) {
    return <div className="p-12 text-center text-slate-600">Test not found.</div>;
  }

  const currentSection = test.content.sections[activeSectionIndex];
  const currentAudioUrl = activeSectionIndex === 0 ? test.audio_url_1 : activeSectionIndex === 1 ? test.audio_url_2 : test.audio_url_3;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    let currentScore = 0;
    Object.keys(test.correct_answers).forEach(qId => {
      const userAnswer = (answers[qId] || '').trim().toLowerCase();
      const correctAnswer = test.correct_answers[qId].trim().toLowerCase();
      if (userAnswer === correctAnswer) {
        currentScore++;
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const timeSpent = mode === 'test' ? (40 * 60) - timer : timer;
      
      try {
        console.log("Creating test session...");
        const { data: testSession, error: sessionError } = await supabase.from('test_sessions').insert({
          user_id: session.user.id,
          skill_type: 'listening',
          test_type: mode,
          status: 'completed',
          total_score: currentScore,
          duration_seconds: timeSpent,
          submitted_at: new Date().toISOString()
        }).select().single();

        if (sessionError) {
          console.error('Error creating test session:', sessionError);
          alert(`Lỗi khi tạo phiên thi: ${sessionError.message}`);
          return;
        }

        console.log("Submitting to Supabase with session_id:", testSession.id);

        const { error: submissionError } = await supabase.from('listening_submissions').insert({
          session_id: testSession.id,
          question_id: test.id,
          user_answer: answers,
          score: currentScore,
          time_taken: timeSpent
        });
        
        if (submissionError) {
          console.error('Error saving results:', submissionError);
          alert(`Lỗi khi lưu kết quả: ${submissionError.message}`);
        } else {
          console.log("Successfully saved to database!");
        }
      } catch (err: any) {
        console.error('Exception saving results:', err);
        alert(`Lỗi ngoại lệ: ${err.message}`);
      }
    } else {
      alert("Bạn chưa đăng nhập! Kết quả sẽ không được lưu vào database.");
    }

    setScore(currentScore);
    setIsSubmitted(true);
    setShowConfirmModal(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalQuestions = Object.keys(test.correct_answers).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pb-24">
      {/* Header / Sticky Top Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/skill/listening')} className="text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 truncate">{test.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${mode === 'test' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {mode === 'test' ? 'Test Mode' : 'Practice Mode'}
            </span>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 text-slate-700 font-mono text-lg font-medium bg-slate-100 px-3 py-1.5 rounded-md">
              <Clock className="w-5 h-5 text-slate-500" />
              {formatTime(timer)}
            </div>
            {!isSubmitted && (
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
              Audio will play automatically. You cannot pause or rewind during the test.
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Results Banner */}
        {isSubmitted && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Test Completed!</h2>
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {score} / {totalQuestions}
            </div>
            <p className="text-indigo-700 font-medium">
              You got {Math.round((score / totalQuestions) * 100)}% correct.
            </p>
            <button
              onClick={() => navigate('/skill/listening')}
              className="mt-6 rounded-md bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50 transition-all"
            >
              Back to Library
            </button>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 mb-8 hide-scrollbar">
          <div className="flex space-x-8 px-2">
            {test.content.sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setActiveSectionIndex(index)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeSectionIndex === index
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Player for Current Section */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 mb-8">
          <audio
            ref={audioRef}
            src={currentAudioUrl || ''}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            onEnded={() => setIsPlaying(false)}
          />
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm text-slate-500 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-100"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>

            {/* Controls */}
            {mode === 'practice' ? (
              <div className="flex items-center justify-center gap-6 mt-2">
                <button onClick={() => seek(-10)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Rewind 10s">
                  <RotateCcw className="w-6 h-6" />
                </button>
                <button onClick={togglePlay} className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 shadow-sm transition-all hover:scale-105">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
                <button onClick={() => seek(10)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Forward 10s">
                  <RotateCw className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mt-2 text-slate-500 text-sm">
                <Volume2 className="w-4 h-4" />
                <span>Audio is playing. Controls disabled in Test Mode.</span>
              </div>
            )}
          </div>
        </div>

        {/* Questions for Current Section */}
        <div className="space-y-12">
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">{currentSection.title}</h2>
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm font-medium italic">
                {currentSection.instruction}
              </div>
            </div>

            <div className="space-y-8">
              {currentSection.questions.map((q) => (
                <div key={q.id} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm mt-1">
                    {q.number}
                  </div>
                  <div className="flex-1 pt-1">
                    {q.type === 'fill_in_blank' && (
                      <div className="text-slate-800 text-lg leading-loose">
                        {q.text.includes('___') ? (
                          q.text.split('___').map((part, index, array) => (
                            <span key={index}>
                              {part}
                              {index < array.length - 1 && (
                                <span className="inline-flex items-center mx-2 align-middle">
                                  <input
                                    type="text"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    disabled={isSubmitted}
                                    className={`w-32 sm:w-40 border-b-2 bg-transparent px-2 py-1 outline-none transition-colors font-medium text-center ${
                                      isSubmitted
                                        ? (answers[q.id] || '').trim().toLowerCase() === test.correct_answers[q.id].toLowerCase()
                                          ? 'border-emerald-500 text-emerald-700'
                                          : 'border-rose-500 text-rose-700'
                                        : 'border-slate-300 focus:border-indigo-600 text-indigo-700'
                                    }`}
                                  />
                                  {isSubmitted && (
                                    <span className="ml-1 inline-flex items-center">
                                      {(answers[q.id] || '').trim().toLowerCase() === test.correct_answers[q.id].toLowerCase() ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <XCircle className="w-5 h-5 text-rose-500" />
                                          <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                            {test.correct_answers[q.id]}
                                          </span>
                                        </div>
                                      )}
                                    </span>
                                  )}
                                </span>
                              )}
                            </span>
                          ))
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{q.text}</span>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                value={answers[q.id] || ''}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                disabled={isSubmitted}
                                className={`w-48 border-b-2 bg-transparent px-2 py-1 outline-none transition-colors font-medium ${
                                  isSubmitted
                                    ? (answers[q.id] || '').trim().toLowerCase() === test.correct_answers[q.id].toLowerCase()
                                      ? 'border-emerald-500 text-emerald-700'
                                      : 'border-rose-500 text-rose-700'
                                    : 'border-slate-300 focus:border-indigo-600 text-indigo-700'
                                }`}
                                placeholder={isSubmitted ? '' : 'Write answer...'}
                              />
                              {isSubmitted && (
                                <span className="ml-2 flex items-center">
                                  {(answers[q.id] || '').trim().toLowerCase() === test.correct_answers[q.id].toLowerCase() ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <XCircle className="w-5 h-5 text-rose-500" />
                                      <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                        {test.correct_answers[q.id]}
                                      </span>
                                    </div>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {q.type === 'multiple_choice' && (
                      <div className="space-y-3">
                        <p className="text-lg text-slate-800 font-medium mb-3">{q.text}</p>
                        <div className="space-y-2">
                          {q.options?.map((opt, i) => {
                            const optLetter = opt.charAt(0);
                            const isCorrectOption = optLetter === test.correct_answers[q.id];
                            const isSelected = answers[q.id] === optLetter;
                            
                            let labelClass = 'border-slate-200 hover:bg-slate-50 cursor-pointer has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50';
                            
                            if (isSubmitted) {
                              if (isCorrectOption) {
                                labelClass = 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500';
                              } else if (isSelected && !isCorrectOption) {
                                labelClass = 'border-rose-500 bg-rose-50 ring-1 ring-rose-500';
                              } else {
                                labelClass = 'border-slate-200 opacity-50 cursor-default';
                              }
                            }

                            return (
                              <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${labelClass}`}>
                                <input
                                  type="radio"
                                  name={`q-${q.id}`}
                                  value={optLetter}
                                  checked={isSelected}
                                  onChange={() => handleAnswerChange(q.id, optLetter)}
                                  disabled={isSubmitted}
                                  className={`mt-1 w-4 h-4 ${isSubmitted ? 'text-slate-400' : 'text-indigo-600 border-slate-300 focus:ring-indigo-600'}`}
                                />
                                <span className={`text-slate-700 flex-1 ${isSubmitted && isCorrectOption ? 'font-bold text-emerald-800' : ''}`}>
                                  {opt}
                                </span>
                                {isSubmitted && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                                {isSubmitted && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Section Navigation */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => setActiveSectionIndex(Math.max(0, activeSectionIndex - 1))}
                disabled={activeSectionIndex === 0}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous Section
              </button>
              
              <button
                onClick={() => setActiveSectionIndex(Math.min(test.content.sections.length - 1, activeSectionIndex + 1))}
                disabled={activeSectionIndex === test.content.sections.length - 1}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Section
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
