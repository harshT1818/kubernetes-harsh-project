# Local Runbook

## Start cluster

```powershell
minikube start
minikube status
```

## Check application

```powershell
kubectl get pods -n production-app
kubectl get svc -n production-app
kubectl get pvc -n production-app
kubectl get pv
```

## Enable Ingress

```powershell
minikube addons enable ingress
kubectl get pods -n ingress-nginx
```

## Apply manifests
Prefer applying only the changed file or logical module.

Examples:

```powershell
kubectl apply -f k8s/backend/deployment.yaml
kubectl apply -f k8s/frontend/deployment.yaml
kubectl apply -f k8s/database/deployment.yaml
kubectl apply -f k8s/ingress/ingress.yaml
```

For a complete module:

```powershell
kubectl apply -f k8s/backend/
```

## Verify rollouts

```powershell
kubectl rollout status deployment/backend -n production-app
kubectl rollout status deployment/frontend -n production-app
kubectl rollout status deployment/postgres -n production-app
```

## Logs

```powershell
kubectl logs deployment/backend -n production-app
kubectl logs deployment/frontend -n production-app
kubectl logs deployment/postgres -n production-app
```

## Inspect scheduling/networking

```powershell
kubectl get pods -n production-app -o wide
kubectl describe pod <pod-name> -n production-app
kubectl get endpoints -n production-app
kubectl describe ingress production-app-ingress -n production-app
```

## Rollback

```powershell
kubectl rollout history deployment/backend -n production-app
kubectl rollout undo deployment/backend -n production-app
```

Use the equivalent command for frontend if required.

## Before pushing Git changes

```powershell
git status
git diff
git add .
git commit -m "<clear change description>"
git push
```

Do not commit real Secret values.
