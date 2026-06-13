import { describe, it, expect } from "vitest";
import { parseVenice402, buildEip3009TypedData, encodeVenicePaymentHeader } from "../venice-x402";

// Venice's real 402 shape (captured 2026-06-13).
const body402 = {
  x402Version: 2,
  accepts: [
    {
      scheme: "exact",
      network: "eip155:8453",
      asset: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      amount: "10000000",
      payTo: "0x2670b922ef37c7df47158725c0cc407b5382293f",
      extra: { name: "USD Coin", version: "2" },
    },
    { scheme: "exact", network: "solana", asset: "EPjF…", amount: "10000000", payTo: "8qUL…" },
  ],
};

describe("parseVenice402", () => {
  it("picks the EVM (Base) requirement and ignores Solana", () => {
    const r = parseVenice402(body402)!;
    expect(r.chainId).toBe(8453);
    expect(r.network).toBe("eip155:8453");
    expect(r.amount).toBe("10000000");
    expect(r.name).toBe("USD Coin");
  });
  it("returns null when no EVM exact requirement exists", () => {
    expect(parseVenice402({ accepts: [{ scheme: "exact", network: "solana", asset: "x", amount: "1", payTo: "y" }] })).toBeNull();
  });
});

describe("buildEip3009TypedData", () => {
  it("builds a valid TransferWithAuthorization typed payload", () => {
    const req = parseVenice402(body402)!;
    const td = buildEip3009TypedData(req, "0x39D2bae5EAedA9283535dDC98F1991c81eD5Cd7E", "0x" + "00".repeat(32) as `0x${string}`, 9999999999);
    expect(td.primaryType).toBe("TransferWithAuthorization");
    expect(td.domain.chainId).toBe(8453);
    expect(td.message.value).toBe(10_000_000n);
    expect(td.message.to).toBe(req.payTo);
  });
});

describe("encodeVenicePaymentHeader", () => {
  it("base64-encodes an x402 v2 exact payment", () => {
    const req = parseVenice402(body402)!;
    const h = encodeVenicePaymentHeader(req, { from: "0x1", to: req.payTo, value: req.amount }, "0xsig" as `0x${string}`);
    const decoded = JSON.parse(Buffer.from(h, "base64").toString());
    expect(decoded.x402Version).toBe(2);
    expect(decoded.scheme).toBe("exact");
    expect(decoded.payload.signature).toBe("0xsig");
  });
});
