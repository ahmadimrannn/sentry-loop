import requests
from fastapi import HTTPException
from utils.time_it import time_it

SERVICES = {
  "lumen": "https://lumenai-multi-agent-research-assistant-production.up.railway.app/health",
  "cognilead": "https://cogni-lead.vercel.app/health"
}

@time_it
def checks_service_status(service: str):
  """Checks the health of the services."""

  if service not in SERVICES:
    raise HTTPException(
        status_code=400,
        detail=f"Unknown service '{service}'. Supported services: {list(SERVICES.keys())}"
    )

  url = SERVICES[service]

  try:
    res = requests.get(url, timeout=10)
    res.raise_for_status()
    
    response = res.json() if res.headers.get("content-type") == "application/json" else {"status": "ok"}
    response['status_code'] = res.status_code
    response['service'] = service
    return response
  except (requests.RequestException, ValueError) as e:
    raise HTTPException(
      status_code=500,
      detail=f"Failed to get the health status of {service}. Error: {str(e)}"
    )


if __name__ == "__main__":
  health_status = checks_service_status("lumen")
  print(health_status)