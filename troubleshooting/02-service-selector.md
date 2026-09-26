# Troubleshooting 02 — Backend Service Selector Failure

## Scenario

The backend Service was intentionally misconfigured to test how Kubernetes behaves when a Service selector does not match any backend Pods.

## Intentional Misconfiguration

The backend Service normally uses:

```yaml
selector:
  app: backend
```

It was changed to:

```yaml
selector:
  app: backend-wrong
```

The backend Pods still had the correct label:

```text
app=backend
```

## Expected Symptom

The backend Pods remain healthy, but the Service cannot find them.

This causes:

```text
Backend Pods healthy
        ↓
Service selector mismatch
        ↓
No Service endpoints
        ↓
Ingress cannot route /api traffic
        ↓
API request fails
```

## Investigation

First, the Helm chart was upgraded:

```powershell
helm upgrade production-app ./production-app `
  -n production-app `
  --force-conflicts
```

`--force-conflicts` was required because the Service had originally been created using `kubectl apply`, and Kubernetes still tracked the Service selector field as owned by `kubectl-client-side-apply`.

The Service was then inspected:

```powershell
kubectl get svc backend-service -n production-app
```

The Service itself continued to exist normally.

The Service endpoints were checked:

```powershell
kubectl get endpoints backend-service -n production-app
```

With the incorrect selector, the expected result was:

```text
ENDPOINTS   <none>
```

The backend Pod labels were inspected using:

```powershell
kubectl get pods -n production-app --show-labels
```

The Pods had:

```text
app=backend
```

while the Service expected:

```text
app=backend-wrong
```

The Service configuration could also be inspected with:

```powershell
kubectl describe service backend-service -n production-app
```

## Root Cause

Kubernetes Services discover destination Pods using label selectors.

The Service selector:

```text
app=backend-wrong
```

did not match the backend Pod label:

```text
app=backend
```

Therefore, Kubernetes could not create backend endpoints for the Service.

The backend application itself was not broken. The failure occurred in the Service-to-Pod routing layer.

## Fix

The Service selector was restored to:

```yaml
selector:
  app: backend
```

The Helm release was upgraded again:

```powershell
helm upgrade production-app ./production-app `
  -n production-app `
  --force-conflicts
```

## Verification

Service endpoints were checked again:

```powershell
kubectl get endpoints backend-service -n production-app
```

The backend Pods appeared again as endpoints:

```text
10.244.0.6:8080
10.244.0.8:8080
```

This confirmed that the Service was once again routing to the backend Pods.

The API was then tested through Ingress:

```powershell
Invoke-RestMethod http://127.0.0.1/api/events
```

If this request cannot connect while Service endpoints are healthy, the problem is no longer the Service layer. On Minikube with Docker on Windows, `minikube tunnel` must also be running for `127.0.0.1` Ingress access.

## Key Learning

A Kubernetes Service can exist and appear healthy even when it has no destination Pods.

The important troubleshooting sequence is:

```text
Check Pods
↓
Check Pod labels
↓
Check Service selector
↓
Check Service endpoints
↓
Check Ingress
```

If Pods are healthy but the Service has no endpoints, the first thing to verify is whether the Service selector matches the Pod labels.
