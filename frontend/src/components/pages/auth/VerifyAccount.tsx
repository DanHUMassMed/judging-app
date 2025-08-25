import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyAccount: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError("No verification token provided.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await axios.post("http://localhost:8000/api/v1/auth/verify", { token });

        setSuccess(true);
        // redirect after success
        setTimeout(() => navigate("/pricing"), 2000);
      } catch (err: any) {
        console.error("Verification failed", err);
        const errorMsg = err.response?.data?.detail || "Verification failed";

        // Option A: show button
        setError(errorMsg);

        // Option B: redirect to ResetPassword with state
        navigate("/reset-password", { state: { error: errorMsg } });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {loading && <p>Verifying your account...</p>}
      {success && <p className="text-green-600">✅ Account verified! Redirecting...</p>}
      {error && (
        <>
          <p className="text-red-600">❌ {error}</p>
          <button
            onClick={() => navigate("/reset-password", { state: { error } })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reset Password
          </button>
        </>
      )}
    </div>
  );
};

export default VerifyAccount;