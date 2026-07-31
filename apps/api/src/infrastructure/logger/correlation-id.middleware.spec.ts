import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { RequestContextStore } from './request-context.store';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  it('should generate new correlationId and requestId when not supplied by client', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      expect.stringMatching(/^corr_/),
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Request-ID',
      expect.stringMatching(/^req_/),
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should preserve and pass through client-supplied X-Correlation-ID and X-Request-ID', () => {
    mockRequest.headers = {
      'x-correlation-id': 'custom-correlation-123',
      'x-request-id': 'custom-request-456',
    };

    middleware.use(mockRequest, mockResponse, () => {
      expect(RequestContextStore.getCorrelationId()).toBe(
        'custom-correlation-123',
      );
      expect(RequestContextStore.getRequestId()).toBe('custom-request-456');
    });

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      'custom-correlation-123',
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Request-ID',
      'custom-request-456',
    );
  });
});
