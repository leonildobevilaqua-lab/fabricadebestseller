export interface BookMetadata {
  id?: string;
  authorName: string;
  topic: string;
  bookTitle?: string;
  subTitle?: string;
  dedication?: string;
  status?: JobStatus;
  progress?: number;
  statusMessage?: string;
  currentStep?: ProjectStep;
  language?: string;
  contact?: {
    name: string;
    email: string;
    phone: string;
  };
  acknowledgments?: string;
  aboutAuthor?: string;
  discountUsed?: number;
}

export type JobStatus = 'IDLE' | 'RESEARCHING' | 'WAITING_TITLE' | 'GENERATING_STRUCTURE' | 'WAITING_STRUCTURE' | 'WRITING' | 'WAITING_DETAILS' | 'COMPLETED' | 'FAILED' | 'REVIEW_STRUCTURE' | 'WRITING_CHAPTERS' | 'GENERATING_MARKETING';

export type ProjectStep = 'START' | 'RESEARCH' | 'TITLE' | 'STRUCTURE' | 'WRITING' | 'DETAILS' | 'DONE';

export interface TitleOption {
  title: string;
  subtitle: string;
  marketingHook: string;
  score: number;
  isTopChoice?: boolean;
  reason?: string;
}

export interface Chapter {
  id: number;
  title: string;
  summary: string;
  content: string;
  isCompleted: boolean;
  intro?: string;
  isGenerated?: boolean;
}

export interface MarketingAssets {
  viralHooks: string[];
  description: string;
  keywords: string[];
  targetAudience: string;
  salesSynopsis?: string;
  youtubeDescription?: string;
  backCover?: string;
  flapCopy?: string;
  backFlapCopy?: string;
}

export interface BookProject {
  id: string;
  metadata: BookMetadata;
  researchContext: string;
  titleOptions: TitleOption[];
  structure: Chapter[];
  marketing: MarketingAssets | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookContent {
  introduction: string;
  chapters: Chapter[];
  conclusion: string;
  dedication: string;
  acknowledgments: string;
  marketing: MarketingAssets;
  aboutAuthor?: string;
}