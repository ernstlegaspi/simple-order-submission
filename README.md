# Simple Order Submission

A small full-stack TypeScript application for submitting an order and receiving a confirmed or rejected result.

The solution stays within the challenge scope:

- Backend: Node.js + Express
- Frontend: React + Vite
- Storage: in-memory only
- API surface: one backend endpoint, `POST /orders`
- Tests: unit, integration, and frontend component tests

It also intentionally applies production-oriented practices requested for the take-home, including dependency injection, environment validation, centralized error handling, linting, formatting, virtualization, and a repository abstraction in front of in-memory storage.

## Repository Structure

```text
.
|-- apps
|   |-- api
|   |   |-- src
|   |   `-- tests
|   `-- web
|       |-- src
|       `-- tests
|-- packages
|   `-- shared
|-- .env.example
`-- package.json
```

### Backend

Backend code lives in `apps/api/src`.

- `app/`: Express application bootstrap and middleware wiring
- `config/`: environment parsing and application configuration
- `core/`: composition root / manual dependency injection
- `http/`: shared HTTP middleware, utilities, and API error handling
- `orders/`: order domain, service layer, repository contract, infrastructure, and route contract
- `infrastructure/logging/`: logger implementation

Backend tests live in `apps/api/tests`.

- Unit tests cover domain and service behavior
- Integration tests cover `POST /orders`

### Frontend

Frontend code lives in `apps/web/src`.

- `features/orders/`: page, form, API client, local validation, and order-related UI
- `shared/components/`: reusable error boundary and virtualized list
- `config/`: frontend env parsing
- `test/`: shared frontend test setup

Frontend tests live in `apps/web/tests`.

- Component tests cover form flows, API states, error boundary behavior, and virtualization behavior

### Shared Package

`packages/shared` is scaffolded for future cross-app sharing. It is intentionally minimal in this take-home to avoid introducing premature coupling while the API contract is still small.

## How to Run

### Prerequisites

- Node.js `>= 20`
- npm `>= 10`

### Setup

1. Create a local env file from the example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Install dependencies:

```bash
npm install
```

### Start the API

```bash
npm run dev:api
```

The API runs on `http://localhost:3001` by default.

### Start the Frontend

In a second terminal:

```bash
npm run dev:web
```

The Vite app runs on `http://localhost:5173` by default.

## Available Commands

- `npm run dev:api`: start the backend in watch mode
- `npm run dev:web`: start the frontend in dev mode
- `npm run build`: build API and web
- `npm run build:api`: build only the backend
- `npm run build:web`: build only the frontend
- `npm run test`: run backend and frontend tests
- `npm run test:api`: run backend tests only
- `npm run test:web`: run frontend tests only
- `npm run lint`: run ESLint
- `npm run format:check`: check formatting
- `npm run format`: write formatting fixes
- `npm run typecheck`: run TypeScript checks
- `npm run verify`: run format, lint, typecheck, tests, and build

## Environment Variables

Environment variables are validated with Zod on both the backend and frontend.

### Backend

- `NODE_ENV`: `development | test | production`
- `API_HOST`: API bind host
- `API_PORT`: API port
- `API_TRUST_PROXY`: enables Express trust proxy handling
- `API_JSON_BODY_LIMIT`: JSON request body size limit
- `API_CORS_ORIGINS`: comma-separated allowed origins, or `*`
- `API_SHUTDOWN_TIMEOUT_MS`: graceful shutdown timeout
- `ORDER_APPROVAL_THRESHOLD_CENTS`: rejection threshold for total order value

### Frontend

- `VITE_API_BASE_URL`: base URL used by the React app when calling the backend

## API

### `POST /orders`

Accepts:

```json
{
  "items": [
    { "id": "item_1", "quantity": 2 },
    { "id": "item_2", "quantity": 1 }
  ],
  "customer": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

Behavior:

- validates the payload with Zod
- calculates total price from a static item catalog
- confirms or rejects the order based on a configurable threshold
- persists the result in memory through a repository abstraction
- returns a structured success payload

Example confirmed response:

```json
{
  "orderId": "019607f6-1d0d-7c7e-9b5c-1ec4d7c2d8c1",
  "status": "CONFIRMED",
  "total": 4200
}
```

Example rejected response:

```json
{
  "orderId": "019607f6-1d0d-7c7e-9b5c-1ec4d7c2d8c1",
  "status": "REJECTED",
  "reason": "ORDER_TOTAL_TOO_HIGH"
}
```

## Design Decisions And Tradeoffs

### 1. In-memory storage behind a repository interface

The persistence layer is intentionally in-memory to match the challenge, but it is not wired directly into the route handler. `SubmitOrderService` depends on an `OrderRepository` contract, and the current implementation is `InMemoryOrderRepository`.

Tradeoff:

- Slightly more abstraction for a small app
- Easier replacement with Redis, Postgres, or another store later
- Better isolation for unit testing

### 2. Manual dependency injection instead of a container library

The backend uses an explicit composition root in `apps/api/src/core/application-context.ts`.

Tradeoff:

- Less framework magic
- Easier to trace dependencies in a small codebase
- Keeps the take-home simple while still demonstrating DI

### 3. Shared validation with Zod

Zod is used for:

- backend request validation
- backend environment validation
- frontend form validation
- frontend response parsing
- frontend environment validation

Tradeoff:

- Slight duplication between backend and frontend contracts today
- Stronger runtime safety at every boundary

### 4. Static catalog instead of an extra lookup API

The challenge only requires one backend endpoint, so item prices and item options are mocked locally. The frontend displays the available catalog to keep the demo understandable without expanding API scope.

### 5. Virtualization in the order item list

Virtualization is included even though most demos will only use a few items. It activates when the list becomes long, which keeps the implementation aligned with the requirement without making the small-list experience worse.

### 6. Production-oriented defaults

Even though this is a take-home, the implementation includes:

- `helmet` for common HTTP security headers
- request IDs
- structured API error responses
- centralized error handling
- graceful shutdown
- typed environment loading
- UUID-based order IDs
- reusable UI components
- frontend error boundary fallback UI

## Implemented Practices

This codebase explicitly includes the requested practices:

- in-memory storage
- persistence layer abstraction
- dependency injection
- `helmet` on the backend
- Zod validation
- UUID-based identifiers
- linting with ESLint
- formatting with Prettier
- unit tests
- integration tests
- frontend component tests
- frontend error boundary
- frontend list virtualization
- `.env` management with Zod schemas
- reusable, production-oriented structure

## Testing Strategy

### Backend

- Unit tests verify the order decision policy
- Unit tests verify `SubmitOrderService`
- Integration tests verify the `POST /orders` endpoint and error cases

### Frontend

- Component tests verify local validation
- Component tests verify confirmed and rejected submission flows
- Component tests verify API error rendering
- Component tests verify the error boundary fallback
- Component tests verify non-virtualized and virtualized list rendering

## What I Would Improve With More Time

- Move shared request/response contracts into `packages/shared`
- Add end-to-end browser tests
- Add richer logging and request correlation output
- Add rate limiting and stricter CORS controls per environment
- Replace the static catalog with a real catalog source
- Add repository integration for durable persistence
- Add accessibility auditing and keyboard interaction refinements
- Add CI configuration for `npm run verify`

## Future Extensions

- Add `GET /orders/:id` for order lookup
- Add inventory checks and richer rejection reasons
- Add background processing for asynchronous order workflows
- Add authentication and tenant-aware order ownership
- Add order history filtering, pagination, and admin views
- Add observability hooks for metrics and tracing

## Delivery Approach

The implementation was intentionally organized into focused steps so the work can be pushed incrementally on a single branch and reviewed commit by commit:

1. tooling and project structure
2. backend foundation
3. domain, service, and repository layers
4. API, validation, and error handling
5. backend tests
6. frontend UI and submission flow
7. error boundary and virtualization
8. frontend tests
9. README and cleanup
