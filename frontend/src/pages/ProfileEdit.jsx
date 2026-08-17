import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);

  //  FIX 1: formState ke andar se 'isDirty' nikal liya hai
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    mode: "onSubmit" 
  });

  useEffect(() => {
    let isMounted = true; 
    const fetchCurrentDetails = async () => {
      try {
         console.log("done");
        const response = await axiosClient.get('/user/current'); 
        console.log("done");
        if (response.data && response.data.user && isMounted) {
          const u = response.data.user;
          console.log(u);

          reset({
            bio: u.bio || "",
            phone: u.phone || "",
            location: u.location || "",
            gender: u.gender || "",
            githubProfile: u.githubProfile || "",
            linkedinProfile: u.linkedinProfile || "",
          });
        }
      } catch (err) {
        console.error("Data pre-fill karne me issue aaya:", err);
      } finally {
        if (isMounted) setFetchingUser(false);
      }
    };
    
    fetchCurrentDetails();
    return () => { isMounted = false; };
  }, []);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
        // Bhai, dhyan rakhna route ke aage '/' laga ho taaki relative path ka issue na ho
        const response = await axiosClient.put('/user/profile/update-details', formData);
        
        if (response.data.success) {
          alert("updated successfully"); 
          navigate('/profile'); 
        }
    } catch (err) {
        console.error("Update fail ho gaya:", err);
        alert("DB update karne me error aaya bhai!");
    } finally {
        setLoading(false);
    }
  };

  if (fetchingUser) {
    return (
      <div className="min-h-screen bg-neutral-950 flex justify-center items-center">
        <div className="text-neutral-400 animate-pulse text-lg font-medium">Loading user details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex justify-center items-center p-6">
      <div className="w-full max-w-xl bg-neutral-900 p-8 rounded-2xl border border-neutral-800 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Update Profile Details</h2>
          <button 
            onClick={() => navigate('/profile')} 
            className="text-neutral-400 hover:text-white transition-all text-sm flex items-center gap-1"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Bio Input */}
          <div>
            <label className="text-sm text-neutral-400 block mb-1">Bio</label>
            <textarea 
              {...register("bio", { maxLength: { value: 160, message: "max character should be 160" } })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-600 transition-all resize-none"
              placeholder="Tell us about yourself..."
              rows="3"
            />
            {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
          </div>

          {/* Grid Layout for Phone and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Phone Number</label>
              <input 
                type="text"
                {...register("phone", { 
                  pattern: { value: /^[0-9]{10}$/, message: "Must be a 10-digit number" } 
                })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-600 transition-all"
                placeholder="9876543210"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="text-sm text-neutral-400 block mb-1">Location</label>
              <input 
                type="text"
                {...register("location")}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-600 transition-all"
                placeholder="Delhi, India"
              />
            </div>
          </div>

          {/* Gender Dropdown */}
          <div>
            <label className="text-sm text-neutral-400 block mb-1">Gender</label>
            <select 
              {...register("gender")}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-600 transition-all"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* GitHub Input */}
          <div>
            {/*  FIX 2: Label par 'Optional' jod diya */}
            <label className="text-sm text-neutral-400 block mb-1">GitHub Profile <span className="text-xs text-neutral-500">(Optional)</span></label>
            <input 
              type="text"
              {...register("githubProfile", { 
                //  validate function se handle kiya taaki khali hone par error na de, par bharne par regex check kare
                validate: value => !value || /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]/.test(value) || "Bhai sahi GitHub link dalo (e.g., github.com/username)"
              })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-600 transition-all"
              placeholder="https://github.com/your-username"
            />
            {errors.githubProfile && <p className="text-red-500 text-xs mt-1">{errors.githubProfile.message}</p>}
          </div>

          {/* LinkedIn Input */}
          <div>
            {/*  FIX 3: Label par 'Optional' jod diya */}
            <label className="text-sm text-neutral-400 block mb-1">LinkedIn Profile <span className="text-xs text-neutral-500">(Optional)</span></label>
            <input 
              type="text"
              {...register("linkedinProfile", {        
// validate: value => !value || /regex/.test(value) || "Error Message String"
                validate: value => !value || /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]/.test(value) || "Bhai sahi LinkedIn link dalo (e.g., linkedin.com/in/username)"
              })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-600 transition-all"
              placeholder="https://linkedin.com/in/your-username"
            />
            {errors.linkedinProfile && <p className="text-red-500 text-xs mt-1">{errors.linkedinProfile.message}</p>}
          </div>

          {/* Submit Button */}
          {/* FIX 4: Button tab tak disabled rahega jab tak loading chal rahi ho YA user ne data me koi BADLAV (!isDirty) na kiya ho */}
          <button 
            type="submit" 
            disabled={loading || !isDirty}
            className={`w-full font-bold py-2.5 rounded-lg transition-all mt-4 flex justify-center items-center ${
              loading || !isDirty 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-800' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Saving Details...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;