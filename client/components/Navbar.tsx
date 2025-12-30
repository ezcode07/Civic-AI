"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  transparent?: boolean;
}

export default function Navbar({ transparent = false }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  useEffect(() => {
    if (!transparent) return;

    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transparent]);

  const navbarClasses = transparent
    ? `fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-sm" : "bg-transparent"
      }`
    : "sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm";

  return (
    <nav className={navbarClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Civic AI
            </h1>
          </Link>
          
          {/* Navigation buttons */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  // Authenticated user navigation
                  <>
                    <Link
                      href="/dashboard"
                      className={`px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer ${
                        pathname === "/dashboard"
                          ? "bg-gray-100 text-gray-900 border border-gray-300"
                          : "text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-white hover:border-gray-400 hover:shadow-sm"
                      }`}
                    >
                      Dashboard
                    </Link>
                    
                    {/* User Profile & Logout */}
                    <div className="flex items-center space-x-3">
                      {user && (
                        <span className="text-sm text-gray-600 hidden md:block">
                          {user.name}
                        </span>
                      )}
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <button
                        onClick={logout}
                        className="px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  // Unauthenticated user navigation
                  <>
                    <Link
                      href="/login"
                      className={`px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer ${
                        pathname === "/login"
                          ? "bg-gray-100 text-gray-900 border border-gray-300"
                          : "text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-white hover:border-gray-400 hover:shadow-sm"
                      }`}
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className={`px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer ${
                        pathname === "/signup"
                          ? "bg-gray-800 text-white shadow-lg"
                          : "bg-black text-white hover:bg-gray-800 hover:shadow-lg hover:scale-105"
                      }`}
                    >
                      {pathname === "/" ? "Get Started" : "Sign Up"}
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}