export type UserPlan = 'Free' | 'Basic' | 'Pro';

export interface UserProfile {
  name: string;
  email: string;
  plan: UserPlan;
  hasOnboarded?: boolean;
}

export interface OnboardingData {
  niche: string;
  audience: string;
  problem: string;
  offerName: string;
  offerPrice: string;
  offerSentence: string;
  step?: number;
  gmail_connected?: boolean;
  email_platform?: string;
  email_platform_key?: string;
}

export interface LeadMagnetOutput {
  title: string;
  headline: string;
  bullets: string[];
  cta: string;
}

export interface Dream100Partner {
  partnerName: string;
  platform: 'YouTube' | 'Podcast';
  link: string;
  contact: string;
  message: string;
  leadsSent?: number;
  rank?: number;
  highlighted?: boolean;
}

export interface EmailSeqItem {
  subject: string;
  body: string;
}

export interface EmailSequenceOutput {
  email1: EmailSeqItem;
  email2: EmailSeqItem;
  email3: EmailSeqItem;
  email4: EmailSeqItem;
}

export interface LinkedInPostItem {
  hook: string;
  body: string;
  commentNote: string;
}

export interface LinkedInOutput {
  post1: LinkedInPostItem;
  post2: LinkedInPostItem;
  post3: LinkedInPostItem;
}

export interface TripwireOutput {
  title: string;
  description: string;
  orderBumpHeadline: string;
  bullets: string[];
}

export interface ToolGenerationCounts {
  leadMagnet: number;
  dream100: number;
  emailSequence: number;
  linkedin: number;
  tripwire: number;
}
