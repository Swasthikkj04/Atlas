import { IsFQDN, IsNotEmpty } from 'class-validator';

export class CreateDomainDto {
  @IsNotEmpty()
  @IsFQDN()
  domainName: string;
}
