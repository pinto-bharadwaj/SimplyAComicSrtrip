import { ProjectCategory, GalleryItem, ExperienceTimeline, DnsRecord } from './types';

// Concrete assets generated for Preetham's portfolio
export const IMAGES = {
  simplyComical: '/src/assets/images/simply_comical_art_1780735531877.png',
  brandingMockup: '/src/assets/images/branding_mockup_1780735544338.png',
  animalWelfare: '/src/assets/images/animal_welfare_campaign_1780735559310.png',
  imaginationLine: '/src/assets/images/imagination_line_art_1780735570966.png',
  preethamProfile: '/src/assets/images/regenerated_image_1780744497554.jpg',
  mrDad: '/src/assets/images/regenerated_image_1780745044078.jpg',
};

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'mr-dad-comics',
    title: 'Mr. Dad',
    subtitle: 'Nostalgic & Witty Fatherhood Comics',
    description: "Introducing Mr Dad! This project features humorous comics based on the creator's interactions with his dad over the years. It is a fun, light-hearted look at the father-son relationship and will surely resonate with anyone who has a quirky, endearing relationship with their dad.",
    category: ProjectCategory.COMICS,
    image: IMAGES.mrDad, // Using newly updated project illustration
    tags: ['Comic Strip', 'Family Humor', 'Slice of Life', 'Character Design'],
    comicPages: [
      {
        url: IMAGES.mrDad,
        title: "The Tech Support Call",
        caption: "Dad logic: Why call customer service when you can just press every button on the remote simultaneously to hard reset the space-time continuum?"
      },
      {
        url: IMAGES.simplyComical,
        title: "The Unsolicited Morning Lecture",
        caption: "A 5-minute request on how to boil an egg quickly escalates into a 45-minute masterclass on global agricultural supply chains."
      },
      {
        url: IMAGES.imaginationLine,
        title: "The Master Chef Experiment",
        caption: "Dad decides to substitute baking powder with detergent 'because they both have sodium and make bubbles'."
      }
    ],
    details: {
      client: 'Self-Published Comic Series',
      role: 'Comic Writer & Lead Cartoonist',
      date: '2023 - Present',
      challenge: 'Crafting highly identifiable everyday family dialogues into instant single- or multi-panel layouts that resonate with diverse readers.',
      solution: 'Developed a signature hand-drawn comic format focusing on expressive gesture dynamics, clear typography, and a warm, inviting feel.',
      impact: 'Garnered highly organic fan engagement and thousands of page views across online channels.'
    }
  },
  {
    id: 'upscie-daisy',
    title: 'Upscie Daisy',
    subtitle: 'Playful Scientific Adventures',
    description: 'Bridging the gap between scientific jargon and popular reading. This creative comic strip series uses humorous cartoon characters to unpack major scientific discoveries and curiosities.',
    category: ProjectCategory.COMICS,
    image: IMAGES.imaginationLine, // Using creative line art style
    tags: ['Sci-Comm', 'Educational Comics', 'Graphic Humour', 'Visual Wit'],
    comicPages: [
      {
        url: IMAGES.imaginationLine,
        title: "Episode 1: Quantum Uncertainty",
        caption: "Daisy learns that sometimes being lost isn't a lack of direction—it is just maintaining a highly sophisticated state of possibilities."
      },
      {
        url: IMAGES.simplyComical,
        title: "Episode 2: The Energy Budget",
        caption: "The cells hold an emergency town hall to discuss why 90% of the daily glucose budget is spent overthinking an interaction from 2018."
      }
    ],
    details: {
      client: 'Creative Science Initiatives',
      role: 'Illustrator & Science Communicator',
      date: '2024',
      challenge: 'Converting rigorous technical findings and molecular mechanics into lightweight storytelling structures without losing accuracy.',
      solution: 'Created custom character guides (like Daisy the microscopic explorer) who navigate scientific phenomena via punchy, hand-drawn comic layouts.',
      impact: 'Used in schools and educational campaigns to increase curiosity and student interaction with science research.'
    }
  },
  {
    id: 'tikku-comics',
    title: 'Tikku Comics',
    subtitle: 'Charming Miniature Journeys',
    description: 'The whimsical, modern adventures of Tikku, an expressive miniature hero with a giant imagination. Negotiating the obstacles of a large world through comical, lighthearted, and occasionally philosophical panels.',
    category: ProjectCategory.COMICS,
    image: IMAGES.simplyComical,
    tags: ['Indie Comics', 'Micro-storytelling', 'Character Branding', 'Daily Strip'],
    comicPages: [
      {
        url: IMAGES.simplyComical,
        title: "Panel 1: The Puddle Ocean",
        caption: "To a tiny hero, a simple sidewalk puddle is a deep-sea crossing. Pack the cardboard raft!"
      },
      {
        url: IMAGES.mrDad,
        title: "Panel 2: Giants in the Garden",
        caption: "Observing a friendly giant ladybug who seems entirely unmoved by Tikku's attempts at miniature diplomatic negotiations."
      }
    ],
    details: {
      client: 'Simply Comical Publishing',
      role: 'Creator & Artist',
      date: '2023 - Present',
      challenge: 'Maintaining high narrative consistency and clean visual weight in small square panel ratios optimal for fast digital viewing.',
      solution: 'Crafted simple vector line layouts, generous expressions, and quick witty dialogues carrying universal human messages.',
      impact: 'Established a core loyal audience that enjoys the playful intersection of philosophical curiosity and cartoon charm.'
    }
  },
  {
    id: 'science-illustrations',
    title: 'Science Illustrations',
    subtitle: 'High-Impact Scientific Visualizations',
    description: 'Translating research and lab publications into visual art. Designing editorial science illustrations, informative graphics, and biology diagrams for philanthropy foundations, textbooks, and public programs.',
    category: ProjectCategory.SCIENCE_ILLUSTRATIONS,
    image: IMAGES.imaginationLine,
    tags: ['Technical Sketching', 'Education Art', 'Visual Literacy', 'Diagrammatic Art'],
    details: {
      client: 'Academic Journals & Charitable Programs',
      role: 'Lead Visual Designer',
      date: '2024 - Present',
      challenge: 'Ensuring absolute structural fidelity in anatomical or molecular drafts while making them visually captivating and readable in 3 seconds.',
      solution: 'Utilized clean minimalist wireframes, distinct focal markers, and elegant color keys to lead the reader\'s eye structurally.',
      impact: 'Increased information retention and engagement metrics for foundation briefs and whitepapers.'
    }
  },
  {
    id: 'iawf-campaign',
    title: 'India Animal Welfare Forum',
    subtitle: 'National Welfare Publicity Drive',
    description: 'Single-handedly spearheaded the comprehensive digital promotion, branding layout, and marketing strategies for Upadhyaya Foundation\'s landmark animal forum. Empowering outreach through custom graphics.',
    category: ProjectCategory.MARKETING,
    image: IMAGES.animalWelfare,
    tags: ['Campaign Branding', 'Digital Promotion', 'Outreach Strategy', 'Social Impact'],
    details: {
      client: 'Upadhyaya Foundation',
      role: 'Solo Director of Digital Promotions',
      date: '2025',
      challenge: 'Building a consistent, trustworthy visual identity for a major national welfare summit and driving nationwide attendance with zero media agency support.',
      solution: 'Created animal welfare silhouettes, customized digital graphics, established cohesive content funnels, and coordinated social scheduling pipelines.',
      impact: 'Drove record digital RSVPs, setting a new benchmark for programmatic stakeholder reporting and digital charity engagement.'
    }
  },
  {
    id: 'mascot-systems',
    title: 'Mascot Design',
    subtitle: 'Brand Character Creation & Vectors',
    description: 'Developing high-spirited custom cartoon mascots and character symbols. Perfect for representing corporate and non-profit narratives with warm, human, and memorable brand ambassadors.',
    category: ProjectCategory.MASCOT_DESIGN,
    image: IMAGES.brandingMockup,
    tags: ['Character Branding', 'Logo Vectors', 'Identity Design', 'Mascot Styling'],
    details: {
      client: 'Startup Teams & Foundation Partners',
      role: 'Mascot Architect',
      date: '2024',
      challenge: 'Encapsulating complex institutional philosophies into a single friendly mascot who can scale from tiny phone screens to giant physical event standees.',
      solution: 'Created clean-vector mascots with iconic silhouettes, memorable color pairings (featuring rich golden yellows), and relatable posture dynamics.',
      impact: 'Mascots introduced a human core to philanthropic drives, achieving high recall value and immediate community trust.'
    }
  },
  {
    id: 'comic-workshops',
    title: 'Comic-Making Workshops',
    subtitle: 'Interactive Visual Storytelling Seminars',
    description: 'Empowering students, researchers, kids, and working professionals to clarify complex thoughts and express critical narratives through basic drawing tricks, comic frameworks, and script templates.',
    category: ProjectCategory.WORKSHOPS,
    image: IMAGES.simplyComical,
    tags: ['Workshop Tutoring', 'Visual Thinking', 'Class Instruction', 'Public Speaking'],
    details: {
      client: 'Schools & Community Centers',
      role: 'Workshop Facilitator',
      date: '2023 - Present',
      challenge: 'Overcoming the "I can\'t draw" block and teaching solid visual layout structures within tight 2-hour learning schedules.',
      solution: 'Engineered an intuitive formula translating characters into simple geometric grids and outlining clear storytelling steps in comic strip patterns.',
      impact: 'Successfully trained hundreds of participants, fostering active visual literacy and alternative research communication techniques.'
    }
  }
];

export const EXPERIENCE_TIMELINE: ExperienceTimeline[] = [
  {
    id: 'art-drive',
    role: 'Fueling The Creative Spark',
    company: 'My Artistic Drive',
    location: 'The Heart of Storytelling',
    period: 'Aesthetic Spark',
    description: [
      'Art is not just decoration—it is the ultimate vehicle for clarifying complex institutional, scientific, or social ideas.',
      'I am driven by a passion to combine strategic marketing frameworks with comical line art, translating difficult concepts into immediate, lighthearted, and universally understood visual assets.'
    ],
    skills: ['Visual Thinking', 'Character Connection', 'Line Art Dynamics', 'Story Design'],
    highlightMetric: 'Connecting people through warm, universally relatable cartoon humor'
  },
  {
    id: 'worldview',
    role: 'Everything is Simply a Comic strip',
    company: 'How I See The World',
    location: 'A Panel-by-Panel Mindset',
    period: 'Core Belief',
    description: [
      'Every human adventure, technical challenge, or corporate mission has a clear setup panel, an engaging middle progression, and a satisfying punchline.',
      'I process reality in sequential grids—stripping away visual noise and dense text blocks to reveal the warm, relatable, human story lying underneath.'
    ],
    skills: ['Conceptual Framing', 'Aesthetic Simplification', 'Narrative Pacing', 'Core Message Distillation'],
    highlightMetric: 'Stripping away complexity to reveal human-scale truths'
  },
  {
    id: 'creation-mission',
    role: 'Empowering Stories, Restoring Joy',
    company: 'What I Want to Create for You',
    location: 'My Creative Commitment',
    period: 'Creative Mission',
    description: [
      'I want to construct spaces of wonder and accessibility—helping researchers explain biology, kids draw their first grids, or organizations find their voice.',
      'Through handcrafting friendly mascots, educational comic books, and custom campaigns, my goal is to design visual systems that inspire trust and evoke visual wonder.'
    ],
    skills: ['Character System Design', 'Workshop Instruction', 'Community Outreach', 'Emotional Branding'],
    highlightMetric: 'Designs that do not just communicate—they connect'
  }
];

export const DNS_RECORDS: DnsRecord[] = [
  {
    type: 'A',
    name: '@',
    value: '74.125.197.121 (Project Router)',
    status: 'configured'
  },
  {
    type: 'CNAME',
    name: 'www',
    value: 'preethambharadwaj.com',
    status: 'configured'
  },
  {
    type: 'TXT',
    name: 'v=spf1',
    value: 'include:spf.google.com ~all',
    status: 'configured'
  }
];

export const SOCIAL_LINKS = [
  { name: 'Instagram', url: 'https://www.instagram.com/simply_a_comic_strip/', iconName: 'Instagram' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/preetham-bharadwaj', iconName: 'Linkedin' }
];

export const BRAND_STORY = {
  quote: "everything is simply a comic strip.",
  longParagraph: "I believe every idea, emotion, and experience can be understood as a story. Much like a comic strip, life unfolds through a series of moments, characters, conflicts, and resolutions. My work is an attempt to capture these moments visually, simplifying complexity, finding humour in the ordinary, and transforming abstract concepts into narratives that people can connect with, remember, and share."
};
