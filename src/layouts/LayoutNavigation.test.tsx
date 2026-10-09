import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import CustomerLayout from './CustomerLayout'
import AdminLayout from './AdminLayout'
import { TestProviders } from '../test/TestProviders'

vi.mock('../services/authService', () => ({
  logout: vi.fn(),
}))

describe('layout navigation', () => {
  it('does not nest links inside other links', () => {
    const { container } = render(
      <MemoryRouter>
        <CustomerLayout />
        <AdminLayout />
      </MemoryRouter>,
      { wrapper: TestProviders },
    )

    expect(container.querySelector('a a')).toBeNull()
  })
})
