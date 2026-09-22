import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { loginUser } from '../authSlice';

const loginSchema = z.object({
  emailId: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Backend error ko safely string me convert karta hai
  const getErrorMessage = (err) => {
    if (!err) return null;

    if (typeof err === 'string') return err;

    // Different backend / thunk error formats
    return (
      err?.response?.data?.message ||
      null
    );
  };

  const errorMessage =
    getErrorMessage(submitError) ||
    getErrorMessage(error);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setSubmitError(null);

    try {
      await dispatch(loginUser(data)).unwrap();
    } catch (err) {
      console.log('Login error:', err);
      setSubmitError(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      <div className="card w-80 bg-base-100 shadow-xl">
        <div className="card-body p-5">
          <h2 className="card-title justify-center text-2xl mb-2">
            Codewith
          </h2>

          {errorMessage && (
                <div className="text-red-500 text-xs mb-2">
                  <span>{errorMessage}</span>
                </div>
            )}
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm">Email</span>
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
                <span className="label-text text-sm">Password</span>
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

                <button
                  type="button"
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
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

              <div className="text-right mt-1">
                <NavLink
                  to="/forgot-password"
                  className="link link-primary text-xs"
                >
                  Forgot Password?
                </NavLink>
              </div>
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
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-3">
            <span className="text-xs">
              Don't have an account?{' '}
              <NavLink to="/signup" className="link link-primary">
                Sign Up
              </NavLink>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;