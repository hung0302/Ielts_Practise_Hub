import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Construction, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SkillPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setLoading(false);
      }
    });
  }, [navigate]);

  const skillName = skillId ? skillId.charAt(0).toUpperCase() + skillId.slice(1) : 'Skill';

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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8 sm:p-12 text-center"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 mb-6">
            <Construction className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            {skillName} Practice
          </h1>
          <p className="text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
            We are currently building the practice materials and test environment for the {skillName} section. 
            Check back soon for interactive exercises, mock tests, and detailed feedback mechanisms.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
            >
              Explore other skills
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
