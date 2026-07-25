# API Improvement Register

| Title | Priority | Severity | Description | Recommendation | Impact | Status |
|---|---|---|---|---|---|---|
| Registration Returns Empty Body | Low | Minor | Endpoint `/api/v1/auth/register` returns `201 Created` with no content, making client-side user experience handling clunky. | Update `AuthController.register` to return a standardized payload with `{ id, email, createdAt }` or issue auto-login token. | Improves frontend DX. | Documented |
| Lack of `Location` header on POST creation | Low | Minor | Creating resources via POST often does not return a `Location` header to point clients to the new resource. | Add `@Header('Location', ...)` or use Express response to set Location header on endpoints like Domain Creation. | Better REST compliance. | Documented |
| Swagger documentation lacks error schemas | Medium | Minor | Current Swagger docs show success responses but omit standard `400 Bad Request` or `401 Unauthorized` schema examples. | Leverage NestJS `@ApiBadRequestResponse()` and `@ApiUnauthorizedResponse()` decorators. | Better DX for API consumers. | Documented |
| X-Powered-By Exposure | Medium | Moderate | Express by default exposes `X-Powered-By: Express`. | Use `app.getHttpAdapter().getInstance().disable('x-powered-by')` or integrate `helmet`. | Reduces information disclosure. | Documented |
