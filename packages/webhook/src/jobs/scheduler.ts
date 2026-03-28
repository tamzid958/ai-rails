import { prisma } from "@airails/shared";
import { correlationQueue } from "./queue.js";

export async function scheduleNightlyJobs(): Promise<void> {
  const products = await prisma.product.findMany({
    select: { id: true, slug: true },
  });

  for (const product of products) {
    await correlationQueue.add(
      "recalculate-effectiveness",
      { productId: product.id, prEventExternalId: "", branchName: "", engineerId: "" },
      {
        repeat: { pattern: "0 3 * * *" },
        jobId: `nightly-${product.id}`,
      },
    );

    console.log(
      `[scheduler] Nightly recalculation scheduled for product ${product.slug}`,
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
}
