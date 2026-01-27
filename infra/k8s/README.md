# Kubernetes Deployment

## Förutsättningar

- Kubernetes cluster (v1.24+)
- kubectl konfigurerat
- Nginx Ingress Controller installerat
- Cert-Manager för TLS certifikat (valfritt)

## Deployment

### 1. Skapa namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Deploya PostgreSQL

```bash
kubectl apply -f postgres.yaml
```

Vänta tills PostgreSQL är redo:

```bash
kubectl wait --for=condition=ready pod -l app=postgres -n dietistapp --timeout=300s
```

### 3. Deploya API

Först, bygg och pusha Docker image:

```bash
docker build -t dietistapp/api:latest -f apps/api/Dockerfile .
docker push dietistapp/api:latest
```

Uppdatera secrets i `api.yaml` med dina faktiska värden, sedan:

```bash
kubectl apply -f api.yaml
```

### 4. Deploya Web

Bygg och pusha Docker image:

```bash
docker build -t dietistapp/web:latest -f apps/web/Dockerfile .
docker push dietistapp/web:latest
```

Deploy:

```bash
kubectl apply -f web.yaml
```

### 5. Verifiera deployment

```bash
kubectl get pods -n dietistapp
kubectl get services -n dietistapp
kubectl get ingress -n dietistapp
```

## Monitoring

Loggar:

```bash
kubectl logs -f -l app=api -n dietistapp
kubectl logs -f -l app=web -n dietistapp
```

Status:

```bash
kubectl describe deployment api -n dietistapp
kubectl describe deployment web -n dietistapp
```

## Skalning

Skala API:

```bash
kubectl scale deployment api --replicas=3 -n dietistapp
```

Skala Web:

```bash
kubectl scale deployment web --replicas=3 -n dietistapp
```

## Uppdatering

Rolling update:

```bash
kubectl set image deployment/api api=dietistapp/api:v2 -n dietistapp
kubectl set image deployment/web web=dietistapp/web:v2 -n dietistapp
```

## Rensning

Ta bort allt:

```bash
kubectl delete namespace dietistapp
```
