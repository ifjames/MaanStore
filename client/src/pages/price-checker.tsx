import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Calculator, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/notifications";

interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

export default function PriceChecker() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'bot',
      message: "👋 Hello! I'm your price checker assistant. Just type something like '5 nova' or '3 coca cola' to get instant pricing!",
      timestamp: new Date()
    }
  ]);

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const processQuery = (query: string) => {
    const trimmed = query.trim().toLowerCase();
    
    // Extract quantity and item name
    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    if (!match) {
      return {
        found: false,
        message: "Please format your query like '5 nova' or '3 coca cola'"
      };
    }

    const [, quantityStr, itemName] = match;
    const quantity = parseInt(quantityStr);
    
    if (!inventory) {
      return {
        found: false,
        message: "Inventory data is loading, please try again in a moment."
      };
    }

    // Find matching items
    const matchingItems = (inventory as any[]).filter(item => 
      item.itemName.toLowerCase().includes(itemName) ||
      itemName.split(' ').some(word => 
        item.itemName.toLowerCase().includes(word)
      )
    );

    if (matchingItems.length === 0) {
      return {
        found: false,
        message: `Sorry, I couldn't find any items matching "${itemName}". Try a different search term.`
      };
    }

    if (matchingItems.length === 1) {
      const item = matchingItems[0];
      const totalPrice = parseFloat(item.price) * quantity;
      const currency = localStorage.getItem('currency') || 'PHP';
      
      return {
        found: true,
        message: `${quantity} ${item.itemName} = ${formatCurrency(totalPrice, currency)}\n\nUnit price: ${formatCurrency(parseFloat(item.price), currency)}\nStock available: ${item.stock} units`
      };
    }

    // Multiple matches
    const itemsList = matchingItems.map(item => `• ${item.itemName}`).join('\n');
    return {
      found: false,
      message: `I found multiple items matching "${itemName}":\n\n${itemsList}\n\nPlease be more specific!`
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      message: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Process the query
    const result = processQuery(input);
    
    // Add bot response
    const botMessage: ChatMessage = {
      id: Date.now() + 1,
      type: 'bot',
      message: result.message,
      timestamp: new Date()
    };

    setTimeout(() => {
      setMessages(prev => [...prev, botMessage]);
    }, 500);

    setInput("");
  };

  return (
    <div className="flex-1 overflow-hidden mobile-padding">
      <div className="h-full max-w-4xl mx-auto flex flex-col">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gradient">Price Checker</h1>
          </div>
          <p className="text-muted-foreground mobile-text">
            Get instant pricing for any item in our inventory
          </p>
        </motion.div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-white/5 dark:bg-black/5 rounded-t-xl backdrop-blur-sm border border-border/50">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-gradient-primary text-white' 
                      : 'bg-gradient-secondary text-white'
                  }`}>
                    {message.type === 'user' ? (
                      <User size={16} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>
                  <Card className={`max-w-[80%] p-3 ${
                    message.type === 'user'
                      ? 'glass-card-primary'
                      : 'glass-card'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {message.message}
                    </p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-border/50 rounded-b-xl">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your query (e.g., '5 nova', '3 coca cola')..."
                  className="pl-10 store-input"
                />
              </div>
              <Button type="submit" disabled={!input.trim()} className="store-btn-primary px-4">
                <Send size={16} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Tip: Use format like "5 nova" or "3 coca cola" for best results
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}