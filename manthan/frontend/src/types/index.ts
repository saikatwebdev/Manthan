// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'organizer' | 'admin';
  department?: string;
  year?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  points: number;
  badges: Badge[];
  socialLinks?: SocialLinks;
  preferences?: UserPreferences;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  portfolio?: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  eventReminders: boolean;
  newsletter: boolean;
}

// Event types
export interface Event {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  department: string;
  category: EventCategory;
  tags: string[];
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  location: EventLocation;
  organizer: User;
  coOrganizers: User[];
  maxParticipants?: number;
  currentParticipants: number;
  registrationFee: number;
  prizes: Prize[];
  requirements: string[];
  agenda: AgendaItem[];
  images: EventImage[];
  status: EventStatus;
  visibility: 'public' | 'private' | 'department-only';
  isTeamEvent: boolean;
  teamSize: {
    min: number;
    max: number;
  };
  skills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  certificates: {
    participation: boolean;
    winner: boolean;
    template?: string;
  };
  qrCode?: {
    url: string;
    code: string;
  };
  analytics: {
    views: number;
    shares: number;
    clickThroughs: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type EventCategory = 
  | 'hackathon' 
  | 'workshop' 
  | 'seminar' 
  | 'competition' 
  | 'cultural' 
  | 'sports' 
  | 'conference' 
  | 'networking' 
  | 'other';

export type EventStatus = 
  | 'draft' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'active' 
  | 'completed' 
  | 'cancelled';

export interface EventLocation {
  venue: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isOnline: boolean;
  onlineLink?: string;
}

export interface Prize {
  position: string;
  amount: number;
  description: string;
}

export interface AgendaItem {
  time: string;
  activity: string;
  speaker?: string;
  duration: string;
}

export interface EventImage {
  url: string;
  caption?: string;
  isPrimary: boolean;
}

// Registration types
export interface Registration {
  _id: string;
  user: User;
  event: Event;
  status: RegistrationStatus;
  registrationDate: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  amountPaid: number;
  teamInfo?: TeamInfo;
  responses: RegistrationResponse[];
  specialRequirements?: string;
  dietaryRestrictions: string[];
  emergencyContact?: EmergencyContact;
  checkIn: CheckInInfo;
  attendance: AttendanceInfo;
  feedback?: FeedbackInfo;
  certificate?: CertificateInfo;
  qrCode?: {
    code: string;
    url: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type RegistrationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'cancelled' 
  | 'waitlisted' 
  | 'checked-in' 
  | 'completed';

export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'not-required';

export interface TeamInfo {
  isTeamLead: boolean;
  teamName?: string;
  teamMembers: TeamMember[];
  teamCode?: string;
  maxMembers?: number;
}

export interface TeamMember {
  user: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface RegistrationResponse {
  question: string;
  answer: string;
  type: 'text' | 'multiple-choice' | 'checkbox' | 'file';
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface CheckInInfo {
  isCheckedIn: boolean;
  checkInTime?: string;
  checkInMethod?: 'qr-code' | 'manual' | 'self-checkin';
  checkInLocation?: string;
  checkedInBy?: string;
}

export interface AttendanceInfo {
  sessions: SessionAttendance[];
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
}

export interface SessionAttendance {
  sessionName: string;
  attended: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface FeedbackInfo {
  rating: number;
  comments?: string;
  recommendations?: string;
  wouldRecommend?: boolean;
  submittedAt: string;
}

export interface CertificateInfo {
  isEligible: boolean;
  certificateId?: string;
  certificateUrl?: string;
  issuedAt?: string;
  downloadCount: number;
}

// Certificate types
export interface Certificate {
  _id: string;
  user: User;
  event: Event;
  certificateId: string;
  type: CertificateType;
  title: string;
  description?: string;
  issuedDate: string;
  validUntil?: string;
  certificateUrl: string;
  verification: {
    verificationCode: string;
    verificationUrl: string;
  };
  metadata: {
    position?: string;
    score?: number;
    grade?: string;
    skills: string[];
    duration?: string;
  };
  downloads: {
    count: number;
    lastDownloaded?: string;
  };
  sharing: {
    isPublic: boolean;
    shareCount: number;
    socialShares: {
      linkedin: number;
      twitter: number;
      facebook: number;
    };
  };
  status: 'active' | 'revoked' | 'expired' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export type CertificateType = 
  | 'participation' 
  | 'winner' 
  | 'completion' 
  | 'achievement' 
  | 'appreciation';

// Notification types
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'announcement';
  category: 'event' | 'registration' | 'certificate' | 'system' | 'promotional' | 'reminder';
  sender?: User;
  relatedEvent?: Event;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor: string;
  expiresAt?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled' | 'failed';
  readBy: {
    user: string;
    readAt: string;
  }[];
  actions: NotificationAction[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationAction {
  label: string;
  url: string;
  type: 'link' | 'button' | 'api-call';
}

// Forum types
export interface ForumPost {
  _id: string;
  title: string;
  content: string;
  author: User;
  category: ForumCategory;
  type: 'discussion' | 'question' | 'announcement' | 'team-request' | 'project-showcase';
  tags: string[];
  relatedEvent?: Event;
  visibility: 'public' | 'event-participants' | 'department' | 'private';
  department?: string;
  teamFormation?: TeamFormationInfo;
  replies: ForumReply[];
  likes: PostLike[];
  bookmarks: PostBookmark[];
  views: PostView[];
  attachments: Attachment[];
  status: 'active' | 'closed' | 'archived' | 'deleted' | 'flagged';
  isPinned: boolean;
  isLocked: boolean;
  analytics: {
    viewCount: number;
    uniqueViews: number;
    likeCount: number;
    replyCount: number;
    bookmarkCount: number;
    engagementScore: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type ForumCategory = 
  | 'general' 
  | 'team-formation' 
  | 'help' 
  | 'announcement' 
  | 'event-discussion' 
  | 'project-showcase' 
  | 'networking';

export interface TeamFormationInfo {
  isLookingForTeam: boolean;
  skillsRequired: string[];
  maxTeamSize?: number;
  currentTeamSize: number;
  teamMembers: TeamMember[];
  applications: TeamApplication[];
  isTeamComplete: boolean;
}

export interface TeamApplication {
  user: User;
  message: string;
  skills: string[];
  appliedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ForumReply {
  _id: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
  likes: PostLike[];
  isEdited: boolean;
  editHistory: EditHistory[];
}

export interface EditHistory {
  content: string;
  editedAt: string;
}

export interface PostLike {
  user: string;
  likedAt: string;
}

export interface PostBookmark {
  user: string;
  bookmarkedAt: string;
}

export interface PostView {
  user: string;
  viewedAt: string;
  ipAddress?: string;
}

export interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[];
    pagination: PaginationInfo;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'organizer';
  department?: string;
  year?: string;
  phone?: string;
  bio?: string;
}

export interface EventForm {
  title: string;
  description: string;
  shortDescription?: string;
  department: string;
  category: EventCategory;
  tags: string[];
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  location: EventLocation;
  maxParticipants?: number;
  registrationFee: number;
  prizes: Prize[];
  requirements: string[];
  agenda: AgendaItem[];
  visibility: 'public' | 'private' | 'department-only';
  isTeamEvent: boolean;
  teamSize: {
    min: number;
    max: number;
  };
  skills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Filter and search types
export interface EventFilters {
  category?: EventCategory;
  department?: string;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  upcoming?: boolean;
  featured?: boolean;
  sortBy?: 'startDate' | 'createdAt' | 'title' | 'currentParticipants';
  sortOrder?: 'asc' | 'desc';
}

export interface UserFilters {
  role?: 'student' | 'organizer' | 'admin';
  department?: string;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'points';
  sortOrder?: 'asc' | 'desc';
}