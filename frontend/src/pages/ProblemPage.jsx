import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from "../components/SubmissionHistory"
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';

const langMap = {
        cpp: 'C++',
        java: 'Java',
        javascript: 'JavaScript'
};


const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  let {problemId}  = useParams();
  const [messages, setMessages] = useState([
        { role: 'model', parts:[{text: "Hi, How are you"}]},
        { role: 'user', parts:[{text: "I am Good"}]}
    ]);

  

  const { handleSubmit } = useForm();

 useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
       
        
        const initialCode = response.data.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;

        setProblem(response.data);
        
        setCode(initialCode);
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Update code when language changes
  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
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
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    
    try {
        const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code:code,
        language: selectedLanguage
      });

       setSubmitResult(response.data);
       setLoading(false);
       setActiveRightTab('result');
      
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
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
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-base-100 overflow-hidden">
  {/* Left Panel */}
  <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-full border-b md:border-b-0 md:border-r border-base-300">
    {/* Left Tabs */}
    <div className="tabs tabs-bordered bg-base-200 px-2 md:px-4 overflow-x-auto flex flex-nowrap whitespace-nowrap scrollbar-none shrink-0 min-h-[48px]">
      <button 
        className={`tab h-full ${activeLeftTab === 'description' ? 'tab-active' : ''}`}
        onClick={() => setActiveLeftTab('description')}
      >
        Description
      </button>
      <button 
        className={`tab h-full ${activeLeftTab === 'editorial' ? 'tab-active' : ''}`}
        onClick={() => setActiveLeftTab('editorial')}
      >
        Editorial
      </button>
      <button 
        className={`tab h-full ${activeLeftTab === 'solutions' ? 'tab-active' : ''}`}
        onClick={() => setActiveLeftTab('solutions')}
      >
        Solutions
      </button>
      <button 
        className={`tab h-full ${activeLeftTab === 'submissions' ? 'tab-active' : ''}`}
        onClick={() => setActiveLeftTab('submissions')}
      >
        Submissions
      </button>
      <button 
        className={`tab h-full ${activeLeftTab === 'chatAI' ? 'tab-active' : ''}`}
        onClick={() => setActiveLeftTab('chatAI')}
      >
        ChatAI
      </button>
    </div>

    {/* Left Content */}
    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
      {problem && (
        <>
          {activeLeftTab === 'description' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-base-content">{problem.title}</h1>
                <div className="flex gap-2">
                  <div className={`badge badge-sm md:badge-md badge-outline ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
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
                  {problem.visibleTestCases.map((example, index) => (
                    <div key={index} className="bg-base-200 p-4 rounded-xl border border-base-300">
                      <h4 className="font-semibold text-sm mb-2 text-base-content/80">Example {index + 1}:</h4>
                      <div className="space-y-1 text-xs md:text-sm font-mono overflow-x-auto">
                        <div><strong className="text-primary">Input:</strong> {example.input}</div>
                        <div><strong className="text-secondary">Output:</strong> {example.output}</div>
                        {example.explanation && (
                          <div className="text-base-content/70 mt-1"><strong className="text-base-content">Explanation:</strong> {example.explanation}</div>
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
                <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration}/>
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

          {activeLeftTab === 'chatAI' && (
            <div className="h-full flex flex-col">
              <h2 className="text-lg md:text-xl font-bold mb-3">CHAT with AI</h2>
              <div className="flex-1 text-sm leading-relaxed">
                <ChatAi problem={problem} messages={messages} setMessages={setMessages}></ChatAi>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </div>

  {/* Right Panel */}
  <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-full">
    {/* Right Tabs */}
    <div className="tabs tabs-bordered bg-base-200 px-2 md:px-4 overflow-x-auto flex flex-nowrap whitespace-nowrap scrollbar-none shrink-0 min-h-[48px]">
      <button 
        className={`tab h-full ${activeRightTab === 'code' ? 'tab-active' : ''}`}
        onClick={() => setActiveRightTab('code')}
      >
        Code
      </button>
      <button 
        className={`tab h-full ${activeRightTab === 'testcase' ? 'tab-active' : ''}`}
        onClick={() => setActiveRightTab('testcase')}
      >
        Testcase
      </button>
      <button 
        className={`tab h-full ${activeRightTab === 'result' ? 'tab-active' : ''}`}
        onClick={() => setActiveRightTab('result')}
      >
        Result
      </button>
    </div>

    {/* Right Content */}
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900">
      {activeRightTab === 'code' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Language Selector */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-base-300 bg-base-100/50 shrink-0">
            <div className="flex gap-1.5">
              {['javascript', 'java', 'cpp'].map((lang) => (
                <button
                  key={lang}
                  className={`btn btn-xs md:btn-sm rounded-md transition-all ${selectedLanguage === lang ? 'btn-primary shadow-sm' : 'btn-ghost text-base-content/70'}`}
                  onClick={() => handleLanguageChange(lang)}
                >
                  {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                </button>
              ))}
            </div>
          </div>

          {/* Editor Container */}
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

          {/* Action Buttons Footer */}
          <div className="p-3 border-t border-base-300 bg-base-100 shrink-0 flex items-center justify-between gap-2">
            <button 
              className="btn btn-ghost btn-sm text-xs"
              onClick={() => setActiveRightTab('testcase')}
            >
              Console
            </button>
            <div className="flex gap-2">
              <button
                className={`btn btn-outline btn-sm text-xs ${loading ? 'loading' : ''}`}
                onClick={handleRun}
                disabled={loading}
              >
                Run
              </button>
              <button
                className={`btn btn-primary btn-sm text-xs ${loading ? 'loading' : ''}`}
                onClick={handleSubmitCode}
                disabled={loading}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {activeRightTab === 'testcase' && (
        <div className="flex-1 p-4 overflow-y-auto bg-base-100 text-base-content">
          <h3 className="font-semibold text-md mb-3 flex items-center gap-2">Console Outputs</h3>
          {runResult ? (
            <div className={`alert rounded-xl ${runResult.success ? 'alert-success bg-success/10 text-success border-success/20' : 'alert-error bg-error/10 text-error border-error/20'} mb-4 shadow-sm`}>
              <div className="w-full">
                {runResult.success ? (
                  <div className="space-y-3 w-full">
                    <h4 className="font-bold flex items-center gap-1.5 text-sm md:text-base">✅ All test cases passed!</h4>
                    <div className="flex gap-4 text-xs font-mono text-base-content/80">
                      <span>Runtime: <span className="font-bold">{runResult.runtime} sec</span></span>
                      <span>Memory: <span className="font-bold">{runResult.memory} KB</span></span>
                    </div>
                    
                    <div className="mt-3 space-y-2.5 w-full">
                      {runResult.testCases.map((tc, i) => (
                        <div key={i} className="bg-base-200 border border-base-300 p-3 rounded-lg text-xs w-full text-base-content">
                          <div className="font-mono space-y-1">
                            <div><span className="text-base-content/60">Input:</span> {tc.stdin}</div>
                            <div><span className="text-base-content/60">Expected:</span> {tc.expected_output}</div>
                            <div><span className="text-base-content/60">Output:</span> {tc.stdout}</div>
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
                      {runResult.testCases.map((tc, i) => (
                        <div key={i} className="bg-base-200 border border-base-300 p-3 rounded-lg text-xs w-full text-base-content">
                          <div className="font-mono space-y-1">
                            <div><span className="text-base-content/60">Input:</span> {tc.stdin}</div>
                            <div><span className="text-base-content/60">Expected:</span> {tc.expected_output}</div>
                            <div><span className="text-base-content/60">Output:</span> {tc.stdout}</div>
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

      {activeRightTab === 'result' && (
        <div className="flex-1 p-4 overflow-y-auto bg-base-100 text-base-content">
          <h3 className="font-semibold text-md mb-3">Submission Status</h3>
          {submitResult ? (
            <div className={`alert rounded-xl shadow-sm ${submitResult.accepted ? 'alert-success bg-success/10 text-success border-success/20' : 'alert-error bg-error/10 text-error border-error/20'}`}>
              <div className="w-full">
                {submitResult.accepted ? (
                  <div className="space-y-2 w-full">
                    <h4 className="font-bold text-base md:text-lg">🎉 Accepted</h4>
                    <div className="text-xs md:text-sm space-y-1 font-mono text-base-content/80 mt-2">
                      <p>Passed: <span className="font-bold text-success">{submitResult.passedTestCases}/{submitResult.totalTestCases}</span></p>
                      <p>Runtime: <span className="font-bold">{submitResult.runtime} sec</span></p>
                      <p>Memory: <span className="font-bold">{submitResult.memory} KB</span></p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 w-full">
                    <h4 className="font-bold text-base md:text-lg">❌ {submitResult.error || "Wrong Answer"}</h4>
                    <div className="text-xs md:text-sm font-mono text-base-content/80 mt-2">
                      <p>Test Cases Passed: <span className="font-bold text-error">{submitResult.passedTestCases}/{submitResult.totalTestCases}</span></p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-base-content/60 italic p-2">
              Click "Submit" to run your solution against all hidden testcases.
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