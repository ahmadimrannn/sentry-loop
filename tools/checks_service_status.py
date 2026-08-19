import requests
from utils.time_it import time_it
from api.event_logger import log_event

class ToolExecutionError(Exception):
    pass

SERVICES = {
  "lumen": "https://lumenai-multi-agent-research-assistant-production.up.railway.app/health",
  "cognilead": "https://cogni-lead.vercel.app/health"
}

@time_it
def checks_service_status(service: str):
  """Checks the health of the services."""

  if service not in SERVICES:
    raise ToolExecutionError(
      f"Unknown service '{service}'. Supported services: {list(SERVICES.keys())}"
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
    log_event(
        service=service, event_type="health_check_failed", severity="critical",
        node_or_route="check_service_status",
        message=f"Health check failed for {service}: {str(e)}",
        context={"url": url},
    )
    raise ToolExecutionError(f"Failed to get the health status of {service}. Error: {str(e)}")


if __name__ == "__main__":
  health_status = checks_service_status("lumen")
  print(health_status)