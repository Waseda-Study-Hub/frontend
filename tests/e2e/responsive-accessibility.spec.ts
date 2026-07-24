import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { signInVerified } from "./support/mocks";

const viewports = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "laptop", width: 1024, height: 900 },
  { name: "desktop", width: 1440, height: 1_000 },
] as const;

const protectedScreens = [
  { path: "/dashboard", heading: "Hello, Haru." },
  { path: "/profile", heading: "Your profile" },
  { path: "/buddies", heading: "Find a study buddy" },
  { path: "/requests", heading: "Study requests" },
  { path: "/spots", heading: "Find your study spot" },
  { path: "/spots/spot-1", heading: "Building 3 Study Commons" },
  { path: "/spots/recommend", heading: "Recommend a study spot" },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const offenders = Array.from(
      document.querySelectorAll<HTMLElement>("body *"),
    )
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: element.className,
          left: Math.round(box.left),
          right: Math.round(box.right),
        };
      })
      .filter(({ left, right }) => left < -1 || right > clientWidth + 1)
      .slice(0, 8);

    return {
      clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders,
    };
  });

  expect(
    result.scrollWidth,
    `Overflowing elements: ${JSON.stringify(result.offenders)}`,
  ).toBeLessThanOrEqual(result.clientWidth);
}

for (const viewport of viewports) {
  test(`${viewport.width}px viewport keeps core screens usable without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await signInVerified(page);

    for (const screen of protectedScreens) {
      await page.goto(screen.path);
      await expect(
        page.getByRole("heading", { name: screen.heading }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    if (viewport.width <= 760) {
      await expect(
        page.getByRole("navigation", { name: "Mobile primary" }),
      ).toBeVisible();
      await page.goto("/profile");
      await page.getByRole("button", { name: /Change school/ }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    } else {
      await expect(
        page.getByRole("navigation", { name: "Primary" }),
      ).toBeVisible();
    }
  });
}

test("sign-in has no serious or critical automated accessibility violations", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();

  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = result.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );

  expect(serious).toEqual([]);
});

test("authenticated core screens have no serious or critical automated accessibility violations", async ({
  page,
}) => {
  await signInVerified(page);

  for (const screen of protectedScreens) {
    await page.goto(screen.path);
    await expect(
      page.getByRole("heading", { name: screen.heading }),
    ).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = result.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    );

    expect(
      serious,
      `${screen.path}: ${serious
        .map(({ id, help }) => `${id} (${help})`)
        .join(", ")}`,
    ).toEqual([]);
  }
});
