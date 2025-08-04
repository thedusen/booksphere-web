import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AttributePicker } from '../AttributePicker';
import * as CatalogingServices from '@/lib/services/cataloging-services';
import { vi } from 'vitest';

// Mock the useGroupedAttributes hook
vi.mock('@/lib/services/cataloging-services', async () => {
  const actual = await vi.importActual('@/lib/services/cataloging-services');
  return {
    ...actual,
    useGroupedAttributes: vi.fn(),
  };
});

const mockGroupedAttributes = {
  'Category 1': [
    { attribute_type_id: '1', name: 'Attribute 1', category_id: 'c1', data_type: 'boolean', display_order: 1 },
    { attribute_type_id: '2', name: 'Attribute 2', category_id: 'c1', data_type: 'boolean', display_order: 2 },
  ],
  'Category 2': [
    { attribute_type_id: '3', name: 'Attribute 3', category_id: 'c2', data_type: 'boolean', display_order: 1 },
  ],
};

describe('AttributePicker', () => {
  beforeEach(() => {
    (CatalogingServices.useGroupedAttributes as any).mockReturnValue({
      data: mockGroupedAttributes,
      isLoading: false,
    });
  });

  it('renders the add button', () => {
    render(<AttributePicker selectedAttributes={[]} onChange={() => {}} />);
    expect(screen.getByText('Add Attributes')).toBeInTheDocument();
  });

  it('opens the popover on button click', async () => {
    render(<AttributePicker selectedAttributes={[]} onChange={() => {}} />);
    await userEvent.click(screen.getByText('Add Attributes'));
    expect(screen.getByPlaceholderText('Search attributes...')).toBeInTheDocument();
  });

  it('displays attribute groups and items', async () => {
    render(<AttributePicker selectedAttributes={[]} onChange={() => {}} />);
    await userEvent.click(screen.getByText('Add Attributes'));
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Attribute 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
  });

  it('calls onChange when an attribute is selected', async () => {
    const handleChange = vi.fn();
    render(<AttributePicker selectedAttributes={[]} onChange={handleChange} />);
    await userEvent.click(screen.getByText('Add Attributes'));
    await userEvent.click(screen.getByText('Attribute 1'));
    expect(handleChange).toHaveBeenCalledWith(['1']);
  });

  it('displays selected attributes as badges', () => {
    render(<AttributePicker selectedAttributes={['1']} onChange={() => {}} />);
    expect(screen.getByText('Attribute 1')).toBeInTheDocument();
  });
}); 