import { useState } from "react";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";

function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage("");
    setEmailError("");

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {

      setLoading(true);

      const { data } = await axiosClient.post(
        "/user/forgot-password",
        { email }
      );

      setIsSuccess(true);
      setMessage(data.message);

    } catch (error) {

      setIsSuccess(false);

      setMessage(
        error?.response?.data?.message ||
        "Something went wrong"
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">

      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300">

        <div className="card-body">

          {/* Icon */}
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
              📧
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-center">
            Forgot Password
          </h1>

          <p className="text-center text-sm opacity-70">
            Enter your registered email address and we'll send you a password reset link.
          </p>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-4"
          >

            <div className="form-control">

              <label className="label">
                <span className="label-text font-medium">
                  Email Address
                </span>
              </label>

              <input
                type="email"
                placeholder="john@example.com"
                className={`input input-bordered w-full ${
                  emailError ? "input-error" : ""
                }`}
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              {emailError && (
                <span className="text-error text-sm mt-1">
                  {emailError}
                </span>
              )}

            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary w-full mt-6 ${
                loading ? "loading" : ""
              }`}
            >
              {loading
                ? "Sending..."
                : "Send Reset Link"}
            </button>

          </form>

          {/* Message */}
          {message && (
            <div
              className={`alert mt-5 ${
                isSuccess
                  ? "alert-success"
                  : "alert-error"
              }`}
            >
              <span>{message}</span>
            </div>
          )}

          <div className="divider">
            OR
          </div>

          <div className="text-center">
            <NavLink
              to="/login"
              className="link link-primary"
            >
              Back to Login
            </NavLink>
          </div>

        </div>

      </div>

    </div>
  );
}

export default ForgotPassword;