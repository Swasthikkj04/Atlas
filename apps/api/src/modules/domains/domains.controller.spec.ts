import { Test, TestingModule } from '@nestjs/testing';
import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';

describe('DomainsController (WX-812: Domain Deletion Endpoint)', () => {
  let controller: DomainsController;
  let domainsService: jest.Mocked<DomainsService>;

  const mockUser = {
    id: '01f6064b-017d-447a-a897-ebfbb235cc77',
    email: 'rolex1995.1995@gmail.com',
  };

  const mockRequest: any = {
    user: mockUser,
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findByUser: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DomainsController],
      providers: [
        {
          provide: DomainsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DomainsController>(DomainsController);
    domainsService = module.get(DomainsService);
  });

  it('delegates delete to DomainsService with authenticated userId and domainId', async () => {
    domainsService.delete.mockResolvedValue(undefined);
    const domainId = 'd2ec8ac2-9e6c-409d-8ba5-70d8c0a4edf8';

    const result = await controller.remove(mockRequest, domainId);

    expect(domainsService.delete).toHaveBeenCalledWith(mockUser.id, domainId);
    expect(result).toEqual({
      success: true,
      message: 'Domain deleted successfully.',
    });
  });
});
