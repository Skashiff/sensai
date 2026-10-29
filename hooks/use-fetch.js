"use client";

import { useCallback, useState } from "react";

export default function useFetch(callback) {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fn = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await callback(...args);
      setData(result);
      return result;
    } catch (failure) {
      const nextError = failure instanceof Error ? failure : new Error("The request failed. Please try again.");
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [callback]);
  return { data, loading, error, fn, setData };
}
