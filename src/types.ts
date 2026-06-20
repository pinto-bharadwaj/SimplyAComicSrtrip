export type ProjectCategory = string;

export const ProjectCategory = {
  ALL: 'all',
  WORKSHOPS: 'workshops',
  SCIENCE_ILLUSTRATIONS: 'science_illustrations',
  COMICS: 'comics',
  MARKETING: 'marketing',
  MASCOT_DESIGN: 'mascot_design',
} as const;

export interface ComicPage {
  url: string;
  title?: string;
  caption?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: ProjectCategory;
  image: string;
  comicPages?: ComicPage[];
  tags: string[];
  ctaText?: string;
  link?: string;
  imageZoom?: number;
  imageAspectRatio?: 'square' | 'rectangle';
  videoUrl?: string;
  details?: {
    client?: string;
    role: string;
    date: string;
    challenge: string;
    solution: string;
    impact?: string;
  };
}

export interface WebsiteSection {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
  layoutTemplate?: 'hero' | 'bio' | 'centered';
}

export interface ExperienceTimeline {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  description: string[];
  skills: string[];
  highlightMetric?: string;
}

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  status: 'configured' | 'pending' | 'action_required';
}
