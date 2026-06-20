import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Eye, Tag, Calendar, User, Target, Compass, Award, ExternalLink, X, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { GALLERY_ITEMS } from '../data';
import { ProjectCategory, GalleryItem } from '../types';
import { getApiUrl } from '../api';

interface GalleryProps {
  refreshTrigger?: number;
}

export default function Gallery({ refreshTrigger = 0 }: GalleryProps) {
  const [projects, setProjects] = useState<GalleryItem[]>(GALLERY_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>(ProjectCategory.ALL);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([
    { id: 'all', name: 'All Projects' },
    { id: 'comics', name: 'Comics' },
    { id: 'science_illustrations', name: 'Science Illustrations' },
    { id: 'workshops', name: 'Workshops' },
    { id: 'marketing', name: 'Campaigns & Marketing' },
    { id: 'mascot_design', name: 'Mascot Design' }
  ]);
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [currentComicPageIndex, setCurrentComicPageIndex] = useState(0);

  // Load projects and categories from local JSON CMS database dynamically on load or trigger
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(getApiUrl('/api/projects?t=' + Date.now()), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setProjects(data);
            
            // Sync current active view if it changes during dynamic updates
            if (activeItem) {
              const freshItem = data.find((p: GalleryItem) => p.id === activeItem.id);
              if (freshItem) {
                setActiveItem(freshItem);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic database projects:', err);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch(getApiUrl('/api/categories?t=' + Date.now()), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic categories:', err);
      }
    };

    fetchProjects();
    fetchCategories();
  }, [refreshTrigger]);

  // Keyboard navigation for Comic Reader Carousel
  useEffect(() => {
    if (!isReading || !activeItem || !activeItem.comicPages) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentComicPageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentComicPageIndex((prev) => Math.min(activeItem.comicPages!.length - 1, prev + 1));
      } else if (e.key === 'Escape') {
        setIsReading(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReading, activeItem]);

  const getProjectSortValue = (item: GalleryItem): number => {
    const dateStr = item.details?.date || '';
    if (!dateStr) return 0;
    
    const years = dateStr.match(/\b\d{4}\b/g)?.map(Number) || [];
    const hasPresent = /present/i.test(dateStr);
    
    const startYear = years[0] || 0;
    const endYear = hasPresent ? 2026 : (years[1] || years[0] || 0);
    
    return endYear * 10000 + startYear;
  };

  // Filter and sort logic
  const filteredItems = projects
    .filter((item) => {
      if (selectedCategory === 'all') return true;
      return item.category === selectedCategory;
    })
    .sort((a, b) => {
      return getProjectSortValue(b) - getProjectSortValue(a);
    });

  return (
    <section id="portfolio" className="py-24 bg-white border-t border-neutral-150">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Block with high negative space */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <span className="font-sans text-[10px] tracking-[0.3em] text-neutral-400 uppercase font-bold block mb-3">
              Curated Showcase
            </span>
            <h2 className="font-sans font-light text-3xl sm:text-4xl text-neutral-900 tracking-tighter leading-tight uppercase">
              Selected Creative Works
            </h2>
            <p className="font-sans text-neutral-400 text-sm mt-3 leading-relaxed">
              Explore custom-drawn single-panel comics, viral partners, coherent brand assets, and digital outreach portfolios managed with sleek, creative competence.
            </p>
          </div>

          {/* Filtering Section */}
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-2 md:pb-0">
            <span className="font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5 mr-3">
              Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`font-sans text-[10px] tracking-widest uppercase px-4 py-2 border transition-all duration-300 rounded-none cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'border-yellow-400 bg-yellow-400 text-neutral-950 font-bold shadow-sm'
                    : 'border-neutral-200 bg-white text-neutral-500 hover:border-yellow-400 hover:text-neutral-950'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -8 }}
                className="group cursor-pointer bg-white border border-neutral-200/80 rounded-none overflow-hidden shadow-none hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                onClick={() => setActiveItem(item)}
              >
                {/* Visual Thumbnail */}
                <div 
                  style={{ aspectRatio: item.imageAspectRatio === 'square' ? '1/1' : '4/3' }}
                  className="relative bg-neutral-50 overflow-hidden border-b border-neutral-150 w-full"
                >
                  <div className="absolute inset-0 bg-neutral-950/0 group-hover:bg-neutral-950/15 z-10 transition-colors duration-300 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="opacity-0 group-hover:opacity-100 bg-yellow-400 text-neutral-950 p-3.5 rounded-none shadow-xl z-20 transition-all duration-300 flex items-center gap-2 font-sans text-[10px] tracking-widest font-bold uppercase"
                    >
                      <Eye className="w-3.5 h-3.5 text-neutral-950" />
                      View Study
                    </motion.div>
                  </div>
                  {item.videoUrl ? (
                    <video
                      src={item.videoUrl}
                      poster={item.image}
                      muted
                      loop
                      playsInline
                      autoPlay
                      style={{
                        '--zoom': `${(Number(item.imageZoom) || 100) / 100}`,
                      } as React.CSSProperties}
                      className="w-full h-full object-cover transition-transform duration-550 [transform:scale(var(--zoom))] group-hover:[transform:scale(calc(var(--zoom)*1.08))]"
                    />
                  ) : (
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        '--zoom': `${(Number(item.imageZoom) || 100) / 100}`,
                      } as React.CSSProperties}
                      className="w-full h-full object-cover transition-transform duration-550 filter group-hover:contrast-[1.01] [transform:scale(var(--zoom))] group-hover:[transform:scale(calc(var(--zoom)*1.08))]"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {/* Category Pill Over Image */}
                  <span className="absolute bottom-4 left-4 z-20 font-sans text-[9px] uppercase font-bold tracking-widest bg-yellow-400 text-neutral-950 border border-yellow-400 px-2.5 py-1">
                    {categories.find(c => c.id === item.category)?.name || item.category.replace('_', ' ')}
                  </span>
                </div>

                {/* Card Content Area */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-sans font-light text-lg text-neutral-900 leading-snug group-hover:text-black transition-colors pr-4 mb-1 uppercase tracking-tight">
                      {item.title}
                    </h3>
                    <p className="font-sans text-[10px] font-bold text-neutral-400 tracking-[0.15em] uppercase mb-3">
                      {item.subtitle}
                    </p>
                    <p className="font-sans text-neutral-500 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  {/* Tags Listing */}
                  <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="font-sans text-[10px] tracking-wide text-neutral-400 flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-neutral-300" /> {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="font-mono text-[10px] text-stone-300 font-bold ml-1">
                        +{item.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Detailed Modal Overlay */}
        <AnimatePresence>
          {activeItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setActiveItem(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="bg-white border border-stone-200/80 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative mb-1"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button top-right */}
                <button
                  className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
                  onClick={() => setActiveItem(null)}
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Left Column: Image/Video Representation */}
                  <div 
                    style={{ aspectRatio: activeItem.imageAspectRatio === 'square' ? '1/1' : '4/3' }}
                    className="relative bg-neutral-100 overflow-hidden min-h-[300px] border-b md:border-b-0 md:border-r border-neutral-200 flex items-center justify-center w-full"
                  >
                    {activeItem.videoUrl ? (
                      <video
                        src={activeItem.videoUrl}
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={activeItem.image}
                        alt={activeItem.title}
                        style={{
                          transform: `scale(${(Number(activeItem.imageZoom) || 100) / 100})`,
                        }}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent p-6 text-white pointer-events-none">
                      <span className="font-sans text-[9px] tracking-widest uppercase font-bold bg-yellow-400 text-neutral-950 px-2.5 py-1 mb-2 inline-block">
                        {categories.find(c => c.id === activeItem.category)?.name || activeItem.category.replace('_', ' ')}
                      </span>
                      <h4 className="font-sans font-light text-2xl tracking-tight uppercase">{activeItem.title}</h4>
                      <p className="font-sans text-[10px] tracking-wider text-neutral-300 mt-1 uppercase font-semibold">{activeItem.subtitle}</p>
                    </div>
                  </div>

                  {/* Right Column: Case Study Specs */}
                  <div className="p-8 md:p-10 flex flex-col justify-between gap-6 max-h-[calc(90vh-100px)] overflow-y-auto">
                    <div>
                      {/* Project Header Info */}
                      <span className="font-sans text-[10px] text-neutral-400 uppercase tracking-[0.2em] font-bold block mb-1">
                        Case Study Breakdown
                      </span>
                      <h3 className="font-sans font-light text-2xl tracking-tight text-neutral-900 border-b border-neutral-100 pb-4 mb-4 uppercase">
                        Project Insights
                      </h3>

                      <p className="font-sans text-neutral-500 text-sm leading-relaxed mb-6">
                        {activeItem.description}
                      </p>

                      {/* Read Comic CTA if pages exist */}
                      {activeItem.comicPages && activeItem.comicPages.length > 0 && (
                        <div className="mb-8">
                          <button
                            id="read-comic-cta-button"
                            onClick={() => {
                              setIsReading(true);
                              setCurrentComicPageIndex(0);
                            }}
                            className="w-full flex items-center justify-center gap-3 bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white font-sans text-xs tracking-widest font-bold uppercase py-4 px-6 border-2 border-neutral-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4 shrink-0" />
                            Read Comic Strip ({activeItem.comicPages.length} Pages)
                          </button>
                        </div>
                      )}

                      {/* Client Detail Items */}
                      {activeItem.details && (
                        <div className="space-y-4">
                          {activeItem.details.client && (
                            <div className="flex gap-3">
                              <User className="w-4 h-4 text-neutral-800 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-sans text-[9px] uppercase tracking-widest text-neutral-400 block font-bold">Client / Partner</span>
                                <span className="font-sans text-xs text-neutral-800 font-bold">{activeItem.details.client}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <Calendar className="w-4 h-4 text-neutral-800 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-sans text-[9px] uppercase tracking-widest text-neutral-400 block font-bold">Deliverable Timeline</span>
                              <span className="font-sans text-xs text-neutral-800 font-bold">{activeItem.details.date}</span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Compass className="w-4 h-4 text-neutral-800 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-sans text-[9px] uppercase tracking-widest text-neutral-400 block font-bold">Visual Challenge</span>
                              <p className="font-sans text-xs text-neutral-500 leading-relaxed mt-0.5">{activeItem.details.challenge}</p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Target className="w-4 h-4 text-neutral-800 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-sans text-[9px] uppercase tracking-widest text-neutral-400 block font-bold">Crafted Solution</span>
                              <p className="font-sans text-xs text-neutral-500 leading-relaxed mt-0.5">{activeItem.details.solution}</p>
                            </div>
                          </div>

                          {activeItem.details.impact && (
                            <div className="flex gap-3 bg-neutral-50 p-4 border-l-4 border-black">
                              <Award className="w-4 h-4 text-black shrink-0 mt-0.5" />
                              <div>
                                <span className="font-sans text-[9px] uppercase tracking-widest text-neutral-800 font-bold block">Performance & Impact</span>
                                <p className="font-sans text-xs text-neutral-600 leading-relaxed mt-0.5">{activeItem.details.impact}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4 mt-4">
                      <div className="flex flex-wrap gap-1.5">
                        {activeItem.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="font-sans text-[9px] tracking-wider uppercase bg-neutral-100 text-neutral-500 px-2 py-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {activeItem.link && (
                        <a
                          href={activeItem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-sans text-[10px] tracking-widest uppercase font-bold border-b-2 border-black pb-0.5 text-black hover:text-neutral-500 hover:border-neutral-500 flex items-center gap-1 transition-all duration-300"
                        >
                          {activeItem.ctaText || 'Visit Live Site'} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-Screen Comic Reader Modal */}
        <AnimatePresence>
          {isReading && activeItem && activeItem.comicPages && (
            <motion.div
              id="comic-reader-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-neutral-950/95 flex flex-col justify-between p-4 sm:p-6"
              onClick={() => setIsReading(false)}
            >
              {/* Reader Header */}
              <div 
                id="comic-reader-header"
                className="w-full max-w-5xl mx-auto flex items-center justify-between text-white border-b border-neutral-800 pb-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <span className="font-sans text-[9px] uppercase tracking-widest text-yellow-400 font-bold">
                    Comic Strip Reader
                  </span>
                  <h3 className="font-sans font-light text-xl tracking-tight uppercase mt-0.5">
                    {activeItem.title}
                  </h3>
                </div>
                
                <button
                  id="comic-reader-close-button"
                  onClick={() => setIsReading(false)}
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-none text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors cursor-pointer"
                  title="Close Reader (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Carousel Stage */}
              <div 
                id="comic-reader-carousel"
                className="w-full max-w-5xl mx-auto flex-grow flex items-center justify-between py-6 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Previous Button Left */}
                <button
                  id="comic-slide-prev-btn"
                  disabled={currentComicPageIndex === 0}
                  onClick={() => setCurrentComicPageIndex(prev => Math.max(0, prev - 1))}
                  className={`p-3 bg-neutral-900 border border-neutral-800 text-white transition-all rounded-none cursor-pointer self-center shrink-0 mr-4 sm:mr-8 ${
                    currentComicPageIndex === 0 
                      ? 'opacity-10 cursor-not-allowed' 
                      : 'hover:bg-yellow-400 hover:text-neutral-950 hover:border-yellow-400 active:scale-95'
                  }`}
                  title="Previous Panel"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Animated Image Wrapper */}
                <div className="flex-grow flex items-center justify-center overflow-hidden max-h-[55vh]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentComicPageIndex}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="relative border-[4px] border-neutral-900 bg-white max-h-full max-w-full aspect-square sm:aspect-[4/3] flex items-center justify-center p-3 shadow-2xl"
                    >
                      <img
                        src={activeItem.comicPages[currentComicPageIndex].url}
                        alt={activeItem.comicPages[currentComicPageIndex].title || activeItem.title}
                        className="max-w-full max-h-[48vh] object-contain filter select-none transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Floating Panel numbering banner */}
                      <span className="absolute top-4 left-4 font-mono text-[9px] sm:text-[10px] bg-neutral-950 text-white px-2.5 py-1 uppercase tracking-wider font-bold border border-neutral-800">
                        Panel {currentComicPageIndex + 1} / {activeItem.comicPages.length}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Next Button Right */}
                <button
                  id="comic-slide-next-btn"
                  disabled={currentComicPageIndex === activeItem.comicPages.length - 1}
                  onClick={() => setCurrentComicPageIndex(prev => Math.min(activeItem.comicPages!.length - 1, prev + 1))}
                  className={`p-3 bg-neutral-900 border border-neutral-800 text-white transition-all rounded-none cursor-pointer self-center shrink-0 ml-4 sm:ml-8 ${
                    currentComicPageIndex === activeItem.comicPages.length - 1 
                      ? 'opacity-10 cursor-not-allowed' 
                      : 'hover:bg-yellow-400 hover:text-neutral-950 hover:border-yellow-400 active:scale-95'
                  }`}
                  title="Next Panel"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Reader Reader Footer: Description and Nav points */}
              <div 
                id="comic-reader-caption-panel"
                className="w-full max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 p-5 sm:p-6 flex flex-col gap-3 text-center items-center mb-2"
                onClick={(e) => e.stopPropagation()}
              >
                {activeItem.comicPages[currentComicPageIndex].title && (
                  <h4 className="font-sans font-bold text-yellow-400 text-xs sm:text-sm uppercase tracking-wider">
                    {activeItem.comicPages[currentComicPageIndex].title}
                  </h4>
                )}
                
                {activeItem.comicPages[currentComicPageIndex].caption && (
                  <p className="font-sans text-neutral-200 text-xs sm:text-sm leading-relaxed max-w-xl">
                    "{activeItem.comicPages[currentComicPageIndex].caption}"
                  </p>
                )}

                {/* Progress Indicators */}
                <div className="flex gap-2.5 mt-2">
                  {activeItem.comicPages.map((_, idx) => (
                    <button
                      key={idx}
                      id={`comic-progress-dot-${idx}`}
                      onClick={() => setCurrentComicPageIndex(idx)}
                      className={`w-3 h-3 transition-all duration-300 rounded-none cursor-pointer border ${
                        currentComicPageIndex === idx 
                          ? 'bg-yellow-400 border-yellow-400 scale-125' 
                          : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-600'
                      }`}
                      title={`Go to Panel ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
