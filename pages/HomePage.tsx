
import React from 'react';
import { Link } from 'react-router-dom';
import { FileSignature, ShieldCheck, Zap } from 'lucide-react';
import Header from '../components/Header';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
            <div className="relative pt-16 pb-32 flex content-center items-center justify-center min-h-[75vh]">
                <div className="absolute top-0 w-full h-full bg-center bg-cover"
                     style={{backgroundImage: "url('https://picsum.photos/1920/1080?grayscale&blur=2')"}}>
                    <span id="blackOverlay" className="w-full h-full absolute opacity-75 bg-black"></span>
                </div>
                <div className="container relative mx-auto">
                    <div className="items-center flex flex-wrap">
                        <div className="w-full lg:w-6/12 px-4 ml-auto mr-auto text-center">
                            <div>
                                <h1 className="text-white font-semibold text-5xl">
                                    Sign Documents, Seamlessly.
                                </h1>
                                <p className="mt-4 text-lg text-gray-300">
                                    RSign provides a fast, secure, and legally binding way to sign your documents electronically. Get started in seconds.
                                </p>
                                <Link to="/dashboard" className="mt-8 inline-block bg-brand-primary text-white font-bold py-3 px-8 rounded-full hover:bg-brand-secondary transition-colors">
                                    Go to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <section className="pb-20 bg-dark-card -mt-24">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap">
                        <div className="lg:pt-12 pt-6 w-full md:w-4/12 px-4 text-center">
                            <div className="relative flex flex-col min-w-0 break-words bg-dark-bg w-full mb-8 shadow-lg rounded-lg">
                                <div className="px-4 py-5 flex-auto">
                                    <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-brand-primary">
                                        <Zap />
                                    </div>
                                    <h6 className="text-xl font-semibold">Fast & Efficient</h6>
                                    <p className="mt-2 mb-4 text-dark-text-secondary">
                                        Sign and send documents in minutes. No more printing, scanning, or faxing.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-4/12 px-4 text-center">
                            <div className="relative flex flex-col min-w-0 break-words bg-dark-bg w-full mb-8 shadow-lg rounded-lg">
                                <div className="px-4 py-5 flex-auto">
                                    <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-brand-secondary">
                                        <FileSignature />
                                    </div>
                                    <h6 className="text-xl font-semibold">Legally Binding</h6>
                                    <p className="mt-2 mb-4 text-dark-text-secondary">
                                        Our electronic signatures are compliant with e-signature laws around the world.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 w-full md:w-4/12 px-4 text-center">
                            <div className="relative flex flex-col min-w-0 break-words bg-dark-bg w-full mb-8 shadow-lg rounded-lg">
                                <div className="px-4 py-5 flex-auto">
                                    <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-teal-400">
                                        <ShieldCheck />
                                    </div>
                                    <h6 className="text-xl font-semibold">Secure & Private</h6>
                                    <p className="mt-2 mb-4 text-dark-text-secondary">
                                        Your documents are encrypted and stored securely. Your privacy is our priority.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>
  );
};

export default HomePage;
