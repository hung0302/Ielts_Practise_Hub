/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Auth from './pages/Auth';
import SkillPage from './pages/SkillPage';
import ListeningSelection from './pages/ListeningSelection';
import ListeningTest from './pages/ListeningTest';
import ReadingSelection from './pages/ReadingSelection';
import ReadingTest from './pages/ReadingTest';
import WritingSelection from './pages/WritingSelection';
import WritingTest from './pages/WritingTest';
import History from './pages/History';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/skill/listening" element={<ListeningSelection />} />
            <Route path="/skill/listening/:testId" element={<ListeningTest />} />
            <Route path="/skill/reading" element={<ReadingSelection />} />
            <Route path="/skill/reading/:testId" element={<ReadingTest />} />
            <Route path="/skill/writing" element={<WritingSelection />} />
            <Route path="/skill/writing/:title" element={<WritingTest />} />
            <Route path="/history" element={<History />} />
            <Route path="/skill/:skillId" element={<SkillPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

