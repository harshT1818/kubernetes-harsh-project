# Pod Scheduling Failure

## Intentional Misconfiguration
Changed PostgreSQL required node affinity from:

workload=database

to:

workload=database-wrong

## Symptom
PostgreSQL Pod remained in Pending state.

## Investigation
kubectl get pods -n production-app

kubectl describe pod <postgres-pod> -n production-app

kubectl get nodes --show-labels

## Root Cause
The PostgreSQL Deployment required a node label that did not exist.

## Fix
Changed the Helm value back to:

workload=database

and ran:

helm upgrade production-app ./production-app -n production-app

## Verification
PostgreSQL Pod returned to Running state.