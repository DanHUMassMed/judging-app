// src/pages/VerifiedSuccess.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifiedSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // You could add optional logic here, like tracking or clearing temporary state
  }, []);

  const handleStart = () => {
    // Navigate user into your main app/dashboard
    navigate("/posters"); 
  };

  return (
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
  );
}