import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import useFetch from "@/hooks/use-fetch";

it("returns successful values and propagates failures to the caller", async () => {
  const callback = vi.fn().mockResolvedValueOnce({ id: "saved" }).mockRejectedValueOnce(new Error("Save failed"));
  const { result } = renderHook(() => useFetch(callback));
  await act(async () => { expect(await result.current.fn()).toEqual({ id: "saved" }); });
  await act(async () => { await expect(result.current.fn()).rejects.toThrow("Save failed"); });
  expect(result.current.error.message).toBe("Save failed");
  expect(result.current.loading).toBe(false);
});
