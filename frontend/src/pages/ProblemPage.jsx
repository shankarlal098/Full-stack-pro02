import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux'; 
import { useParams } from 'react-router';
import Editor from '@monaco-editor/react';

import axiosClient from "../utils/axiosClient";
import SubmissionHistory from "../components/SubmissionHistory"; 
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};





const ProblemPage = () => {
  const { problemId } = useParams();
  const { user } = useSelector((state) => state.auth);

  // Core States
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Redis sync indicator state
  const [submitError, setsubmiterror] = useState(false);

  // Navigation & Results States
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);

  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: "Hi, How are you" }] },
    { role: 'user', parts: [{ text: "I am Good" }] }
  ]);

  // 1. PHASE 1: Initial Page Load (Fetch Problem Details & Check Redis Cache)
  useEffect(() => {
    const fetchProblemAndCache = async () => {
      setLoading(true);
      try {
        // A. Fetch Problem metadata from DB
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        setProblem(response.data);

        // B. Check if code exists in Redis for this problem
        const redisResponse = await axiosClient.get(`/code/get/${problemId}`);
        
        if (redisResponse.data.success && redisResponse.data.data) {
          const { languages, currentLanguage } = redisResponse.data.data;
          
          // Agar cache bacha hua hai, toh use restore karo
          setSelectedLanguage(currentLanguage || 'javascript');
          setCode(languages[currentLanguage || 'javascript'] || '');
        } else {
          // Agar cache nahi hai, toh DB ka fresh initial code template lagao
          const initialCode = response.data.startCode.find(
            sc => sc.language === langMap[selectedLanguage]
          )?.initialCode;
          if (initialCode) setCode(initialCode);
        }
      } catch (error) {
        console.error('Error during initial fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    if (problemId) fetchProblemAndCache();
  }, [problemId]);


  // 2. PHASE 2: Handle Auto-Save with DEBOUNCE (Sync with Redis)
  useEffect(() => {
    // Agar page loading par hai ya code state khali hai, toh API hit mat karo
    if (loading || !problem || !code) return;

    // 1.5 Second ka Debounce timeout lagao
    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSaving(true); // UI me "Syncing..." dikhao
        await axiosClient.post('/code/save', {
          problemId,
          code,
          language: selectedLanguage
        });
      } catch (error) {
        console.error("Redis Auto-Save Failed:", error);
      } finally {
        setIsSaving(false); // UI me "Saved" dikhao
      }
    }, 1500); // 1500ms continuous gap milte hi sync chalega

    // Cleanup: Agar user 1.5 second se pehle dobara key press karega, toh purana save timer cancel!
    return () => clearTimeout(delayDebounceFn);
  }, [code, selectedLanguage, problemId, problem]);


  // 3. PHASE 3: Handle Manual Language Switching
  const handleLanguageChange = async (newLang) => {
    setSelectedLanguage(newLang);
    
    try {
      // Language badalte waqt check karo ki kya Redis mein is user ka is problem ka kuch save hai?
      const { data } = await axiosClient.get(`/code/get/${problemId}`);
      
      if (data.success && data.data?.languages?.[newLang]) {
        // Agar user ne is language mein thodi der pehle code likha tha, toh wahi se load karo
        setCode(data.data.languages[newLang]);
      } else if (problem) {
        // Agar pehli baar select kar raha hai, toh fresh startCode template fetch karo DB data se
        const initialCode = problem.startCode.find(sc => sc.language === langMap[newLang])?.initialCode;
        setCode(initialCode || '');
      }
    } catch (error) {
      console.error("Error switching language cache:", error);
    }
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });
      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({ success: false, error: 'Internal server error', testCases: [] });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });
      setSubmitResult(response.data);
      setLoading(false);
      setActiveRightTab('result');
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setsubmiterror(true)
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-500 border-green-500';
      case 'medium': return 'text-yellow-500 border-yellow-500';
      case 'hard': return 'text-red-500 border-red-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-base-100 overflow-hidden">
      {/* Left Panel */}
      <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-full border-b md:border-b-0 md:border-r border-base-300">
        <div className="tabs tabs-bordered bg-base-200 px-2 md:px-4 overflow-x-auto flex flex-nowrap whitespace-nowrap scrollbar-none shrink-0 min-h-[48px]">
          {['description', 'editorial', 'solutions', 'submissions', 'chatAI'].map((tab) => (
            <button
              key={tab}
              className={`tab h-full capitalize ${activeLeftTab === tab ? 'tab-active font-bold text-primary' : ''}`}
              onClick={() => setActiveLeftTab(tab)}
            >
              {tab === 'chatAI' ? 'ChatAI' : tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {problem && (
            <>
              {activeLeftTab === 'description' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl md:text-2xl font-bold text-base-content">{problem.title}</h1>
                    <div className="flex gap-2">
                      <div className={`badge badge-sm md:badge-md badge-outline ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                      </div>
                      <div className="badge badge-sm md:badge-md badge-primary">{problem.tags}</div>
                    </div>
                  </div>

                  <div className="prose max-w-none text-base-content/90">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                      {problem.description}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-md md:text-lg font-semibold mb-3">Examples:</h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases?.map((example, index) => (
                        <div key={index} className="bg-base-200 p-4 rounded-xl border border-base-300">
                          <h4 className="font-semibold text-sm mb-2 text-base-content/80">Example {index + 1}:</h4>
                          <div className="space-y-1 text-xs md:text-sm font-mono overflow-x-auto">
                            <div><strong className="text-primary">Input:</strong> {example.input}</div>
                            <div><strong className="text-secondary">Output:</strong> {example.output}</div>
                            {example.explanation && (
                              <div className="text-base-content/70 mt-1"><strong>Explanation:</strong> {example.explanation}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'editorial' && (
                <div className="prose max-w-none">
                  <h2 className="text-lg md:text-xl font-bold mb-4">Editorial</h2>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration} />
                  </div>
                </div>
              )}

              {activeLeftTab === 'solutions' && (
                <div className="space-y-4">
                  <h2 className="text-lg md:text-xl font-bold mb-2">Solutions</h2>
                  <div className="space-y-4">
                    {problem.referenceSolution?.map((solution, index) => (
                      <div key={index} className="border border-base-300 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-base-200 px-4 py-2 border-b border-base-300 flex justify-between items-center">
                          <h3 className="font-semibold text-sm">{problem?.title}</h3>
                          <span className="badge badge-sm badge-ghost uppercase font-mono">{solution?.language}</span>
                        </div>
                        <div className="p-3 bg-neutral text-neutral-content">
                          <pre className="text-xs md:text-sm overflow-x-auto p-1 font-mono">
                            <code>{solution?.completeCode}</code>
                          </pre>
                        </div>
                      </div>
                    )) || <p className="text-sm text-base-content/60 italic">Solutions will be available after you solve the problem.</p>}
                  </div>
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div className="space-y-4">
                  <h2 className="text-lg md:text-xl font-bold mb-2">Your Submission History</h2>
                  <SubmissionHistory problemId={problemId} userId={user?._id} />
                </div>
              )}

              {activeLeftTab === 'chatAI' && (
                <div className="h-full flex flex-col">
                  <h2 className="text-lg md:text-xl font-bold mb-3">CHAT with AI</h2>
                  <div className="flex-1 text-sm leading-relaxed">
                    <ChatAi problem={problem} messages={messages} setMessages={setMessages} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-full">
        <div className="tabs tabs-bordered bg-base-200 px-2 md:px-4 overflow-x-auto flex flex-nowrap whitespace-nowrap scrollbar-none shrink-0 min-h-[48px]">
          {['code', 'testcase', 'result'].map((tab) => (
            <button
              key={tab}
              className={`tab h-full capitalize ${activeRightTab === tab ? 'tab-active font-bold' : ''}`}
              onClick={() => setActiveRightTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900">
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2 border-b border-base-300 bg-base-100/50 shrink-0">
                <div className="flex gap-1.5">
                  {['javascript', 'java', 'cpp'].map((lang) => (
                    <button
                      key={lang}
                      className={`btn btn-xs md:btn-sm rounded-md transition-all ${selectedLanguage === lang ? 'btn-primary shadow-sm' : 'btn-ghost text-base-content/70'}`}
                      onClick={() => handleLanguageChange(lang)} // Fixed: Language selector now checks cache
                    >
                      {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                    </button>
                  ))}
                </div>

                    {isSaving ? (
                           <span className="badge bg-amber-950/40 border border-amber-500/30 text-amber-400 badge-sm gap-1.5 animate-pulse text-xs font-medium px-2.5 py-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    Cloud Syncing...
                           </span>
                       ) : (
                        <span className="badge bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 badge-sm gap-1.5 text-xs font-medium px-2.5 py-3">
                         <span>✓</span> Saved
                         </span>
                      )}
              </div>

              <div className="flex-1 relative w-full overflow-hidden bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  width="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    folding: true,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'line',
                    padding: { top: 10, bottom: 10 }
                  }}
                />
              </div>

              <div className="p-3 border-t border-base-300 bg-base-100 shrink-0 flex items-center justify-between gap-2">
                <button
                  className="btn btn-ghost btn-sm text-xs"
                  onClick={() => setActiveRightTab('testcase')}
                >
                  Console
                </button>
                <div className="flex gap-2">
                  <button
                    className="btn btn-outline btn-sm text-xs"
                    onClick={handleRun}
                    disabled={loading}
                  >
                    {loading && activeRightTab === 'code' ? <span className="loading loading-spinner loading-xs"></span> : 'Run'}
                  </button>
                  <button
                    className="btn btn-primary btn-sm text-xs"
                    onClick={handleSubmitCode}
                    disabled={loading}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Testcase Tab View */}
          {activeRightTab === 'testcase' && (
            <div className="flex-1 p-4 overflow-y-auto bg-base-100 text-base-content">
              <h3 className="font-semibold text-md mb-3">Console Outputs</h3>
              {runResult ? (
                <div className={`alert rounded-xl ${runResult.success ? 'alert-success bg-success/10 text-success' : 'alert-error bg-error/10 text-error'} mb-4 shadow-sm`}>
                  <div className="w-full">
                    {runResult.success ? (
                      <div className="space-y-3 w-full">
                        <h4 className="font-bold text-sm md:text-base">✅ All test cases passed!</h4>
                        <div className="flex gap-4 text-xs font-mono opacity-80">
                          <span>Runtime: <strong>{runResult.runtime} sec</strong></span>
                          <span>Memory: <strong>{runResult.memory} KB</strong></span>
                        </div>
                        <div className="mt-3 space-y-2.5 w-full">
                          {runResult.testCases?.map((tc, i) => (
                            <div key={i} className="bg-base-200 border border-base-300 p-3 rounded-lg text-xs w-full text-base-content">
                              <div className="font-mono space-y-1">
                                <div><span className="opacity-60">Input:</span> {tc.stdin}</div>
                                <div><span className="opacity-60">Expected:</span> {tc.expected_output}</div>
                                <div><span className="opacity-60">Output:</span> {tc.stdout}</div>
                                <div className="text-success font-bold mt-1">✓ Passed</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 w-full">
                        <h4 className="font-bold text-sm md:text-base">❌ Runtime Error / Failed Testcases</h4>
                        <div className="mt-3 space-y-2.5 w-full">
                          {runResult.testCases?.map((tc, i) => (
                            <div key={i} className="bg-base-200 border border-base-300 p-3 rounded-lg text-xs w-full text-base-content">
                              <div className="font-mono space-y-1">
                                <div><span className="opacity-60">Input:</span> {tc.stdin}</div>
                                <div><span className="opacity-60">Expected:</span> {tc.expected_output}</div>
                                <div><span className="opacity-60">Output:</span> {tc.stdout}</div>
                                <div className={`font-bold mt-1 ${tc.status_id === 3 ? 'text-success' : 'text-error'}`}>
                                  {tc.status_id === 3 ? '✓ Passed' : '✗ Failed'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-base-content/60 italic p-2">
                  Click "Run" to test your code with the example test cases.
                </div>
              )}
            </div>
          )}

          {/* Result Tab View */}
          {activeRightTab === 'result' && (
            <div className="flex-1 p-4 overflow-y-auto bg-base-100 text-base-content">
              <h3 className="font-semibold text-md mb-3">Submission Status</h3>
              {submitResult ? (
                <div className={`alert rounded-xl shadow-sm ${submitResult.accepted ? 'alert-success bg-success/10 text-success' : 'alert-error bg-error/10 text-error'}`}>
                  <div className="w-full">
                    {submitResult.accepted ? (
                      <div className="space-y-2 w-full">
                        <h4 className="font-bold text-base md:text-lg">🎉 Accepted</h4>
                        <div className="text-xs md:text-sm space-y-1 font-mono opacity-80 mt-2">
                          <p>Passed: <span className="font-bold text-success">{submitResult.passedTestCases}/{submitResult.totalTestCases}</span></p>
                          <p>Runtime: <strong>{submitResult.runtime} sec</strong></p>
                          <p>Memory: <strong>{submitResult.memory} KB</strong></p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 w-full">
                        <h4 className="font-bold text-base md:text-lg">❌ {submitResult.error || "Wrong Answer"}</h4>
                        <div className="text-xs md:text-sm font-mono opacity-80 mt-2">
                          <p>Test Cases Passed: <span className="font-bold text-error">{submitResult.passedTestCases}/{submitResult.totalTestCases}</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : ((!submitError) &&
                <div className="text-sm text-base-content/60 italic p-2">
                  Click "Submit" to run your solution against all hidden testcases.
                </div>
              )}
              {submitError && ( 
              <div className="text-sm text-base-content/60 italic p-2">
                  Compiler servers are busy (API Limit Reached). Please try again later!
                </div> 
              )} 
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;