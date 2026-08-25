from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from utils.signing import verify_token
from tools.update_proposal_status import update_proposal_status
from graph.build_graph import graph
from langgraph.types import Command

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        token = query.get("token", [None])[0]

        if not token:
            self._respond(400, "Missing token")
            return

        result = verify_token(token)
        if result is None:
            self._respond(400, "Invalid or expired link")
            return

        proposal_id, decision = result
        new_status = "approved" if decision == "approve" else "rejected"

        try:
            row = update_proposal_status(proposal_id, new_status)
        except ValueError:
            self._respond(409, "This proposal was already reviewed.")
            return

        thread_id = row["thread_id"]
        config = {"configurable": {"thread_id": thread_id}}
        graph.invoke(Command(resume=decision), config=config)

        self._respond(200, f"Proposal {decision}d. Thanks.")

    def _respond(self, code, message):
        self.send_response(code)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(f"<html><body><h2>{message}</h2></body></html>".encode())