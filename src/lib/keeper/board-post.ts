import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const postBoardScore = createServerFn({ method: "POST" })
  .validator(
    z.object({
      player: z.string(),
      score: z.number(),
      lines: z.number(),
      nonce: z.string(),
      signature: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { submitSignedScore } = await import("./run");
    return submitSignedScore(data);
  });
