import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedPage } from "./protected-page";

const mocks = vi.hoisted(() => ({
  auth: {
    user: null as { emailVerified: boolean } | null,
    loading: false,
    configured: true,
  },
  replace: vi.fn(),
}));

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mocks.auth,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("./app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

describe("ProtectedPage", () => {
  beforeEach(() => {
    mocks.auth.user = null;
    mocks.auth.loading = false;
    mocks.auth.configured = true;
  });

  it("fails closed when Firebase is not configured", () => {
    mocks.auth.configured = false;

    render(
      <ProtectedPage>
        <div>Private dashboard</div>
      </ProtectedPage>,
    );

    expect(
      screen.getByRole("heading", { name: "Authentication is unavailable" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Private dashboard")).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("does not mount private content while session bootstrap is pending", () => {
    mocks.auth.loading = true;

    render(
      <ProtectedPage>
        <div>Private dashboard</div>
      </ProtectedPage>,
    );

    expect(screen.getByText("Restoring your session…")).toBeInTheDocument();
    expect(screen.queryByText("Private dashboard")).not.toBeInTheDocument();
  });

  it("redirects a signed-out visitor without mounting private content", async () => {
    render(
      <ProtectedPage>
        <div>Private dashboard</div>
      </ProtectedPage>,
    );

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/sign-in"));
    expect(screen.queryByText("Private dashboard")).not.toBeInTheDocument();
  });

  it("routes an unverified account to verification", async () => {
    mocks.auth.user = { emailVerified: false };

    render(
      <ProtectedPage>
        <div>Private dashboard</div>
      </ProtectedPage>,
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/verify-email"),
    );
    expect(screen.queryByText("Private dashboard")).not.toBeInTheDocument();
  });

  it("renders private content only for a verified account", () => {
    mocks.auth.user = { emailVerified: true };

    render(
      <ProtectedPage>
        <div>Private dashboard</div>
      </ProtectedPage>,
    );

    expect(screen.getByText("Private dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
