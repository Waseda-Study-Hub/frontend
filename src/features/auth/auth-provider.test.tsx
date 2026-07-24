import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./auth-provider";

const firebaseMocks = vi.hoisted(() => ({
  firebaseSignOut: vi.fn().mockResolvedValue(undefined),
  getIdToken: vi.fn().mockResolvedValue("refreshed-token"),
  reload: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn(
    (
      _auth: unknown,
      callback: (user: { uid: string; emailVerified: boolean }) => void,
    ) => {
      callback({ uid: "student-1", emailVerified: true });
      return vi.fn();
    },
  ),
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: firebaseMocks.onAuthStateChanged,
  reload: firebaseMocks.reload,
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: firebaseMocks.firebaseSignOut,
}));

vi.mock("@/lib/firebase/client", () => ({
  auth: {
    currentUser: {
      uid: "student-1",
      emailVerified: true,
      getIdToken: firebaseMocks.getIdToken,
    },
  },
  firebaseConfigured: true,
}));

function SignOutProbe() {
  const auth = useAuth();
  return (
    <button type="button" onClick={() => auth.signOut()}>
      Clear private session
    </button>
  );
}

function RefreshProbe() {
  const auth = useAuth();
  return (
    <button type="button" onClick={() => auth.refreshVerification()}>
      Refresh verification
    </button>
  );
}

describe("AuthProvider", () => {
  it("clears all private query data before Firebase sign-out", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(["profile", "student-1"], {
      contacts: { line: "private-line-id" },
    });
    client.setQueryData(["requests", "connected", "student-1"], {
      contacts: [{ value: "private@fuji.waseda.jp" }],
    });
    firebaseMocks.firebaseSignOut.mockImplementationOnce(async () => {
      expect(client.getQueryCache().getAll()).toHaveLength(0);
    });

    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <SignOutProbe />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Clear private session" }),
    );

    await waitFor(() => {
      expect(firebaseMocks.firebaseSignOut).toHaveBeenCalledTimes(1);
      expect(client.getQueryCache().getAll()).toHaveLength(0);
    });
  });

  it("refreshes the ID token after email verification changes", async () => {
    const user = userEvent.setup();
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <RefreshProbe />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Refresh verification" }),
    );

    await waitFor(() => {
      expect(firebaseMocks.reload).toHaveBeenCalled();
      expect(firebaseMocks.getIdToken).toHaveBeenCalledWith(true);
    });
  });
});
