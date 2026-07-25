import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Firestore,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

export type StudySpotComment = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Date | null;
};

function timestampToDate(value: unknown) {
  return value && typeof (value as Timestamp).toDate === "function"
    ? (value as Timestamp).toDate()
    : null;
}

export function subscribeToStudySpotComments(
  db: Firestore,
  spotId: string,
  onData: (comments: StudySpotComment[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const commentsQuery = query(
    collection(db, "study_spots", spotId, "comments"),
    orderBy("createdAt", "asc"),
    limit(100),
  );

  return onSnapshot(
    commentsQuery,
    (snapshot) => {
      onData(
        snapshot.docs.map((comment) => {
          const data = comment.data();
          return {
            id: comment.id,
            authorId:
              typeof data.authorId === "string" ? data.authorId : "",
            authorName:
              typeof data.authorName === "string"
                ? data.authorName
                : "Waseda student",
            text: typeof data.text === "string" ? data.text : "",
            createdAt: timestampToDate(data.createdAt),
          };
        }),
      );
    },
    (error) => onError(error),
  );
}

export async function addStudySpotComment(
  db: Firestore,
  spotId: string,
  authorId: string,
  authorName: string,
  rawText: string,
) {
  const text = rawText.trim();
  if (!text || text.length > 500) {
    throw new Error("Comments must be between 1 and 500 characters.");
  }

  await addDoc(collection(db, "study_spots", spotId, "comments"), {
    authorId,
    authorName,
    text,
    createdAt: serverTimestamp(),
  });
}
