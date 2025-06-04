import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import type { Card } from '@/types/card'

interface GenerationCallbacks {
    onCardGenerated: (card: Card) => void
    onComplete: () => void
    onError: (error: string) => void
}

type SocketEventListener = (...args: any[]) => void

class AISocketService {
    private socket: Socket | null = null
    private isConnected = false
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectDelay = 1000 // Start with 1 second
    private activeGenerationId: string | null = null
    private eventListeners: Map<string, Set<SocketEventListener>> = new Map()
    private currentTitle: string | null = null
    private currentDescription: string | null = null

    constructor() {
        this.initialize()
    }

    private initialize() {
        const auth = useAuthStore()
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

        // Ensure we have a JWT before connecting
        if (!auth.jwt) {
            console.error('No JWT available')
            return
        }

        console.log('Initializing socket connection to:', baseUrl, 'with JWT:', auth.jwt.substring(0, 10) + '...')

        try {
            this.socket = io(baseUrl, {
                auth: {
                    token: auth.jwt
                },
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
                timeout: 10000, // 10 second connection timeout
                transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
                path: '/socket.io/', // Explicitly set socket.io path
                withCredentials: true // Enable credentials
            })

            // Add beforeunload handler
            window.addEventListener('beforeunload', this.handleBeforeUnload)

            this.setupEventListeners()
        } catch (error) {
            console.error('Failed to initialize socket:', error)
        }
    }

    private setupEventListeners() {
        if (!this.socket) {
            console.error('Socket is null, cannot setup event listeners')
            return
        }

        this.socket.on('connect', () => {
            console.log('Socket connected successfully, socket id:', this.socket?.id)
            this.isConnected = true
            this.reconnectAttempts = 0
            
            // If we have an active generation, restart it
            if (this.activeGenerationId) {
                console.log('Restarting active generation after reconnection')
                this.socket?.emit('startGeneration', {
                    title: this.currentTitle,
                    description: this.currentDescription
                })
            }
        })

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason, 'socket id:', this.socket?.id)
            this.isConnected = false
            
            // If the disconnection was not initiated by the client
            if (reason !== 'io client disconnect') {
                console.log('Attempting to reconnect...')
                this.handleReconnection()
            }
        })

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message, 'socket id:', this.socket?.id)
            this.reconnectAttempts++
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached')
                this.cleanup()
            }
        })

        this.socket.on('error', (error) => {
            console.error('Socket error:', error, 'socket id:', this.socket?.id)
            if (this.activeGenerationId) {
                this.cleanupListeners()
            }
        })
    }

    private handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
            setTimeout(() => {
                if (this.socket) {
                    this.socket.connect()
                }
            }, delay)
        }
    }

    public startGeneration(title: string, description: string, callbacks: GenerationCallbacks): string | null {
        console.log('Starting generation with socket state:', {
            isConnected: this.isConnected,
            socketId: this.socket?.id,
            hasSocket: !!this.socket
        })

        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected, attempting to reconnect...')
            this.initialize()
            callbacks.onError('Socket not connected, attempting to reconnect...')
            return null
        }

        const auth = useAuthStore()
        if (!auth.user?.id) {
            console.error('User not authenticated')
            callbacks.onError('User not authenticated')
            return null
        }

        // Store current generation details for reconnection
        this.currentTitle = title
        this.currentDescription = description

        const generationId = `${auth.user.id}-${Date.now()}`
        this.activeGenerationId = generationId

        console.log('Setting up generation with ID:', generationId)

        // Set up event listeners
        this.addListener('cardGenerated', (data: { generationId: string, card: any }) => {
            if (data.generationId === generationId) {
                console.log('Socket received raw card data:', data.card)
                // Ensure proper card structure
                const card: Card = {
                    id: Date.now(),
                    setId: 0,
                    front: {
                        text: data.card.front.text || '',
                        imageUrl: data.card.front.imageUrl || null
                    },
                    back: {
                        text: data.card.back.text || '',
                        imageUrl: data.card.back.imageUrl || null
                    },
                    hint: data.card.hint || null
                }
                console.log('Socket transformed card:', {
                    id: card.id,
                    front: { text: card.front.text, imageUrl: card.front.imageUrl },
                    back: { text: card.back.text, imageUrl: card.back.imageUrl },
                    hint: card.hint
                })
                callbacks.onCardGenerated(card)
            }
        })

        this.addListener('generationComplete', (data: { generationId: string }) => {
            if (data.generationId === generationId) {
                console.log('Generation complete for ID:', generationId)
                callbacks.onComplete()
                this.cleanupListeners()
                // Clear current generation details
                this.currentTitle = null
                this.currentDescription = null
            }
        })

        this.addListener('generationError', (data: { generationId: string, error: string }) => {
            if (data.generationId === generationId) {
                console.error('Generation error for ID:', generationId, 'Error:', data.error)
                callbacks.onError(data.error)
                this.cleanupListeners()
                // Clear current generation details
                this.currentTitle = null
                this.currentDescription = null
            }
        })

        // Start generation
        console.log('Emitting startGeneration event with:', { title, description })
        this.socket.emit('startGeneration', {
            title,
            description
        })

        return generationId
    }

    private addListener(event: string, callback: SocketEventListener) {
        if (!this.socket) return

        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set())
        }
        this.eventListeners.get(event)?.add(callback)
        this.socket.on(event, callback)
    }

    private cleanupListeners() {
        if (!this.socket) return

        this.eventListeners.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                this.socket?.off(event, callback)
            })
        })
        this.eventListeners.clear()
        this.activeGenerationId = null
    }

    public disconnect() {
        // Remove beforeunload handler
        window.removeEventListener('beforeunload', this.handleBeforeUnload)
        
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
            this.isConnected = false
            this.eventListeners.clear()
            this.activeGenerationId = null
        }
    }

    private handleBeforeUnload = () => {
        if (this.socket) {
            this.socket.disconnect()
        }
    }

    private cleanup() {
        this.disconnect()
        this.reconnectAttempts = 0
    }
}

export const aiSocketService = new AISocketService() 