#!/usr/bin/env bash
# Testlauf gegen eine isolierte Test-DB und einen eigenen App-Server.
#
# Vorher schrieben alle Suites in die Live-DB: die Prisma-Tests direkt, und
# tests/auth.test.mjs registrierte User per HTTP gegen den PROD-Server auf :3000.
# Dieses Script startet stattdessen einen eigenen Standalone-Server gegen
# pagefoundry_test und faehrt ihn danach wieder herunter.
#
#   bash scripts/test.sh              # alle Suites
#   bash scripts/test.sh auth         # nur eine Suite (auth|retell|consultation)

set -euo pipefail
cd "$(dirname "$0")/.."

SUITE="${1:-all}"

# ── Env: bewusst NUR .env.test, niemals die Prod-.env ────────────────────────
if [ ! -f .env.test ]; then
  echo "FEHLER: .env.test fehlt. Vorlage: .env.test.example" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
. ./.env.test
set +a

# ── Schutzsperre: niemals gegen die Prod-DB ──────────────────────────────────
DB_NAME="$(node -e 'process.stdout.write(new URL(process.env.DATABASE_URL).pathname.slice(1))')"
if [ "$DB_NAME" != "pagefoundry_test" ]; then
  echo "ABBRUCH: DATABASE_URL zeigt auf '$DB_NAME', erwartet 'pagefoundry_test'." >&2
  echo "Die Tests schreiben echte Zeilen — sie laufen nicht gegen Prod." >&2
  exit 1
fi
if [ "${EMAIL_ENABLED:-}" = "true" ]; then
  echo "ABBRUCH: EMAIL_ENABLED=true in der Testumgebung — das wuerde echte Mails senden." >&2
  exit 1
fi

PORT="${TEST_PORT:-3011}"
export PORT
export HOSTNAME=127.0.0.1
export TEST_BASE_URL="${TEST_BASE_URL:-http://127.0.0.1:$PORT}"

if ss -ltn "sport = :$PORT" | tail -n +2 | grep -q .; then
  echo "ABBRUCH: Port $PORT ist belegt. TEST_PORT in .env.test aendern." >&2
  exit 1
fi

echo "→ Test-DB: $DB_NAME | Server: $TEST_BASE_URL | Suite: $SUITE"

# ── Schema auf die Test-DB bringen ───────────────────────────────────────────
npx prisma migrate deploy >/dev/null
echo "✓ Migrationen auf der Test-DB"

# ── Build: nur neu bauen, wenn der Standalone-Server veraltet ist ────────────
SERVER=".next/standalone/server.js"
NEWEST_SRC="$(find app src prisma package.json next.config.js middleware.ts -type f -newer "$SERVER" -print -quit 2>/dev/null || true)"
if [ ! -f "$SERVER" ] || [ -n "$NEWEST_SRC" ]; then
  echo "→ Build (Standalone fehlt oder ist aelter als der Quellcode)…"
  npm run build >/dev/null
fi
echo "✓ Build aktuell"

# ── Eigenen Server starten ───────────────────────────────────────────────────
node "$SERVER" >/tmp/pagefoundry-test-server.log 2>&1 &
SERVER_PID=$!

cleanup() {
  # Gezielt per PID beenden. NIEMALS `pkill -f standalone/server.js`:
  # mehrere Next-Apps auf dieser Maschine teilen diesen Pfad, das killt fremde Prod-Server.
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

for i in $(seq 1 40); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "FEHLER: Test-Server ist abgestuerzt. Log:" >&2
    tail -20 /tmp/pagefoundry-test-server.log >&2
    exit 1
  fi
  if curl -sf -o /dev/null "$TEST_BASE_URL/" 2>/dev/null; then
    echo "✓ Test-Server laeuft (PID $SERVER_PID)"
    break
  fi
  sleep 0.5
  if [ "$i" -eq 40 ]; then
    echo "FEHLER: Test-Server antwortet nicht auf $TEST_BASE_URL. Log:" >&2
    tail -20 /tmp/pagefoundry-test-server.log >&2
    exit 1
  fi
done

# ── Suites ───────────────────────────────────────────────────────────────────
run_auth()         {
  node --test tests/auth.test.mjs
  npx tsx --test tests/safePath.unit.test.ts tests/passwordReset.unit.test.ts
}
run_retell()       { npx tsx --test tests/retell.unit.test.ts; }
run_consultation() { npx tsx --test tests/consultation.unit.test.ts; }
run_flows()        { node --test tests/customerFlows.integration.test.mjs; }

case "$SUITE" in
  auth)         run_auth ;;
  retell)       run_retell ;;
  consultation) run_consultation ;;
  flows)        run_flows ;;
  all)          run_auth && run_retell && run_consultation && run_flows ;;
  *) echo "Unbekannte Suite '$SUITE' (auth|retell|consultation|flows)" >&2; exit 1 ;;
esac
