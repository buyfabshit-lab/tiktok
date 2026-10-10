import { expect, test } from "@playwright/test";

test("signs in and adds a note", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("jeff@example.com");
  await page.getByLabel("Password").fill("demo-password-12");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Notes" })).toBeVisible();
  await page.getByLabel("New note").fill("floor test");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("floor test")).toBeVisible();
});
