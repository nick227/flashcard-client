import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useIsMobile } from '../useIsMobile'

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
    vi.restoreAllMocks()
  })

  it('detects desktop by default', async () => {
    const wrapper = mount({
      template: '<div>{{ isMobile }}</div>',
      setup() {
        const isMobile = useIsMobile()
        return { isMobile }
      }
    })

    await nextTick()
    expect(wrapper.vm.isMobile).toBe(false)
  })

  it('detects mobile when width below breakpoint', async () => {
    window.innerWidth = 500

    const wrapper = mount({
      template: '<div>{{ isMobile }}</div>',
      setup() {
        const isMobile = useIsMobile()
        return { isMobile }
      }
    })

    await nextTick()
    expect(wrapper.vm.isMobile).toBe(true)
  })

  it('uses custom breakpoint', async () => {
    window.innerWidth = 1000

    const wrapper = mount({
      template: '<div>{{ isMobile }}</div>',
      setup() {
        const isMobile = useIsMobile(1200)
        return { isMobile }
      }
    })

    await nextTick()
    expect(wrapper.vm.isMobile).toBe(true)
  })

  it('updates on window resize', async () => {
    window.innerWidth = 1024

    const wrapper = mount({
      template: '<div>{{ isMobile }}</div>',
      setup() {
        const isMobile = useIsMobile()
        return { isMobile }
      }
    })

    await nextTick()
    expect(wrapper.vm.isMobile).toBe(false)

    window.innerWidth = 500
    window.dispatchEvent(new Event('resize'))
    await nextTick()

    expect(wrapper.vm.isMobile).toBe(true)
  })

  it('cleans up resize listener on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const wrapper = mount({
      template: '<div>{{ isMobile }}</div>',
      setup() {
        const isMobile = useIsMobile()
        return { isMobile }
      }
    })

    wrapper.unmount()
    await nextTick()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('handles breakpoint exactly at threshold', async () => {
    window.innerWidth = 768

    const wrapper = mount({
      template: '<div>{{ isMobile }}</div>',
      setup() {
        const isMobile = useIsMobile(768)
        return { isMobile }
      }
    })

    await nextTick()
    expect(wrapper.vm.isMobile).toBe(false)
  })

  it('handles multiple resize events', async () => {
    window.innerWidth = 1024

    const wrapper = mount({
      template: '<div>{{ isMobile }}</div>',
      setup() {
        const isMobile = useIsMobile()
        return { isMobile }
      }
    })

    await nextTick()
    expect(wrapper.vm.isMobile).toBe(false)

    // Resize to mobile
    window.innerWidth = 400
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.vm.isMobile).toBe(true)

    // Resize back to desktop
    window.innerWidth = 1200
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.vm.isMobile).toBe(false)
  })
})

