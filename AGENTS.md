# AGENTS.md

## Purpose

This repository contains **Cluster Café**, a Kubernetes learning and production-style portfolio project.

AI agents should make small, explainable, low-risk changes and preserve the current architecture unless a task explicitly requires redesign.

The project combines:

- application development
- Kubernetes
- Helm
- PostgreSQL
- admin tooling
- product analytics
- interactive Kubernetes learning simulations

Changes should remain easy to understand and easy to demonstrate.

---

# Project Goal

Cluster Café is a three-tier Kubernetes application:

```text
Frontend
Backend
PostgreSQL
```

The infrastructure demonstrates:

- Namespace
- Deployments
- ClusterIP Services
- NGINX Ingress
- ConfigMaps
- Secrets
- PV / PVC
- resource requests and limits
- readiness probes
- liveness probes
- Backend HPA
- Node Affinity
- Taints / Tolerations
- RollingUpdate strategy
- troubleshooting scenarios
- Helm packaging/deployment

The product layer additionally demonstrates:

- Memory Jar persistence
- Admin note management
- PostgreSQL-backed events
- Product analytics
- HPA visualization
- self-healing visualization
- rolling-update visualization
- Service selector failure simulation
- readiness / liveness simulation

---

# Product Concept

Cluster Café teaches Kubernetes using a café analogy.

```text
Ingress        = café entrance
Service        = waiter / order counter
Pod            = cook
Deployment     = shift manager
HPA            = extra cooks during rush hour
ConfigMap      = staff notice board
Secret         = locked manager drawer
PostgreSQL     = café memory / records
PVC / PV       = pantry / storage
```

The analogy must remain connected to the real Kubernetes terminology.

Do not replace technical explanations entirely with metaphor.

---

# Current Repository Structure

Expected structure:

```text
frontend/
backend/

production-app/
  Chart.yaml
  values.yaml
  templates/

assets/
  diagrams/

troubleshooting/

product/

ai-context/

AGENTS.md
README.md
```

Frontend public files may include:

```text
frontend/public/
  index.html
  styles.css
  app.js

  admin.html
  admin.css
  admin.js

  analytics.html
  analytics.css
  analytics.js
```

---

# Deployment Model

The project now uses **Helm**.

Do NOT move the project back to raw-manifest-only deployment unless explicitly requested.

Primary chart:

```text
production-app/
```

Configuration:

```text
production-app/values.yaml
```

Templates:

```text
production-app/templates/
```

Typical deployment:

```powershell
helm upgrade production-app ./production-app `
  -n production-app `
  --force-conflicts
```

`--force-conflicts` may currently be required because some resources were originally managed using `kubectl apply` before migration to Helm.

Do not treat this as a general Helm best practice.

---

# Important Constraints

1. Use Helm as the primary Kubernetes deployment mechanism.

2. Do not introduce a second competing deployment system without explicit instruction.

3. Do not hardcode real credentials.

4. Never commit real Secret values.

5. Keep backend and PostgreSQL internal through ClusterIP Services.

6. External HTTP traffic enters through Ingress.

7. PostgreSQL remains at one replica unless replication is explicitly designed.

8. Do not replace PostgreSQL Deployment with StatefulSet unless explicitly requested.

9. Keep changes small and explainable.

10. Preserve current Kubernetes names unless explicitly requested.

11. Do not introduce React, Next.js, Tailwind or another frontend framework without a clear requirement.

12. Prefer existing lightweight HTML/CSS/vanilla-JS architecture.

13. Do not give the frontend unrestricted Kubernetes API access.

14. Do not create dangerous public endpoints that can arbitrarily mutate the cluster.

15. Clearly distinguish real infrastructure behavior from educational UI simulation.

16. Update README/context documentation when architecture or important behavior changes.

---

# Kubernetes Naming

Namespace:

```text
production-app
```

Resources:

```text
Frontend Deployment:
frontend

Frontend Service:
frontend-service

Backend Deployment:
backend

Backend Service:
backend-service

PostgreSQL Deployment:
postgres

PostgreSQL Service:
postgres-service

PostgreSQL Secret:
postgres-secret

PostgreSQL ConfigMap:
postgres-config

Backend HPA:
backend-hpa

Ingress:
production-app-ingress

PVC:
postgres-pvc

PV:
postgres-pv
```

Do not silently rename these objects.

---

# Networking Model

```text
Client
  |
  v
Ingress
  |
  +---- / ----------------> frontend-service
  |                              |
  |                              v
  |                         Frontend Pods
  |
  +---- /api -------------> backend-service
                                 |
                                 v
                            Backend Pods
                                 |
                                 v
                          postgres-service
                                 |
                                 v
                            PostgreSQL
```

Frontend pages include:

```text
/
/admin.html
/analytics.html
```

API traffic uses:

```text
/api/*
```

---

# Application Responsibilities

## Frontend

Frontend contains:

- learner experience
- Cluster Café analogy
- interactive explanations
- Admin Console
- Analytics Dashboard
- simulations

The frontend should not directly connect to PostgreSQL.

Flow:

```text
Frontend
   |
   v
Backend API
   |
   v
PostgreSQL
```

---

## Backend

Backend uses Node.js / Express.

Responsibilities include:

- health endpoint
- PostgreSQL access
- notes
- Admin APIs
- event tracking
- analytics aggregation
- controlled CPU-load endpoint

Avoid adding unrelated responsibilities without explicit need.

---

# PostgreSQL

Important tables:

```text
cafe_notes
cafe_events
```

## cafe_notes

Current conceptual fields:

```text
id
message
author_name
category
status
is_pinned
is_featured
created_at
updated_at
deleted_at
```

Supported statuses:

```text
active
hidden
deleted
```

Deletion is currently soft delete.

---

## cafe_events

Used for activity and product analytics.

Known event types include:

```text
note_created
note_hidden
note_deleted
note_pinned
note_unpinned

rush_hour_started
rush_hour_completed

self_heal_simulation_started
self_heal_simulation_completed

rolling_update_started
rolling_update_completed

route_broken
route_restored

readiness_failed
readiness_restored

liveness_failed
liveness_recovered
```

When adding event types:

- use predictable snake_case naming
- whitelist allowed client-generated events
- do not allow arbitrary event insertion
- preserve useful metadata

---

# Product Surfaces

## Main Café

```text
/
```

Primary learner-facing experience.

---

## Admin Console

```text
/admin.html
```

Current responsibilities:

- note management
- filtering
- search
- pin/unpin
- hide
- restore
- soft delete
- activity timeline
- Kubernetes concept simulations

Do not expose real destructive Kubernetes operations directly through unauthenticated browser actions.

---

## Analytics

```text
/analytics.html
```

Uses PostgreSQL event data.

Possible metrics include:

- simulations run
- memories created
- Rush Hour starts
- concept usage
- recent activity
- active / hidden / pinned notes

Do not hardcode fake product metrics when real values can be derived from `cafe_events` or `cafe_notes`.

---

# Simulation Principles

Simple animations are acceptable.

The purpose is understanding, not visual complexity.

Stick figures, emoji, CSS transitions and simple diagrams are preferred over unnecessary animation libraries.

---

## Rush Hour

Visual explanation:

```text
customers increase
      |
      v
load increases
      |
      v
more cooks
```

Real backend CPU work is triggered through:

```text
/api/work
```

Real HPA state must be verified with Kubernetes.

Do not claim the visual cook count is the exact real replica count unless it is actually retrieved from the cluster.

---

## Self-Healing

Simulation:

```text
cook disappears
      |
      v
replacement appears
```

Real demo may use:

```powershell
kubectl delete pod <pod> -n production-app
```

The browser simulation does not itself delete Kubernetes Pods.

---

## Rolling Update

Simulation supports repeated menu versions:

```text
v1 -> v2
v2 -> v3
v3 -> v4
```

It should maintain a stable desired worker count rather than continually appending cooks.

---

## Broken Route

Represents Service selector mismatch:

```text
healthy Pods
+
Service exists
+
0 endpoints
=
traffic failure
```

This is an educational simulation unless a real Service selector is deliberately changed through kubectl.

---

## Readiness / Liveness

Readiness:

```text
Should the Pod receive traffic?
```

Liveness:

```text
Should Kubernetes restart the unhealthy container?
```

Keep these concepts clearly separated.

---

# Storage Rules

Current PostgreSQL storage:

```text
postgres
  |
  v
postgres-pvc
  |
  v
postgres-pv
```

Local Minikube uses `hostPath`.

Do not describe `hostPath` as an appropriate cloud production storage solution.

For a cloud environment, explain that CSI-backed persistent storage would normally be used.

Reclaim policy:

```text
Retain
```

Do not describe `Retain` as equivalent to backup.

---

# PostgreSQL Scheduling

PostgreSQL demonstrates:

```text
Node Affinity
Taints
Tolerations
```

Expected database label:

```text
workload=database
```

Possible taint:

```text
dedicated=database:NoSchedule
```

Because Minikube uses a single node, database taints may need to be temporary.

Do not permanently make the single Minikube node unusable by frontend/backend workloads.

---

# Resource Management

Deployments should retain sensible:

```text
resources.requests
resources.limits
```

Do not remove them merely to make a scheduling issue disappear.

If resource settings cause problems, explain the trade-off.

---

# HPA

Backend HPA currently demonstrates:

```text
minimum replicas: 2
maximum replicas: 5
target CPU: 60%
```

HPA:

```text
scales Pods
```

Cluster Autoscaler / Karpenter:

```text
scale Nodes
```

Do not conflate them.

Node autoscaling is conceptual in the local single-node Minikube environment.

---

# Health Checks

Backend:

```text
Readiness -> /health
Liveness  -> /health
```

PostgreSQL:

```text
Readiness -> pg_isready
Liveness  -> pg_isready
```

Preserve these unless a task explicitly changes health-check behavior.

---

# Docker Image Workflow

Source changes do not automatically update running Kubernetes Pods.

Required flow:

```text
source change
    |
    v
docker build
    |
    v
new image tag
    |
    v
minikube image load
    |
    v
values.yaml update
    |
    v
helm upgrade
```

Prefer new tags for meaningful deployable checkpoints.

Example:

```powershell
docker build --no-cache -t production-frontend:2.10 ./frontend
minikube image load production-frontend:2.10
```

Do not generate a new tag for every small local CSS edit.

---

# Local Development

For simple frontend iteration:

```powershell
cd frontend
npm start
```

Then:

```text
http://localhost:3000/
http://localhost:3000/admin.html
http://localhost:3000/analytics.html
```

For real API/PostgreSQL/Kubernetes integration, use the deployed Minikube application.

---

# Change Workflow

For any requested change:

1. Inspect relevant files first.
2. Identify whether the change affects:
   - frontend
   - backend
   - PostgreSQL
   - Helm
   - Kubernetes behavior
   - product documentation
3. State the file being changed.
4. Prefer copy/paste-friendly changes.
5. Prefer new self-contained blocks/files when practical.
6. Avoid asking the user to repeatedly edit small fragments in many older functions.
7. Keep selectors and labels consistent.
8. Validate behavior.
9. Give exact verification commands.
10. Mention meaningful risks or rollback concerns.
11. Update documentation if behavior or architecture changes.

---

# Code Editing Preference

The project owner prefers simple changes.

When possible:

**Prefer**

```text
Create this file.
Paste this complete block.
Run this command.
```

over:

```text
Find line X.
Modify two variables.
Then find another function.
Insert three lines halfway through it.
```

For an existing function that must change, provide the complete replacement function.

---

# Verification Commands

Basic health:

```powershell
kubectl get pods -n production-app
kubectl get svc -n production-app
kubectl get ingress -n production-app
kubectl get hpa -n production-app
kubectl get pvc -n production-app
kubectl get pv
```

Rollouts:

```powershell
kubectl rollout status deployment/frontend -n production-app
kubectl rollout status deployment/backend -n production-app
kubectl rollout status deployment/postgres -n production-app
```

Logs:

```powershell
kubectl logs deployment/frontend -n production-app
kubectl logs deployment/backend -n production-app
kubectl logs deployment/postgres -n production-app
```

Detailed investigation:

```powershell
kubectl describe pod <pod-name> -n production-app
```

---

# Application Verification

With:

```powershell
minikube tunnel
```

running:

```text
http://127.0.0.1/
http://127.0.0.1/admin.html
http://127.0.0.1/analytics.html
```

Backend:

```powershell
Invoke-RestMethod http://127.0.0.1/api/status
```

Notes:

```powershell
Invoke-RestMethod http://127.0.0.1/api/notes
```

Events:

```powershell
Invoke-RestMethod http://127.0.0.1/api/admin/events |
  ConvertTo-Json -Depth 6
```

Analytics:

```powershell
Invoke-RestMethod http://127.0.0.1/api/admin/analytics |
  ConvertTo-Json -Depth 6
```

---

# Security

Never:

- commit real DB credentials
- display real Secret values
- expose unrestricted Kubernetes credentials to the frontend
- add arbitrary shell-command execution APIs
- let unauthenticated users execute arbitrary cluster mutations
- expose PostgreSQL directly to the internet

Admin currently exists as a learning/internal surface.

If Cluster Café is later made publicly accessible, authentication and authorization should be added before enabling sensitive Admin operations.

---

# Production Reality

This is a learning/portfolio environment using Minikube.

Clearly distinguish local implementation from real production practice.

Examples:

```text
Minikube hostPath
!= cloud production storage

single PostgreSQL Deployment
!= highly available PostgreSQL

local Minikube
!= real multi-node cluster

visual HPA animation
!= direct real-time HPA metrics
```

Production alternatives may be mentioned without unnecessarily replacing the learning implementation.

---

# Product / Portfolio Direction

Future additions should ideally strengthen at least one of:

1. Kubernetes learning
2. product experience
3. technical depth
4. product analytics
5. interview story

Avoid feature creep.

Potential future areas:

- guided onboarding
- Break the Café troubleshooting experience
- user research
- analytics funnels
- learning progress
- Admin authentication
- CI/CD
- monitoring
- public deployment

---

# Agent Behavior

AI agents should:

- preserve the current architecture
- make incremental changes
- explain important decisions
- prefer simple solutions
- keep code understandable
- maintain the café metaphor consistently
- preserve real Kubernetes terminology
- avoid unnecessary dependencies
- avoid broad refactors without explicit request
- prioritize demo reliability
- prioritize teachability

Do not silently change:

- ports
- namespace
- labels
- resource names
- image repositories
- database schema
- API response formats

If one of these must change, explicitly explain the impact and update dependent code.