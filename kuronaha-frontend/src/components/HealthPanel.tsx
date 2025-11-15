"use client";

import { useEffect, useState } from "react";
import { Card } from "./Card";
import { getJson } from "@/lib/api";

type HealthResponse = {
  status: string;
  engine_model_loaded: boolean;
  engine_explainer_loaded: boolean;
  naval_model_loaded: boolean;
  naval_explainer_loaded: boolean;
};

export function HealthPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getJson<HealthResponse>("/health")
      .then((data) => {
        if (mounted) {
          setHealth(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
        }
      });

    const id = setInterval(() => {
      getJson<HealthResponse>("/health")
        .then((data) => {
          if (mounted) {
            setHealth(data);
            setError(null);
          }
        })
        .catch((err) => {
          if (mounted) {
            setError(err.message);
          }
        });
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Card
      title="Service availability"
      description="Snapshots of the FastAPI instance to confirm the models are ready."
    >
      <dl className="grid gap-4 rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm text-black">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-black/70">API status</dt>
          <dd className="font-semibold">
            {error ? "unreachable" : health?.status ?? "checking"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-black/70">Engine artifacts</dt>
          <dd className="font-semibold">
            {flagLabel(Boolean(health?.engine_model_loaded && health?.engine_explainer_loaded))}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-black/70">Naval artifacts</dt>
          <dd className="font-semibold">
            {flagLabel(Boolean(health?.naval_model_loaded && health?.naval_explainer_loaded))}
          </dd>
        </div>
        {error && <p className="text-xs text-black/70">{error}</p>}
      </dl>
    </Card>
  );
}

function flagLabel(ready: boolean) {
  return ready ? "ready" : "pending";
}
