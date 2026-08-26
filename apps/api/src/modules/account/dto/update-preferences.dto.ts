import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum ThemeOption {
  SYSTEM = 'system',
  LIGHT = 'light',
  DARK = 'dark',
}

export enum MotionOption {
  SYSTEM = 'system',
  STANDARD = 'standard',
  REDUCED = 'reduced',
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    enum: ThemeOption,
    description: 'Interface theme preference',
    example: 'system',
  })
  @IsOptional()
  @IsEnum(ThemeOption, {
    message: 'Theme must be one of: system, light, dark',
  })
  theme?: ThemeOption;

  @ApiPropertyOptional({
    enum: MotionOption,
    description: 'Motion and animation accessibility preference',
    example: 'system',
  })
  @IsOptional()
  @IsEnum(MotionOption, {
    message: 'Motion must be one of: system, standard, reduced',
  })
  motion?: MotionOption;
}
