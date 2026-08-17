import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import axiosClient from "../utils/axiosClient";

function ResetPassword() {

  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] =useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage(
        "Passwords do not match"
      );
      return;
    }
    try {
      setLoading(true);
      const { data } =
        await axiosClient.post(
          "/user/reset-password",
          {
            token,
            password,
          }
        );
      setMessage(data.message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {

      setMessage(
        error?.response?.data?.message ||
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-center">
            Reset Password
          </h2>
          <form
            onSubmit={handleSubmit}
            className="mt-4"
          >
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  New Password
                </span>
              </label>
              <input
                type="password"
                className="input input-bordered"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">
                  Confirm Password
                </span>
              </label>
              <input
                type="password"
                className="input input-bordered"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                required
              />

            </div>
            <button
              type="submit"
              className={`btn btn-primary w-full mt-6 ${
                loading
                  ? "loading btn-disabled"
                  : ""
              }`}
              disabled={loading}
            >
              {loading
                ? "Resetting..."
                : "Reset Password"}
            </button>
          </form>
          {message && (
            <div className="alert alert-info mt-4">
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;