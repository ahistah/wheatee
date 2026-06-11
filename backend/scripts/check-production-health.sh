#!/usr/bin/env bash
set -euo pipefail

: "${WHEATY_API_URL:?Set WHEATY_API_URL to the deployed Cloud Run URL}"

base_url="${WHEATY_API_URL%/}"
health_json="$(curl -fsS "$base_url/health")"

HEALTH_JSON="$health_json" bun -e '
const health = JSON.parse(process.env.HEALTH_JSON ?? "{}");
const failures = [];

if (health.ok !== true) failures.push("ok is not true");
if (health.ready !== true) failures.push("ready is not true");
if (health.mode !== "ai") failures.push(`mode is ${health.mode ?? "missing"}, expected ai`);
if (health.mongo !== true) failures.push("mongo is not true");
if (health.storage !== true) failures.push("storage is not true");
if (health.speech !== true) failures.push("speech is not true");
if (!Number.isFinite(health.knowledgeBase) || health.knowledgeBase < 1) failures.push("knowledgeBase is empty");
if (Array.isArray(health.missingConfig) && health.missingConfig.length) {
  failures.push(`missingConfig: ${health.missingConfig.join(", ")}`);
}

if (failures.length) {
  console.error("Production health check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(JSON.stringify(health, null, 2));
  process.exit(1);
}

console.log("Production health check passed.");
console.log(JSON.stringify({
  service: health.service,
  ready: health.ready,
  mode: health.mode,
  knowledgeBase: health.knowledgeBase,
}, null, 2));
'
