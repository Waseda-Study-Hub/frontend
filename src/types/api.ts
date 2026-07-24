export interface UserProfile {
  uid?: string;
  username: string;
  full_name: string;
  year: number;
  major: string;
  courses: string[];
  availability_slots: string[];
  bio?: string | null;
  instagram_tag?: string | null;
  match_reason?: string;
}

export interface StudySpot {
  id?: string;
  name: string;
  location: string;
  description: string;
  labels: string[];
  added_by: string;
  is_public: boolean;
}
