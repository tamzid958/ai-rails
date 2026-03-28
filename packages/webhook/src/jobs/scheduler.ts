import { prisma } from "@airails/shared";
import { correlationQueue, recommendationsQueue } from "./queue.js";

export async function scheduleNightlyJobs(): Promise<void> {
  const products = await prisma.product.findMany({
    select: { id: true, slug: true },
  });

  for (const product of products) {
    // 3 AM — correlation recalculation
    await correlationQueue.add(
      "recalculate-effectiveness",
      { productId: product.id, prEventExternalId: "", branchName: "", engineerId: "" },
      {
        repeat: { pattern: "0 3 * * *" },
        jobId: `nightly-${product.id}`,
      },
    );

    // 4 AM — recommendations generation (1 hour after correlation)
    await recommendationsQueue.add(
      "generate-recommendations",
      { productId: product.id },
      {
        repeat: { pattern: "0 4 * * *" },
        jobId: `recs-${product.id}`,
      },
    );

    console.log(
      `[scheduler] Nightly jobs scheduled for product ${product.slug}`,
    );
  }
}

export async function scheduleProductNightly(
  productId: string,
): Promise<void> {
  await correlationQueue.add(
    "recalculate-effectiveness",
    { productId, prEventExternalId: "", branchName: "", engineerId: "" },
    {
      repeat: { pattern: "0 3 * * *" },
      jobId: `nightly-${productId}`,
    },
  );

  await recommendationsQueue.add(
    "generate-recommendations",
    { productId },
    {
      repeat: { pattern: "0 4 * * *" },
      jobId: `recs-${productId}`,
    },
  );
}
