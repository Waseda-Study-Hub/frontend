import { expect, test } from "@playwright/test";
import {
  E2E_USER,
  installApiMock,
  signIn,
  signInVerified,
} from "./support/mocks";

test("a signed-out visitor cannot render a protected page", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.getByRole("heading", { name: /Your study day, at a glance/i }),
  ).toHaveCount(0);
});

test("an unverified account is routed to email verification", async ({
  page,
}) => {
  await installApiMock(page);
  await signIn(page, { verified: false });

  await expect(page).toHaveURL(/\/verify-email$/);
  await expect(
    page.getByRole("heading", { name: "Verify your Waseda email" }),
  ).toBeVisible();
  await expect(page.getByText(E2E_USER.email)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/verify-email$/);
});

test("a verified account can enter the protected application", async ({
  page,
}) => {
  await signInVerified(page);

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hello, Haru." }),
  ).toBeVisible();
});

test("sign-out returns to sign-in and the protected route stays closed", async ({
  page,
}) => {
  await signInVerified(page);
  await page.locator('summary[aria-label="Open profile menu"]').click();
  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
});
