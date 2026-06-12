import React, { useEffect, useState, useRef } from "react";
import axiosClient from '../utils/axiosClient';
import axios from 'axios'; // Direct Cloudinary hit ke liye
import { NavLink } from "react-router";
import { useNavigate } from "react-router";

const ProfilePage = () => {
  const navigate = useNavigate(); //  Navigation handler active kiya
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // New States for Avatar Management
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Tere backend model wala default avatar path
  const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get('/problem/profile');
        console.log(res.data);
        if (res.data.success) {
          setProfileData(res.data);
        }
      } catch (err) {
        console.error(err);
        setError("Profile data load karne mein dikkat hui!");
      } finally {
        loading && setLoading(false);
      }
    };
    fetchProfile();

    // Dropdown ke bahar click hone par dropdown close karne ka listener
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return (
    <div className="w-full h-screen bg-neutral-950 flex justify-center items-center m-0 p-0 absolute inset-0 z-50">
      <span className="loading loading-spinner loading-lg text-neutral-500"></span>
    </div>
  );

  if (error) return (
    <div className="w-full h-screen bg-neutral-950 flex justify-center items-center text-neutral-400 font-medium m-0 p-0 absolute inset-0 z-50">
      ⚠️ {error}
    </div>
  );

  if (!profileData || !profileData.user || !profileData.stats) {
    return (
      <div className="w-full h-screen bg-neutral-950 flex justify-center items-center m-0 p-0 absolute inset-0 z-50">
        <span className="loading loading-spinner loading-lg text-neutral-500"></span>
      </div>
    );
  }

  const { user, stats, recentSubmissions = [] } = profileData;

  // =========================================================================
  //  AVATAR HANDLERS (CORE LOGIC)
  // =========================================================================

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setDropdownOpen(false);

    try {
      const signatureResponse = await axiosClient.get('/image/create');
      const { signature, timestamp, public_id, api_key, upload_url, folder } = signatureResponse.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('public_id', public_id);
      formData.append('api_key', api_key);
      formData.append('folder', folder); 

      const uploadResponse = await axios.post(upload_url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const secureUrl = uploadResponse.data.secure_url;
      const cloudinaryPublicId = uploadResponse.data.public_id;

      const isUpdating = user.profilePic && user.profilePic !== DEFAULT_AVATAR;
      const endpoint = isUpdating ? '/image/update' : '/image/save';
      const method = isUpdating ? 'put' : 'post';

      const backendResponse = await axiosClient[method](endpoint, {
        secureUrl,
        cloudinaryPublicId,
        type: 'avatar'
      });

      if (backendResponse.data.success) {
        setProfileData(prev => ({
          ...prev,
          user: { ...prev.user, profilePic: secureUrl }
        }));
        if (fileInputRef.current) fileInputRef.current.value = "";
      }

    } catch (err) {
      console.error("Upload error details:", err);
      alert("Image handle karne me issue aaya bhai!");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm("Bhai sach me profile photo hatani hai?")) return;
    setUploading(true);
    setDropdownOpen(false);
    try {
      const res = await axiosClient.delete('/image/delete', {
        data: { type: 'avatar' }
      });

      if (res.data.success) {
        setProfileData(prev => ({
          ...prev,
          user: { ...prev.user, profilePic: DEFAULT_AVATAR }
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Delete karne me dikkat aayi bhai!");
    } finally {
      setUploading(false);
    }
  };

  const hasUploadedPhoto = user.profilePic && user.profilePic !== DEFAULT_AVATAR;

  return (
    <div className="w-full min-h-screen h-full bg-neutral-950 text-neutral-200 m-0 p-6 md:p-8 overflow-y-auto block">
      <div className="w-full h-full space-y-6">
        
        <div className="w-full card bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-xl shadow-xl flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          
          {/* Left Side: Avatar and Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">  
            <div ref={dropdownRef} className="relative group">
              <div 
                onClick={() => !uploading && setDropdownOpen(!dropdownOpen)}
                className={`avatar placeholder ring-1 ring-neutral-800 rounded-full p-1 bg-neutral-950 flex-shrink-0 transition-all ${
                  !uploading ? 'cursor-pointer hover:ring-neutral-600' : 'opacity-60 pointer-events-none'
                }`}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden relative">
                  <img src={user.profilePic || DEFAULT_AVATAR} alt="Profile" className="object-cover w-full h-full" />
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-neutral-300 font-medium transition-opacity
                    ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {uploading ? "Changing..." : "Change"}
                  </div>

                  {uploading && (
                    <div className="absolute inset-0 bg-neutral-950/70 flex items-center justify-center">
                      <span className="loading loading-spinner loading-md text-neutral-400"></span>
                    </div>
                  )}
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />

              {dropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-44 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                  {!hasUploadedPhoto ? (
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
                    >
                       Upload Photo
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => fileInputRef.current.click()}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
                      >
                         Update Photo
                      </button>
                      <button 
                        onClick={handleDeletePhoto}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors border-t border-neutral-800/60"
                      >
                         Remove Photo
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* User Meta details data info */}
            <div className="text-center md:text-left space-y-2 flex-1 w-full">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 md:gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
                  {user.firstName} {user.lastName}
                </h1>
                
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded border ${
                  user.role === 'admin' 
                    ? 'bg-red-950/40 border-red-900/50 text-red-400' 
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                }`}>
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>

              <p className="text-sm text-neutral-400 font-mono">{user.emailId}</p>

              <p className="text-sm text-neutral-400 max-w-3xl pt-1 leading-relaxed mx-auto md:mx-0">
                {user.bio || "No bio added yet. Add your bio and information here by add details section."}
              </p>

              {/*  Naye fields (githubProfile, linkedinProfile) ke mutabik condition update kar di */}
              {(user.githubProfile || user.linkedinProfile || user.twitter) && (
                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2 text-xs text-neutral-400 font-mono">
                  {user.githubProfile && (
                    <div><span className="text-neutral-500">github:</span> <a href={user.githubProfile} target="_blank" rel="noreferrer" className="hover:text-neutral-200 underline underline-offset-4">{user.githubProfile.split('/').pop()}</a></div>
                  )}
                  {user.linkedinProfile && (
                    <div><span className="text-neutral-500">linkedin:</span> <a href={user.linkedinProfile} target="_blank" rel="noreferrer" className="hover:text-neutral-200 underline underline-offset-4">{user.linkedinProfile.split('/').pop()}</a></div>
                  )}
                  {user.twitter && (
                    <div><span className="text-neutral-500">twitter:</span> <a href={user.twitter} target="_blank" rel="noreferrer" className="hover:text-neutral-200 underline underline-offset-4">{user.twitter.split('/').pop()}</a></div>
                  )}
                </div>
              )}
              
              <div className="text-xs text-neutral-500 pt-1 font-mono">
                Member since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Right Side: Decent Action Button */}
          <div className="w-full md:w-auto flex justify-center md:justify-end flex-shrink-0">
            {/*  Button par onClick handle karke navigate jod diya aur cursor pointer lagaya */}
            <button 
              onClick={() => navigate('/profile/edit')} 
              className="border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-all px-4 py-2 rounded-lg w-full md:w-auto cursor-pointer"
            >
              Add Details
            </button>
          </div>

        </div>

        {/* SECTION 2 & 3: Stats Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Problems Solved</span>
            <span className="text-3xl font-bold text-emerald-500 mt-2">{user.problemsSolvedCount || 0}</span>
            <span className="text-xs text-neutral-500 mt-1 font-mono">Unique accepted tasks</span>
          </div>

          <div className="card bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Attempts</span>
            <span className="text-3xl font-bold text-neutral-300 mt-2">{stats.totalSubmissions || 0}</span>
            <span className="text-xs text-neutral-500 mt-1 font-mono">Total evaluations done</span>
          </div>

          <div className="card bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Accuracy Rate</span>
            <span className="text-3xl font-bold text-amber-500 mt-2">{stats.accuracy || 0}%</span>
            <div className="w-full bg-neutral-950 border border-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-amber-500 h-full rounded-full" style={{ width: `${stats.accuracy || 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Recent Activity Timeline */}
        <div className="w-full card bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-md">
          <h2 className="text-base font-bold text-neutral-300 mb-4 tracking-tight flex items-center gap-2">
            Recent Code Submissions
          </h2>

          {recentSubmissions.length === 0 ? (
            <p className="text-neutral-500 text-sm py-6 text-center font-mono">No submissions logged for this account.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-mono text-xs">
                    <th className="pb-3 text-left">Problem Title</th>
                    <th className="pb-3 text-left">Status</th>
                    <th className="pb-3 text-left">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {recentSubmissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="py-3.5 font-medium text-neutral-300">
                        <NavLink to={`/problem/${sub.problemId?._id}`} className="hover:text-neutral-100 hover:underline transition-all">
                          {sub.problemId?.title || "Unknown Problem"}
                        </NavLink>
                      </td>
                      <td className="py-3.5">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          sub.status === "accepted" 
                            ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/60" 
                            : "bg-red-950/50 text-red-400 border border-red-900/60"
                        }`}>
                          {sub.status === "accepted" ? "ACCEPTED" : sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-neutral-400 font-mono">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;