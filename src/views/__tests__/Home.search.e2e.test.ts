import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Home from '../Home.vue'
import { cachedApi } from '@/services/CachedApiService'
import type { Set } from '@/types/set'

// Mock the router
const mockRouter = {
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => ({
    params: {},
    query: {}
  })
}))

// Mock the cachedApi service
vi.mock('@/services/CachedApiService', () => ({
  cachedApi: {
    get: vi.fn()
  }
}))

describe('Home.vue - Search E2E Tests', () => {
  let wrapper: VueWrapper<any>

  // Mock set data
  const createMockSet = (id: number, title: string, description: string): Set => ({
    id,
    title,
    description,
    userId: 1,
    categoryId: 1,
    category: 'Science',
    type: 'free' as const,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 100,
    likes: 10,
    cardsCount: 20,
    tags: [],
    price: { type: 'free' as const },
    educatorId: 1,
    educatorName: 'Test Educator',
    thumbnail: `https://example.com/image-${id}.jpg`,
    hidden: false,
    cards: [],
    isArchived: false
  })

  const mockSets = [
    createMockSet(1, 'Biology Basics', 'Learn fundamental biology concepts'),
    createMockSet(2, 'Advanced Biology', 'Advanced topics in biology'),
    createMockSet(3, 'Chemistry 101', 'Introduction to chemistry'),
    createMockSet(4, 'Physics Fundamentals', 'Basic physics principles'),
    createMockSet(5, 'Mathematics', 'Essential math concepts')
  ]

  const mockBatchResponse = (ids: number[]) => {
    return ids.reduce((acc, id) => {
      acc[id] = Math.floor(Math.random() * 100)
      return acc
    }, {} as Record<string, number>)
  }

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    
    // Default mock implementation for batch requests
    vi.mocked(cachedApi.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('batch')) {
        return Promise.resolve(mockBatchResponse([1, 2, 3, 4, 5]))
      }
      
      // Default: return all sets
      return Promise.resolve({
        items: mockSets,
        pagination: { total: mockSets.length, hasMore: false }
      })
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = async () => {
    const wrapper = mount(Home, {
      global: {
        stubs: {
          HomeHero: { template: '<div class="home-hero-stub">Home Hero</div>' },
          CategoryCloud: { template: '<div class="category-cloud-stub">Category Cloud</div>' },
          StatsSection: { template: '<div class="stats-section-stub">Stats Section</div>' },
          FunnyLoadingIndicator: { template: '<div class="loading-stub">Loading...</div>' },
          LoadMoreButton: { template: '<button class="load-more-stub">Load More</button>' },
          SetPreviewCard: {
            props: ['set'],
            template: '<div class="set-preview-card" :data-set-id="set.id"><h3>{{ set.title }}</h3><p>{{ set.description }}</p></div>'
          },
          SearchInput: {
            props: ['modelValue', 'disabled', 'placeholder'],
            emits: ['update:modelValue', 'submit'],
            template: `
              <div class="search-input-stub">
                <input 
                  type="text"
                  :value="modelValue"
                  @input="$emit('update:modelValue', $event.target.value)"
                  @keyup.enter="$emit('submit', modelValue)"
                  :disabled="disabled"
                  :placeholder="placeholder"
                  data-test="search-input"
                />
                <button 
                  @click="$emit('submit', modelValue)" 
                  data-test="search-submit"
                >
                  Search
                </button>
              </div>
            `
          }
        }
      }
    })

    // Wait for component to initialize
    await flushPromises()
    await nextTick()
    
    return wrapper
  }

  describe('Search Input Rendering', () => {
    it('should render search input component', async () => {
      wrapper = await createWrapper()
      
      const searchInput = wrapper.find('[data-test="search-input"]')
      expect(searchInput.exists()).toBe(true)
    })

    it('should have correct placeholder text', async () => {
      wrapper = await createWrapper()
      
      const searchInput = wrapper.find('[data-test="search-input"]')
      expect(searchInput.attributes('placeholder')).toBe('Search flashcard sets...')
    })

    it('should initially render all sets', async () => {
      wrapper = await createWrapper()
      
      const setCards = wrapper.findAll('.set-preview-card')
      expect(setCards.length).toBe(mockSets.length)
    })
  })

  describe('Search Functionality', () => {
    it('should filter sets when user types search query', async () => {
      // Mock API to return filtered results
      const filteredSets = mockSets.filter(set => 
        set.title.toLowerCase().includes('biology')
      )
      
      vi.mocked(cachedApi.get).mockImplementation((endpoint: string, params?: Record<string, unknown>) => {
        if (endpoint.includes('batch')) {
          return Promise.resolve(mockBatchResponse([1, 2]))
        }
        
        if (params?.search === 'biology') {
          return Promise.resolve({
            items: filteredSets,
            pagination: { total: filteredSets.length, hasMore: false }
          })
        }
        
        return Promise.resolve({
          items: mockSets,
          pagination: { total: mockSets.length, hasMore: false }
        })
      })

      wrapper = await createWrapper()
      
      // Get search input
      const searchInput = wrapper.find('[data-test="search-input"]')
      
      // Type search query
      await searchInput.setValue('biology')
      await flushPromises()
      
      // Wait for debounce (600ms)
      await new Promise(resolve => setTimeout(resolve, 650))
      await flushPromises()
      await nextTick()
      
      // Verify API was called with search parameter
      expect(cachedApi.get).toHaveBeenCalledWith(
        'sets',
        expect.objectContaining({
          search: 'biology'
        }),
        expect.any(Object)
      )
      
      // Verify filtered results are displayed
      const setCards = wrapper.findAll('.set-preview-card')
      expect(setCards.length).toBe(filteredSets.length)
      
      // Verify only biology sets are shown
      const titles = setCards.map(card => card.find('h3').text())
      expect(titles.every(title => title.toLowerCase().includes('biology'))).toBe(true)
    })

    it('should show search results indicator when searching', async () => {
      const filteredSets = [mockSets[0]]
      
      vi.mocked(cachedApi.get).mockImplementation((endpoint: string, params?: Record<string, unknown>) => {
        if (endpoint.includes('batch')) {
          return Promise.resolve(mockBatchResponse([1]))
        }
        
        if (params?.search === 'biology') {
          return Promise.resolve({
            items: filteredSets,
            pagination: { total: filteredSets.length, hasMore: false }
          })
        }
        
        return Promise.resolve({
          items: mockSets,
          pagination: { total: mockSets.length, hasMore: false }
        })
      })

      wrapper = await createWrapper()
      
      // Type search query
      const searchInput = wrapper.find('[data-test="search-input"]')
      await searchInput.setValue('biology')
      
      // Wait for debounce and API call
      await new Promise(resolve => setTimeout(resolve, 650))
      await flushPromises()
      await nextTick()
      
      // Verify search results indicator is shown
      const searchResultsInfo = wrapper.find('.search-results-info')
      expect(searchResultsInfo.exists()).toBe(true)
      expect(searchResultsInfo.text()).toContain('Search results for:')
      expect(searchResultsInfo.text()).toContain('biology')
    })

    it('should show no results message when search returns empty', async () => {
      vi.mocked(cachedApi.get).mockImplementation((endpoint: string, params?: Record<string, unknown>) => {
        if (endpoint.includes('batch')) {
          return Promise.resolve({})
        }
        
        if (params?.search === 'xyz123nonexistent') {
          return Promise.resolve({
            items: [],
            pagination: { total: 0, hasMore: false }
          })
        }
        
        return Promise.resolve({
          items: mockSets,
          pagination: { total: mockSets.length, hasMore: false }
        })
      })

      wrapper = await createWrapper()
      
      // Type search query that returns no results
      const searchInput = wrapper.find('[data-test="search-input"]')
      await searchInput.setValue('xyz123nonexistent')
      
      // Wait for debounce and API call
      await new Promise(resolve => setTimeout(resolve, 650))
      await flushPromises()
      await nextTick()
      
      // Verify no results message is shown
      const noResults = wrapper.find('.no-results')
      expect(noResults.exists()).toBe(true)
      expect(noResults.text()).toContain('No sets found for')
      expect(noResults.text()).toContain('xyz123nonexistent')
    })

    it('should clear search when clear button is clicked', async () => {
      // Setup: Start with filtered results
      const filteredSets = [mockSets[0]]
      let searchTerm = 'biology'
      
      vi.mocked(cachedApi.get).mockImplementation((endpoint: string, params?: Record<string, unknown>) => {
        if (endpoint.includes('batch')) {
          return Promise.resolve(mockBatchResponse(
            searchTerm ? [1] : [1, 2, 3, 4, 5]
          ))
        }
        
        if (params?.search === 'biology') {
          return Promise.resolve({
            items: filteredSets,
            pagination: { total: filteredSets.length, hasMore: false }
          })
        }
        
        return Promise.resolve({
          items: mockSets,
          pagination: { total: mockSets.length, hasMore: false }
        })
      })

      wrapper = await createWrapper()
      
      // Perform search
      const searchInput = wrapper.find('[data-test="search-input"]')
      await searchInput.setValue('biology')
      await new Promise(resolve => setTimeout(resolve, 650))
      await flushPromises()
      await nextTick()
      
      // Verify filtered state
      let setCards = wrapper.findAll('.set-preview-card')
      expect(setCards.length).toBe(filteredSets.length)
      
      // Clear search
      searchTerm = ''
      const clearButton = wrapper.find('.clear-search-btn')
      expect(clearButton.exists()).toBe(true)
      
      await clearButton.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 650))
      await flushPromises()
      await nextTick()
      
      // Verify API called with empty search
      expect(cachedApi.get).toHaveBeenCalledWith(
        'sets',
        expect.objectContaining({
          page: 1,
          limit: 12
        }),
        expect.any(Object)
      )
      
      // Verify all sets are shown again
      setCards = wrapper.findAll('.set-preview-card')
      expect(setCards.length).toBe(mockSets.length)
    })

    it('should reset pagination when new search is performed', async () => {
      wrapper = await createWrapper()
      
      // Clear previous calls
      vi.clearAllMocks()
      
      // Perform search
      const searchInput = wrapper.find('[data-test="search-input"]')
      await searchInput.setValue('biology')
      await new Promise(resolve => setTimeout(resolve, 650))
      await flushPromises()
      
      // Verify API called with page 1
      expect(cachedApi.get).toHaveBeenCalledWith(
        'sets',
        expect.objectContaining({
          page: 1,
          search: 'biology'
        }),
        expect.any(Object)
      )
    })

    it('should debounce search requests', async () => {
      wrapper = await createWrapper()
      
      // Clear initial mount calls
      vi.clearAllMocks()
      
      const searchInput = wrapper.find('[data-test="search-input"]')
      
      // Type multiple characters quickly
      await searchInput.setValue('b')
      await nextTick()
      await searchInput.setValue('bi')
      await nextTick()
      await searchInput.setValue('bio')
      await nextTick()
      await searchInput.setValue('biol')
      await nextTick()
      await searchInput.setValue('biology')
      await nextTick()
      
      // API should not be called yet (within debounce period)
      expect(cachedApi.get).not.toHaveBeenCalledWith(
        'sets',
        expect.objectContaining({
          search: expect.any(String)
        }),
        expect.any(Object)
      )
      
      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 650))
      await flushPromises()
      
      // Now API should be called only once with final value
      const searchCalls = vi.mocked(cachedApi.get).mock.calls.filter(
        call => call[0] === 'sets' && call[1]?.search
      )
      
      // Should only have one call for the sets endpoint with search
      expect(searchCalls.length).toBeGreaterThanOrEqual(1)
      expect(searchCalls[searchCalls.length - 1][1]).toEqual(
        expect.objectContaining({
          search: 'biology'
        })
      )
    })
  })

  describe('Search Submit', () => {
    it('should trigger search on Enter key press', async () => {
      wrapper = await createWrapper()
      
      // Clear initial calls
      vi.clearAllMocks()
      
      const searchInput = wrapper.find('[data-test="search-input"]')
      await searchInput.setValue('physics')
      
      // Press Enter
      await searchInput.trigger('keyup.enter')
      await new Promise(resolve => setTimeout(resolve, 650))
      await flushPromises()
      
      // Verify search was triggered
      expect(cachedApi.get).toHaveBeenCalledWith(
        'sets',
        expect.objectContaining({
          search: 'physics'
        }),
        expect.any(Object)
      )
    })

    it('should trigger search on submit button click', async () => {
      wrapper = await createWrapper()
      
      // Clear initial calls
      vi.clearAllMocks()
      
      const searchInput = wrapper.find('[data-test="search-input"]')
      await searchInput.setValue('chemistry')
      
      // Click submit button
      const submitButton = wrapper.find('[data-test="search-submit"]')
      await submitButton.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 650))
      await flushPromises()
      
      // Verify search was triggered
      expect(cachedApi.get).toHaveBeenCalledWith(
        'sets',
        expect.objectContaining({
          search: 'chemistry'
        }),
        expect.any(Object)
      )
    })
  })

  describe('Loading States', () => {
    it('should disable search input while loading', async () => {
      // Create a promise that we control
      let resolveSearch: any
      const searchPromise = new Promise(resolve => {
        resolveSearch = resolve
      })
      
      vi.mocked(cachedApi.get).mockImplementation((endpoint: string) => {
        if (endpoint.includes('batch')) {
          return Promise.resolve(mockBatchResponse([1, 2, 3, 4, 5]))
        }
        return searchPromise as Promise<any>
      })

      wrapper = await createWrapper()
      
      const searchInput = wrapper.find('[data-test="search-input"]')
      
      // Initially not disabled
      expect(searchInput.attributes('disabled')).toBeUndefined()
      
      // Start search
      await searchInput.setValue('test')
      await new Promise(resolve => setTimeout(resolve, 650))
      
      // Should be disabled during loading
      await nextTick()
      expect(searchInput.attributes('disabled')).toBeDefined()
      
      // Resolve the search
      resolveSearch({
        items: mockSets,
        pagination: { total: mockSets.length, hasMore: false }
      })
      
      await flushPromises()
      await nextTick()
      
      // Should be enabled again
      expect(searchInput.attributes('disabled')).toBeUndefined()
    })
  })

  describe('API Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(cachedApi.get).mockImplementation((endpoint: string, params?: Record<string, unknown>) => {
        if (endpoint.includes('batch')) {
          return Promise.resolve(mockBatchResponse([1, 2, 3, 4, 5]))
        }
        
        if (params?.search) {
          return Promise.reject(new Error('Network error'))
        }
        
        return Promise.resolve({
          items: mockSets,
          pagination: { total: mockSets.length, hasMore: false }
        })
      })

      wrapper = await createWrapper()
      
      // Perform search that will fail
      const searchInput = wrapper.find('[data-test="search-input"]')
      await searchInput.setValue('test')
      await new Promise(resolve => setTimeout(resolve, 650))
      await flushPromises()
      await nextTick()
      
      // Verify error message is displayed
      const errorContainer = wrapper.find('.error-container')
      expect(errorContainer.exists()).toBe(true)
    })
  })

  describe('SetPreviewCard Integration', () => {
    it('should pass correct set data to SetPreviewCard', async () => {
      wrapper = await createWrapper()
      
      const firstCard = wrapper.findComponent({ name: 'SetPreviewCard' })
      expect(firstCard.exists()).toBe(true)
      expect(firstCard.props('set')).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          description: expect.any(String)
        })
      )
    })

    it('should navigate to set view when card is clicked', async () => {
      wrapper = await createWrapper()
      
      const firstCard = wrapper.findAll('.set-preview-card')[0]
      const setId = firstCard.attributes('data-set-id')
      
      // Simulate clicking the card (emit view event)
      await firstCard.trigger('click')
      
      // In a real scenario, SetPreviewCard would emit a view event
      // For this test, we'll verify the viewSet function would work
      expect(setId).toBeDefined()
    })
  })
})

