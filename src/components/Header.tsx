import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ArrowUpRight, Menu, X } from 'lucide-react';

interface HeaderProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export default function Header({ activeSection, onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Portfolio', id: 'portfolio' },
    { label: 'Inquire', id: 'contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col cursor-pointer space-y-0.5"
          onClick={() => onNavigate('hero')}
        >
          <span className="font-sans font-light text-2xl tracking-tighter text-neutral-900 uppercase">
            Preetham Bharadwaj
          </span>
          <span className="font-sans text-[10px] tracking-[0.3em] text-neutral-400 uppercase font-semibold">
            preethambharadwaj.com
          </span>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`font-sans text-xs tracking-[0.2em] uppercase transition-all duration-300 relative py-2 ${
                activeSection === item.id
                  ? 'text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-950'
              }`}
            >
              {item.label}
              {activeSection === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Mobile Navigation Trigger */}
        <button
          className="md:hidden text-stone-700 hover:text-stone-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 right-0 bg-stone-50 border-b border-stone-200 flex flex-col p-6 shadow-xl md:hidden gap-4"
          >
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left font-sans text-xs uppercase tracking-widest py-3 ${
                    activeSection === item.id
                      ? 'text-neutral-900 font-bold pl-3 border-l-2 border-neutral-900'
                      : 'text-neutral-500 pl-0'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-200">
                <Globe className="w-3.5 h-3.5 text-neutral-600" />
                <span className="font-sans text-[10px] uppercase text-neutral-700">
                  preethambharadwaj.com
                </span>
              </div>
              <span className="font-mono text-[10px] text-neutral-400">DNS SECURED</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
