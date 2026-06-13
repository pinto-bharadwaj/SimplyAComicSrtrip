import { Globe, Instagram, Linkedin, ExternalLink, ShieldCheck } from 'lucide-react';
import { SOCIAL_LINKS } from '../data';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const getIcon = (name: string) => {
    switch (name) {
      case 'Instagram':
        return <Instagram className="w-4 h-4" />;
      case 'Linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'Globe':
        return <Globe className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <footer className="bg-white text-neutral-900 border-t border-neutral-200 py-16 font-sans">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Core Attribution */}
        <div className="flex flex-col text-center md:text-left">
          <span className="font-sans font-medium text-neutral-950 tracking-[0.2em] text-xs uppercase block">
            PREETHAM BHARADWAJ
          </span>
          <p className="font-sans text-xs text-neutral-400 mt-2 max-w-sm">
            Ideas, drawn to Life.
          </p>
        </div>

        {/* Central Social Nodes */}
        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-neutral-50 hover:bg-yellow-300 text-neutral-500 hover:text-black border border-neutral-200 hover:border-neutral-900 transition-all duration-300 rounded-none cursor-pointer"
              title={`View ${link.name}`}
            >
              <span className="sr-only">{link.name}</span>
              {getIcon(link.iconName)}
            </a>
          ))}
        </div>

        {/* Domain Sync Badge & Copyright */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right gap-2">
          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-3 py-1 rounded-none">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span className="font-sans text-[9px] tracking-[0.1em] text-neutral-800 uppercase font-bold">
              preethambharadwaj.com
            </span>
          </div>
          <span className="font-sans text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
            &copy; {currentYear} Preetham Bharadwaj.
          </span>
        </div>

      </div>
    </footer>
  );
}
