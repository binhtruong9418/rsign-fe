
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Layout, PenTool, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import Header from '../components/Header';

const HomePage: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-secondary-50 to-white">
            <Header />
            <main className="flex-grow">
                {/* Hero Section */}
                <div className="relative pt-32 pb-24 flex items-center justify-center min-h-[75vh]">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="container relative mx-auto px-4 z-10">
                        <div className="max-w-5xl mx-auto text-center">
                            {/* Badge */}
                            <div className="mb-8 inline-block">
                                <span className="inline-flex items-center gap-2 text-primary-600 font-semibold tracking-wide uppercase text-sm bg-primary-50 px-5 py-2 rounded-full border-2 border-primary-200 shadow-sm">
                                    <CheckCircle size={16} />
                                    Self-Hosted Digital Signature Platform
                                </span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="text-secondary-900 font-bold text-5xl sm:text-6xl lg:text-7xl leading-tight mb-8 font-heading">
                                Secure Document Signing
                                <br />
                                <span className="text-primary-600">Made Simple</span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-xl sm:text-2xl text-secondary-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                                Self-hosted e-signature solution with authentic handwritten signature technology.
                                Cost-effective, secure, and fully under your control.
                            </p>

                            {/* CTA Button */}
                            <div className="flex justify-center mb-16">
                                <Link
                                    to="/register"
                                    className="group inline-flex items-center gap-3 bg-primary-600 text-white text-lg font-semibold px-10 py-5 rounded-xl shadow-xl hover:shadow-2xl hover:bg-primary-700 transform transition-all duration-200 hover:-translate-y-1"
                                >
                                    Get Started Now
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                                <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-md border border-secondary-200">
                                    <CheckCircle size={20} className="text-accent-500" />
                                    <span className="text-secondary-700 font-medium">Self-Hosted</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-md border border-secondary-200">
                                    <CheckCircle size={20} className="text-accent-500" />
                                    <span className="text-secondary-700 font-medium">Cost-Effective</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-md border border-secondary-200">
                                    <CheckCircle size={20} className="text-accent-500" />
                                    <span className="text-secondary-700 font-medium">Authentic Signatures</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <section className="py-24 bg-white">
                    <div className="container mx-auto px-4">
                        {/* Section Header */}
                        <div className="text-center mb-20">
                            <h2 className="text-4xl sm:text-5xl font-bold text-secondary-900 mb-4">
                                Powerful Features
                            </h2>
                            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
                                Everything you need for secure and efficient document signing
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                            {/* Feature 1 */}
                            <div className="group relative bg-white p-8 rounded-2xl border-2 border-secondary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl"></div>
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-secondary-900">
                                    Document Management
                                </h3>
                                <p className="text-secondary-600 leading-relaxed">
                                    Upload PDFs and manage the complete document lifecycle from creation to completion with ease.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="group relative bg-white p-8 rounded-2xl border-2 border-secondary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl"></div>
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                                    <Layout size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-secondary-900">
                                    Workflow Design
                                </h3>
                                <p className="text-secondary-600 leading-relaxed">
                                    Intuitive drag-and-drop interface to define signature positions and manage signer workflows.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="group relative bg-white p-8 rounded-2xl border-2 border-secondary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl"></div>
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                                    <PenTool size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-secondary-900">
                                    Authentic Signatures
                                </h3>
                                <p className="text-secondary-600 leading-relaxed">
                                    Capture real handwritten signatures with vector stroke technology for maximum authenticity.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="group relative bg-white p-8 rounded-2xl border-2 border-secondary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl"></div>
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                                    <Lock size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-secondary-900">
                                    Self-Hosted Security
                                </h3>
                                <p className="text-secondary-600 leading-relaxed">
                                    Complete data control with self-hosted deployment. Your documents, your infrastructure, your rules.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default HomePage;
