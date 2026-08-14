# Publishing Channels Management

<cite>
**Referenced Files in This Document**
- [page.tsx](file://app/publishing/page.tsx)
- [publishing-channels.tsx](file://components/publishing/publishing-channels.tsx)
- [toggle-channel.ts](file://app/publishing/actions/toggle-channel.ts)
- [route.ts (LinkedIn connect)](file://app/api/publishing/linkedin/connect/route.ts)
- [route.ts (LinkedIn callback)](file://app/api/publishing/linkedin/callback/route.ts)
- [types.ts](file://app/publishing/engine/types.ts)
- [index.ts (providers registry)](file://app/publishing/engine/providers/index.ts)
- [linkedin.ts (provider)](file://app/publishing/engine/providers/linkedin.ts)
- [simulated.ts (provider)](file://app/publishing/engine/providers/simulated.ts)
- [publication-schedule-controls.tsx](file://components/publishing/publication-schedule-controls.tsx)
- [schedule-publication.ts](file://app/publishing/actions/schedule-publication.ts)
- [cancel-publication.ts](file://app/publishing/actions/cancel-publication.ts)
- [schema.prisma](file://prisma/schema.prisma)
- [migration.sql](file://prisma/migrations/20260812122000_add_publishing_channels/migration.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains how the publishing channels feature works end-to-end: connecting and managing multiple social media platforms, toggling channel states, storing and validating credentials, and controlling publication scheduling. It focuses on the user interface for channel management, backend actions that update channel configurations, and the provider-based architecture used to publish content to platforms like LinkedIn. Security considerations for credential storage and access control are also covered.

## Project Structure
The publishing channels feature spans server components, client components, server actions, API routes, and an engine with pluggable providers. The key areas are:
- Publishing page and UI for channel cards and distribution queue
- Server action to toggle channel connection state
- LinkedIn OAuth flow endpoints for connect and callback
- Provider registry and platform-specific implementations
- Scheduling controls and related server actions
- Data model definitions for channels and publications

```mermaid
graph TB
UI["Publishing Page<br/>app/publishing/page.tsx"]
Card["Channel Cards<br/>components/publishing/publishing-channels.tsx"]
Toggle["Toggle Channel Action<br/>app/publishing/actions/toggle-channel.ts"]
Connect["LinkedIn Connect API<br/>app/api/publishing/linkedin/connect/route.ts"]
Callback["LinkedIn Callback API<br/>app/api/publishing/linkedin/callback/route.ts"]
Providers["Provider Registry<br/>app/publishing/engine/providers/index.ts"]
LinkedInProv["LinkedIn Provider<br/>app/publishing/engine/providers/linkedin.ts"]
SimProv["Simulated Provider<br/>app/publishing/engine/providers/simulated.ts"]
DB["Prisma Schema<br/>prisma/schema.prisma"]
UI --> Card
Card --> Toggle
Card --> Connect
Connect --> Callback
Callback --> DB
UI --> Providers
Providers --> LinkedInProv
Providers --> SimProv
Toggle --> DB
```

**Diagram sources**
- [page.tsx:18-76](file://app/publishing/page.tsx#L18-L76)
- [publishing-channels.tsx:33-147](file://components/publishing/publishing-channels.tsx#L33-L147)
- [toggle-channel.ts:6-39](file://app/publishing/actions/toggle-channel.ts#L6-L39)
- [route.ts (LinkedIn connect):3-33](file://app/api/publishing/linkedin/connect/route.ts#L3-L33)
- [route.ts (LinkedIn callback):4-168](file://app/api/publishing/linkedin/callback/route.ts#L4-L168)
- [index.ts (providers registry):5-20](file://app/publishing/engine/providers/index.ts#L5-L20)
- [linkedin.ts (provider):141-283](file://app/publishing/engine/providers/linkedin.ts#L141-L283)
- [simulated.ts (provider):8-32](file://app/publishing/engine/providers/simulated.ts#L8-L32)
- [schema.prisma:57-93](file://prisma/schema.prisma#L57-L93)

**Section sources**
- [page.tsx:18-76](file://app/publishing/page.tsx#L18-L76)
- [schema.prisma:57-93](file://prisma/schema.prisma#L57-L93)

## Core Components
- Publishing page loads connected channels and displays a distribution queue with status badges and schedule controls.
- Channel cards show each platform’s name, description, connection indicator dot, and a Connect/Disconnect button. LinkedIn uses a dedicated Connect link to start OAuth; other platforms use a toggle action.
- Server action toggles a channel’s connected state and clears sensitive fields when disconnecting.
- LinkedIn OAuth endpoints handle authorization redirect and token exchange, then persist credentials and identity into the database.
- Provider registry maps platform names to concrete implementations; currently supports LinkedIn and a simulated provider.
- Scheduling controls allow users to set or reschedule publication times and cancel scheduled items.

**Section sources**
- [page.tsx:18-186](file://app/publishing/page.tsx#L18-L186)
- [publishing-channels.tsx:33-147](file://components/publishing/publishing-channels.tsx#L33-L147)
- [toggle-channel.ts:6-39](file://app/publishing/actions/toggle-channel.ts#L6-L39)
- [route.ts (LinkedIn connect):3-33](file://app/api/publishing/linkedin/connect/route.ts#L3-L33)
- [route.ts (LinkedIn callback):4-168](file://app/api/publishing/linkedin/callback/route.ts#L4-L168)
- [index.ts (providers registry):5-20](file://app/publishing/engine/providers/index.ts#L5-L20)
- [linkedin.ts (provider):141-283](file://app/publishing/engine/providers/linkedin.ts#L141-L283)
- [simulated.ts (provider):8-32](file://app/publishing/engine/providers/simulated.ts#L8-L32)
- [publication-schedule-controls.tsx:13-181](file://components/publishing/publication-schedule-controls.tsx#L13-L181)
- [schedule-publication.ts:6-51](file://app/publishing/actions/schedule-publication.ts#L6-L51)
- [cancel-publication.ts:6-52](file://app/publishing/actions/cancel-publication.ts#L6-L52)

## Architecture Overview
The system uses a provider-based architecture to abstract platform differences. The UI triggers actions that either update channel state or initiate OAuth flows. When publishing, the engine selects the appropriate provider by platform name and executes platform-specific logic. Credentials are stored per channel and validated before API calls.

```mermaid
sequenceDiagram
participant U as "User"
participant UI as "Channel Card UI"
participant SA as "Toggle Channel Action"
participant DB as "Database"
participant OA as "LinkedIn Connect API"
participant CB as "LinkedIn Callback API"
participant PR as "Provider Registry"
participant LP as "LinkedIn Provider"
U->>UI : Click "Connect" or "Disconnect"
alt Disconnect or non-LinkedIn Connect
UI->>SA : togglePublishingChannel(platform)
SA->>DB : Update or create channel (connected flag)
SA-->>UI : Revalidate /publishing
else LinkedIn Connect
UI->>OA : GET /api/publishing/linkedin/connect
OA-->>U : Redirect to LinkedIn OAuth
U->>CB : Callback with code
CB->>DB : Upsert channel with tokens and identity
CB-->>U : Redirect back to /publishing?linkedin=connected
end
Note over PR,LP : Publishing uses provider registry to call platform APIs
```

**Diagram sources**
- [publishing-channels.tsx:38-141](file://components/publishing/publishing-channels.tsx#L38-L141)
- [toggle-channel.ts:6-39](file://app/publishing/actions/toggle-channel.ts#L6-L39)
- [route.ts (LinkedIn connect):3-33](file://app/api/publishing/linkedin/connect/route.ts#L3-L33)
- [route.ts (LinkedIn callback):4-168](file://app/api/publishing/linkedin/callback/route.ts#L4-L168)
- [index.ts (providers registry):5-20](file://app/publishing/engine/providers/index.ts#L5-L20)
- [linkedin.ts (provider):141-283](file://app/publishing/engine/providers/linkedin.ts#L141-L283)

## Detailed Component Analysis

### Channel UI and State Management
- Displays a grid of channel cards with visual indicators:
  - Green dot indicates connected; gray dot indicates not connected.
  - Text label shows “Connected” or “Not connected”.
  - LinkedIn card shows a dedicated “Connect” link to start OAuth; others show a “Connect”/“Disconnect” button.
- Uses React transitions to prevent UI flicker during toggles.
- Loads connected platforms from the server and passes them as props to compute initial state.

```mermaid
flowchart TD
Start(["Render Channel Cards"]) --> Load["Load connectedPlatforms from server"]
Load --> Map["Map channels to UI state"]
Map --> Indicators{"Is platform connected?"}
Indicators --> |Yes| ShowConnected["Show green dot + Connected label"]
Indicators --> |No| ShowDisconnected["Show gray dot + Not connected label"]
ShowConnected --> ActionsConnected["Show Disconnect button (or LinkedIn Connect link if applicable)"]
ShowDisconnected --> ActionsDisconnected["Show Connect button (or LinkedIn Connect link)"]
ActionsConnected --> Toggle["Call togglePublishingChannel"]
ActionsDisconnected --> Toggle
Toggle --> Revalidate["Revalidate /publishing"]
Revalidate --> End(["Updated UI"])
```

**Diagram sources**
- [publishing-channels.tsx:33-147](file://components/publishing/publishing-channels.tsx#L33-L147)
- [toggle-channel.ts:6-39](file://app/publishing/actions/toggle-channel.ts#L6-L39)

**Section sources**
- [publishing-channels.tsx:33-147](file://components/publishing/publishing-channels.tsx#L33-L147)
- [page.tsx:18-76](file://app/publishing/page.tsx#L18-L76)

### Backend Toggle Action
- Finds existing channel by platform or creates one if missing.
- Toggles the connected boolean.
- On disconnect, clears sensitive fields (accountName, accessToken, refreshToken, expiresAt, externalId).
- Revalidates the publishing page to reflect changes immediately.

```mermaid
flowchart TD
Entry(["togglePublishingChannel(platform)"]) --> Find["Find channel by platform"]
Find --> Exists{"Exists?"}
Exists --> |Yes| Update["Update connected flag"]
Exists --> |No| Create["Create channel with connected=true"]
Update --> ClearOnDisconnect{"Toggling to disconnected?"}
ClearOnDisconnect --> |Yes| ClearFields["Clear sensitive fields"]
ClearOnDisconnect --> |No| SkipClear["Keep fields"]
Create --> Revalidate["Revalidate /publishing"]
ClearFields --> Revalidate
SkipClear --> Revalidate
Revalidate --> Exit(["Done"])
```

**Diagram sources**
- [toggle-channel.ts:6-39](file://app/publishing/actions/toggle-channel.ts#L6-L39)

**Section sources**
- [toggle-channel.ts:6-39](file://app/publishing/actions/toggle-channel.ts#L6-L39)

### LinkedIn OAuth Flow
- Connect endpoint builds an authorization URL using environment variables and redirects the user to LinkedIn.
- Callback endpoint validates the incoming code, exchanges it for tokens, retrieves user info, computes author URN, and upserts the channel record with credentials and identity.
- Redirects back to the publishing page with a success query parameter.

```mermaid
sequenceDiagram
participant UI as "Channel Card"
participant Conn as "Connect API"
participant LI as "LinkedIn OAuth"
participant Cb as "Callback API"
participant DB as "Database"
UI->>Conn : GET /api/publishing/linkedin/connect
Conn-->>UI : Redirect to LinkedIn Authorization
UI->>LI : User authorizes app
LI-->>Cb : Redirect with authorization code
Cb->>LI : Exchange code for tokens
LI-->>Cb : Access token (+ optional refresh token)
Cb->>LI : Fetch user info
LI-->>Cb : User identity (sub)
Cb->>DB : Upsert channel with tokens and author URN
Cb-->>UI : Redirect to /publishing?linkedin=connected
```

**Diagram sources**
- [route.ts (LinkedIn connect):3-33](file://app/api/publishing/linkedin/connect/route.ts#L3-L33)
- [route.ts (LinkedIn callback):4-168](file://app/api/publishing/linkedin/callback/route.ts#L4-L168)

**Section sources**
- [route.ts (LinkedIn connect):3-33](file://app/api/publishing/linkedin/connect/route.ts#L3-L33)
- [route.ts (LinkedIn callback):4-168](file://app/api/publishing/linkedin/callback/route.ts#L4-L168)

### Provider Engine and Platform-Specific Logic
- Provider registry maps platform names to implementations. If a platform is not registered, an error is thrown.
- LinkedIn provider:
  - Validates channel credentials and expiration before publishing.
  - Uploads images via LinkedIn’s image upload flow, then creates a post with optional media.
  - Returns success with external ID or detailed error messages.
- Simulated provider logs inputs and returns a synthetic external ID for testing.

```mermaid
classDiagram
class PublishingProvider {
+string platform
+publish(input, context) PublishResult
}
class LinkedInProvider {
+platform "LinkedIn"
+publish(input, context) PublishResult
}
class SimulatedProvider {
+platform "SIMULATED"
+publish(input, context) PublishResult
}
class ProviderRegistry {
+getPublishingProvider(platform) PublishingProvider
}
PublishingProvider <|.. LinkedInProvider
PublishingProvider <|.. SimulatedProvider
ProviderRegistry --> PublishingProvider : "returns"
```

**Diagram sources**
- [types.ts:1-37](file://app/publishing/engine/types.ts#L1-L37)
- [index.ts (providers registry):5-20](file://app/publishing/engine/providers/index.ts#L5-L20)
- [linkedin.ts (provider):141-283](file://app/publishing/engine/providers/linkedin.ts#L141-L283)
- [simulated.ts (provider):8-32](file://app/publishing/engine/providers/simulated.ts#L8-L32)

**Section sources**
- [types.ts:1-37](file://app/publishing/engine/types.ts#L1-L37)
- [index.ts (providers registry):5-20](file://app/publishing/engine/providers/index.ts#L5-L20)
- [linkedin.ts (provider):141-283](file://app/publishing/engine/providers/linkedin.ts#L141-L283)
- [simulated.ts (provider):8-32](file://app/publishing/engine/providers/simulated.ts#L8-L32)

### Scheduling Controls and Actions
- Client component allows scheduling, rescheduling, and canceling publications with validation for future dates and proper formatting.
- Server actions update publication status and timestamps, and revert content state when canceling.
- Revalidation ensures consistent views across pages.

```mermaid
sequenceDiagram
participant UI as "Schedule Controls"
participant SA as "Server Actions"
participant DB as "Database"
UI->>SA : schedulePublication(id, utcISOString)
SA->>DB : Validate date and update status to SCHEDULED
SA-->>UI : Success (revalidated pages)
UI->>SA : cancelPublication(id)
SA->>DB : Transaction : set status QUEUED, clear scheduledAt, reset content status
SA-->>UI : Success (revalidated pages)
```

**Diagram sources**
- [publication-schedule-controls.tsx:13-181](file://components/publishing/publication-schedule-controls.tsx#L13-L181)
- [schedule-publication.ts:6-51](file://app/publishing/actions/schedule-publication.ts#L6-L51)
- [cancel-publication.ts:6-52](file://app/publishing/actions/cancel-publication.ts#L6-L52)

**Section sources**
- [publication-schedule-controls.tsx:13-181](file://components/publishing/publication-schedule-controls.tsx#L13-L181)
- [schedule-publication.ts:6-51](file://app/publishing/actions/schedule-publication.ts#L6-L51)
- [cancel-publication.ts:6-52](file://app/publishing/actions/cancel-publication.ts#L6-L52)

### Data Model and Relationships
- PublishingChannel stores platform identity, connection state, and credentials.
- Publication links Content to a specific channel and tracks status, scheduling, and errors.
- Unique constraints ensure one publication per content-channel pair.

```mermaid
erDiagram
PUBLISHINGCHANNEL {
string id PK
string platform UK
boolean connected
string accountName
string accessToken
string refreshToken
datetime expiresAt
string externalId
string authorUrn
datetime createdAt
datetime updatedAt
}
PUBLICATION {
string id PK
string contentId FK
string channelId FK
string status
datetime scheduledAt
datetime publishedAt
string externalId
string error
datetime createdAt
datetime updatedAt
}
CONTENT {
string id PK
string title
string body
string status
datetime scheduledAt
datetime publishedAt
datetime createdAt
datetime updatedAt
}
PUBLICATION ||--|| CONTENT : "contentId"
PUBLICATION ||--|| PUBLISHINGCHANNEL : "channelId"
```

**Diagram sources**
- [schema.prisma:21-37](file://prisma/schema.prisma#L21-L37)
- [schema.prisma:57-93](file://prisma/schema.prisma#L57-L93)

**Section sources**
- [schema.prisma:21-37](file://prisma/schema.prisma#L21-L37)
- [schema.prisma:57-93](file://prisma/schema.prisma#L57-L93)
- [migration.sql:5-9](file://prisma/migrations/20260812122000_add_publishing_channels/migration.sql#L5-L9)

## Dependency Analysis
- UI depends on server actions for toggling channels and scheduling publications.
- Server actions depend on Prisma to read/write channel and publication records.
- LinkedIn OAuth endpoints depend on environment variables for client credentials and app URL.
- Provider registry centralizes platform mapping; adding a new platform requires registering a provider implementation.
- LinkedIn provider depends on Prisma to fetch channel credentials and on external APIs for OAuth and posting.

```mermaid
graph LR
UI["Channel UI"] --> SA["Toggle/Schedule Actions"]
SA --> DB["Prisma"]
UI --> OA["LinkedIn Connect API"]
OA --> CB["LinkedIn Callback API"]
CB --> DB
UI --> PR["Provider Registry"]
PR --> LP["LinkedIn Provider"]
LP --> DB
LP --> EXT["LinkedIn APIs"]
```

**Diagram sources**
- [publishing-channels.tsx:33-147](file://components/publishing/publishing-channels.tsx#L33-L147)
- [toggle-channel.ts:6-39](file://app/publishing/actions/toggle-channel.ts#L6-L39)
- [schedule-publication.ts:6-51](file://app/publishing/actions/schedule-publication.ts#L6-L51)
- [cancel-publication.ts:6-52](file://app/publishing/actions/cancel-publication.ts#L6-L52)
- [route.ts (LinkedIn connect):3-33](file://app/api/publishing/linkedin/connect/route.ts#L3-L33)
- [route.ts (LinkedIn callback):4-168](file://app/api/publishing/linkedin/callback/route.ts#L4-L168)
- [index.ts (providers registry):5-20](file://app/publishing/engine/providers/index.ts#L5-L20)
- [linkedin.ts (provider):141-283](file://app/publishing/engine/providers/linkedin.ts#L141-L283)

**Section sources**
- [index.ts (providers registry):5-20](file://app/publishing/engine/providers/index.ts#L5-L20)
- [linkedin.ts (provider):141-283](file://app/publishing/engine/providers/linkedin.ts#L141-L283)

## Performance Considerations
- Use server actions to minimize client-side state synchronization and leverage Next.js revalidation for efficient UI updates.
- Avoid unnecessary network calls by loading connected platforms once on the server and passing them as props.
- For large media uploads, consider streaming or background processing to avoid blocking requests.
- Cache provider lookups where appropriate; the current registry is small and fast but can be memoized if expanded.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Missing environment variables:
  - LinkedIn connect and callback require LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and APP_URL. If any are missing, endpoints return configuration errors.
- OAuth failures:
  - Invalid or expired codes result in explicit error responses. Check the callback response for error details.
- Token issues:
  - If the access token is missing or expired, the LinkedIn provider returns a clear error instructing reconnect.
- Missing identity:
  - If user info does not include a member identifier, the callback fails; ensure required profile permissions are granted.
- Image upload problems:
  - Ensure APP_URL is correctly configured so the provider can download images from storage before uploading to LinkedIn.
- Scheduling errors:
  - Invalid or past dates will throw errors; ensure the selected time is in the future and properly formatted.

**Section sources**
- [route.ts (LinkedIn connect):3-33](file://app/api/publishing/linkedin/connect/route.ts#L3-L33)
- [route.ts (LinkedIn callback):4-168](file://app/api/publishing/linkedin/callback/route.ts#L4-L168)
- [linkedin.ts (provider):141-283](file://app/publishing/engine/providers/linkedin.ts#L141-L283)
- [schedule-publication.ts:6-51](file://app/publishing/actions/schedule-publication.ts#L6-L51)

## Conclusion
The publishing channels feature provides a clean interface to connect and manage multiple platforms, with robust backend actions and a flexible provider architecture. LinkedIn integration demonstrates a complete OAuth flow and secure credential handling. Scheduling controls enable precise control over publication timing. Extending support to additional platforms involves implementing a provider and registering it in the registry. Security best practices include storing credentials securely, validating tokens before use, and clearing sensitive data on disconnect.

[No sources needed since this section summarizes without analyzing specific files]