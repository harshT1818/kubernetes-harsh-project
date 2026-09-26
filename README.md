# Kubernetes Production Application

A three-tier application deployed on Kubernetes using **Helm**, with frontend, backend, PostgreSQL, Ingress routing, persistent storage, health checks, resource management, autoscaling, and database-specific scheduling.

## Architecture

```text
Client
  |
  v
NGINX Ingress
  |
  +---- / --------> frontend-service
  |                     |
  |                 Frontend Pods
  |
  +---- /api -----> backend-service
                        |
                    Backend Pods
                        |
                        v
                 postgres-service
                        |
                   PostgreSQL Pod
                        |
                        v
                    PVC -> PV
```

The backend is horizontally scalable using HPA.

PostgreSQL is configured to run on a database-designated node using Node Affinity and Toleration.

## Tech Stack

- Kubernetes
- Minikube
- Helm
- Docker
- NGINX Ingress Controller
- Metrics Server
- Node.js / Express
- PostgreSQL

## Project Structure

```text
kubernetes-harsh-project/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── public/
│
├── production-app/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── backend-deployment.yaml
│       ├── backend-service.yaml
│       ├── backend-hpa.yaml
│       ├── frontend-deployment.yaml
│       ├── frontend-service.yaml
│       ├── postgres-deployment.yaml
│       ├── postgres-service.yaml
│       ├── postgres-configmap.yaml
│       ├── postgres-secret.yaml
│       ├── postgres-pv.yaml
│       ├── postgres-pvc.yaml
│       └── ingress.yaml
│
├── troubleshooting/
│   ├── 01-pod-scheduling.md
│   └── 02-service.md
│
└── README.md
```

## Kubernetes Design

### Namespace

The application runs inside:

```text
production-app
```

The namespace logically groups and isolates application resources.

### Frontend

The frontend runs as a Deployment with:

- 2 replicas
- CPU and memory requests/limits
- readiness probe
- liveness probe
- RollingUpdate deployment strategy
- internal ClusterIP Service

### Backend

The backend runs as a Deployment with:

- minimum 2 replicas
- CPU and memory requests/limits
- readiness probe on `/health`
- liveness probe on `/health`
- RollingUpdate deployment strategy
- internal ClusterIP Service
- Horizontal Pod Autoscaler

### PostgreSQL

PostgreSQL runs with:

- 1 replica
- persistent storage
- ConfigMap-based database configuration
- Secret-based credentials
- CPU and memory requests/limits
- `pg_isready` readiness and liveness probes
- Node Affinity
- Toleration for database-specific nodes

A single replica is intentionally used because multiple standalone PostgreSQL Pods would not automatically create a replicated PostgreSQL cluster.

For a real production environment, a PostgreSQL operator, StatefulSet, or managed database service would usually be preferred.

## Helm

The application is managed as a Helm release.

```text
values.yaml
     |
     v
Helm templates
     |
     v
Rendered Kubernetes manifests
     |
     v
Kubernetes cluster
```

`values.yaml` stores configurable values such as:

- image repository and tag
- replica count
- service ports
- resource requests and limits
- storage size
- HPA thresholds
- database scheduling configuration

The templates define the Kubernetes resource structure.

Render the manifests without deploying:

```powershell
helm template production-app ./production-app
```

Install the application:

```powershell
helm upgrade --install production-app ./production-app -n production-app
```

Upgrade after modifying the chart:

```powershell
helm upgrade production-app ./production-app -n production-app
```

Check the release:

```powershell
helm list -n production-app
helm status production-app -n production-app
```

## Local Setup

### Prerequisites

Install:

- Docker
- kubectl
- Minikube
- Helm

Verify:

```powershell
docker --version
kubectl version --client
minikube version
helm version
```

### Start Minikube

```powershell
minikube start
```

Verify:

```powershell
kubectl get nodes
```

The Minikube node should show:

```text
Ready
```

## Build Application Images

Build the backend:

```powershell
docker build -t production-backend:1.0 ./backend
```

Build the frontend:

```powershell
docker build -t production-frontend:1.0 ./frontend
```

Load both images into Minikube:

```powershell
minikube image load production-backend:1.0
minikube image load production-frontend:1.0
```

## Required Minikube Addons

Enable NGINX Ingress:

```powershell
minikube addons enable ingress
```

Enable Metrics Server:

```powershell
minikube addons enable metrics-server
```

Verify:

```powershell
kubectl get pods -n ingress-nginx
kubectl top nodes
```

## Database Node Scheduling

The PostgreSQL workload requires a node with:

```text
workload=database
```

Apply the label:

```powershell
kubectl label node minikube workload=database --overwrite
```

The production design also supports a database-specific taint:

```powershell
kubectl taint node minikube dedicated=database:NoSchedule
```

PostgreSQL has the required toleration and Node Affinity configuration.

Node Affinity determines **where PostgreSQL should run**.

Toleration gives PostgreSQL **permission to run on the tainted node**.

> In the single-node Minikube environment, the taint may be removed after demonstrating the scheduling behaviour because frontend and backend workloads also require the same node.

Remove it using:

```powershell
kubectl taint node minikube dedicated=database:NoSchedule-
```

## Persistent Storage

PostgreSQL uses:

```text
PostgreSQL Pod
      |
      v
     PVC
      |
      v
      PV
      |
      v
/data/postgres
```

Storage configuration:

- Size: 2Gi
- Access mode: ReadWriteOnce
- Reclaim policy: Retain

`Retain` prevents Kubernetes from automatically deleting the underlying data when the claim is removed.

It should not be considered a database backup.

`hostPath` is used because this project runs locally on Minikube.

In a cloud deployment, CSI-backed storage such as AWS EBS would normally be used.

## Ingress

Ingress routing:

```text
/       -> frontend-service:3000
/api    -> backend-service:8080
```

Check:

```powershell
kubectl get ingress -n production-app
kubectl describe ingress production-app-ingress -n production-app
```

Because Minikube is running through Docker on Windows, expose Ingress using:

```powershell
minikube tunnel
```

Keep this command running in a separate terminal.

Frontend:

```text
http://127.0.0.1/
```

Backend:

```text
http://127.0.0.1/api/events
```

Test:

```powershell
Invoke-WebRequest http://127.0.0.1/ -UseBasicParsing
Invoke-RestMethod http://127.0.0.1/api/events
```

A successful backend response confirms:

```text
Ingress
 -> backend-service
 -> Backend Pod
 -> postgres-service
 -> PostgreSQL
```

## Horizontal Pod Autoscaling

Backend HPA configuration:

```text
Minimum replicas: 2
Maximum replicas: 5
Target CPU: 60%
```

Check:

```powershell
kubectl get hpa -n production-app
```

### HPA Load Test

Generate backend traffic:

```powershell
kubectl run load-generator `
  --image=busybox:1.36 `
  -n production-app `
  --restart=Never `
  -- /bin/sh -c "while true; do wget -q -O- http://backend-service:8080/api/events > /dev/null; done"
```

Watch HPA:

```powershell
kubectl get hpa -n production-app -w
```

Watch Pods:

```powershell
kubectl get pods -n production-app -w
```

Observed during testing:

```text
CPU: 1% -> 128%

Backend replicas:
2 -> 4 -> 5
```

This verifies that HPA scales backend Pods automatically when CPU usage exceeds the configured target.

Delete the load generator afterward:

```powershell
kubectl delete pod load-generator -n production-app
```

## Deployment Strategy

Frontend and backend use:

```text
RollingUpdate
```

The rollout configuration is designed to replace old Pods gradually instead of stopping all replicas simultaneously.

This reduces downtime and provides safer application updates.

Check rollout status:

```powershell
kubectl rollout status deployment/backend -n production-app
kubectl rollout status deployment/frontend -n production-app
```

## Health Checks

Backend:

```text
Readiness -> GET /health
Liveness  -> GET /health
```

PostgreSQL:

```text
Readiness -> pg_isready
Liveness  -> pg_isready
```

Readiness determines whether a Pod should receive traffic.

Liveness determines whether Kubernetes should restart an unhealthy container.

## ConfigMap and Secret

Non-sensitive configuration is separated from application code using ConfigMaps.

Sensitive configuration is stored using Kubernetes Secrets.

Example backend configuration:

```text
DB_HOST
DB_PORT
DB_NAME
```

Database credentials:

```text
POSTGRES_USER
POSTGRES_PASSWORD
```

Real production credentials should not be committed to Git.

A dedicated external secret manager would normally be preferred for production environments.

## Troubleshooting

Intentional failures are documented under:

```text
troubleshooting/
```

Completed scenarios include:

### Pod Scheduling Failure

Required PostgreSQL Node Affinity was intentionally changed to a label that did not exist.

Result:

```text
No eligible node
 -> PostgreSQL Pod Pending
```

Investigated using:

```powershell
kubectl describe pod <pod> -n production-app
kubectl get nodes --show-labels
```

### Service Selector Failure

The backend Service selector was intentionally changed so it no longer matched backend Pod labels.

Result:

```text
Healthy Pods
 -> selector mismatch
 -> no Service endpoints
 -> API unavailable
```

Investigated using:

```powershell
kubectl get pods -n production-app --show-labels
kubectl describe service backend-service -n production-app
kubectl get endpoints backend-service -n production-app
```

## Useful Commands

Application status:

```powershell
kubectl get all -n production-app
```

Pods:

```powershell
kubectl get pods -n production-app -o wide
```

Services:

```powershell
kubectl get svc -n production-app
```

Ingress:

```powershell
kubectl get ingress -n production-app
```

Storage:

```powershell
kubectl get pv
kubectl get pvc -n production-app
```

HPA:

```powershell
kubectl get hpa -n production-app
```

Logs:

```powershell
kubectl logs deployment/backend -n production-app
kubectl logs deployment/frontend -n production-app
kubectl logs deployment/postgres -n production-app
```

Inspect a Pod:

```powershell
kubectl describe pod <pod-name> -n production-app
```

## Node Autoscaling

HPA handles **Pod scaling**.

A production cloud environment would additionally use a node autoscaler such as:

```text
Cluster Autoscaler
or
Karpenter
```

The relationship is:

```text
Traffic increases
      |
      v
HPA needs more Pods
      |
      v
Pods require additional capacity
      |
      v
Node Autoscaler provisions Nodes
```

Node autoscaling is documented as part of the production architecture but is not simulated as real cloud infrastructure in the local single-node Minikube environment.

## Key Design Decisions

- Helm is used instead of individually applying many Kubernetes manifests.
- Frontend and backend are stateless and can safely use multiple replicas.
- PostgreSQL uses one replica in this implementation.
- Backend and PostgreSQL Services are not externally exposed.
- Ingress is the external routing layer.
- PostgreSQL data uses persistent storage.
- Backend uses HPA because application traffic can vary.
- PostgreSQL uses database-specific scheduling rules.
- RollingUpdate is used for application deployments.
- Health probes prevent traffic from reaching unhealthy Pods.
- Resource requests and limits improve scheduling and resource isolation.

## Future Production Improvements

Possible improvements for a real production deployment include:

- managed PostgreSQL such as AWS RDS
- Karpenter or Cluster Autoscaler
- TLS using cert-manager
- custom domain
- external secrets manager
- NetworkPolicies
- PodDisruptionBudgets
- multiple worker nodes
- monitoring with Prometheus and Grafana
- centralized logging
- CI/CD pipeline
- private container registry
- automated Helm deployments

## Summary

This project demonstrates a complete Kubernetes application lifecycle:

```text
Docker images
      |
      v
Helm Chart
      |
      v
Kubernetes Deployments
      |
      +-> Services
      |
      +-> Ingress
      |
      +-> ConfigMap / Secret
      |
      +-> Persistent Storage
      |
      +-> Health Probes
      |
      +-> Resource Management
      |
      +-> HPA
      |
      +-> Node Scheduling
```

The goal is not only to deploy the application, but to demonstrate how Kubernetes handles networking, configuration, storage, health, scaling, deployment safety, and troubleshooting in a production-style architecture.