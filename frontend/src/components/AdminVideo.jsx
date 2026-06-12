import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient'
import { NavLink } from 'react-router';

const AdminVideo = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/problem/getAllProblem');
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setProblems(response.data.data); 
      } else if (Array.isArray(response.data)) {
        setProblems(response.data); 
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch problems from server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    
    try {
      await axiosClient.delete(`/video/delete/${id}`);
      setProblems(problems.filter(problem => problem._id !== id));
    } catch (err) {
      // String format me pass karo taaki safe rahe
      alert(err?.response?.data?.error || "Delete karne me locha hua bhai!");
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg my-4 max-w-2xl mx-auto">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-white font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-base-100 rounded-xl shadow-md mt-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black tracking-tight text-white">Video Management Dashboard</h1>
      </div>

      <div className="overflow-x-auto rounded-lg border border-base-300">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-base-200 text-gray-300 text-sm">
              <th className="w-1/12">#</th>
              <th className="w-5/12">Title</th>
              <th className="w-2/12">Difficulty</th>
              <th className="w-2/12">Tags</th>
              <th className="w-2/12 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">Koi problems nahi mili bhai!</td>
              </tr>
            ) : (
              problems.map((problem, index) => (
                 <tr key={problem._id} className="hover:bg-base-200/50 transition">
                  <th className="font-bold text-gray-400">{index + 1}</th>
                  <td className="font-medium text-white">{problem.title}</td>
                  <td>
                    <span className={`badge font-semibold ${
                      problem.difficulty === 'Easy' 
                        ? 'badge-success text-white' 
                        : problem.difficulty === 'Medium' 
                          ? 'badge-warning text-gray-900' 
                          : 'badge-error text-white'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-outline border-gray-600 text-gray-400">
                      {problem.tags || 'General'}
                    </span>
                  </td>
                  {/*  Dono buttons ek hi column me clean align ho gaye hain */}
                  <td>
                    <div className="flex justify-center items-center space-x-2">
                      <NavLink 
                        to={`/admin/upload/${problem._id}`}
                        className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm"
                      >
                        Upload
                      </NavLink>
                      <button 
                        onClick={() => handleDelete(problem._id)}
                        className="btn btn-sm btn-error text-white shadow-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminVideo;