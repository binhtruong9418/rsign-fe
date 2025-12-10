
import React from 'react';
import { Link } from 'react-router-dom';
import { FileSignature, ShieldCheck, Zap, CheckCircle } from 'lucide-react';
import Header from '../components/Header';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow">
            {/* Hero Section */}
            <div className="relative pt-24 pb-32 flex content-center items-center justify-center min-h-[60vh] bg-gradient-to-b from-secondary-50 to-white overflow-hidden">
                <div className="container relative mx-auto px-4">
                    <div className="items-center flex flex-wrap">
                        <div className="w-full lg:w-8/12 px-4 mx-auto text-center">
                            <div className="mb-8">
                                <span className="text-primary-600 font-semibold tracking-wider uppercase text-sm bg-primary-50 px-3 py-1 rounded-full">Secure e-Signatures</span>
                            </div>
                            <h1 className="text-secondary-900 font-bold text-5xl sm:text-6xl leading-tight mb-6 font-heading">
                                Sign Documents, <br/>
                                <span className="text-primary-600">Seamlessly & Securely.</span>
                            </h1>
                            <p className="mt-4 text-xl text-secondary-600 mb-10 max-w-2xl mx-auto">
                                RSign provides a fast, legally binding way to sign your documents electronically. 
                                Trusted by professionals worldwide.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link to="/dashboard" className="btn-primary text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform transition hover:-translate-y-1">
                                    Start Signing for Free
                                </Link>
                                <Link to="/login" className="btn-secondary text-lg px-8 py-4 rounded-xl">
                                    View Demo
                                </Link>
                            </div>
                            <div className="mt-12 flex justify-center gap-8 text-secondary-500 text-sm font-medium">
                                <span className="flex items-center gap-2"><CheckCircle size={16} className="text-accent-500"/> No credit card required</span>
                                <span className="flex items-center gap-2"><CheckCircle size={16} className="text-accent-500"/> Legally binding</span>
                                <span className="flex items-center gap-2"><CheckCircle size={16} className="text-accent-500"/> Encrypted storage</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <section className="py-20 bg-secondary-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-secondary-900 mb-4">Why Choose RSign?</h2>
                        <p className="text-secondary-600 max-w-2xl mx-auto">Everything you need to manage your document workflows efficiently and securely.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="card hover:shadow-md transition-shadow duration-300 border-t-4 border-t-primary-500">
                            <div className="text-primary-600 p-3 inline-flex items-center justify-center w-14 h-14 mb-6 rounded-lg bg-primary-50">
                                <Zap size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Fast & Efficient</h3>
                            <p className="text-secondary-600 leading-relaxed">
                                Sign and send documents in minutes. No more printing, scanning, or faxing. Automate your workflow today.
                            </p>
                        </div>

                        <div className="card hover:shadow-md transition-shadow duration-300 border-t-4 border-t-primary-500">
                            <div className="text-primary-600 p-3 inline-flex items-center justify-center w-14 h-14 mb-6 rounded-lg bg-primary-50">
                                <FileSignature size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Legally Binding</h3>
                            <p className="text-secondary-600 leading-relaxed">
                                Our electronic signatures are fully compliant with e-signature laws (ESIGN, UETA, eIDAS) globally.
                            </p>
                        </div>

                        <div className="card hover:shadow-md transition-shadow duration-300 border-t-4 border-t-primary-500">
                            <div className="text-primary-600 p-3 inline-flex items-center justify-center w-14 h-14 mb-6 rounded-lg bg-primary-50">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
                            <p className="text-secondary-600 leading-relaxed">
                                Bank-grade encryption for your documents. Your data privacy and security are our top priorities.
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
