import {
  addDoc,
  collection,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

export type ReportTarget = {
  type: "conversation" | "study_spot";
  id: string;
  label: string;
  reportedUserId: string;
};

export const reportReasons = [
  "Spam",
  "Harassment or safety",
  "Inaccurate information",
  "Other",
] as const;

export type ReportReason = (typeof reportReasons)[number];

export async function submitReport(
  db: Firestore,
  reporterId: string,
  target: ReportTarget,
  reason: ReportReason,
  details: string,
) {
  const cleanDetails = details.trim();
  if (cleanDetails.length > 500) {
    throw new Error("Report details must be 500 characters or fewer.");
  }

  await addDoc(collection(db, "reports"), {
    reporterId,
    targetType: target.type,
    targetId: target.id,
    targetLabel: target.label.slice(0, 160),
    reportedUserId: target.reportedUserId,
    reason,
    details: cleanDetails,
    status: "open",
    createdAt: serverTimestamp(),
  });
}
