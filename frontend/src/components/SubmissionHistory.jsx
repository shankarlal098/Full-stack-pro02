import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';

const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
        setSubmissions(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch submission history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (problemId) fetchSubmissions();
  }, [problemId]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'badge-success text-white';
      case 'wrong': return 'badge-error text-white';
      case 'error': return 'badge-warning text-white';
      case 'pending': return 'badge-info text-white';
      default: return 'badge-neutral';
    }
  };

  const formatMemory = (memory) => {
    if (!memory) return '0 kB';
    if (memory < 1024) return `${memory} kB`;
    return `${(memory / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 w-full">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error text-sm py-3 my-2 shadow-sm rounded-xl">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  return (
    // Fixed: container mx-auto hata kar w-full lagaya taaki left tab layout me perfectly set ho sake
    <div className="w-full space-y-4">
      {submissions.length === 0 ? (
        <div className="alert alert-info text-sm py-3 shadow-sm rounded-xl bg-info/10 text-info border-info/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>No submissions found for this problem yet.</span>
        </div>
      ) : (
        <>
          {/* Table Container with proper responsive overflow */}
          <div className="overflow-x-auto w-full border border-base-300 rounded-xl bg-base-100 shadow-sm max-h-[400px] custom-scrollbar">
            <table className="table table-sm table-zebra w-full text-xs md:text-sm">
              <thead className="bg-base-200 sticky top-0 z-10">
                <tr>
                  <th>#</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                  <th>Test Cases</th>
                  <th>Submitted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, index) => (
                  <tr key={sub._id} className="hover">
                    <th>{index + 1}</th>
                    <td className="font-mono font-semibold opacity-80">{sub.language}</td>
                    <td>
                      <span className={`badge badge-sm font-semibold ${getStatusColor(sub.status)}`}>
                        {sub.status ? sub.status.charAt(0).toUpperCase() + sub.status.slice(1) : ''}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{sub.runtime || 0}s</td>
                    <td className="font-mono text-xs">{formatMemory(sub.memory)}</td>
                    <td className="font-mono text-xs text-base-content/70">
                      {sub.testCasesPassed ?? 0}/{sub.testCasesTotal ?? 0}
                    </td>
                    <td className="text-xs text-base-content/60">{formatDate(sub.createdAt)}</td>
                    <td className="text-right">
                      {/* Fixed: Changed 'btn-s' to 'btn-xs md:btn-sm' for dynamic layout scaling */}
                      <button 
                        className="btn btn-xs md:btn-sm btn-outline btn-primary rounded-md px-2.5"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-base-content/50 px-1">
            Total {submissions.length} dynamic attempts tracked.
          </p>
        </>
      )}

      {/* Code View Modal Section */}
      {selectedSubmission && (
        <div className="modal modal-open z-50">
          <div className="modal-box w-11/12 max-w-4xl bg-base-100 border border-base-300 shadow-2xl rounded-2xl relative">
            <h3 className="font-bold text-base md:text-lg border-b border-base-300 pb-3 mb-4 flex justify-between items-center">
              <span>Code Submission Logs</span>
              <span className="badge badge-neutral font-mono text-xs uppercase">{selectedSubmission.language}</span>
            </h3>
            
            <div className="mb-4 bg-base-200 p-3 rounded-xl flex flex-wrap gap-4 text-xs md:text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <span className="opacity-60">Verdict:</span>
                <span className={`badge badge-sm font-bold ${getStatusColor(selectedSubmission.status)}`}>
                  {selectedSubmission.status}
                </span>
              </div>
              <div><span className="opacity-60">Runtime:</span> <strong className="font-mono">{selectedSubmission.runtime}s</strong></div>
              <div><span className="opacity-60">Memory:</span> <strong className="font-mono">{formatMemory(selectedSubmission.memory)}</strong></div>
              <div><span className="opacity-60">Passed:</span> <strong className="font-mono">{selectedSubmission.testCasesPassed}/{selectedSubmission.testCasesTotal}</strong></div>
            </div>

            {selectedSubmission.errorMessage && (
              <div className="alert alert-error bg-error/10 border-error/20 text-error text-xs p-3 rounded-xl mb-4 font-mono">
                <span>{selectedSubmission.errorMessage}</span>
              </div>
            )}
            
            {/* Syntax View Box */}
            <div className="relative rounded-xl overflow-hidden border border-neutral-800">
              <pre className="p-4 bg-neutral-900 text-neutral-content rounded-xl text-xs md:text-sm font-mono overflow-x-auto max-h-[350px] custom-scrollbar leading-relaxed">
                <code>{selectedSubmission.code}</code>
              </pre>
            </div>
            
            <div className="modal-action border-t border-base-300 pt-3 mt-4">
              <button 
                className="btn btn-sm md:btn-md btn-active rounded-xl"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </button>
            </div>
          </div>
          {/* Backdrop layer to click outside close / view dimming */}
          <div className="modal-backdrop bg-black/40" onClick={() => setSelectedSubmission(null)}></div>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistory;