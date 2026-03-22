import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface SkillCardProps {
  key?: React.Key;
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
  delay?: number;
}

export default function SkillCard({ title, description, icon: Icon, href, color, delay = 0 }: SkillCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Link
        to={href}
        className="group relative flex flex-col items-start justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-slate-300 overflow-hidden h-full"
      >
        <div className={`absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${color}`} />
        
        <div className="flex items-center gap-4 mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        
        <p className="text-sm leading-6 text-slate-600 mb-6 flex-grow">
          {description}
        </p>
        
        <div className="flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-500">
          Start Practicing
          <span aria-hidden="true" className="ml-1 transition-transform group-hover:translate-x-1">
            &rarr;
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
