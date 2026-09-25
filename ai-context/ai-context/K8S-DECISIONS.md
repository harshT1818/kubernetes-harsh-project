# Kubernetes Decisions

This file records decisions that should not be changed casually by an AI agent.

## 1. Plain manifests, no Helm
Reason: Helm was not part of the assignment when the project was built. The goal is to demonstrate direct understanding of Kubernetes objects.

Do not introduce Helm unless explicitly requested.

## 2. One namespace
Namespace: `production-app`

Reason: keeps assignment resources grouped and easy to inspect.

## 3. ClusterIP for application Services
Frontend, backend, and PostgreSQL Services use ClusterIP.

Reason: internal networking should stay private; Ingress is the external entry point.

## 4. Two frontend replicas
Reason: demonstrate redundancy and RollingUpdate behavior.

## 5. Two backend replicas
Reason: backend is stateless and will later demonstrate HPA scaling.

## 6. One PostgreSQL replica
Reason: multiple plain PostgreSQL Deployment replicas would not automatically create safe database replication.

## 7. PostgreSQL uses Deployment
Reason: assignment requirement. In a real production design, StatefulSet, an operator, or managed PostgreSQL could be more appropriate.

## 8. Configuration separation
Use ConfigMap for non-sensitive values and Secret for credentials.

Do not hardcode DB credentials inside application source or Deployment manifests.

## 9. Health probes
Backend:
- readiness: HTTP `/health`
- liveness: HTTP `/health`

PostgreSQL:
- readiness/liveness: `pg_isready`

Reason: use application-native health checks.

## 10. Persistent database storage
PostgreSQL data directory is backed by PVC/PV.

Local Minikube storage uses hostPath only for demonstration.

Reclaim policy: `Retain`.

Reason: accidental PVC deletion should not automatically delete underlying DB data. This is not a backup mechanism.

## 11. Dedicated DB scheduling
Use both:
- required node affinity
- taint/toleration

Reason: affinity selects DB nodes, taint keeps normal workloads away, toleration permits PostgreSQL.

## 12. RollingUpdate
Frontend/backend use RollingUpdate rather than Recreate.

Reason: stateless workloads can be updated gradually with better availability.

## 13. HPA target
Only backend is intended for HPA initially.

Reason: backend is stateless and resource requests already exist, making CPU-based HPA understandable and demonstrable.
