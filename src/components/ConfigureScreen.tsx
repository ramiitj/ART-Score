import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, User, Mail, ShieldAlert, Calendar, GraduationCap, Briefcase, FileCheck } from "lucide-react";
import { DOMAINS, DIFFICULTY_LEVELS } from "../types";

interface ConfigureProps {
  onBack: () => void;
  onGenerate: (config: {
    userName: string;
    userEmail: string;
    domain: string;
    difficulty: string;
    age: string;
    gender: string;
    education: string;
    workExperience: string;
    researchConsent: boolean;
  }) => void;
  isLoading: boolean;
  // Pre-fills identity/demographics on a repeat attempt by the same person
  // (e.g. "Benchmark New Scenario" from Results) so retaking the test doesn't
  // force re-entering everything from scratch. This also makes repeat
  // attempts by the same person low-friction, which is what the person x
  // item variance decomposition (scripts/variance-decomposition.ts) needs
  // real data for -- see docs/HEADROOM_MIGRATION_SPEC.md §11 and §15.
  initialUserName?: string;
  initialUserEmail?: string;
  initialAge?: string;
  initialGender?: string;
  initialEducation?: string;
  initialWorkExperience?: string;
  initialResearchConsent?: boolean;
}

export default function ConfigureScreen({
  onBack,
  onGenerate,
  isLoading,
  initialUserName = "",
  initialUserEmail = "",
  initialAge = "",
  initialGender = "",
  initialEducation = "",
  initialWorkExperience = "",
  initialResearchConsent = false,
}: ConfigureProps) {
  // Defaults set to Beginner and General
  const [userName, setUserName] = useState(initialUserName);
  const [userEmail, setUserEmail] = useState(initialUserEmail);
  const [domain, setDomain] = useState("General Knowledge Work");
  const [difficulty, setDifficulty] = useState("Beginner");

  // Demographic states relocated from ResultsScreen
  const [age, setAge] = useState(initialAge);
  const [gender, setGender] = useState(initialGender);
  const [education, setEducation] = useState(initialEducation);
  const [workExperience, setWorkExperience] = useState(initialWorkExperience);
  const [researchConsent, setResearchConsent] = useState(initialResearchConsent);

  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setError("Please fill out your identity parameters to begin.");
      return;
    }
    if (!age || !gender || !education || !workExperience) {
      setError("Please complete all professional background details.");
      return;
    }
    setError("");
    onGenerate({
      userName,
      userEmail,
      domain,
      difficulty,
      age,
      gender,
      education,
      workExperience,
      researchConsent
    });
  };

  return (
    <div className="max-w-xl md:max-w-2xl mx-auto py-1 w-full flex flex-col justify-center h-full">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-1 text-center"
      >
        <span className="text-[10px] uppercase font-mono font-bold py-0.5 px-2.5 rounded bg-neutral-900 text-amber-500 tracking-wider">
          Step 2: Candidate Intake & Session Setup
        </span>
        <h2 className="text-lg md:text-xl font-extrabold text-neutral-800 mt-1 font-sans tracking-tight">
          Configure Your Evaluation
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-neutral-100 p-3 md:p-4"
      >
        <form onSubmit={handleSubmit} className="space-y-2.5">
          
          {/* Section 1: Identity Parameters */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-450 hidden md:block">
              Identity Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-750 mb-0.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-neutral-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs text-neutral-800 bg-neutral-50/20 hover:bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500 font-semibold transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-755 mb-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-neutral-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs text-neutral-800 bg-neutral-50/20 hover:bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500 font-semibold transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-b border-neutral-100 my-0.5"></div>

          {/* Section 2: Demographic Details */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-750 mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-neutral-400" />
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Years"
                  className="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs text-neutral-800 bg-neutral-50/20 hover:bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500 font-semibold transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-760 mb-0.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-neutral-400" />
                  Gender
                </label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs text-neutral-800 bg-white hover:bg-neutral-50 focus:outline-none focus:border-amber-500 font-semibold transition-all cursor-pointer"
                >
                  <option value="">-- Choose --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer Not to Say</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-750 mb-0.5 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-neutral-400" />
                  Education
                </label>
                <select
                  required
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs text-neutral-800 bg-white hover:bg-neutral-50 focus:outline-none focus:border-amber-500 font-semibold transition-all cursor-pointer"
                >
                  <option value="">-- Choose --</option>
                  <option value="High School">High School</option>
                  <option value="Associate / Diploma">Associate / Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate / PhD">Doctorate / PhD</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-750 mb-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-neutral-400" />
                  Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  required
                  value={workExperience}
                  onChange={(e) => setWorkExperience(e.target.value)}
                  placeholder="Years"
                  className="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs text-neutral-800 bg-neutral-50/20 hover:bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500 font-semibold transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-neutral-100 my-0.5"></div>

          {/* Section 3: Parameters */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-800 mb-0.5">
                  Target Domain Expert Area
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs text-neutral-800 bg-white hover:bg-neutral-50 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
                >
                  {DOMAINS.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-800 mb-0.5">
                  Challenge Tier
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {DIFFICULTY_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`shadow-xs rounded py-1.5 text-[10px] uppercase font-bold tracking-wide border transition-all ${
                        difficulty === level
                          ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                          : "bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200/50"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-neutral-100 my-0.5"></div>

          {/* Section 4: Research Consent Checkbox (optional -- you can proceed without checking this) */}
          <div className="pt-0">
            <label className="flex items-start gap-2 cursor-pointer selection:bg-transparent">
              <input
                type="checkbox"
                checked={researchConsent}
                onChange={(e) => setResearchConsent(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span className="text-[10px] text-neutral-500 leading-tight font-medium">
                (Optional) I consent to using my anonymized evaluation details for research and aggregated cognitive benchmarking statistics.
              </span>
            </label>
          </div>

          {error && (
            <div className="p-1.5 bg-red-50 text-red-650 border border-red-100 rounded text-[10px] font-semibold flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={onBack}
              type="button"
              className="px-2 py-1 flex-1 md:flex-none text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-neutral-900 transition-colors rounded py-2.5 px-4 text-sm font-bold shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin"></div>
                  Generating Challenge...
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-neutral-950" />
                  Generate Challenge Scenario
                  <ArrowRight className="w-4 h-4 text-neutral-950" />
                </div>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
