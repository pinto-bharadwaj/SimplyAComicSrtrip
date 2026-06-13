import { motion } from 'motion/react';
import { ArrowRight, Instagram, Linkedin, MessageSquareCode } from 'lucide-react';
import { BRAND_STORY, IMAGES, SOCIAL_LINKS } from '../data';

interface HeroProps {
  onExplorePortfolio: () => void;
  onExploreExperience: () => void;
  sectionData?: {
    title?: string;
    subtitle?: string;
    description?: string;
    image?: string;
  };
}

export default function Hero({ onExplorePortfolio, onExploreExperience, sectionData }: HeroProps) {
  const subtitle = sectionData?.subtitle || 'Creative Portfolio & Vision Map';
  const title = sectionData?.title || 'I transform ideas into visual narratives through illustration, design strategy, and storytelling.';
  const description = sectionData?.description || 'My experience spans from philanthropy and social impact to creative design. From brand identities to comic-inspired illustrations, I believe complex ideas become memorable when told visually. To me, everything is a comic strip waiting to be drawn.';
  const image = sectionData?.image || IMAGES.preethamProfile;

  // Find social links configurations from data
  const instagramLink = SOCIAL_LINKS.find(s => s.name === 'Instagram')?.url || 'https://instagram.com';
  const linkedinLink = SOCIAL_LINKS.find(s => s.name === 'LinkedIn')?.url || 'https://linkedin.com';

  const renderHighlightedTitle = (text: string) => {
    const matchRegex = /visual(?:ize)?\s+narratives?/i;
    const matchResult = text.match(matchRegex);
    
    if (!matchResult || matchResult.index === undefined) {
      return text;
    }
    
    const index = matchResult.index;
    const len = matchResult[0].length;
    const before = text.substring(0, index);
    const match = text.substring(index, index + len);
    const after = text.substring(index + len);
    
    return (
      <>
        {before}
        <span className="bg-yellow-300 text-neutral-950 px-2 py-0.5 inline-block -rotate-1 border border-neutral-900 mx-1 uppercase font-black">
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <section className="relative min-h-[85vh] flex items-center bg-white overflow-hidden py-16 font-sans">
      {/* Subtle Yellow Ambient Circle Accent */}
      <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-yellow-100/30 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 relative z-10 w-full gap-12 items-center">
        
        {/* Left Column: Storytelling & Action Cards */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          
          {/* Subheading Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="w-8 h-[2px] bg-yellow-400" />
            <span className="font-sans text-[10px] tracking-[0.3em] text-neutral-400 uppercase font-bold">
              {subtitle}
            </span>
          </motion.div>

          {/* High-Impact Brand Headline with dynamic capability */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="font-sans font-black text-3xl sm:text-4xl md:text-5xl text-neutral-900 tracking-tighter leading-tight mb-6"
          >
            {renderHighlightedTitle(title)}
          </motion.h1>

          {/* Minimalist Professional Philosophy Hook */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-neutral-500 font-medium text-sm sm:text-base max-w-2xl leading-relaxed pr-6 mb-8"
          >
            {description}
          </motion.p>

          {/* Social connections & CTAs Grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 border-b border-neutral-100 pb-8 mb-8"
          >
            <button
              onClick={onExplorePortfolio}
              className="px-8 py-4 bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white font-sans text-xs tracking-widest uppercase font-bold rounded-none border border-neutral-950 transition-all duration-300 cursor-pointer shadow-md"
            >
              Explore Portfolio
            </button>

            <button
              onClick={onExploreExperience}
              className="px-8 py-4 bg-[#FFDF20] text-black border border-neutral-950 hover:!bg-neutral-950 hover:!text-white font-sans text-xs tracking-widest uppercase font-bold rounded-none transition-all duration-300 cursor-pointer shadow-md"
            >
              Contact & Inquire
            </button>
            
            {/* Quick Instagram/Linkedin Floating Pills */}
            <div className="flex gap-2.5 pl-0 sm:pl-4 mt-2 sm:mt-0">
              <a
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-neutral-50 hover:bg-yellow-300 text-neutral-600 hover:text-neutral-950 border border-neutral-200 hover:border-neutral-950 rounded-none transition-all cursor-pointer"
                title="Connect on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={linkedinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-neutral-50 hover:bg-yellow-300 text-neutral-600 hover:text-neutral-950 border border-neutral-200 hover:border-neutral-950 rounded-none transition-all cursor-pointer"
                title="Connect on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Core Values Minimalist Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-6 max-w-xl"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                <span className="font-sans text-[10px] tracking-wider uppercase text-neutral-400 font-bold">Concept</span>
              </div>
              <p className="font-sans font-bold text-neutral-900 text-xs mt-1">Sci-Comm Comic Art</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                <span className="font-sans text-[10px] tracking-wider uppercase text-neutral-400 font-bold">Capability</span>
              </div>
              <p className="font-sans font-bold text-neutral-900 text-xs mt-1">Mascot & Marketing</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                <span className="font-sans text-[10px] tracking-wider uppercase text-neutral-400 font-bold">Tutoring</span>
              </div>
              <p className="font-sans font-bold text-neutral-900 text-xs mt-1">Doodling Workshops</p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Branded Comic Illustration Frame featuring the attached logo */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.2, duration: 0.8 }}
            className="relative p-4"
          >
            {/* Bold Yellow Shadow Backdrop Offset */}
            <div className="absolute inset-4 bg-yellow-400 border-[3px] border-neutral-950 scale-100 rounded-full -rotate-4 shadow-md pointer-events-none" />

            {/* Circular frame simulating high-end studio seal */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-[4px] border-neutral-950 bg-white flex items-center justify-center shadow-xl transition-transform hover:scale-[1.01] duration-500">
              <img
                src={image}
                alt="Preetham Bharadwaj Profile"
                className="w-full h-full object-cover filter select-none hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Float speech bubble representing the core philosophy */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 120 }}
              className="absolute -top-4 -right-2 md:-right-6 bg-yellow-300 border-[3px] border-neutral-950 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center rounded-none z-20 hover:-rotate-1 transition-transform"
              style={{ borderRadius: '20px 20px 0px 20px' }}
            >
              <span className="font-sans uppercase text-[10px] tracking-[0.15em] text-neutral-500 font-black">Philosophy</span>
              <span className="font-sans text-xs tracking-tight text-neutral-950 font-extrabold uppercase leading-none mt-1">
                "everything is simply <br />a comic strip."
              </span>
            </motion.div>

            {/* Decorative Vector Pen Tip Graphic Overlay */}
            <div className="absolute -bottom-2 -left-2 bg-white border-2 border-neutral-950 px-3 py-1.5 shadow-sm text-neutral-950 font-sans text-[8px] uppercase tracking-widest font-black font-semibold rotate-3">
              EST. 2023
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
