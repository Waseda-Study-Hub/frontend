import { z } from "zod";

export const studyStyleSchema = z.enum([
  "quiet_study",
  "active_discussion",
  "morning_person",
  "afternoon_person",
  "evening_night",
  "group_study",
  "one_on_one",
]);
export const studyLanguageSchema = z.enum(["english", "japanese", "bilingual"]);
export const contactMethodSchema = z.enum([
  "waseda_email",
  "instagram",
  "discord",
  "line",
]);

export const publicProfileSchema = z.object({
  uid: z.string(),
  nickname: z.string(),
  school_id: z.string(),
  year: z.number().int().min(1).max(8),
  courses: z.array(z.string()),
  study_styles: z.array(studyStyleSchema),
  study_language: studyLanguageSchema,
  public_bio: z.string().nullable().optional(),
  match_reason: z.string().nullable().optional(),
});

export const privateProfileSchema = publicProfileSchema.extend({
  full_name: z.string().nullable().optional(),
  study_focus: z.string().nullable().optional(),
  contacts: z
    .object({
      waseda_email: z.string().email().nullable().optional(),
      instagram: z.string().nullable().optional(),
      discord: z.string().nullable().optional(),
      line: z.string().nullable().optional(),
    })
    .default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export const profileInputSchema = z.object({
  nickname: z.string().trim().min(2).max(40),
  full_name: z.string().trim().max(100).optional(),
  school_id: z.string().min(1, "Choose your school."),
  year: z.number().int().min(1).max(8),
  courses: z.array(z.string().trim().min(1).max(80)).max(3),
  study_focus: z.string().trim().min(2).max(120),
  study_styles: z.array(studyStyleSchema).min(1).max(7),
  study_language: studyLanguageSchema,
  contacts: z.object({
    waseda_email: z.string().email().optional().or(z.literal("")),
    instagram: z.string().trim().max(50).optional(),
    discord: z.string().trim().max(100).optional(),
    line: z.string().trim().max(100).optional(),
  }),
  public_bio: z.string().trim().max(300).optional(),
});

export const requestStatusSchema = z.enum([
  "pending",
  "accepted",
  "declined",
  "cancelled",
]);
export const requestSummarySchema = z.object({
  id: z.string(),
  sender: publicProfileSchema,
  recipient: publicProfileSchema,
  topic: z.string().nullable().optional(),
  message: z.string(),
  sender_contact_methods: z.array(contactMethodSchema),
  recipient_contact_methods: z.array(contactMethodSchema),
  status: requestStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
  accepted_at: z.string().nullable().optional(),
});
export const requestListSchema = z.object({
  items: z.array(requestSummarySchema),
  next_cursor: z.string().nullable().optional(),
});
export const connectionContactSchema = z.object({
  request_id: z.string(),
  status: z.literal("accepted"),
  contacts: z.array(
    z.object({
      owner_uid: z.string(),
      owner_nickname: z.string(),
      method: contactMethodSchema,
      value: z.string(),
    }),
  ),
});

export const crowdSummarySchema = z
  .object({
    status: z.enum(["quiet", "moderate", "busy", "full"]),
    reported_at: z.string(),
    report_count: z.number().int().positive(),
    freshness: z.enum(["fresh", "recent", "stale"]),
  })
  .nullable();

export const studySpotSchema = z.object({
  id: z.string(),
  name: z.string(),
  campus: z.string(),
  building: z.string(),
  floor_or_location: z.string().nullable().optional(),
  description: z.string(),
  noise_level: z.enum(["quiet", "moderate", "lively"]),
  has_outlets: z.boolean(),
  has_nearby_restroom: z.boolean(),
  has_private_room: z.boolean(),
  food_allowed: z.boolean(),
  latest_crowd: crowdSummarySchema.optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export const studySpotPrivateSchema = studySpotSchema.extend({
  visibility: z.enum(["public", "private"]),
  moderation_status: z.enum(["pending", "approved", "rejected"]),
  added_by: z.string(),
});
export const studySpotListSchema = z.object({
  items: z.array(studySpotSchema),
  next_cursor: z.string().nullable().optional(),
});
export const studySpotPrivateListSchema = z.object({
  items: z.array(studySpotPrivateSchema),
  next_cursor: z.string().nullable().optional(),
});
export const studySpotInputSchema = studySpotSchema
  .pick({
    name: true,
    campus: true,
    building: true,
    floor_or_location: true,
    description: true,
    noise_level: true,
    has_outlets: true,
    has_nearby_restroom: true,
    has_private_room: true,
    food_allowed: true,
  })
  .extend({
    name: z.string().trim().min(3).max(100),
    campus: z.string().min(1),
    building: z.string().trim().min(1).max(100),
    description: z.string().trim().min(20).max(600),
    floor_or_location: z.string().trim().max(120).optional(),
    visibility: z.enum(["public", "private"]),
  });

export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type PrivateProfile = z.infer<typeof privateProfileSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ContactMethod = z.infer<typeof contactMethodSchema>;
export type StudyStyle = z.infer<typeof studyStyleSchema>;
export type StudyRequestSummary = z.infer<typeof requestSummarySchema>;
export type ConnectionContact = z.infer<typeof connectionContactSchema>;
export type StudySpot = z.infer<typeof studySpotSchema>;
export type StudySpotPrivate = z.infer<typeof studySpotPrivateSchema>;
export type StudySpotInput = z.infer<typeof studySpotInputSchema>;
