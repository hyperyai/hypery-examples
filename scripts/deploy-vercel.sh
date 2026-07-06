#!/usr/bin/env bash
#
# Create + configure a Vercel project for every example in this repo, connected
# to the GitHub repo (so each auto-deploys on push), with the correct Root
# Directory and environment variables. Idempotent — safe to re-run.
#
# ── Prerequisites ────────────────────────────────────────────────────────────
# 1. A Vercel token:  export VERCEL_TOKEN=xxxxx   (vercel.com → Account → Tokens)
# 2. If your projects live under a Team, also:    export VERCEL_TEAM_ID=team_xxx
# 3. The Vercel GitHub app must be installed on the `hyperyai` org with access to
#    hypery-examples (vercel.com → Integrations → GitHub). Otherwise the git link
#    fails and you'd deploy via `vercel --cwd <app>` instead.
# 4. Create one Hypery OAuth app per demo (see DEPLOYMENT.md), each with redirect
#    URI  https://hypery-<app>.vercel.app/callback , then export its client id
#    (and secret for the confidential demos). Blank is allowed — the project is
#    still created and you can add the value in the dashboard later:
#
#      export AUTH_DEMO_CLIENT_ID=app_...
#      export FIBER_CLIENT_ID=app_...
#      export JUSTMAKEIT_CLIENT_ID=app_...
#      export VERCEL_DEMO_CLIENT_ID=app_...
#      export CHAT_CLIENT_ID=app_...       CHAT_CLIENT_SECRET=...
#      export IMAGINE_CLIENT_ID=app_...    IMAGINE_CLIENT_SECRET=...
#      # optional:
#      export AUTH_DEMO_SELLER_APP_ID=app_...          # enables the checkout demo
#      export VERCEL_DEMO_GATEWAY_API_KEY=ak_...        # browser-exposed; use a throwaway key
#      export HYPERY_GATEWAY=https://hypery.ai      # gateway origin (default)
#
# Usage:  VERCEL_TOKEN=... AUTH_DEMO_CLIENT_ID=... ./scripts/deploy-vercel.sh
#         DEPLOY=0 ... ./scripts/deploy-vercel.sh    # create/configure only, don't deploy
set -euo pipefail

: "${VERCEL_TOKEN:?export VERCEL_TOKEN (vercel.com → Account Settings → Tokens)}"
API="https://api.vercel.com"
REPO="${EXAMPLES_REPO:-hyperyai/hypery-examples}"
ORG="${REPO%%/*}"; REPONAME="${REPO##*/}"
GATEWAY="${HYPERY_GATEWAY:-https://hypery.ai}"
BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY="${DEPLOY:-1}"
TID="${VERCEL_TEAM_ID:-}"
AUTH=(-H "Authorization: Bearer ${VERCEL_TOKEN}" -H "Content-Type: application/json")

command -v jq  >/dev/null || { echo "jq is required"; exit 1; }

# Build a URL, appending ?upsert / &teamId as needed.
url() { local base="$1" extra="${2:-}" q="${2:-}"
  [ -n "$TID" ] && q="${q:+$q&}teamId=${TID}"
  [ -n "$q" ] && echo "${base}?${q}" || echo "${base}"; }

APPS=(auth-demo chat fiber imagine justmakeit vercel-demo)

# Emit `KEY<TAB>VALUE<TAB>TYPE` env lines for an app. TYPE is plain|sensitive.
app_env() {
  local app="$1" redirect="https://hypery-$1.vercel.app/callback"
  local U="${app^^}"; U="${U//-/_}"
  local cid_v="${U}_CLIENT_ID" sec_v="${U}_CLIENT_SECRET"
  local cid="${!cid_v:-}" sec="${!sec_v:-}"
  e() { printf '%s\t%s\t%s\n' "$1" "$2" "${3:-plain}"; }
  case "$app" in
    auth-demo)
      e NEXT_PUBLIC_AUTH_URL "$GATEWAY"; e NEXT_PUBLIC_OAUTH_CLIENT_ID "$cid"; e NEXT_PUBLIC_REDIRECT_URI "$redirect"
      [ -n "${AUTH_DEMO_SELLER_APP_ID:-}" ] && e NEXT_PUBLIC_DEMO_SELLER_APP_ID "$AUTH_DEMO_SELLER_APP_ID" ;;
    fiber)
      e NEXT_PUBLIC_AUTH_URL "$GATEWAY"; e NEXT_PUBLIC_OAUTH_CLIENT_ID "$cid"; e NEXT_PUBLIC_REDIRECT_URI "$redirect" ;;
    justmakeit)
      e NEXT_PUBLIC_AI_GATEWAY_URL "$GATEWAY"; e NEXT_PUBLIC_GATEWAY_HUB_URL "$GATEWAY"
      e NEXT_PUBLIC_OAUTH_CLIENT_ID "$cid"; e NEXT_PUBLIC_REDIRECT_URI "$redirect" ;;
    chat)
      e NEXT_PUBLIC_API_URL "$GATEWAY/api/v1"; e NEXT_PUBLIC_AUTH_URL "$GATEWAY"
      e NEXT_PUBLIC_OAUTH_CLIENT_ID "$cid"; e NEXT_PUBLIC_REDIRECT_URI "$redirect"; e OAUTH_CLIENT_SECRET "$sec" sensitive ;;
    imagine)
      e NEXT_PUBLIC_API_URL "$GATEWAY/api/v1"; e NEXT_PUBLIC_CORE_API_URL "$GATEWAY"; e NEXT_PUBLIC_AUTH_URL "$GATEWAY"
      e NEXT_PUBLIC_OAUTH_CLIENT_ID "$cid"; e NEXT_PUBLIC_REDIRECT_URI "$redirect"; e OAUTH_CLIENT_SECRET "$sec" sensitive ;;
    vercel-demo)
      e NEXT_PUBLIC_API_URL "$GATEWAY/api/v1"; e NEXT_PUBLIC_AUTH_URL "$GATEWAY"
      e NEXT_PUBLIC_OAUTH_CLIENT_ID "$cid"; e NEXT_PUBLIC_REDIRECT_URI "$redirect"
      [ -n "${VERCEL_DEMO_GATEWAY_API_KEY:-}" ] && e NEXT_PUBLIC_GATEWAY_API_KEY "$VERCEL_DEMO_GATEWAY_API_KEY" ;;
  esac
}

echo "Deploying examples from ${REPO} to Vercel${TID:+ (team ${TID})}"; echo

for app in "${APPS[@]}"; do
  name="hypery-${app}"
  echo "▸ ${name}  (root: ${app})"

  # 1. Create the project, git-connected, with the app folder as Root Directory.
  body=$(jq -n --arg n "$name" --arg r "$app" --arg repo "$REPO" \
    '{name:$n, framework:"nextjs", rootDirectory:$r, gitRepository:{type:"github", repo:$repo}}')
  resp=$(curl -sS -w $'\n%{http_code}' -X POST "$(url "$API/v11/projects")" "${AUTH[@]}" -d "$body")
  code=${resp##*$'\n'}; json=${resp%$'\n'*}
  case "$code" in
    200|201) echo "  ✓ project created" ;;
    409)     echo "  • project exists — updating env" ;;
    *)       echo "  ✗ create failed (HTTP $code): $(jq -r '.error.message // .' <<<"$json")"; echo; continue ;;
  esac

  # 2. Upsert environment variables.
  while IFS=$'\t' read -r key val typ; do
    [ -z "${key:-}" ] && continue
    if [ -z "${val:-}" ]; then echo "    – ${key}: no value (add it in the dashboard)"; continue; fi
    ebody=$(jq -n --arg k "$key" --arg v "$val" --arg t "$typ" \
      '{key:$k, value:$v, type:$t, target:["production","preview","development"]}')
    ec=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$(url "$API/v10/projects/$name/env" "upsert=true")" "${AUTH[@]}" -d "$ebody")
    [ "$ec" = 200 ] || [ "$ec" = 201 ] && echo "    ✓ ${key}" || echo "    ✗ ${key} (HTTP $ec)"
  done < <(app_env "$app")

  # 3. Trigger a production deploy (best effort — a push to $BRANCH also deploys).
  if [ "$DEPLOY" = 1 ]; then
    dbody=$(jq -n --arg n "$name" --arg org "$ORG" --arg repo "$REPONAME" --arg ref "$BRANCH" \
      '{name:$n, target:"production", gitSource:{type:"github", org:$org, repo:$repo, ref:$ref}}')
    dc=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$(url "$API/v13/deployments")" "${AUTH[@]}" -d "$dbody")
    [ "$dc" = 200 ] || [ "$dc" = 201 ] && echo "  ⟳ production deploy triggered" \
      || echo "  ! deploy trigger returned HTTP $dc — push to ${BRANCH} or click Deploy in the dashboard"
  fi
  echo "  → https://${name}.vercel.app"; echo
done

echo "Done. Live URLs (once builds finish):"
for app in "${APPS[@]}"; do echo "  https://hypery-${app}.vercel.app"; done
