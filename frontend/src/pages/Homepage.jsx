import { useEffect, useState } from 'react';
import { NavLink } from 'react-router'; 
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

const getDifficultyBadgeColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'hard': return 'badge-error';
    default: return 'badge-neutral';
  }
};

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Core States
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Filter State
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all' 
  });

  // 1. Core Fetch Function (With Server-Side Filters)
  const fetchProblems = async (pageNum, currentFilters) => {
    setIsLoading(true);
    try {
      // API me page, limit, difficulty aur tag query params bhej rahe hain
      const { data } = await axiosClient.get(
        `/problem/getAllProblem?page=${pageNum}&limit=10&difficulty=${currentFilters.difficulty}&tag=${currentFilters.tag}`
      );
      
      // Agar page 1 hai toh purana data saaf karke naya data set karo (for filter change)
      // Agar page > 1 hai toh purane data me naya data append karo (for load more)
      setProblems((prev) => pageNum === 1 ? data.data : [...prev, ...data.data]);
      
      // Check if more data exists
      if (data.meta.currentPage >= data.meta.totalPages) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setIsLoading(false); 
    }
  };

  // 2. Effect for Filters: Jab bhi filter badlega, reset to Page 1 and Fetch
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProblems(1, filters);
  }, [filters.difficulty, filters.tag]); 

  // 3. Effect for Initial Load & Solved Problems Fetching
  useEffect(() => {
    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch (error) {
        console.error('Error fetching solved problems:', error);
      }
    };

    if (user) fetchSolvedProblems();
  }, [user]); 

  // 4. Load More Click Handler
  const handleLoadMore = () => {
    if (isLoading || !hasMore) return; 
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProblems(nextPage, filters); // Agla page usi filter ke sath mangao
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]); 
  };

  // 5. Solved/Unsolved Status Local Filter (Since it relies on separate solvedProblems API)
  const displayedProblems = problems.filter(problem => {
    if (filters.status === 'all') return true;
    if (filters.status === 'solved') {
      return solvedProblems.some(sp => sp._id === problem._id);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navigation Bar */}
      <nav className="navbar bg-base-100 shadow-lg px-4">
        <div className="flex-1">
          <NavLink to="/" className="btn btn-ghost text-xl">Codewith</NavLink>
        </div>
        <div className="flex-none gap-4">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} className="btn btn-ghost">
              {user?.firstName}
            </div>
            <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 z-[1]">
              <li><button onClick={handleLogout}>Logout</button></li>
              {user?.role === 'admin' && <li><NavLink to="/admin">Admin</NavLink></li>}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        {/* Filters Dropdowns */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select 
            className="select select-bordered"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">All Problems</option>
            <option value="solved">Solved Problems</option>
          </select>

          <select 
            className="select select-bordered"
            value={filters.difficulty}
            onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select 
            className="select select-bordered"
            value={filters.tag}
            onChange={(e) => setFilters({...filters, tag: e.target.value})}
          >
            <option value="all">All Tags</option>
            <option value="array">Array</option>
            <option value="linkedList">Linked List</option>
            <option value="graph">Graph</option>
            <option value="dp">DP</option>
            <option value="math">Math</option>
          </select>
        </div>

        {/* Problems List */}
        <div className="grid gap-4">
          {displayedProblems.map(problem => (
            <div key={problem._id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h2 className="card-title">
                    <NavLink to={`/problem/${problem._id}`} className="hover:text-primary">
                      {problem.title}
                    </NavLink>
                  </h2>
                  {solvedProblems.some(sp => sp._id === problem._id) && (
                    <div className="badge badge-success gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Solved
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <div className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </div>
                  <div className="badge badge-info">
                    {problem.tags}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* No Problems Found Alert */}
         {!isLoading && displayedProblems.length === 0 && (
            <div className="flex justify-center items-center py-12">
              <div className="card bg-base-100 border border-base-300 shadow-xl max-w-md w-full">
                <div className="card-body items-center text-center">
                  <div className="text-5xl mb-2">🔍</div>
                  <h2 className="card-title text-lg">
                       No problems found matching the filters.
                  </h2>
                </div>
              </div>
            </div>

          )}

          {/* Shimmer Effect Skeleton */}
         {/* Skeleton Loading */}
            {isLoading && (
              <>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="card bg-base-100 border border-base-300 shadow-lg animate-pulse"
                  >
                    <div className="card-body">
                      <div className="h-7 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded-lg w-2/3 mb-4"></div>

                      <div className="flex gap-2 mb-3">
                        <div className="h-5 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded-full w-20"></div>
                        <div className="h-5 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded-full w-16"></div>
                      </div>

                      <div className="h-4 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded w-full"></div>
                      <div className="h-4 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded w-5/6 mt-2"></div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Load More Button */}
            {!isLoading && hasMore && displayedProblems.length > 0 && (
              <div className="flex justify-center mt-8 mb-4">
                <button
                  onClick={handleLoadMore}
                  className="
                    btn
                    border-0
                    rounded-2xl
                    px-8
                    bg-gradient-to-r
                    from-cyan-500
                    to-blue-600
                    text-white
                    font-bold
                    tracking-wide
                    hover:scale-105
                    hover:-translate-y-1
                    hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]
                    transition-all
                    duration-300
                  "
                >
                  Load More →
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;