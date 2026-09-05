import type { Hex } from "viem";

/** Pinned Cream list for remaining EOA holders. Keep in source so Vercel can see it. */
export const CREAM_SNAP = {
  root: "0xacf6582faa5aba6c474a03a83d71dfb79d8dc45fbe33d9da6677d802c6ea69d6" as Hex,
  drip: "53852557832677280",
  leaves: [
    {
      address: "0x03c3239111E983C55eD95b595E6A694CC7513DAa",
      amount: "3191622160602707",
      leaf: "0xf5230451c53444eefa0789675303384eb17810508b0a57a8ec768c998d4eccb4" as Hex,
    },
    {
      address: "0x2A462185A70Fe65da46d79CF148A242102c9a596",
      amount: "50151549287728577",
      leaf: "0x51c63169551ded9a296b4c13e26fcc44e1088b358c8fc9a4d07e340443cae1fd" as Hex,
    },
    {
      address: "0x4CA9011E51788c5acA2db978dC1A7Ea5F09f870B",
      amount: "509386193874525",
      leaf: "0x05af87b03f9508cb63fd4673cb0e0f16995a237255d9774de94534392af4cfa1" as Hex,
    },
    {
      address: "0x7856d270fD3B21D864ECcbd9210a6FeACe2dD78d",
      amount: "190471469",
      leaf: "0x17759139c5dc9e6b66a2fd6fc5cdfce727e455ac5dff91bd6c68d638bc835fec" as Hex,
    },
  ],
} as const;
