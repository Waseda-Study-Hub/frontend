import { expect, test } from "@playwright/test";
import {
  installApiMock,
  PRIVATE_SPOT_NAME,
  signIn,
  signInVerified,
} from "./support/mocks";

test("a first-login 404 becomes profile onboarding with validation", async ({
  page,
}) => {
  await installApiMock(page, { missingProfile: true });
  await signIn(page, { verified: true });

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Start with your academic profile" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Build my profile/ }).click();
  await expect(
    page.getByRole("heading", { name: "Build your study profile" }),
  ).toBeVisible();

  await page.getByLabel("Nickname").fill("H");
  await page.getByRole("button", { name: "Complete profile" }).click();

  await expect(page.getByLabel("Nickname")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByText("Choose your school.")).toBeVisible();
  await expect(
    page.getByText("Choose at least one study style."),
  ).toBeVisible();
});

test("buddy filters synchronize to the URL and can be cleared", async ({
  page,
}) => {
  await signInVerified(page);
  await page.goto("/buddies");
  await expect(page.getByRole("heading", { name: "Aoi" })).toBeVisible();

  await page
    .getByPlaceholder("Course, topic, or nickname")
    .fill("law & economics");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("law & economics");

  await page.getByLabel("Year").selectOption("2");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("year"))
    .toBe("2");

  await page.getByLabel("Study style").selectOption("quiet_study");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("study_style"))
    .toBe("quiet_study");

  await page
    .getByRole("combobox", { name: "Language" })
    .selectOption("english");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("study_language"))
    .toBe("english");

  await page.reload();
  await expect(page.getByPlaceholder("Course, topic, or nickname")).toHaveValue(
    "law & economics",
  );
  await expect(page.getByLabel("Year")).toHaveValue("2");
  await expect(page.getByLabel("Study style")).toHaveValue("quiet_study");
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue(
    "english",
  );

  await page.getByRole("button", { name: "Clear all" }).click();
  await expect.poll(() => new URL(page.url()).search).toBe("");
});

test("request validation runs before persistence and success stays privacy-safe", async ({
  page,
}) => {
  await signInVerified(page);
  await page.goto("/buddies");
  await expect(page.getByRole("heading", { name: "Aoi" })).toBeVisible();
  await page.getByRole("button", { name: "Request study" }).click();

  const dialog = page.getByRole("dialog", { name: "Study with Aoi" });
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Write at least 10 characters.")).toBeVisible();

  await page
    .getByLabel("Message")
    .fill("Would you like to review microeconomics together?");
  await page.getByLabel("Waseda email").uncheck();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(
    page.getByText("Choose at least one contact method."),
  ).toBeVisible();

  await page.getByLabel("Instagram").check();
  await page.getByRole("button", { name: "Send request" }).click();

  await expect(
    page.getByRole("heading", { name: "Request sent" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Contact details remain hidden unless the request is accepted/,
    ),
  ).toBeVisible();
  await expect(page.getByText("aoi@fuji.waseda.jp")).toHaveCount(0);
});

test("a duplicate pending request renders a safe conflict state", async ({
  page,
}) => {
  await installApiMock(page, { requestConflict: true });
  await signIn(page, { verified: true });
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/buddies");
  await page.getByRole("button", { name: "Request study" }).click();
  await page
    .getByLabel("Message")
    .fill("Would you like to review microeconomics together?");
  await page.getByRole("button", { name: "Send request" }).click();

  await expect(
    page.getByRole("alert").filter({
      hasText: "You already have a pending request with this student.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Duplicate pending request")).toHaveCount(0);
});

test("contact information is fetched only from an accepted connection", async ({
  page,
}) => {
  await signInVerified(page);
  await page.goto("/requests");

  await expect(page.getByRole("heading", { name: "Aoi" })).toBeVisible();
  await expect(page.getByText("aoi@fuji.waseda.jp")).toHaveCount(0);

  await page.getByRole("tab", { name: "Connected" }).click();
  await expect(page.getByRole("heading", { name: "Aoi" })).toBeVisible();
  await expect(page.getByText("aoi@fuji.waseda.jp")).toHaveCount(0);

  await page
    .getByRole("button", { name: "View shared contact details" })
    .click();
  await expect(page.getByText("aoi@fuji.waseda.jp")).toBeVisible();
});

test("study-spot filters reach the API and private spots are absent", async ({
  page,
}) => {
  await signInVerified(page);
  await page.goto("/spots");
  await expect(
    page.getByRole("heading", { name: "Building 3 Study Commons" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Toyama Learning Commons" }),
  ).toBeVisible();
  await expect(page.getByText(PRIVATE_SPOT_NAME)).toHaveCount(0);

  const filteredRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname === "/__test-api/study-spots/" &&
      url.searchParams.get("campus") === "Toyama" &&
      url.searchParams.get("outlets") === "true"
    );
  });
  await page.getByLabel("Campus").selectOption("Toyama");
  await page.getByLabel("Outlets").check();
  await filteredRequest;

  await expect(page.getByText(/2 approved public spots/)).toBeVisible();
});

test("study-spot contribution validates input and never sends client authority", async ({
  page,
}) => {
  await signInVerified(page);
  await page.goto("/spots/recommend");
  await expect(page.getByText(PRIVATE_SPOT_NAME)).toBeVisible();
  await page.getByRole("button", { name: "Submit recommendation" }).click();

  await expect(page.getByLabel("Spot name")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Campus")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Description")).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await page.getByLabel("Spot name").fill("Building 3 Study Commons");
  await page.getByLabel("Campus").selectOption("Waseda");
  await page.getByLabel("Building").fill("Building 3");
  await page.getByLabel(/Floor or location note/).fill("2F");
  await page
    .getByLabel("Description")
    .fill("A quiet shared study area near the central staircase.");
  await page.getByLabel("Electrical outlets").check();
  await page.getByLabel("Private contribution").check();

  const submissionPromise = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/__test-api/study-spots/",
  );
  await page.getByRole("button", { name: "Submit recommendation" }).click();
  const submission = await submissionPromise;
  const submitted = submission.postDataJSON();

  expect(submitted).toMatchObject({
    name: "Building 3 Study Commons",
    campus: "Waseda",
    building: "Building 3",
    visibility: "private",
    has_outlets: true,
  });
  expect(submitted).not.toHaveProperty("added_by");
  expect(submitted).not.toHaveProperty("uid");

  await expect(
    page.getByRole("heading", { name: "Thanks for sharing a study spot" }),
  ).toBeVisible();
});
