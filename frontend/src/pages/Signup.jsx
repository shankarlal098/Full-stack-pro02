import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser } from '../authSlice';

// Zod Schema Validation
const signupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(3, 'First name must be at least 3 characters'),

  emailId: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux Auth State
  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  // Convert different backend error formats into one message
  const getErrorMessage = (err) => {
    if (!err) return null;

    // If error is already a string
    if (typeof err === 'string') {
      return err;
    }

    // Handle different possible backend/thunk error formats
    return (
      err?.data?.message ||
      err?.data?.error ||
      err?.response?.data?.message ||
      err?.response?.data?.error ||
  
      null
    );
  };

  // Local submit error gets priority over Redux error
  const errorMessage =
    getErrorMessage(submitError) ||
    getErrorMessage(error);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    // Previous error clear
    setSubmitError(null);

    try {
      await dispatch(registerUser(data)).unwrap();
    } catch (err) {
      console.log('Signup error:', err);

      // Store actual backend error
      setSubmitError(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      <div className="card w-80 bg-base-100 shadow-xl">
        <div className="card-body p-5">

          {/* Title */}
          <h2 className="card-title justify-center text-2xl mb-2">
            Codewith
          </h2>

          {/* Backend Error */}
          {errorMessage && (
            <div className="alert alert-error text-xs py-2 px-3 mb-2 rounded-lg">
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* First Name */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm">
                  First Name
                </span>
              </label>

              <input
                type="text"
                placeholder="John"
                className={`input input-sm input-bordered w-full ${
                  errors.firstName ? 'input-error' : ''
                }`}
                {...register('firstName')}
              />

              {errors.firstName && (
                <span className="text-error text-xs mt-1">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-control mt-2">
              <label className="label py-1">
                <span className="label-text text-sm">
                  Email
                </span>
              </label>

              <input
                type="email"
                placeholder="john@example.com"
                className={`input input-sm input-bordered w-full ${
                  errors.emailId ? 'input-error' : ''
                }`}
                {...register('emailId')}
              />

              {errors.emailId && (
                <span className="text-error text-xs mt-1">
                  {errors.emailId.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-control mt-2">
              <label className="label py-1">
                <span className="label-text text-sm">
                  Password
                </span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input input-sm input-bordered w-full pr-9 ${
                    errors.password ? 'input-error' : ''
                  }`}
                  {...register('password')}
                />

                {/* Password Toggle */}
                <button
                  type="button"
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    // Eye Off
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    // Eye
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {errors.password && (
                <span className="text-error text-xs mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <div className="form-control mt-4">
              <button
                type="submit"
                className="btn btn-primary btn-sm w-auto px-5 mx-auto"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Signing Up...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>

          {/* Login Redirect */}
          <div className="text-center mt-3">
            <span className="text-xs">
              Already have an account?{' '}

              <NavLink
                to="/login"
                className="link link-primary"
              >
                Login
              </NavLink>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Signup;