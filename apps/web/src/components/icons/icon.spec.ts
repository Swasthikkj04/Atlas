import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DESIGN_TOKENS } from '../../styles/tokens.ts';
import { resolveIconProps, ICON_SIZE_MAP, ICON_STROKE_MAP } from './icon-props.ts';
import type { IconProps } from './Icon.types.ts';

// Dummy icon component reference for testing prop resolution
const DummyIcon = (() => null) as unknown as IconProps['icon'];

describe('WX-003: Icon System & Sizing Contracts', () => {
  it('defines 5 canonical semantic icon sizes matching design tokens', () => {
    assert.equal(DESIGN_TOKENS.icons.sizes.micro.px, 12);
    assert.equal(DESIGN_TOKENS.icons.sizes.small.px, 14);
    assert.equal(DESIGN_TOKENS.icons.sizes.default.px, 16);
    assert.equal(DESIGN_TOKENS.icons.sizes.medium.px, 20);
    assert.equal(DESIGN_TOKENS.icons.sizes.large.px, 24);

    assert.equal(ICON_SIZE_MAP.micro, 12);
    assert.equal(ICON_SIZE_MAP.small, 14);
    assert.equal(ICON_SIZE_MAP.default, 16);
    assert.equal(ICON_SIZE_MAP.medium, 20);
    assert.equal(ICON_SIZE_MAP.large, 24);
  });

  it('defines 3 canonical stroke widths for display, ui, and micro contexts', () => {
    assert.equal(DESIGN_TOKENS.icons.strokes.display, 1.5);
    assert.equal(DESIGN_TOKENS.icons.strokes.ui, 1.75);
    assert.equal(DESIGN_TOKENS.icons.strokes.micro, 2.0);

    assert.equal(ICON_STROKE_MAP.display, 1.5);
    assert.equal(ICON_STROKE_MAP.ui, 1.75);
    assert.equal(ICON_STROKE_MAP.micro, 2.0);
  });

  it('resolves icon props without undefined stroke to preserve Lucide currentColor visibility', () => {
    const resolved = resolveIconProps({
      icon: DummyIcon,
      size: 'default',
    });

    assert.equal(resolved.size, 16);
    assert.equal(resolved.strokeWidth, 1.75);
    // Crucial bug prevention: stroke and color MUST NOT be defined as undefined
    assert.equal('stroke' in resolved, false, 'stroke property must not be present when strokeColor is undefined');
    assert.equal('color' in resolved, false, 'color property must not be present when strokeColor is undefined');
    assert.equal(resolved['aria-hidden'], true);
  });

  it('attaches stroke and color when custom strokeColor is provided', () => {
    const resolved = resolveIconProps({
      icon: DummyIcon,
      size: 'default',
      strokeColor: '#1a56db',
    });

    assert.equal(resolved.stroke, '#1a56db');
    assert.equal(resolved.color, '#1a56db');
  });

  it('configures accessible attributes when aria-label or title is supplied', () => {
    const resolvedWithLabel = resolveIconProps({
      icon: DummyIcon,
      size: 'small',
      'aria-label': 'Security Shield',
    });

    assert.equal(resolvedWithLabel['aria-label'], 'Security Shield');
    assert.equal(resolvedWithLabel.role, 'img');
    assert.equal('aria-hidden' in resolvedWithLabel, false);

    const resolvedWithTitle = resolveIconProps({
      icon: DummyIcon,
      size: 'large',
      title: 'User Profile',
    });

    assert.equal(resolvedWithTitle.title, 'User Profile');
    assert.equal(resolvedWithTitle.role, 'img');
  });

  it('maps numeric and contextual stroke widths accurately', () => {
    const micro = resolveIconProps({ icon: DummyIcon, size: 'micro' });
    assert.equal(micro.strokeWidth, ICON_STROKE_MAP.micro);

    const small = resolveIconProps({ icon: DummyIcon, size: 'small' });
    assert.equal(small.strokeWidth, ICON_STROKE_MAP.micro);

    const def = resolveIconProps({ icon: DummyIcon, size: 'default' });
    assert.equal(def.strokeWidth, ICON_STROKE_MAP.ui);

    const large = resolveIconProps({ icon: DummyIcon, size: 'large' });
    assert.equal(large.strokeWidth, ICON_STROKE_MAP.display);
  });
});
