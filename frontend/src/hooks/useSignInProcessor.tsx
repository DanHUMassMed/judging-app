import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFieldValidation } from "./useFieldValidation";
import { useAuth } from "../components/pages/auth/AuthContext";

export const useSignInProcessor = () => {
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); 
  const [loginSubmitted, setLoginSubmitted] = useState(false);

  const navigate = useNavigate();
  const { validationErrors, setValidationError, resetValidationErrors } =
    useFieldValidation();

  const handleClickShowPassword = () => setShowPassword(prev => !prev);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const isASCII = (text: string): boolean => /^[\x09\x0A\x0D\x20-\x7E]*$/.test(text);
  const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    resetValidationErrors();

    // Client-side validation
    let hasError = false;
    if (!email.trim()) {
      setValidationError("email", "Email is required");
      hasError = true;
    } else if (!isValidEmail(email)) {
      setValidationError("email", "Invalid email format");
      hasError = true;
    }

    if (!password.trim()) {
      setValidationError("password", "Password is required");
      hasError = true;
    } else if (password.length < 8) {
      setValidationError("password", "Invalid password");
      hasError = true;
    }

    if (hasError) return;

    try {
      await login(email, password);
      setLoginSubmitted(true); // mark that login was submitted
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  // Navigate after login when isAuthenticated updates
  useEffect(() => {
    if (loginSubmitted && isAuthenticated) {
      navigate("/pricing");
    }
  }, [isAuthenticated, loginSubmitted, navigate]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    handleClickShowPassword,
    handleMouseDownPassword,
    handleSubmit,
    validationErrors,
    error,
  };
};