import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
const plan = {
  decision: "Ship core only.",
  priorities: "Defer analytics.",
  actions: "Sam owns core by Wednesday.",
  risks: "Critical defect means delay.",
  clientMessage: "Please approve the reduced scope; next update Thursday.",
};
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_PRACTICE_STATIC", "true");
  const map = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("public browser practice", () => {
  it("completes a no-key simulation and preserves previous attempts", async () => {
    const { transport } = await import("./transport");
    let r = await transport("start");
    expect(r.capabilities.ai).toBe(false);
    await expect(
      transport("submit", { revision: r.session.revision, plan }),
    ).rejects.toThrow("circumstance");
    r = await transport("reveal", { revision: r.session.revision, plan });
    r = await transport("submit", { revision: r.session.revision, plan });
    expect(r.session.attempts[0].feedback).toBeNull();
    r = await transport("revise", { revision: r.session.revision });
    r = await transport("submit", {
      revision: r.session.revision,
      plan: { ...plan, decision: "Delay pending full testing." },
    });
    expect(r.session.attempts).toHaveLength(2);
    expect(r.session.attempts[0].plan.decision).toBe(plan.decision);
    expect((await transport()).session).toEqual(r.session);
  });
  it("detects another tab changing the session", async () => {
    const { transport } = await import("./transport");
    const r = await transport("start");
    await transport("save", { revision: r.session.revision, plan });
    await expect(
      transport("save", { revision: r.session.revision, plan }),
    ).rejects.toThrow("another tab");
  });
  it("stores references as authored material and never generates fake AI", async () => {
    const { transport } = await import("./transport");
    let r = await transport("start");
    r = await transport("reference", {
      revision: r.session.revision,
      colleague: "alex",
      note: 0,
    });
    expect(r.session.messages[1].source).toBe("reference");
    await expect(
      transport("chat", { revision: r.session.revision }),
    ).rejects.toThrow("not connected");
  });
  it("resets only the simulation and leaves unrelated browser data alone", async () => {
    const { transport } = await import("./transport");
    localStorage.setItem("unrelated", "keep");
    await transport("start");
    await transport("reset");
    expect((await transport()).session).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });
});
