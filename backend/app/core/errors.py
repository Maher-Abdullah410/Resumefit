"""Uniform error body: {"error": {"code", "message", "details", "request_id"}}  (API contract, section 2.2)."""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str, details: list | None = None):
        self.status_code, self.code, self.message, self.details = status_code, code, message, details or []


def _body(request: Request, code: str, message: str, details: list | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details or [],
                      "request_id": getattr(request.state, "request_id", None)}}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(request: Request, exc: AppError):
        return JSONResponse(_body(request, exc.code, exc.message, exc.details), status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError):
        details = [{"field": ".".join(str(p) for p in e["loc"] if p != "body"), "issue": e["msg"]} for e in exc.errors()]
        return JSONResponse(_body(request, "VALIDATION_ERROR", "Request validation failed.", details), status_code=422)

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException):
        codes = {401: "UNAUTHORIZED", 404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}
        return JSONResponse(_body(request, codes.get(exc.status_code, "HTTP_ERROR"), str(exc.detail)),
                            status_code=exc.status_code, headers=getattr(exc, "headers", None))
