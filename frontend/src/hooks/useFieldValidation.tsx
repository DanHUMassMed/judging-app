import { useState } from "react";

type ValidationErrors = Record<string, string>;

export const useFieldValidation = () => {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Set a specific validation error
  const setValidationError = (field: string, message: string) => {
    setValidationErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  };

  // Clear a specific validation error
  const clearValidationError = (field: string) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Reset all validation errors
  const resetValidationErrors = () => {
    setValidationErrors({});
  };

  return {
    validationErrors,
    resetValidationErrors,
    setValidationError,
    clearValidationError,
  };
};