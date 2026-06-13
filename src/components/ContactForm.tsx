import React, { useState, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle, Mail, MapPin, AppWindow, ArrowRight, ShieldCheck, MailCheck, Instagram, Linkedin } from 'lucide-react';
import { ContactSubmission } from '../types';
import { SOCIAL_LINKS } from '../data';
import { getApiUrl } from '../api';

interface ContactFormProps {
  sectionData?: {
    title?: string;
    subtitle?: string;
    description?: string;
  };
}

export default function ContactForm({ sectionData }: ContactFormProps) {
  const subtitle = sectionData?.subtitle || 'Reach Out';
  const title = sectionData?.title || "Let's make something remarkable.";
  const description = sectionData?.description || "Reach out for bespoke branding initiatives, scientific illustrations, character mascot design, interactive comic strips, and creative communication strategy. Let's make your story simple and memorable.";

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<ContactSubmission | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Field guards
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg('Please specify your name, email, and detailed message.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(getApiUrl('/api/inquiries'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitted({
          ...formData,
          timestamp: new Date().toLocaleTimeString(),
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch (err: any) {
      console.error('Inquiry submit error:', err);
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-white border-t border-neutral-150 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Information & Social Contacts Panel */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <span className="font-sans text-[10px] text-neutral-400 uppercase tracking-[0.25em] font-bold block mb-3">
                {subtitle}
              </span>
              <h2 className="font-sans font-light text-3xl sm:text-4xl text-neutral-900 tracking-tighter leading-tight mb-5 uppercase">
                {title}
              </h2>
              <p className="font-sans text-neutral-500 font-medium text-sm leading-relaxed mb-8">
                {description}
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <span className="p-2.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="font-sans text-[9px] uppercase text-neutral-400 block font-bold tracking-wider">Digital Inbox</span>
                    <a
                      href="mailto:bharadwajpreetham@gmail.com"
                      className="font-sans text-xs sm:text-sm text-neutral-900 hover:text-neutral-500 font-semibold transition-colors"
                    >
                      bharadwajpreetham@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <span className="p-2.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="font-sans text-[9px] uppercase text-neutral-400 block font-bold tracking-wider">Operation Base</span>
                    <span className="font-sans text-xs sm:text-sm text-neutral-800 font-semibold">
                      Mumbai, India
                    </span>
                  </div>
                </div>


              </div>

              {/* Direct Connect Yellow Pills */}
              <div className="mt-8 pt-6 border-t border-neutral-100">
                <span className="font-sans text-[10px] text-neutral-400 uppercase tracking-widest font-bold block mb-3">
                  Direct Connect
                </span>
                <div className="flex flex-col gap-2">
                  {SOCIAL_LINKS.filter(s => s.name === 'Instagram' || s.name === 'LinkedIn').map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 bg-neutral-50 hover:bg-yellow-300 text-neutral-950 border border-neutral-200 hover:border-neutral-900 transition-all duration-300 rounded-none flex items-center justify-between text-xs font-bold uppercase cursor-pointer shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        {link.name === 'Instagram' ? <Instagram className="w-4 h-4 text-neutral-700" /> : <Linkedin className="w-4 h-4 text-neutral-700" />}
                        Connect on {link.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-neutral-100 mt-8 hidden lg:block">
              <span className="font-sans text-[9px] text-neutral-400 uppercase tracking-widest block mb-1 font-bold">
                Security Guarantee
              </span>
              <p className="font-sans text-neutral-400 text-[11px] leading-relaxed flex items-start gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-neutral-800 shrink-0 mt-0.5" />
                This contact channel is completely encrypted. Your personal email addresses will never be shared or used for spam.
              </p>
            </div>
          </div>

          {/* Contact Input Panel */}
          <div className="lg:col-span-8">
            <div className="bg-neutral-50 border border-neutral-200 p-8 sm:p-10 rounded-none relative overflow-hidden shadow-none">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="contact-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleFormSubmit}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="font-sans text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Your Name"
                          className="w-full bg-white border border-neutral-200 focus:border-black px-4 py-3 rounded-none text-sm outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-sans text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="client@domain.com"
                          className="w-full bg-white border border-neutral-200 focus:border-black px-4 py-3 rounded-none text-sm outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-sans text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Project Collaboration Brief"
                        className="w-full bg-white border border-neutral-200 focus:border-black px-4 py-3 rounded-none text-sm outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-sans text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                        Project Details & Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        placeholder="I want to collaborate on custom designs for an upcoming cycle..."
                        className="w-full bg-white border border-neutral-200 focus:border-black px-4.5 py-3.5 rounded-none text-sm outline-none transition-colors resize-y"
                      />
                    </div>

                    {errorMsg && (
                      <div className="p-4 bg-red-50 text-red-700 rounded-none text-xs leading-relaxed border border-red-100">
                        {errorMsg}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-8 py-3.5 bg-[#FFDF20] text-black border border-neutral-950 hover:!bg-neutral-950 hover:!text-white disabled:bg-neutral-200 font-sans text-xs tracking-widest uppercase flex items-center justify-center gap-2.5 rounded-none transition-all duration-300 cursor-pointer font-bold shadow-md"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Dispatching Message...
                          </>
                        ) : (
                          <>
                            Submit Inquiry <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="contact-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <div className="w-16 h-16 bg-neutral-100 rounded-none border border-neutral-200 text-black flex items-center justify-center mb-6">
                      <MailCheck className="w-8 h-8" />
                    </div>

                    <h3 className="font-sans font-light text-neutral-900 text-xl tracking-tight mb-2 uppercase font-medium">
                      Inquiry Dispatched Successfully!
                    </h3>
                    <p className="font-sans text-neutral-500 text-sm max-w-md leading-relaxed mb-6 font-medium">
                      Thank you, <strong>{submitted.name}</strong>. Your message was formatted and packed securely. Preetham receives these inquiries directly at <span className="text-black font-semibold">{submitted.email}</span>.
                    </p>

                    <div className="bg-white border border-neutral-200 rounded-none p-5 text-left w-full max-w-md shadow-none text-xs space-y-2 mb-8">
                      <div className="flex border-b border-neutral-100 pb-1.5">
                        <span className="font-sans text-neutral-400 w-20 uppercase tracking-widest font-bold text-[9px]">Subject:</span>
                        <span className="font-sans font-bold text-neutral-800 uppercase tracking-tight">{submitted.subject || 'Inquiry'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-sans text-neutral-400 w-20 uppercase tracking-widest font-bold text-[9px]">Message:</span>
                        <p className="font-sans text-neutral-600 italic leading-relaxed">{submitted.message}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSubmitted(null)}
                      className="px-6 py-3 bg-[#FFDF20] text-black border border-neutral-950 hover:!bg-neutral-950 hover:!text-white rounded-none font-sans text-[10px] tracking-widest uppercase flex items-center gap-1.5 transition-all duration-300 cursor-pointer font-bold shadow-md"
                    >
                      Send Another Message <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
