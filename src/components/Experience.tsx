import { motion } from 'motion/react';
import { Award, Briefcase, Calendar, MapPin, Sparkles, Trophy, CheckCircle, Compass } from 'lucide-react';
import { EXPERIENCE_TIMELINE } from '../data';

interface ExperienceProps {
  sectionData?: {
    title?: string;
    subtitle?: string;
    description?: string;
  };
}

export default function Experience({ sectionData }: ExperienceProps) {
  const subtitle = sectionData?.subtitle || 'Artistic Statement';
  const title = sectionData?.title || 'The Persona & Visual Drive';
  const description = sectionData?.description || 'By understanding that everything is simply a comic strip, I bridge standard narratives with playful, accessible panel-by-panel illustrations that build joyful community bonds.';

  return (
    <section id="experience" className="py-24 bg-white border-t border-neutral-150">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Header Description Left Block */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div className="mb-8 lg:mb-0">
              <span className="font-sans text-[10px] text-neutral-400 uppercase tracking-[0.25em] font-bold block mb-3">
                {subtitle}
              </span>
              <h2 className="font-sans font-light text-3xl sm:text-4xl text-neutral-900 tracking-tighter leading-tight mb-4 uppercase whitespace-pre-line">
                {title}
              </h2>
              <p className="font-sans text-neutral-500 font-medium text-sm leading-relaxed">
                {description}
              </p>
            </div>

            {/* Graphic Highlight Card: Single-handled Marketing accomplishment */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-yellow-400 text-neutral-950 p-6 rounded-none border-[3px] border-neutral-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-60 hover:rotate-1 transition-transform"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 bg-white text-neutral-950 border-[2px] border-neutral-950">
                  <Trophy className="w-4 h-4" />
                </span>
                <span className="font-sans text-[9px] tracking-widest uppercase text-neutral-700 font-black">
                  Major Milestone
                </span>
              </div>

              <div>
                <h4 className="font-sans font-black text-base text-neutral-950 tracking-tight leading-snug uppercase">
                  India Animal Welfare Forum
                </h4>
                <p className="font-sans text-xs text-neutral-800 font-medium mt-1.5 leading-relaxed">
                  Single-handedly spearheaded comprehensive digital promotional pipelines, content graphics, and outreach trackers for a national-scale flagship event.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-950/20">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-950 animate-pulse" />
                <span className="font-sans text-[9px] uppercase tracking-widest text-neutral-950 font-black">
                  100% DIRECTED IN-HOUSE
                </span>
              </div>
            </motion.div>
          </div>

          {/* Timeline Pipeline Right Block */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {EXPERIENCE_TIMELINE.map((timeline, idx) => (
              <motion.div
                key={timeline.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="relative bg-white border border-neutral-200 rounded-none p-8 shadow-none flex flex-col md:flex-row gap-6 hover:border-black transition-colors duration-300"
              >
                {/* Visual Connector Dot */}
                <span className="hidden md:block absolute left-[-42px] top-10 w-2.5 h-2.5 rounded-full border-4 border-neutral-100 bg-neutral-950 z-10 box-content shadow-sm" />

                {/* Left Mini Column: Metadata */}
                <div className="md:w-1/3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-neutral-950 font-sans text-[10px] font-bold uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    <span>{timeline.period}</span>
                  </div>

                  <h3 className="font-sans font-black text-neutral-900 text-lg sm:text-xl tracking-tight mt-1 uppercase leading-snug">
                    {timeline.role}
                  </h3>

                  <div className="flex items-center gap-2 font-sans text-[10px] tracking-wider text-neutral-500 mt-0.5 uppercase font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{timeline.company}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-sans text-[10px] text-neutral-400 mt-1 uppercase">
                    <Compass className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                    <span>{timeline.location}</span>
                  </div>
                </div>

                {/* Right Mini Column: Details & Program Description */}
                <div className="md:w-2/3 flex flex-col justify-between border-t md:border-t-0 md:border-l border-neutral-100 pt-6 md:pt-0 md:pl-8 gap-6">
                  <div className="space-y-3.5">
                    {timeline.description.map((desc, dIdx) => (
                      <div key={dIdx} className="flex gap-2.5 items-start">
                        <CheckCircle className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
                        <p className="font-sans text-neutral-500 text-xs sm:text-sm leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Program Skills Tags */}
                  <div className="flex flex-col gap-3 pt-6 border-t border-neutral-100 mt-2">
                    <span className="font-sans text-[9px] tracking-widest uppercase text-neutral-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-neutral-950" /> APPLIED CAPABILITIES
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {timeline.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="font-sans text-[9px] bg-neutral-100 border border-neutral-200/50 text-neutral-600 px-3 py-1 uppercase tracking-wider"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
