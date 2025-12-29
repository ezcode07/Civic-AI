"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        const result = await signup(formData.fullName, formData.email, formData.password);
        
        if (result.success) {
          // Redirect to dashboard on successful signup
          router.push("/dashboard");
        } else {
          // Show error message
          setErrors({ general: result.error || "Account creation failed. Please try again." });
        }
      } catch (error) {
        console.error("Signup error:", error);
        setErrors({ general: "An unexpected error occurred. Please try again." });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isFormValid = 
    formData.fullName.trim() && 
    formData.email.trim() && 
    formData.password.trim() && 
    formData.confirmPassword.trim();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4 tracking-tight">
              Create your Civic-AI account
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-light">
              Get started in seconds
            </p>
          </div>

          {/* Sign Up Form */}
          <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-gray-100">
            {/* General Error Message */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 md:px-5 md:py-4 border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-base md:text-lg placeholder-gray-600 ${
                    errors.fullName
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                  }`}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 md:px-5 md:py-4 border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-base md:text-lg placeholder-gray-600 ${
                    errors.email
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                  }`}
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 md:px-5 md:py-4 border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-base md:text-lg placeholder-gray-600 ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                  }`}
                  placeholder="Create a password (min. 6 characters)"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-3">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 md:px-5 md:py-4 border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-base md:text-lg placeholder-gray-600 ${
                    errors.confirmPassword
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                  }`}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`w-full py-4 md:py-5 px-8 rounded-xl text-lg md:text-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isFormValid && !isLoading
                    ? "bg-black text-white hover:bg-gray-800 hover:shadow-xl hover:scale-[1.02] focus:ring-gray-500"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <span className="flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Sign Up
                      {isFormValid && (
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-base md:text-lg text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-black hover:text-gray-800 transition-colors duration-200 underline underline-offset-2"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}