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
        const isDev = import.meta.env.DEV

        // Ensure we have a JWT before connecting
        if (!auth.jwt) {
            console.error('No JWT available')
            return
        }

        console.log('Initializing socket connection:', {
            baseUrl,
            isDev,
            hasJwt: !!auth.jwt
        })

        try {
            this.socket = io(baseUrl, {
                auth: {
                    token: auth.jwt
                },
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
                timeout: 20000, // Increased timeout to 20 seconds
                transports: ['websocket', 'polling'],
                path: '/socket.io/',
                withCredentials: true,
                forceNew: true,
                autoConnect: true
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
            hasSocket: !!this.socket,
            transport: this.socket?.io?.engine?.transport?.name
        })

        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected, attempting to reconnect...')
            this.initialize()
            callbacks.onError('Socket not connected, attempting to reconnect...')
            return null
        }

        // Verify socket is actually connected
        if (!this.socket.connected) {
            console.error('Socket reports connected but is not actually connected')
            this.socket.connect()
            callbacks.onError('Socket connection lost, attempting to reconnect...')
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
        this.addListener('cardGenerated', (data: { generationId: string, card: any }, callback: (ack: any) => void) => {
            console.log('Received cardGenerated event:', {
                eventGenerationId: data.generationId,
                currentGenerationId: generationId,
                card: data.card
            })
            
            if (data.generationId === generationId) {
                console.log('Processing card for current generation')
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
                console.log('Emitting transformed card to callbacks')
                callbacks.onCardGenerated(card)
                // Acknowledge receipt of card
                if (callback) {
                    console.log('Acknowledging card receipt')
                    callback({ received: true })
                }
            } else {
                console.log('Ignoring card for different generation')
            }
        })

        this.addListener('generationComplete', (data: { generationId: string }, callback: (ack: any) => void) => {
            console.log('Received generationComplete event:', {
                eventGenerationId: data.generationId,
                currentGenerationId: generationId
            })
            
            if (data.generationId === generationId) {
                console.log('Processing completion for current generation')
                callbacks.onComplete()
                this.cleanupListeners()
                // Clear current generation details
                this.currentTitle = null
                this.currentDescription = null
                // Acknowledge completion
                if (callback) {
                    console.log('Acknowledging completion')
                    callback({ received: true })
                }
            } else {
                console.log('Ignoring completion for different generation')
            }
        })

        this.addListener('generationError', (data: { generationId: string, error: string }, callback: (ack: any) => void) => {
            console.log('Received generationError event:', {
                eventGenerationId: data.generationId,
                currentGenerationId: generationId,
                error: data.error
            })
            
            if (data.generationId === generationId) {
                console.log('Processing error for current generation')
                callbacks.onError(data.error)
                this.cleanupListeners()
                // Clear current generation details
                this.currentTitle = null
                this.currentDescription = null
                // Acknowledge error
                if (callback) {
                    console.log('Acknowledging error')
                    callback({ received: true })
                }
            } else {
                console.log('Ignoring error for different generation')
            }
        })

        // Start generation
        console.log('Emitting startGeneration event with:', { 
            title, 
            description,
            generationId 
        })
        this.socket.emit('startGeneration', {
            title,
            description,
            generationId
        }, (error: any) => {
            if (error) {
                console.error('Error from startGeneration callback:', error)
                callbacks.onError(error.message || 'Failed to start generation')
                this.cleanupListeners()
            } else {
                console.log('StartGeneration acknowledged by server')
            }
        })

        return generationId
    }

    private addListener(event: string, callback: SocketEventListener) {
        if (!this.socket) {
            console.error('Cannot add listener: socket is null')
            return
        }

        console.log(`Adding listener for event: ${event}`)
        
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set())
        }
        this.eventListeners.get(event)?.add(callback)
        
        // Remove any existing listeners for this event to prevent duplicates
        this.socket.off(event)
        
        // Add the new listener
        this.socket.on(event, callback)
        console.log(`Listener added for event: ${event}`)
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