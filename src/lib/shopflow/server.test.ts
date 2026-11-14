import { it, expect } from "vitest";
import { shopflowRequest } from "./server";
import { newRun } from "./engine";
function request(body: unknown, origin = "http://localhost") {
  return new Request("http://localhost/api/shopflow", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify(body),
  });
}
it("executes state transitions on the server and recomputes state from validated events", async () => {
  const response = await shopflowRequest(
    request({
      run: newRun(),
      action: { type: "ORDER_INSPECTED", id: "SF-1042" },
    }),
  );
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.state.inspected).toEqual(["SF-1042"]);
  expect(data.run.events[0].action.type).toBe("ORDER_INSPECTED");
});
it("rejects invalid workflow and cross-origin submissions", async () => {
  expect(
    (
      await shopflowRequest(
        request({
          run: newRun(),
          action: { type: "ROLE_SWITCHED", skipEscalation: true },
        }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await shopflowRequest(
        request({ run: newRun() }, "https://attacker.example"),
      )
    ).status,
  ).toBe(403);
});
it("labels fallback honestly and never calls it AI", async () => {
  const response = await shopflowRequest(
    request({ run: newRun(), mode: "chat", text: "How do refunds work?" }),
  );
  const data = await response.json();
  expect(data.source).toBe("reference");
  expect(data.notice).toContain("not connected");
  expect(data.text).toContain("overcharge");
});
