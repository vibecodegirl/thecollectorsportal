
import React, { useState } from 'react';
import { useConversation } from '@11labs/react';
import { MessageCircle, Mic, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Define the correct types based on the ElevenLabs API
type Role = 'user' | 'agent';

const VoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ content: string; sender: 'user' | 'assistant' }>>([]);
  const [isListening, setIsListening] = useState(false);
  
  const conversation = useConversation({
    onMessage: (message) => {
      // Use type assertion to handle the message source correctly
      if (message.source === 'agent') {
        setMessages(prev => [...prev, { content: message.message, sender: 'assistant' }]);
      } else if (message.source === 'user') {
        setMessages(prev => [...prev, { content: message.message, sender: 'user' }]);
      }
    },
    onConnect: () => {
      console.log('Connected to ElevenLabs voice assistant');
    },
    onDisconnect: () => {
      setIsListening(false);
      console.log('Disconnected from ElevenLabs voice assistant');
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
    }
  });

  const handleStartConversation = async () => {
    try {
      setIsListening(true);
      await conversation.startSession({
        agentId: "NQ2iXuzoNSw9fcWM4PCc"
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setIsListening(false);
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
      setIsListening(false);
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && isListening) {
      handleEndConversation();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <button 
            className="relative group flex items-center justify-center p-4 bg-collector-navy rounded-full shadow-lg border-2 border-collector-gold hover:border-collector-cyan transition-all duration-300 animate-pulse-glow"
            aria-label="Open voice assistant"
          >
            <div className="absolute inset-0 bg-collector-gold rounded-full opacity-20 group-hover:opacity-30 animate-pulse-subtle"></div>
            <div className="relative z-10">
              <MessageCircle className="h-6 w-6 text-collector-gold group-hover:text-collector-cyan transition-colors duration-300" />
            </div>
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-collector-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-collector-cyan"></span>
            </span>
          </button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md bg-gray-900 border-gray-700 text-white overflow-hidden">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <span className="time-warp-text">Time Warp Assistant</span>
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-full mt-6">
            <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-300">Start a conversation with our collection assistant!</p>
                  <p className="text-sm text-gray-400 mt-2">Ask about collectibles, valuation tips, or how to organize your collection.</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg max-w-[85%] ${
                      msg.sender === 'assistant' 
                        ? 'bg-collector-navy border border-collector-gold/30 ml-auto text-right' 
                        : 'bg-gray-800 border border-gray-700 mr-auto'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>
            
            <div className="border-t border-gray-800 pt-4">
              <div className="flex justify-center">
                {isListening ? (
                  <Button 
                    onClick={handleEndConversation}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2"
                  >
                    <X className="h-5 w-5" />
                    Stop Listening
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStartConversation}
                    className="bg-collector-cyan hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse-subtle"
                  >
                    <Mic className="h-5 w-5" />
                    Start Talking
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                {isListening ? "I'm listening... Speak now!" : "Click to start voice conversation"}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default VoiceAssistant;
