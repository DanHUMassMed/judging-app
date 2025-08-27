import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import axios from "axios";

const VerifyAccount: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { magic_link, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!token) return;

    const runMagicLink = async () => {
      try {
        await magic_link(token);
        setSuccess(true);
      } catch (err: any) {
        console.error("Magic Link failed", err);
        setError(err.response?.data?.detail || "Magic Link failed");
      }
    };

  runMagicLink();
  }, [token]);

  const handleStart = () => {
      if (isAuthenticated) {
      navigate("/posters");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      {loading && <p>Verifying your account...</p>}

      {success &&(
          <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md">
              <h1 className="text-2xl font-bold text-green-600 mb-4">
                🎉 Your account has been verified!
              </h1>
              <p className="text-gray-600 mb-6">
                You can now start using your account.
              </p>
              <button
                onClick={handleStart}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl shadow hover:bg-blue-700 transition"
              >
                Start Using Your Account
              </button>
            </div>
          </div>
        )}

      {error && <p className="text-red-600">❌ {error}</p>}
    </div>
  );
};

export default VerifyAccount;