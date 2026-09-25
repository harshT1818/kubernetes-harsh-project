# AGENTS.md

## Purpose
This repository is a Kubernetes learning/production-style assignment. AI agents should make small, explainable, low-risk changes and preserve the current architecture unless the task explicitly requires a redesign.

## Project Goal
Build and document a 3-tier Kubernetes application using plain Kubernetes manifests (no Helm for this assignment):

- Frontend
- Backend
- PostgreSQL
- ConfigMaps and Secrets
- ClusterIP Services
- Ingress
- Persistent storage with PV/PVC
- Resource requests/limits
- Readiness and liveness probes
- Backend HPA
- Node autoscaling concept/config
- Dedicated PostgreSQL scheduling using node affinity + taint/toleration
- RollingUpdate deployment strategy
- Intentional troubleshooting scenarios

## Repository Conventions
Expected structure:

```text
frontend/
backend/
k8s/
  namespace.yaml
  frontend/
  backend/
  database/
  ingress/
  autoscaling/
troubleshooting/
architecture/
README.md
ai-context/
```

## Important Constraints

1. Do NOT introduce Helm unless explicitly requested.
2. Prefer normal Kubernetes YAML manifests.
3. Do NOT hardcode real credentials in manifests.
4. Do NOT commit real Secret values. Use example/placeholders where needed.
5. Keep backend and PostgreSQL internal using ClusterIP Services.
6. External traffic should enter through Ingress.
7. PostgreSQL stays at one replica in this assignment unless replication is explicitly designed.
8. Do not replace PostgreSQL Deployment with StatefulSet unless explicitly requested; the assignment currently asks for Deployment.
9. Keep changes minimal and explainable.
10. Before changing architecture, read `ai-context/ARCHITECTURE.md` and `ai-context/K8S-DECISIONS.md`.

## Current Kubernetes Naming

- Namespace: `production-app`
- Frontend Deployment: `frontend`
- Frontend Service: `frontend-service`
- Backend Deployment: `backend`
- Backend Service: `backend-service`
- PostgreSQL Deployment: `postgres`
- PostgreSQL Service: `postgres-service`
- PostgreSQL Secret: `postgres-secret`
- PostgreSQL ConfigMap: `postgres-config`
- Backend ConfigMap: `backend-config`

## Current Networking Model

```text
Client
  |
Ingress
  |-- /     -> frontend-service -> frontend Pods
  |-- /api  -> backend-service  -> backend Pods
                                   |
                                   -> postgres-service -> PostgreSQL Pod
```

## Change Workflow
For any requested change:

1. Inspect relevant files first.
2. State what is being changed and why.
3. Prefer editing existing manifests over creating duplicates.
4. Keep selectors/labels consistent.
5. Validate YAML structure.
6. Give exact verification commands after changes.
7. Mention rollback or failure risk if relevant.
8. Update README/context docs when behavior or architecture changes.

## Verification Commands
Common checks:

```bash
kubectl get pods -n production-app
kubectl get svc -n production-app
kubectl get ingress -n production-app
kubectl get pvc -n production-app
kubectl get pv
kubectl rollout status deployment/frontend -n production-app
kubectl rollout status deployment/backend -n production-app
kubectl rollout status deployment/postgres -n production-app
```

Use `kubectl describe` and `kubectl logs` when debugging.

## Agent Behavior
- Do not make broad refactors unless explicitly asked.
- Do not silently change ports, labels, namespaces, image names, or service names.
- Do not add technologies just because they are common in production.
- Preserve assignment teachability: every object/config should be easy to explain in a demo.
- If unsure, prefer the simplest Kubernetes-native solution.
