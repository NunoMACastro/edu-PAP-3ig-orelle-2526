import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Send, Sparkles, Camera, X } from 'lucide-react@0.263.1';
import { Avatar } from './ui/avatar';
import { PhotoAnalysis } from './PhotoAnalysis';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIChat({ open, onOpenChange }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou a consultora virtual Orelle. Como posso ajudá-la hoje? Posso analisar fotografias, recomendar produtos ou dar sugestões personalizadas.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [photoAnalysisOpen, setPhotoAnalysisOpen] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Obrigada pela sua mensagem! Com base nas suas preferências, recomendo o nosso Sérum Iluminador Radiance. Este produto é ideal para pele mista e proporciona hidratação profunda. Gostaria de saber mais?',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    'Analisar foto da minha pele',
    'Produtos para pele seca',
    'Sugestões para evento noturno',
    'Rotina de cuidados diária'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-primary text-[#F5EFE7]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#E7BFBF] rounded-full p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-[#F5EFE7]">Consultora IA Orelle</DialogTitle>
                <DialogDescription className="text-[#E7BFBF]">
                  Assistente pessoal de beleza
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-[#F5EFE7] hover:bg-primary/80"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 bg-[#F5EFE7]">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <div
                      className={`w-full h-full flex items-center justify-center text-xs ${
                        message.sender === 'ai'
                          ? 'bg-primary text-[#F5EFE7]'
                          : 'bg-[#E7BFBF] text-primary'
                      }`}
                    >
                      {message.sender === 'ai' ? <Sparkles className="h-4 w-4" /> : 'V'}
                    </div>
                  </Avatar>
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-[#F5EFE7]'
                        : 'bg-white text-[#1E1E1E]'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {messages.length === 1 && (
            <div className="mt-6 space-y-2">
              <p className="text-sm text-[#D9D9D9] mb-3">Sugestões rápidas:</p>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left border-[#E7BFBF] hover:bg-[#E7BFBF] hover:text-primary"
                  onClick={() => setInputValue(action)}
                >
                  {action}
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0 border-[#E7BFBF] hover:bg-[#E7BFBF]"
              onClick={() => setPhotoAnalysisOpen(true)}
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Descreva o que procura ou envie uma foto..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-[#E7BFBF] focus:border-primary"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="flex-shrink-0 bg-primary hover:bg-primary/90 text-[#F5EFE7]"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Photo Analysis Modal */}
      <PhotoAnalysis 
        open={photoAnalysisOpen} 
        onOpenChange={setPhotoAnalysisOpen} 
      />
    </Dialog>
  );
}