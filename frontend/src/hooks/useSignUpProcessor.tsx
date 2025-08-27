import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useFieldValidation } from "./useFieldValidation";
import {toSnakeCase, toCamelCase} from "../utils/caseUtils";
import type { UserCreateRequest, UserResponse } from "../types";

export const useSignUpProcessor = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // server error
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const { validationErrors, setValidationError, resetValidationErrors } =
    useFieldValidation();

  const handleClickShowPassword = () => setShowPassword((prev) => !prev);

  // Utils
  const isValidEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignUpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    resetValidationErrors();

    let hasError = false;

    if (!firstName.trim()) {
      setValidationError("firstName", "First name is required");
      hasError = true;
    }

    if (!lastName.trim()) {
      setValidationError("lastName", "Last name is required");
      hasError = true;
    }

    if (!organization.trim()) {
      setValidationError("organization", "Organization is required");
      hasError = true;
    }

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
      setValidationError("password", "Password must be at least 8 characters");
      hasError = true;
    }

    if (hasError) return;

    try {
      const payload = toSnakeCase<UserCreateRequest>({ firstName, lastName, organization, email, password });
      
      const response = await axios.post(
        "http://localhost:8000/api/v1/auth/register",
        payload,
        { withCredentials: true }
      );

      setAccessToken(response.data.access_token);
      const user = toCamelCase<UserResponse>(response.data.user);
      console.log("Registered user:", user);
      navigate("/verification-sent", { state: { from: "sign-up", email } });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    organization,
    setOrganization,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    handleClickShowPassword,
    handleSignUpSubmit,
    validationErrors,
    error,
  };
};