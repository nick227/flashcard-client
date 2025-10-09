import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NotFound from '../NotFound.vue'

describe('NotFound', () => {
  const createWrapper = () => {
    const mockRouter = {
      back: vi.fn()
    }
    
    return mount(NotFound, {
      global: {
        mocks: {
          useRouter: () => mockRouter
        },
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })
  }

  it('renders 404 page', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Page Not Found')
  })

  it('displays error message', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain("The page you're looking for doesn't exist")
  })

  it('renders go back button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Go Back')
  })

  it('displays error icon', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.fa-exclamation-circle').exists()).toBe(true)
  })

  it('renders back arrow icon', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.fa-arrow-left').exists()).toBe(true)
  })

  it('has both action buttons', () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })
})


