# Remote signing-file handoff

Use only when existing local credentials are incomplete and the user needs to upload files.

A stdlib-only Python HTTP server can bind to `127.0.0.1:8931` and expose a UUID-gated route with instructions and multipart upload. Accept only `.p12`, `.mobileprovision`, and `.p8`; sanitize filenames to basenames and bound request size. Merge only the known text fields `p12_password`, `key_id`, `issuer_id`, and `team_id` into `/tmp/tf-drop/meta.json`. Store all inputs outside the repository with owner-only permissions. Do not serve uploaded files back over HTTP or log their contents.

Expose the loopback server with `tailscale funnel --bg`. This is an outbound tunnel and does not require the sender to join the tailnet. Share the gated upload URL with the user. Run a watcher with a five-minute deadline; reset the funnel and stop the server when the input set is complete or the deadline expires. Preserve any unrelated preexisting Funnel configuration instead of resetting it blindly.

Validate the complete set as described in `SKILL.md` before trusting it. Stop the upload endpoint even when validation fails. Keep the credential handoff separate from public demo or IPA artifact hosting.
