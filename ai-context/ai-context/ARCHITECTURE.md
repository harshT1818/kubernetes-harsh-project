# Architecture Context

## Current Application
This is a small 3-tier application used to demonstrate Kubernetes concepts.

### Frontend
- Simple Node/Express frontend
- Container port: `3000`
- Deployment replicas: `2`
- Service: `frontend-service`
- Service type: `ClusterIP`
- Exposed externally through Ingress path `/`

### Backend
- Node/Express backend
- Container port: `8080`
- Deployment replicas: `2`
- Service: `backend-service`
- Service type: `ClusterIP`
- Exposed through Ingress path `/api`
- Health endpoint: `/health`
- PostgreSQL connectivity endpoint: `/api/events`

### Database
- PostgreSQL 16
- Deployment replicas: `1`
- Service: `postgres-service`
- Port: `5432`
- Internal-only ClusterIP
- Uses ConfigMap + Secret for database configuration
- Uses PVC mounted at `/var/lib/postgresql/data`
- Uses `pg_isready` for health checks

## Data Flow

```text
Browser
  |
  v
Ingress Controller
  |
  +--> `/` --> frontend-service --> frontend Pods
  |
  +--> `/api` --> backend-service --> backend Pods
                                      |
                                      v
                              postgres-service
                                      |
                                      v
                                PostgreSQL Pod
                                      |
                                      v
                                   PVC -> PV
```

## Scheduling Model
PostgreSQL is intended for a dedicated database node.

- Node label: `workload=database`
- Taint: `dedicated=database:NoSchedule`
- PostgreSQL uses required node affinity for the label.
- PostgreSQL uses a toleration for the taint.

Mental model:

- Affinity = choose database node
- Taint = repel normal workloads
- Toleration = allow PostgreSQL onto tainted node

## Deployment Strategy
Frontend and backend use RollingUpdate.

Preferred small-environment configuration:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 0
    maxSurge: 1
```

Reason: keep existing capacity available while a replacement Pod becomes ready.

## Local Environment
Local testing is done using Minikube.

Local PV uses `hostPath` for demonstration only. In real cloud production, use CSI-backed persistent storage such as EBS or another suitable provider.
