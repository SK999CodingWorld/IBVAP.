import asyncio
import time
import statistics
import httpx

BASE_URL = "http://127.0.0.1:8001"

async def benchmark_endpoint(client: httpx.AsyncClient, method: str, url: str, json_data=None, headers=None, total_requests=100, concurrency=10):
    semaphore = asyncio.Semaphore(concurrency)
    latencies = []

    async def single_request():
        async with semaphore:
            t0 = time.perf_counter()
            try:
                if method == "GET":
                    resp = await client.get(url, headers=headers, timeout=10.0)
                else:
                    resp = await client.post(url, json=json_data, headers=headers, timeout=10.0)
                elapsed = (time.perf_counter() - t0) * 1000.0
                if resp.status_code in (200, 201):
                    latencies.append(elapsed)
            except Exception:
                pass

    t_start = time.perf_counter()
    tasks = [asyncio.create_task(single_request()) for _ in range(total_requests)]
    await asyncio.gather(*tasks)
    total_time = time.perf_counter() - t_start

    if not latencies:
        return {"rps": 0.0, "p50_ms": 0.0, "p95_ms": 0.0, "p99_ms": 0.0, "successful": 0, "total": total_requests}

    latencies.sort()
    p50 = statistics.median(latencies)
    p95_idx = int(len(latencies) * 0.95)
    p95 = latencies[min(p95_idx, len(latencies) - 1)]
    p99_idx = int(len(latencies) * 0.99)
    p99 = latencies[min(p99_idx, len(latencies) - 1)]
    rps = len(latencies) / total_time

    return {
        "rps": round(rps, 1),
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "successful": len(latencies),
        "total": total_requests
    }

async def run_benchmark():
    benchmark_headers = {"X-Benchmark": "1"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=benchmark_headers) as client:
        # Obtain auth token
        login_res = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login_res.json().get("access_token")
        auth_headers = {"Authorization": f"Bearer {token}", "X-Benchmark": "1"} if token else benchmark_headers

        print("=== PERFORMANCE BENCHMARK ===")
        # 1. Public Lightweight Health check
        res_pub_health = await benchmark_endpoint(client, "GET", "/health", total_requests=100, concurrency=10)
        print(f"Public /health:  {res_pub_health['rps']} req/s | p50: {res_pub_health['p50_ms']}ms | p95: {res_pub_health['p95_ms']}ms")

        # 2. Deep API Health check
        res_health = await benchmark_endpoint(client, "GET", "/api/health", total_requests=100, concurrency=10)
        print(f"Deep /api/health: {res_health['rps']} req/s | p50: {res_health['p50_ms']}ms | p95: {res_health['p95_ms']}ms")

        # 2. Cameras list
        res_cameras = await benchmark_endpoint(client, "GET", "/api/cameras", headers=auth_headers, total_requests=100, concurrency=10)
        print(f"Cameras List: {res_cameras['rps']} req/s | p50: {res_cameras['p50_ms']}ms | p95: {res_cameras['p95_ms']}ms")

        # 3. Auth login (CPU-intensive bcrypt)
        res_login = await benchmark_endpoint(client, "POST", "/api/auth/login", json_data={"username": "admin", "password": "admin123"}, total_requests=25, concurrency=5)
        print(f"Auth Login:   {res_login['rps']} req/s | p50: {res_login['p50_ms']}ms | p95: {res_login['p95_ms']}ms")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
