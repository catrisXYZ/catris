import { createServerFn } from "@tanstack/react-start";
import { createPublicClient, http, type Address } from "viem";
import { z } from "zod";
import { ponsEscrowAbi } from "@/lib/abis";
import { PONS, robinhoodChain } from "@/lib/chain";

export const readEscrowNative = createServerFn({ method: "GET" })
  .validator(z.object({ recipient: z.string() }))
  .handler(async ({ data }) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(data.recipient)) return null as string | null;
    const client = createPublicClient({
      chain: robinhoodChain,
      transport: http(robinhoodChain.rpcUrls.default.http[0]),
    });
    try {
      const value = await client.readContract({
        address: PONS.feeEscrow,
        abi: ponsEscrowAbi,
        functionName: "balanceOf",
        args: [data.recipient as Address],
      });
      return value.toString();
    } catch {
      return null;
    }
  });
