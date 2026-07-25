import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

export type ChatParticipant = {
  uid: string;
  name: string;
};

export type ConversationSummary = {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastSenderId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date | null;
};

function timestampToDate(value: unknown) {
  return value && typeof (value as Timestamp).toDate === "function"
    ? (value as Timestamp).toDate()
    : null;
}

export function conversationIdFor(firstUid: string, secondUid: string) {
  return [firstUid, secondUid].sort().join("__");
}

export function otherParticipant(
  conversation: ConversationSummary,
  currentUid: string,
) {
  const uid =
    conversation.participants.find((participant) => participant !== currentUid) ??
    "";
  return {
    uid,
    name: conversation.participantNames[uid] || "Study buddy",
  };
}

export function subscribeToConversations(
  db: Firestore,
  uid: string,
  onData: (conversations: ConversationSummary[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const conversationsQuery = query(
    collection(db, "conversations"),
    where("participants", "array-contains", uid),
  );

  return onSnapshot(
    conversationsQuery,
    (snapshot) => {
      const conversations = snapshot.docs
        .map((conversation) => {
          const data = conversation.data();
          return {
            id: conversation.id,
            participants: Array.isArray(data.participants)
              ? data.participants
              : [],
            participantNames:
              typeof data.participantNames === "object" &&
              data.participantNames
                ? data.participantNames
                : {},
            lastMessage:
              typeof data.lastMessage === "string" ? data.lastMessage : "",
            lastSenderId:
              typeof data.lastSenderId === "string" ? data.lastSenderId : "",
            createdAt: timestampToDate(data.createdAt),
            updatedAt: timestampToDate(data.updatedAt),
          } satisfies ConversationSummary;
        })
        .sort(
          (first, second) =>
            (second.updatedAt?.getTime() ?? 0) -
            (first.updatedAt?.getTime() ?? 0),
        );
      onData(conversations);
    },
    (error) => onError(error),
  );
}

export function subscribeToMessages(
  db: Firestore,
  conversationId: string,
  onData: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const messagesQuery = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "desc"),
    limit(200),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs
        .map((message) => {
          const data = message.data();
          return {
            id: message.id,
            senderId: typeof data.senderId === "string" ? data.senderId : "",
            text: typeof data.text === "string" ? data.text : "",
            createdAt: timestampToDate(data.createdAt),
          } satisfies ChatMessage;
        })
        .sort(
          (first, second) =>
            (first.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
            (second.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER),
        );
      onData(messages);
    },
    (error) => onError(error),
  );
}

export async function ensureConversation(
  db: Firestore,
  currentUser: ChatParticipant,
  buddy: ChatParticipant,
) {
  const participants = [currentUser.uid, buddy.uid].sort();
  const participantNames = {
    [currentUser.uid]: currentUser.name,
    [buddy.uid]: buddy.name,
  };
  const conversationId = conversationIdFor(currentUser.uid, buddy.uid);
  const conversationRef = doc(db, "conversations", conversationId);

  try {
    await setDoc(conversationRef, {
      participants,
      participantNames,
      lastMessage: "",
      lastSenderId: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "";
    if (!code.endsWith("permission-denied")) throw error;

    // A full set is a secure create for a new conversation. If the document
    // already exists, the rules reject replacing its message summary, so only
    // refresh the participant display names instead.
    await updateDoc(conversationRef, { participantNames });
  }

  return conversationId;
}

export async function sendChatMessage(
  db: Firestore,
  conversationId: string,
  senderId: string,
  rawText: string,
) {
  const text = rawText.trim();
  if (!text || text.length > 1000) {
    throw new Error("Messages must be between 1 and 1,000 characters.");
  }

  const conversationRef = doc(db, "conversations", conversationId);
  const messageRef = doc(collection(conversationRef, "messages"));
  const batch = writeBatch(db);

  batch.set(messageRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });
  batch.update(conversationRef, {
    lastMessage: text.slice(0, 160),
    lastSenderId: senderId,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}
