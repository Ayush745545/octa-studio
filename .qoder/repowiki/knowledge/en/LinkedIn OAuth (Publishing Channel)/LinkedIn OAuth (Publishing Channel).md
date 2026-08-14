---
kind: external_dependency
name: LinkedIn OAuth (Publishing Channel)
slug: linkedin-oauth
category: external_dependency
category_hints:
    - auth_protocol
    - client_constraint
scope:
    - '**'
---

The publishing pipeline integrates LinkedIn as a connected channel via the standard LinkedIn OAuth 2.0 flow. Authorization starts at `/api/publishing/linkedin/connect`, redirects to `https://www.linkedin.com/oauth/v2/authorization` with scopes `openid profile w_member_social`, and returns to `/api/publishing/linkedin/callback`. Tokens and metadata are persisted in the `PublishingChannel` model (`accessToken`, `refreshToken`, `expiresAt`, `externalId`, `authorUrn`). Credentials come from `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` environment variables; the callback URL is derived from `APP_URL`.