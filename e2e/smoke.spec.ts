import { expect, test } from "@playwright/test";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAAEklEQVR4nGNgYGD4z8DAwAAABQAB/ym9dEAAAAAASUVORK5CYII=", "base64");

test("anyone can drop a picture and download it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Drops" })).toBeVisible();
  await page.getByLabel("Picture or video").setInputFiles({ name: "koi-patch.png", mimeType: "image/png", buffer: PNG });
  await page.getByLabel("Your name").fill("Ana");
  await expect(page.getByLabel("Caption")).toHaveValue("koi patch");
  await page.getByRole("button", { name: "Drop it" }).click();
  const card = page.locator("figure").filter({ hasText: "KOI PATCH" });
  await expect(card).toBeVisible();
  await expect(card.getByText(/Ana ·/)).toBeVisible();
  await expect(card.getByRole("link", { name: "Download" })).toHaveAttribute("href", /^blob:|^data:/);
  await expect(card.getByRole("button", { name: "Take down" })).toHaveCount(0);
});

test("a stranger cannot drop a PDF or skip the name", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Picture or video").setInputFiles({ name: "po.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
  await expect(page.getByText("Pictures and videos only.")).toBeVisible();
  await page.getByRole("button", { name: "Drop it" }).click();
  await expect(page.getByText("Pick a picture or a video first.")).toBeVisible();
});

test("the owner signs in and takes a drop down", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Owner" }).click();
  await page.getByLabel("Email").fill("justin@example.com");
  await page.getByLabel("Password").fill("twelve-letters!");
  await page.getByRole("button", { name: "Sign in" }).click();
  const first = page.locator("figure").first();
  const title = await first.locator(".title").innerText();
  await first.getByRole("button", { name: "Take down" }).click();
  await expect(page.getByText("Taken down.")).toBeVisible();
  await expect(page.locator("figure").filter({ hasText: title })).toHaveCount(0);
});
