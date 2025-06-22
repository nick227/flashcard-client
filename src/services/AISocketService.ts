import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import type { Card, CardLayout } from '@/types/card'
import { createCellsFromContent } from '@/utils/cellUtils'

interface GenerationCallbacks {
    onCardGenerated: (card: Card) => void
    onComplete: () => void
    onError: (error: string) => void
}

type SocketEventListener = (...args: any[]) => void

interface GenerationProgress {
    status: 'preparing' | 'generating' | 'completed' | 'failed'
    cardsGenerated: number
    totalCards: number
    currentOperation?: string
    error?: string
}

// Helper function to transform old card structure to new cell-based structure
function transformCardToCellStructure(oldCard: any): Card {
    return {
        id: oldCard.id || Date.now() + Math.random(),
        title: oldCard.title || '',
        description: oldCard.description || '',
        front: {
            cells: createCellsFromContent(oldCard.front?.text || '', oldCard.front?.imageUrl || null, oldCard.front?.layout),
            layout: (oldCard.front?.layout || 'default') as CardLayout
        },
        back: {
            cells: createCellsFromContent(oldCard.back?.text || '', oldCard.back?.imageUrl || null, oldCard.back?.layout),
            layout: (oldCard.back?.layout || 'default') as CardLayout
        },
        hint: oldCard.hint || undefined,
        createdAt: oldCard.createdAt || new Date(),
        updatedAt: oldCard.updatedAt || new Date(),
        reviewCount: oldCard.reviewCount || 0,
        difficulty: oldCard.difficulty || 0,
        isArchived: oldCard.isArchived || false,
        isPublic: oldCard.isPublic || false,
        userId: oldCard.userId || '',
        deckId: oldCard.deckId || ''
    }
}

class AISocketService {
    private socket: Socket | null = null
    private isConnected = false
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectDelay = 1000 // Start with 1 second
    private activeGenerationId: string | null = null
    private disconnectListeners: Set<() => void> = new Set()
    private currentTitle: string | null = null
    private currentDescription: string | null = null
    private currentCategory: string | null = null
    private onStatusChange: ((status: string) => void) | null = null
    private onProgressUpdate: ((progress: GenerationProgress) => void) | null = null

    constructor() {
        // Remove automatic initialization
    }

    public get connected(): boolean {
        return this.isConnected && this.socket?.connected === true
    }

    public setStatusCallback(callback: (status: string) => void) {
        this.onStatusChange = callback
    }

    public setProgressCallback(callback: (progress: GenerationProgress) => void) {
        this.onProgressUpdate = callback
    }

    private updateStatus(status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting', message?: string) {
        if (this.onStatusChange) {
            this.onStatusChange(message || status)
        }
    }

    private updateProgress(progress: Partial<GenerationProgress>) {
        if (this.onProgressUpdate) {
            const currentProgress = {
                status: progress.status || 'generating',
                cardsGenerated: progress.cardsGenerated || 0,
                totalCards: progress.totalCards || 10,
                currentOperation: progress.currentOperation,
                error: progress.error
            }
            this.onProgressUpdate(currentProgress)
        }
    }

    public initialize() {
        // If socket already exists and is connected, don't reinitialize
        if (this.socket?.connected) {
            console.log('Socket already connected, skipping initialization')
            return
        }

        const auth = useAuthStore()
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const isDev = import.meta.env.DEV

        // Ensure we have a JWT before connecting
        if (!auth.jwt) {
            console.error('No JWT available')
            this.updateStatus('disconnected', 'Authentication required')
            return
        }

        // Update auth checks to use isAuthenticated
        if (!auth.isAuthenticated) {
            console.warn('Socket connection attempted without auth')
            return
        }

        console.log('Initializing socket connection:', {
            baseUrl,
            isDev,
            hasJwt: !!auth.jwt,
            existingSocket: !!this.socket
        })

        this.updateStatus('connecting', 'Connecting to AI service...')

        try {
            // If socket exists but is disconnected, reconnect it
            if (this.socket) {
                console.log('Reconnecting existing socket')
                this.socket.connect()
                return
            }

            // Create new socket connection
            this.socket = io(baseUrl, {
                auth: {
                    token: auth.jwt
                },
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
                timeout: 30000,
                transports: ['websocket', 'polling'],
                path: '/socket.io/',
                withCredentials: true,
                forceNew: false,
                autoConnect: true,
                multiplex: true
            })

            this.setupEventListeners()
        } catch (error) {
            console.error('Failed to initialize socket:', error)
            this.updateStatus('disconnected', 'Failed to connect to AI service')
            throw error
        }
    }

    private setupEventListeners() {
        if (!this.socket) {
            console.error('Socket is null, cannot setup event listeners')
            return
        }

        // Remove any existing listeners to prevent duplicates
        this.socket.removeAllListeners()

        this.socket.on('connect', () => {
            console.log('Socket connected successfully, socket id:', this.socket?.id)
            this.isConnected = true
            this.reconnectAttempts = 0
            this.updateStatus('connected', 'Connected to AI service')
            
            // If we have an active generation, restart it
            if (this.activeGenerationId) {
                console.log('Restarting active generation after reconnection')
                this.updateStatus('connected', 'Reconnecting to previous generation...')
                this.socket?.emit('startGeneration', {
                    title: this.currentTitle,
                    description: this.currentDescription,
                    generationId: this.activeGenerationId,
                    category: this.currentCategory
                })
            }
        })

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason, 'socket id:', this.socket?.id)
            this.isConnected = false
            
            // Notify all disconnect listeners
            this.disconnectListeners.forEach(callback => callback())
            
            // If the disconnection was not initiated by the client and not due to server disconnect
            if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
                console.log('Attempting to reconnect...')
                this.updateStatus('reconnecting', 'Connection lost, attempting to reconnect...')
                this.handleReconnection()
            } else {
                this.updateStatus('disconnected', 'Disconnected from AI service')
                // Don't try to reconnect if server disconnected us
                if (reason === 'io server disconnect') {
                    this.cleanup()
                }
            }
        })

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message, 'socket id:', this.socket?.id)
            this.reconnectAttempts++
            this.updateStatus('reconnecting', `Connection error: ${error.message}. Attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`)
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached')
                this.updateStatus('disconnected', 'Failed to connect after multiple attempts')
                this.cleanup()
            }
        })

        this.socket.on('error', (error) => {
            console.error('Socket error:', error, 'socket id:', this.socket?.id)
            this.updateStatus('disconnected', `Connection error: ${error}`)
            if (this.activeGenerationId) {
                this.cleanupListeners()
            }
        })
    }

    private handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
            this.updateStatus('reconnecting', `Reconnecting in ${delay/1000} seconds...`)
            setTimeout(() => {
                if (this.socket && !this.socket.connected) {
                    this.socket.connect()
                }
            }, delay)
        }
    }

    private handleError(error: any, context: string): string {
        const errorMessage = this.formatErrorMessage(error, context)
        console.error(`Socket ${context} error:`, errorMessage)
        this.updateStatus('disconnected', errorMessage)
        return errorMessage
    }

    private formatErrorMessage(error: any, context: string): string {
        if (typeof error === 'string') return error
        if (error.message) return `${context}: ${error.message}`
        return `An unexpected error occurred during ${context}`
    }

    public startGeneration(title: string, description: string, category: string, callbacks: GenerationCallbacks): string | null {
        // Initialize socket if not already connected
        if (!this.validateConnection()) {
            this.initialize()
            if (!this.validateConnection()) {
                const error = this.handleError('Connection not available', 'connection')
                callbacks.onError(error)
                return null
            }
        }

        const auth = useAuthStore()
        if (!auth.user?.id) {
            const error = this.handleError('User not authenticated', 'auth')
            callbacks.onError(error)
            return null
        }

        // Store current generation details for reconnection
        this.currentTitle = title
        this.currentDescription = description
        this.currentCategory = category

        const generationId = `${auth.user.id}-${Date.now()}`
        this.activeGenerationId = generationId

        // Update progress to preparing
        this.updateProgress({
            status: 'preparing',
            currentOperation: 'Initializing generation...'
        })

        // Set up event listeners
        this.setupGenerationListeners(generationId, callbacks)

        // Start generation
        this.socket?.emit('startGeneration', {
            title,
            description,
            category,
            generationId
        }, (error: any) => {
            if (error) {
                console.error('Error from startGeneration callback:', error)
                const errorMessage = typeof error === 'string' ? error : error.message || 'Failed to start generation'
                callbacks.onError(errorMessage)
                this.cleanupListeners()
            }
        })

        return generationId
    }

    private validateConnection(): boolean {
        if (!this.socket) {
            console.log('Socket not initialized, attempting to initialize...')
            this.initialize()
            // Return false to indicate we need to wait for connection
            return false
        }

        if (!this.isConnected || !this.socket.connected) {
            console.log('Socket not connected, attempting to connect...')
            this.socket.connect()
            // Return false to indicate we need to wait for connection
            return false
        }

        const auth = useAuthStore()
        if (!auth.jwt) {
            console.error('No JWT available')
            this.updateStatus('disconnected', 'Authentication required')
            return false
        }

        return true
    }

    /**
     * Wait for socket connection with timeout
     */
    private async waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
        const startTime = Date.now()
        
        while (Date.now() - startTime < timeoutMs) {
            if (this.isConnected && this.socket?.connected) {
                return true
            }
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        return false
    }

    private setupGenerationListeners(generationId: string, callbacks: GenerationCallbacks) {
        this.addListener('generationProgress', (data: { generationId: string, message: string, progress: number, totalCards: number }) => {
            if (data.generationId === generationId) {
                this.updateProgress({
                    status: 'generating',
                    currentOperation: data.message,
                    cardsGenerated: Math.round((data.progress / 100) * data.totalCards),
                    totalCards: data.totalCards
                })
            }
        })

        this.addListener('cardGenerated', (data: { generationId: string, card: any, progress: number, totalCards: number }) => {
            if (data.generationId === generationId) {
                console.log('Received card data:', data.card)
                const card: Card = transformCardToCellStructure(data.card)
                console.log('Transformed card to cell structure:', {
                    frontCells: card.front.cells?.length || 0,
                    backCells: card.back.cells?.length || 0,
                    frontText: card.front.cells?.find(c => c.type === 'text')?.content || 'none',
                    frontMedia: card.front.cells?.find(c => c.type === 'media')?.mediaUrl || 'none',
                    backText: card.back.cells?.find(c => c.type === 'text')?.content || 'none',
                    backMedia: card.back.cells?.find(c => c.type === 'media')?.mediaUrl || 'none'
                })
                
                this.updateProgress({
                    status: 'generating',
                    cardsGenerated: Math.round((data.progress / 100) * data.totalCards),
                    totalCards: data.totalCards
                })
                
                callbacks.onCardGenerated(card)
            }
        })

        this.addListener('generationComplete', (data: { generationId: string, totalCards: number }) => {
            if (data.generationId === generationId) {
                this.updateProgress({
                    status: 'completed',
                    currentOperation: 'Generation complete!',
                    cardsGenerated: data.totalCards,
                    totalCards: data.totalCards
                })
                callbacks.onComplete()
                this.cleanupListeners()
            }
        })

        this.addListener('generationError', (data: { generationId: string, error: string }) => {
            if (data.generationId === generationId) {
                // Check if this is a cancellation (not a real error)
                const isCancellation = data.error.includes('cancelled') || data.error.includes('Cancelled')
                
                this.updateProgress({
                    status: 'failed', // Keep as failed for UI consistency
                    error: data.error
                })
                
                if (isCancellation) {
                    console.log(`Generation ${generationId} was cancelled`)
                    // Don't call onError for cancellations, just cleanup
                    this.cleanupListeners()
                } else {
                    callbacks.onError(data.error)
                    this.cleanupListeners()
                }
            }
        })
    }

    private addListener(event: string, callback: SocketEventListener) {
        if (!this.socket) {
            console.error('Cannot add listener: socket is null')
            return
        }

        console.log(`Adding listener for event: ${event}`)
        
        // Remove any existing listeners for this event to prevent duplicates
        this.socket.off(event)
        
        // Add the new listener
        this.socket.on(event, callback)
        console.log(`Listener added for event: ${event}`)
    }

    private cleanupListeners() {
        if (!this.socket) return

        // Remove all generation-related event listeners
        this.socket.off('generationProgress')
        this.socket.off('cardGenerated')
        this.socket.off('generationComplete')
        this.socket.off('generationError')
        
        this.activeGenerationId = null
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
            this.isConnected = false
            this.activeGenerationId = null
        }
    }

    private cleanup() {
        this.disconnect()
        this.reconnectAttempts = 0
    }

    /**
     * Generate a single card face (front or back) using AI
     * @param side - 'front' or 'back'
     * @param title - The set title
     * @param description - The set description
     * @param category - The set category
     * @param otherSideContent - The content of the other side (for context)
     * @param callbacks - { onResult, onError }
     */
    public async generateSingleCardFace(
        side: 'front' | 'back',
        title: string,
        description: string,
        category: string,
        otherSideContent: string,
        callbacks: { onResult: (text: string) => void, onError: (err: string) => void }
    ) {
        console.log('[AISocketService] generateSingleCardFace called:', { side, title, description, category, hasOtherSideContent: !!otherSideContent })
        
        // First validate connection
        if (!this.validateConnection()) {
            console.log('[AISocketService] Connection validation failed, waiting for connection...')
            
            // Wait for connection to establish
            const connected = await this.waitForConnection(15000) // 15 second timeout
            
            if (!connected) {
                console.error('[AISocketService] Failed to establish connection within timeout')
                callbacks.onError('Could not connect to AI service');
                return;
            }
        }
        
        // Double-check socket exists
        if (!this.socket) {
            console.error('[AISocketService] Socket is null after connection')
            callbacks.onError('Connection failed');
            return;
        }
        
        console.log('[AISocketService] Emitting generateSingleCardFace event')
        
        // Add timeout for socket response
        const responseTimeout = setTimeout(() => {
            console.error('[AISocketService] Socket response timeout')
            callbacks.onError('Request timed out - no response from server');
        }, 30000); // 30 second timeout
        
        this.socket.emit(
            'generateSingleCardFace',
            { side, title, description, category, otherSideContent },
            (response: { text?: string, error?: string }) => {
                clearTimeout(responseTimeout); // Clear timeout on response
                console.log('[AISocketService] Received response:', response)
                if (response.error) {
                    console.error('[AISocketService] Server returned error:', response.error)
                    callbacks.onError(response.error);
                } else if (response.text) {
                    console.log('[AISocketService] Server returned text:', response.text)
                    callbacks.onResult(response.text);
                } else {
                    console.error('[AISocketService] Invalid response format:', response)
                    callbacks.onError('Invalid response from server');
                }
            }
        );
    }

    // Add disconnect event handling methods
    public onDisconnect(callback: () => void) {
        this.disconnectListeners.add(callback)
    }

    public offDisconnect(callback: () => void) {
        this.disconnectListeners.delete(callback)
    }
}

export const aiSocketService = new AISocketService() 