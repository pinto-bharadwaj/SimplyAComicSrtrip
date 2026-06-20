import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import Header from './components/Header';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import Experience from './components/Experience';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import CmsDashboard from './components/CmsDashboard';
import { BRAND_STORY, IMAGES } from './data';
import { Sparkles, ArrowRight, Paintbrush, Star, PenTool, Check } from 'lucide-react';
import { getApiUrl } from './api';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dynamic API state holding sections edits and guest messages
  const [sections, setSections] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [newComment, setNewComment] = useState({ name: '', text: '', rating: 5 });
  const [commentSuccess, setCommentSuccess] = useState('');
  const [commentError, setCommentError] = useState('');

  // Fetch sections and comments in response to updates
  const fetchSections = async () => {
    try {
      const res = await fetch(getApiUrl('/api/sections?t=' + Date.now()), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      }
    } catch (err) {
      console.error('Failed to load sections dynamic state:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(getApiUrl('/api/comments?t=' + Date.now()), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to load comments dynamic state:', err);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchComments();
  }, [refreshTrigger]);

  // Dynamic fallback translator
  const getSection = (id: string, defaults: { title: string; subtitle: string; description: string; image?: string }) => {
    const matched = sections.find((s: any) => s.id === id);
    return {
      title: matched?.title || defaults.title,
      subtitle: matched?.subtitle || defaults.subtitle,
      description: matched?.description || defaults.description,
      image: matched?.image || defaults.image,
    };
  };

  // Submission handler for visitor comments
  const handleAddCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCommentError('');
    setCommentSuccess('');

    if (!newComment.name.trim() || !newComment.text.trim()) {
      setCommentError('Please enter both your name and comment text.');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const res = await fetch(getApiUrl('/api/comments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComment),
      });

      if (res.ok) {
        setCommentSuccess('Thank you! Your comment has been posted successfully.');
        setNewComment({ name: '', text: '', rating: 5 });
        fetchComments();
      } else {
        const data = await res.json();
        setCommentError(data.error || 'Failed to submit comment. Please check inputs.');
      }
    } catch (err) {
      setCommentError('Server request error. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Smooth scroll helper suited to web container iframe layout
  const handleNavigationChange = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Dynamic Section Render Engine
  const renderSection = (sec: any) => {
    switch (sec.id) {
      case 'hero':
        return (
          <div key={sec.id} id="hero">
            <Hero
              onExplorePortfolio={() => handleNavigationChange('portfolio')}
              onExploreExperience={() => handleNavigationChange('contact')}
              sectionData={sec}
            />
          </div>
        );
        
      case 'bio':
        return (
          <div key={sec.id}>
            <section id="bio" className="py-10 md:py-14 bg-neutral-50 border-t border-b border-neutral-200 overflow-hidden font-sans">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-14">
                
                {/* Custom generated illustration item - Brand Branding Highlight */}
                <div className="lg:col-span-4 relative group flex justify-center">
                  <div className="absolute inset-0 bg-neutral-200/50 blur-xl filter group-hover:scale-105 transition-transform duration-500 rounded-none" />
                  <motion.div
                    initial={{ opacity: 0, rotate: -2 }}
                    whileInView={{ opacity: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    className="relative w-full max-w-[280px] min-h-[280px] h-auto rounded-none overflow-hidden border border-neutral-200 bg-white shadow-none p-4 flex flex-col justify-center"
                  >
                    {/* Graphic container showing beautiful dynamic custom mockup */}
                    <div className="w-[240px] h-[240px] flex items-center justify-center overflow-hidden bg-neutral-50 rounded-none border border-neutral-100 mx-auto">
                      <img
                        src="/src/assets/images/regenerated_image_1780754399041.jpg"
                        alt="Simply a Comic Strip Logo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback source check if the dynamic URL is broken or placeholder
                          (e.target as HTMLImageElement).src = IMAGES.simplyComical;
                        }}
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Long form storytelling */}
                <div className="lg:col-span-8 flex flex-col justify-center">
                  <span className="font-sans text-[10px] text-neutral-400 uppercase tracking-widest font-bold block mb-2">
                    {sec.subtitle || 'Philosophical Stance'}
                  </span>
                  <h3 className="font-sans font-light text-2xl sm:text-3xl text-neutral-900 tracking-tighter leading-snug mb-6 uppercase">
                    {sec.title}
                  </h3>
                  
                  <p className="font-sans text-neutral-600 text-xs sm:text-sm md:text-base leading-relaxed mb-6 font-medium">
                    {sec.description}
                  </p>

                  <div className="flex flex-wrap gap-x-8 gap-y-4 pt-6 border-t border-neutral-200">
                    <div className="flex flex-col">
                      <span className="font-sans text-[22px] font-light text-neutral-950 tracking-tighter">2023</span>
                      <span className="font-sans text-[9px] text-neutral-400 uppercase tracking-widest mt-0.5 font-bold">Established "Simply a Comic Strip"</span>
                    </div>
                  </div>
                </div>

              </div>
            </section>
            
            {/* Gallery follows Bio Spotlight Section */}
            <Gallery refreshTrigger={refreshTrigger} />
          </div>
        );
        
      case 'experience_header':
        return (
          <div key={sec.id} id="experience">
            <Experience sectionData={sec} />
          </div>
        );
        
      case 'contact_header':
        return (
          <div key={sec.id} id="contact">
            {/* Dynamic Visitor Messages, Reviews & Comments Section precedes Contact Form */}
            <section id="reviews" className="py-20 bg-neutral-50/50 border-t border-b border-neutral-100 font-sans">
              <div className="max-w-7xl mx-auto px-6">
                <div className="border-b border-neutral-200 pb-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <span className="font-sans text-[9px] text-neutral-400 uppercase tracking-[0.25em] font-bold block mb-2.5">
                      Visitor Log & Feedback
                    </span>
                    <h2 className="font-sans font-black text-2xl sm:text-3xl text-neutral-900 tracking-tighter uppercase">
                      Reviews & Conversations
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-sans text-neutral-500 bg-white border border-neutral-200 px-4 py-2 self-start ring-1 ring-neutral-100">
                    <span className="font-mono text-neutral-900 font-bold">{comments.length}</span>
                    <span className="uppercase tracking-wider text-[10px]">Entries Posted</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  
                  {/* Left Column: Active Review Form */}
                  <div className="lg:col-span-5 bg-white border border-neutral-200 p-6 md:p-8 shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                    <h3 className="font-sans font-bold text-xs text-[#111111] uppercase tracking-widest mb-6 flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-neutral-900" />
                      Write a Comment or Review
                    </h3>

                    <form onSubmit={handleAddCommentSubmit} className="space-y-4">
                      {commentError && (
                        <div className="p-3 border border-red-350 bg-red-50 text-red-800 font-sans text-xs flex items-center gap-2">
                          <span>{commentError}</span>
                        </div>
                      )}

                      {commentSuccess && (
                        <div className="p-3 border border-green-250 bg-green-50 text-green-800 font-sans text-xs flex items-center gap-2">
                          <Check className="w-4 h-4 shrink-0 text-green-600 bg-green-150 p-0.5 rounded-full" />
                          <span>{commentSuccess}</span>
                        </div>
                      )}

                      <div>
                        <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Your Name / Identity
                        </label>
                        <input
                          type="text"
                          required
                          value={newComment.name}
                          onChange={(e) => setNewComment(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-neutral-50 border border-neutral-200 p-2.5 font-sans text-xs focus:outline-none focus:border-neutral-950 text-neutral-800"
                          placeholder="e.g. Maya Lin"
                        />
                      </div>

                      <div>
                        <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-2">
                          Rating Score
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewComment(prev => ({ ...prev, rating: star }))}
                              className="p-1 cursor-pointer transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= newComment.rating 
                                    ? 'text-yellow-400 fill-yellow-400 stroke-neutral-950' 
                                    : 'text-neutral-200 stroke-neutral-400'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Your Review / Message
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={newComment.text}
                          onChange={(e) => setNewComment(prev => ({ ...prev, text: e.target.value }))}
                          className="w-full bg-neutral-50 border border-neutral-200 p-2.5 font-sans text-xs focus:outline-none focus:border-neutral-950 leading-relaxed text-neutral-700"
                          placeholder="Describe your collaborative experience or leave a short critique..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingComment}
                        className="w-full bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white font-sans text-xs font-bold uppercase py-3.5 tracking-widest border border-neutral-950 transition-all duration-300 cursor-pointer text-center shadow-md"
                      >
                        {isSubmittingComment ? 'Submitting Message...' : 'Post Public Review'}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Interactive Comments Display Stream */}
                  <div className="lg:col-span-7 space-y-4">
                    {comments.length === 0 ? (
                      <div className="bg-white border border-neutral-150 p-16 text-center text-neutral-400 font-sans text-xs">
                        Be the first to post a review or feedback! Fill out the form on the left.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2 scrollbar-thin">
                        {comments.map((comment) => (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-neutral-200 p-5 hover:border-neutral-450 transition-all shadow-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-neutral-100 text-neutral-600 border border-neutral-200">
                                  <span className="text-[10px] font-bold font-sans uppercase">
                                    {comment.name?.substring(0, 2).toUpperCase() || 'VI'}
                                  </span>
                                </span>
                                <span className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-900">
                                  {comment.name}
                                </span>
                              </div>
                              <span className="font-sans text-[10px] text-neutral-400 font-medium">
                                {comment.date ? new Date(comment.date).toLocaleDateString() : 'Just now'}
                              </span>
                            </div>

                            <div className="flex items-center gap-0.5 mb-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= (comment.rating || 5) 
                                      ? 'text-yellow-400 fill-yellow-400 stroke-neutral-950' 
                                      : 'text-neutral-150 stroke-neutral-300'
                                  }`}
                                />
                              ))}
                            </div>

                            <p className="font-sans text-neutral-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line italic">
                              "{comment.text}"
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </section>
            
            <ContactForm sectionData={sec} />
          </div>
        );
        
      default:
        // Render custom sections dynamically based on layoutTemplate
        const template = sec.layoutTemplate || 'centered';
        
        if (template === 'hero') {
          return (
            <section key={sec.id} id={sec.id} className="relative py-16 bg-white overflow-hidden font-sans border-b border-neutral-100">
              <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-yellow-100/10 blur-3xl pointer-events-none" />
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 relative z-10 w-full gap-12 items-center">
                <div className={sec.image ? 'lg:col-span-7 flex flex-col justify-center' : 'lg:col-span-12 flex flex-col justify-center'}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-[2px] bg-yellow-400" />
                    <span className="font-sans text-[10px] tracking-[0.3em] text-neutral-400 uppercase font-bold">{sec.subtitle}</span>
                  </div>
                  <h2 className="font-sans font-black text-3xl sm:text-4xl text-neutral-900 tracking-tighter leading-tight mb-6 uppercase">{sec.title}</h2>
                  <p className="font-sans text-neutral-500 font-medium text-sm sm:text-base leading-relaxed mb-8">{sec.description}</p>
                </div>
                {sec.image && (
                  <div className="lg:col-span-5 flex items-center justify-center relative">
                    <div className="absolute inset-4 bg-yellow-400 border-[3px] border-neutral-950 scale-100 rounded-full -rotate-4 shadow-md pointer-events-none" />
                    <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-[4px] border-neutral-950 bg-white flex items-center justify-center shadow-xl">
                      <img src={sec.image} alt={sec.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        } else if (template === 'bio') {
          return (
            <section key={sec.id} id={sec.id} className="py-14 bg-neutral-50 border-t border-b border-neutral-200 overflow-hidden font-sans">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-14">
                {sec.image && (
                  <div className="lg:col-span-4 relative group flex justify-center">
                    <div className="absolute inset-0 bg-neutral-200/50 blur-xl rounded-none" />
                    <div className="relative w-full max-w-[280px] min-h-[280px] h-auto rounded-none overflow-hidden border border-neutral-200 bg-white p-4 flex flex-col justify-center">
                      <div className="w-[240px] h-[240px] flex items-center justify-center overflow-hidden bg-neutral-50 rounded-none border border-neutral-100 mx-auto">
                        <img src={sec.image} alt={sec.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  </div>
                )}
                <div className={sec.image ? 'lg:col-span-8 flex flex-col justify-center' : 'lg:col-span-12 flex flex-col justify-center'}>
                  <span className="font-sans text-[10px] text-neutral-400 uppercase tracking-widest font-bold block mb-2">{sec.subtitle}</span>
                  <h3 className="font-sans font-light text-2xl sm:text-3xl text-neutral-900 tracking-tighter leading-snug mb-6 uppercase">{sec.title}</h3>
                  <p className="font-sans text-neutral-600 text-xs sm:text-sm md:text-base leading-relaxed mb-6 font-medium">{sec.description}</p>
                </div>
              </div>
            </section>
          );
        } else {
          return (
            <section key={sec.id} id={sec.id} className="py-20 bg-white border-b border-neutral-150 font-sans text-center">
              <div className="max-w-3xl mx-auto px-6">
                <span className="font-sans text-[10px] text-neutral-400 uppercase tracking-[0.3em] font-bold block mb-3">{sec.subtitle}</span>
                <h2 className="font-sans font-light text-3xl sm:text-4xl text-neutral-900 tracking-tighter leading-tight mb-6 uppercase">{sec.title}</h2>
                <p className="font-sans text-neutral-500 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8">{sec.description}</p>
                {sec.image && (
                  <div className="max-w-md mx-auto border border-neutral-200 p-2 bg-neutral-50 mt-4">
                    <img src={sec.image} alt={sec.title} className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </section>
          );
        }
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans">
      
      {/* 1. Header Node */}
      <Header activeSection={activeSection} onNavigate={handleNavigationChange} />

      {/* Render All Sections Dynamically */}
      {sections.length === 0 ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        sections.map(renderSection)
      )}

      {/* Dynamic Portfolio CMS Management Console */}
      <CmsDashboard onSaveSuccess={() => setRefreshTrigger(prev => prev + 1)} />

    </div>
  );
}
