import { expect, test } from "@playwright/test";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAAEklEQVR4nGNgYGD4z8DAwAAABQAB/ym9dEAAAAAASUVORK5CYII=", "base64");

test("the profile shows counts, and anyone can drop a picture, open it and download it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "midnightfusion" })).toBeVisible();
  await expect(page.getByText("Covered in bubbles. You're connected.")).toBeVisible();
  const before = Number(await page.locator(".stats li").first().locator("b").innerText());
  await page.getByRole("button", { name: "Put up your own" }).click();
  await page.getByLabel("Picture or video").setInputFiles({ name: "koi-patch.png", mimeType: "image/png", buffer: PNG });
  await page.getByLabel("Your name").fill("Ana");
  await expect(page.getByLabel("Caption")).toHaveValue("koi patch");
  await page.getByRole("button", { name: "Drop it" }).click();
  await expect(page.locator(".stats li").first().locator("b")).toHaveText(String(before + 1));
  await page.getByRole("listitem", { name: /koi patch by Ana/ }).click();
  const post = page.getByRole("dialog");
  await expect(post.getByText("koi patch")).toBeVisible();
  await expect(post.getByRole("link", { name: "Download" })).toHaveAttribute("href", /^blob:|^data:|^\//);
  await expect(page.getByRole("button", { name: /take down|owner|sign in/i })).toHaveCount(0);
  await post.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a stranger cannot drop a PDF or skip the file", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Put up your own" }).click();
  await page.getByLabel("Picture or video").setInputFiles({ name: "po.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
  await expect(page.getByText("Pictures and videos only.")).toBeVisible();
  await page.getByRole("button", { name: "Drop it" }).click();
  await expect(page.getByText("Pick a picture or a video first.")).toBeVisible();
});
