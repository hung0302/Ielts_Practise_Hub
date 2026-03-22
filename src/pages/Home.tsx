import { Headphones, Mic, BookOpen, Edit3 } from 'lucide-react';
import SkillCard from '../components/SkillCard';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const skills = [
  {
    title: 'Listening',
    description: 'Practice with a variety of audio recordings, including conversations and monologues, to improve your comprehension skills.',
    icon: Headphones,
    href: '/skill/listening',
    color: 'bg-blue-500',
  },
  {
    title: 'Reading',
    description: 'Enhance your reading speed and accuracy with diverse texts ranging from descriptive to analytical and discursive.',
    icon: BookOpen,
    href: '/skill/reading',
    color: 'bg-emerald-500',
  },
  {
    title: 'Writing',
    description: 'Develop your ability to write clear, well-structured essays and reports with guided practice and examples.',
    icon: Edit3,
    href: '/skill/writing',
    color: 'bg-amber-500',
  },
  {
    title: 'Speaking',
    description: 'Build confidence in expressing your opinions and discussing various topics fluently and coherently.',
    icon: Mic,
    href: '/skill/speaking',
    color: 'bg-rose-500',
  },
];

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-12 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl"
          >
            Master Your IELTS
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-slate-600"
          >
            Comprehensive practice materials and tests for all four IELTS skills. Choose a skill below to start your preparation journey.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-4 lg:gap-8">
          {skills.map((skill, index) => (
            <SkillCard 
              key={skill.title} 
              {...skill} 
              href={user ? skill.href : '/auth'} 
              delay={0.1 * (index + 1)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
