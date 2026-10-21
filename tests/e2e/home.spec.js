import { test, expect } from "@playwright/test";

test.describe("JWT Generator - Frontend Smoke Tests", () => {
  test("Generator page loads successfully", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "JWT Generator" })
    ).toBeVisible();
  });

  test("Decoder page loads successfully", async ({ page }) => {
    await page.goto("/decode");

    await expect(
      page.getByRole("heading", { name: "JWT Decoder" })
    ).toBeVisible();
  });

  test("Verifier page loads successfully", async ({ page }) => {
    await page.goto("/verify");

    await expect(
      page.getByRole("heading", { name: "JWT Verifier" })
    ).toBeVisible();
  });

  test("Navigation links are visible", async ({ page }) => {
    await page.goto("/");

    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
    });

    await expect(navigation.getByRole("link", { name: "Generator" }))
      .toBeVisible();

    await expect(navigation.getByRole("link", { name: "Decoder" }))
      .toBeVisible();

    await expect(navigation.getByRole("link", { name: "Verifier" }))
      .toBeVisible();
  });

  test("Navigation opens the Decoder page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Decoder" })
      .click();

    await expect(page).toHaveURL(/\/decode$/);

    await expect(
      page.getByRole("heading", { name: "JWT Decoder" })
    ).toBeVisible();
  });

  test("Navigation opens the Verifier page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Verifier" })
      .click();

    await expect(page).toHaveURL(/\/verify$/);

    await expect(
      page.getByRole("heading", { name: "JWT Verifier" })
    ).toBeVisible();
  });
});