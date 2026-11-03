import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  GraduationCap, 
  X, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Award, 
  Coins, 
  ArrowRight, 
  ShieldCheck, 
  Share2, 
  BadgeCheck 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoItem, SkillCertificate } from '../../types';
import { sounds } from '../../utils/soundEffects';

interface SkillQuizModalProps {
  video: VideoItem | null;
  onClose: () => void;
}

export const SkillQuizModal: React.FC<SkillQuizModalProps> = ({ video, onClose }) => {
  const { addFundsToWallet, currentUser, setActiveTab, setShareToast } = useApp();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedCert, setEarnedCert] = useState<SkillCertificate | null>(null);

  if (!video || !video.skillQuiz) return null;

  const quiz = video.skillQuiz;
  const currentQ = quiz.questions[currentQuestionIndex];
  const hasAnsweredCurrent = selectedAnswers[currentQuestionIndex] !== undefined;
  const isCurrentCorrect = selectedAnswers[currentQuestionIndex] === currentQ.correctIndex;

  const handleSelectOption = (idx: number) => {
    if (hasAnsweredCurrent) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = idx;
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);

    if (idx === currentQ.correctIndex) {
      sounds.playLikePop();
    }
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Finished all 3 questions!
      const totalCorrect = selectedAnswers.filter(
        (ans, qIdx) => ans === quiz.questions[qIdx].correctIndex
      ).length;

      if (totalCorrect === quiz.questions.length) {
        // Passed 100%!
        sounds.playSuccessPayout();
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#FF9F0A', '#10B981', '#00B2FE', '#6366F1'],
        });

        // Award bonus GHS 1.00 for skill completion
        addFundsToWallet(quiz.rewardGHS);

        const newCert: SkillCertificate = {
          id: `cert-${Date.now()}`,
          title: quiz.title,
          badgeName: quiz.badgeName,
          badgeIcon: quiz.badgeIcon,
          issueDate: 'Just Now',
          credentialId: `VV-CERT-${Math.floor(10000 + Math.random() * 90000)}`,
          creatorName: video.creator.name,
          videoTitle: video.title
        };

        if (currentUser.certificates) {
          currentUser.certificates.unshift(newCert);
        } else {
          currentUser.certificates = [newCert];
        }

        setEarnedCert(newCert);
        setIsCompleted(true);
      } else {
        alert(`You scored ${totalCorrect}/${quiz.questions.length}. Please review the video and try again to earn the verified badge!`);
        setSelectedAnswers([]);
        setCurrentQuestionIndex(0);
      }
    }
  };

  const handleShareCertificate = () => {
    if (!earnedCert) return;
    const text = `🎓 I just earned my verified "${earnedCert.badgeName}" on ValuVid by passing the Proof-of-Skill check for ${video.title}! Credential: #${earnedCert.credentialId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setShareToast('Certificate credential copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#070E1B] border border-amber-500/40 rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-[1.5px] shrink-0">
              <div className="w-full h-full bg-[#050B14] rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-wide">Proof-of-Skill Checkpoint</h3>
                <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.2 rounded-full">
                  ● +GHS {quiz.rewardGHS.toFixed(2)} Bonus
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">Interactive Micro-Certification by {video.creator.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* COMPLETED CERTIFICATE CELEBRATION */}
        {isCompleted && earnedCert ? (
          <div className="flex flex-col gap-3.5 animate-fade-in">
            {/* Certificate Card */}
            <div className="bg-gradient-to-br from-neutral-950 via-[#0A1628] to-[#141E30] border-2 border-amber-400/60 rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-2 shadow-lg">
                {earnedCert.badgeIcon}
              </div>

              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                <BadgeCheck className="w-3.5 h-3.5" /> Official ValuVid Micro-Credential
              </div>

              <h3 className="text-base font-black text-white mb-0.5">
                {earnedCert.badgeName}
              </h3>

              <p className="text-[11px] text-neutral-300 max-w-xs mb-3">
                Awarded to <strong>@{currentUser.username}</strong> for demonstrating mastery in <em>"{video.title}"</em>.
              </p>

              {/* Credential Stamp */}
              <div className="w-full bg-black/60 rounded-xl p-2.5 border border-neutral-800 flex items-center justify-between text-[10px]">
                <div className="text-left">
                  <span className="text-neutral-500 block">Credential ID:</span>
                  <span className="font-mono text-cyan-300 font-bold">{earnedCert.credentialId}</span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">Verified Signer:</span>
                  <span className="text-emerald-400 font-bold">{earnedCert.creatorName}</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/80">
                <Coins className="w-3.5 h-3.5" />
                <span>+GHS {quiz.rewardGHS.toFixed(2)} Credited to ValuWallet!</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareCertificate}
                className="flex-1 py-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Share Credential</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  setActiveTab('profile');
                }}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <span>View on Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE QUIZ QUESTIONS STEP */
          <div className="flex flex-col gap-3">
            {/* Progress indicators */}
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
              <span className="text-amber-400 font-bold">100% Score Required for Badge</span>
            </div>

            <div className="flex gap-1.5 w-full">
              {quiz.questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i === currentQuestionIndex
                      ? 'bg-amber-400'
                      : i < currentQuestionIndex
                      ? 'bg-emerald-400'
                      : 'bg-neutral-800'
                  }`}
                />
              ))}
            </div>

            {/* Question Card */}
            <div className="bg-black/40 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white leading-snug">
                {currentQ.question}
              </h4>

              {/* Options */}
              <div className="flex flex-col gap-2">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                  const isCorrect = idx === currentQ.correctIndex;
                  let btnStyle = 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800';

                  if (hasAnsweredCurrent) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200';
                    } else {
                      btnStyle = 'bg-neutral-900/50 border-neutral-800/50 text-neutral-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnsweredCurrent}
                      onClick={() => handleSelectOption(idx)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {hasAnsweredCurrent && (
                        isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : isSelected ? (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : null
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {showExplanation && (
                <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed animate-fade-in ${
                  isCurrentCorrect ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}>
                  <strong className="block mb-0.5">
                    {isCurrentCorrect ? '✓ Correct!' : '✗ Not quite:'}
                  </strong>
                  {currentQ.explanation}
                </div>
              )}
            </div>

            {/* Next / Submit Question Button */}
            {hasAnsweredCurrent && (
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Complete & Issue Badge 🏆'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};