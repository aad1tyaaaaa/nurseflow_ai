import uuid
from datetime import datetime, timezone

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.database import async_session
from app.models.audit_log import AuditLog


class AuditMiddleware(BaseHTTPMiddleware):
    """Logs all mutating API requests (POST, PUT, PATCH, DELETE) to the audit trail."""

    AUDITED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if request.method in self.AUDITED_METHODS:
            try:
                user_id = None
                if hasattr(request.state, "user_id"):
                    user_id = request.state.user_id

                # Extract resource info from path
                path_parts = request.url.path.strip("/").split("/")
                resource_type = path_parts[-1] if path_parts else "unknown"
                # Try to find UUID in path as resource_id
                resource_id = None
                for part in path_parts:
                    try:
                        uuid.UUID(part)
                        resource_id = part
                    except ValueError:
                        continue

                async with async_session() as session:
                    log = AuditLog(
                        user_id=user_id,
                        action=f"{request.method} {request.url.path}",
                        resource_type=resource_type,
                        resource_id=resource_id,
                        details={
                            "status_code": response.status_code,
                            "query_params": dict(request.query_params),
                        },
                        ip_address=request.client.host if request.client else None,
                        user_agent=request.headers.get("user-agent"),
                    )
                    session.add(log)
                    await session.commit()
            except Exception:
                pass  # Audit logging should never break the request

        return response
