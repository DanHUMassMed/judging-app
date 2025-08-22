import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFieldValidation } from "./useFieldValidation";
import { useAuth } from "../components/AuthContext";

export const useSignInProcessor = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // server error
  
  const navigate = useNavigate();
  const { validationErrors, setValidationError, resetValidationErrors } =
    useFieldValidation();

  const handleClickShowPassword = () => setShowPassword((prev) => !prev);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

   // Utility function to check ASCII characters
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
    }else if (!isValidEmail(email)) {
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
      console.log("Logged in!");
      navigate("/pricing");
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.response?.data?.detail || "Login failed");
    }
  };

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