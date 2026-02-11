import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const ChatBot: React.FC = () => {
    // We'll reuse the AI generation hook but extend it with a custom endpoint call
    // Since useAIGeneration currently handles specific tasks, we'll manually call the API here
    // or add a new method to the hook. For now, let's keep it self-contained or add a new hook method.
    // Given the constraints, I'll add a generic chat capability to the hook in the next step.
    // For this component structure:
    
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I am your AI educational assistant. How can I help you today? I can assist with curriculum questions, lesson planning ideas, or general educational support.',
            timestamp: new Date()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Using the existing AI infrastructure via a new endpoint we'll create
            const res = await fetch('http://localhost:3001/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content })
            });

            if (!res.ok) throw new Error('Failed to get response');

            const data = await res.json();
            
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I encountered an error processing your request. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', height: '100%' }}>
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ 
                    padding: 'var(--space-md)', 
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-sm)',
                    background: 'var(--bg-surface-elevated)'
                }}>
                    <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
                    <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>AI Assistant</h2>
                </div>

                <div className="area-scroll" style={{ flex: 1, padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={{ 
                            display: 'flex', 
                            gap: 'var(--space-md)', 
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                            alignItems: 'flex-start'
                        }}>
                            <div style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="var(--accent-secondary)" />}
                            </div>
                            
                            <div style={{ 
                                maxWidth: '70%',
                                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                                borderTopLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                                fontSize: '14px',
                                lineHeight: '1.5'
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                    <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about curriculum, teaching methods, or subject topics..."
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                borderRadius: '24px',
                                background: 'var(--bg-deep)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={isLoading || !input.trim()}
                            style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, justifyContent: 'center' }}
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
