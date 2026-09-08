# Caddy — static site config

`Caddyfile.static` is the live config at
`/srv/devanshedutech/frontend/Caddyfile.static` on the VPS, mounted into the
`dvt-frontend` container. This copy exists so it is reviewable and so the two
lists below are visible to whoever adds the next landing page.

## Adding a landing page

A landing page in `public/<name>/` needs registering in **three** places, or it
half-works in ways that only show up for returning visitors:

1. **`@nocache` in this file** — otherwise browsers cache the HTML and keep
   loading the previous build's script versions.
2. **`navigateFallbackDenylist` in `vite.config.ts`** — otherwise the service
   worker answers the URL with the React app shell instead of the page.
3. **The `?v=` query on its script tags** — bump it whenever the referenced
   file's contents change, or caches serve the old one.

All three were missed when `/pyen` and `/pyma` were added, and each produced a
different confusing symptom.

## Applying a change

`admin off` is set, so `caddy reload` cannot work — there is no admin API to
send the new config to. Restart the container instead:

    docker compose -f /srv/devanshedutech/docker-compose.yml restart dvt-frontend

Validate first:

    docker compose exec -T dvt-frontend caddy validate \
      --config /etc/caddy/Caddyfile --adapter caddyfile
