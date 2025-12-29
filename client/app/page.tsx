"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar transparent={true} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-screen text-center py-16 md:py-20">
            {/* Hero Content Container */}
            <div className="max-w-4xl mx-auto animate-fade-in-up">
              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 md:mb-8 leading-tight tracking-tight text-center">
                AI-Powered Civic Assistant for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Everyone
                </span>
              </h1>
              
              {/* Subheading */}
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed font-light text-center">
                Understand government schemes, legal notices, and public services in simple local language.
              </p>
              
              {/* CTA Button Group */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                {/* Primary CTA */}
                <Link 
                  href="/dashboard" 
                  className="group px-8 py-4 md:px-10 md:py-5 bg-black text-white rounded-full text-lg md:text-xl font-semibold hover:bg-gray-800 hover:shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center">
                    Try Civic-AI
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                
                {/* Secondary CTA */}
                <a 
                  href="#contact" 
                  className="px-8 py-4 md:px-10 md:py-5 text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-full text-lg md:text-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 w-full sm:w-auto"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" data-animate className={`py-20 md:py-28 bg-gray-50 transition-all duration-1000 ${isVisible.problem ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">The Problem</h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Current barriers preventing citizens from accessing government services
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                icon: (
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: "Complex Language",
                description: "Government schemes and legal notices are written in complex language that's hard to understand.",
                color: "red"
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Confusing Processes",
                description: "Citizens struggle to understand eligibility criteria and application processes.",
                color: "orange"
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                ),
                title: "Language Barriers",
                description: "Language barriers exclude rural and non-English speaking users from accessing services.",
                color: "blue"
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Middleman Dependency",
                description: "Dependence on middlemen leads to misinformation, delays, and additional costs.",
                color: "purple"
              }
            ].map((item, index) => (
              <div key={index} className="group bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-gray-300 hover:-translate-y-2 transition-all duration-300">
                <div className={`w-14 h-14 md:w-16 md:h-16 bg-${item.color}-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" data-animate className={`py-20 md:py-28 bg-white transition-all duration-1000 ${isVisible.solution ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">Our Solution</h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-light">
              AI-powered technology that makes government services accessible to everyone
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: "AI-Powered Simplification",
                description: "Uses advanced AI to simplify complex government and legal information into easy-to-understand language.",
                color: "green"
              },
              {
                icon: (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12h6m-6 4h6" />
                  </svg>
                ),
                title: "Multiple Input Methods",
                description: "Supports image upload, voice queries, and text input for maximum accessibility and convenience.",
                color: "blue"
              },
              {
                icon: (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                ),
                title: "Local Language Support",
                description: "Explains content in simple, local languages to break down communication barriers.",
                color: "purple"
              },
              {
                icon: (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Verified Information",
                description: "Provides accurate, verified information directly from official government sources.",
                color: "indigo"
              }
            ].map((item, index) => (
              <div key={index} className="group text-center hover:-translate-y-2 transition-all duration-300">
                <div className={`w-20 h-20 md:w-24 md:h-24 bg-${item.color}-100 rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                  {item.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg max-w-sm mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" data-animate className={`py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white transition-all duration-1000 ${isVisible.contact ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">Contact Us</h2>
            <p className="text-lg md:text-xl text-gray-600 font-light">Have questions? We'd love to hear from you.</p>
          </div>
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="group">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 md:px-5 md:py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base md:text-lg group-hover:border-gray-400 placeholder-gray-600"
                    placeholder="Your full name"
                  />
                </div>
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 md:px-5 md:py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base md:text-lg group-hover:border-gray-400 placeholder-gray-600"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              <div className="group">
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-3">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 md:px-5 md:py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base md:text-lg resize-none group-hover:border-gray-400 placeholder-gray-600"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="group w-full bg-black text-white py-4 md:py-5 px-8 rounded-xl text-lg md:text-xl font-semibold hover:bg-gray-800 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <span className="flex items-center justify-center">
                  Send Message
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
            <div className="md:col-span-1">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Civic-AI</h3>
              <p className="text-gray-400 leading-relaxed text-base md:text-lg max-w-md">
                AI-powered civic assistant making government services accessible to everyone in simple, local language.
              </p>
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base md:text-lg">Home</a></li>
                <li><a href="#solution" className="text-gray-400 hover:text-white transition-colors duration-200 text-base md:text-lg">Features</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors duration-200 text-base md:text-lg">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base md:text-lg">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base md:text-lg">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base md:text-lg">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 md:pt-12 text-center">
            <p className="text-gray-400 text-base md:text-lg">&copy; 2024 Civic-AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}