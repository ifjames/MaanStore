import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Calculator, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/notifications";
import { inventoryService } from "@/lib/firestore-service";

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
      message: "👋 Hello! I'm your price checker assistant. Just type something like:\n\n• '1 555 sardines green'\n• '5 nova'\n• '3 coca cola'\n• '7 v fresh' (handles bulk pricing!)\n\nI'll find the exact item and calculate the total price, including bulk discounts when available!",
      timestamp: new Date()
    }
  ]);

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryService.getAll(),
    staleTime: 30000, // Cache for 30 seconds
  });

  // Helper function to parse bulk pricing from item names
  const parseBulkPricing = (itemName: string, itemPrice: string) => {
    // Look for patterns like "4 candy for 5 pesos", "4 for 5 pesos", "3 pcs for 10"
    const bulkPatterns = [
      /(\d+)\s+(?:candy|pcs?|pieces?)\s+for\s+(\d+(?:\.\d+)?)/i,
      /(\d+)\s+for\s+(\d+(?:\.\d+)?)/i,
      /(\d+)\s*pcs?\s*=\s*(\d+(?:\.\d+)?)/i,
      /(\d+)\s*pieces?\s*=\s*(\d+(?:\.\d+)?)/i
    ];

    for (const pattern of bulkPatterns) {
      const match = itemName.match(pattern);
      if (match) {
        const bulkQuantity = parseInt(match[1]);
        const bulkPrice = parseFloat(match[2]);
        const unitPrice = bulkPrice / bulkQuantity;
        
        return {
          isBulk: true as const,
          bulkQuantity,
          bulkPrice,
          unitPrice: unitPrice.toFixed(2),
          displayPrice: itemPrice // Keep original price for reference
        };
      }
    }

    return {
      isBulk: false as const,
      unitPrice: itemPrice
    };
  };

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
    
    if (inventoryLoading) {
      return {
        found: false,
        message: "Loading inventory data, please wait..."
      };
    }
    
    if (!inventory || inventory.length === 0) {
      return {
        found: false,
        message: "No inventory data available. Please check back later."
      };
    }

    const searchTerms = itemName.split(' ').filter(term => term.length > 1); // Filter out single characters
    
    // Score-based matching system
    const scoredItems = inventory.map(item => {
      const itemNameLower = item.itemName.toLowerCase();
      let score = 0;
      
      // Exact match gets highest score
      if (itemNameLower === itemName) {
        score = 1000;
      }
      // Contains the full search term
      else if (itemNameLower.includes(itemName)) {
        score = 500;
      }
      // Check how many search terms match
      else {
        let matchedTerms = 0;
        let totalTermScore = 0;
        
        searchTerms.forEach(term => {
          if (itemNameLower.includes(term)) {
            matchedTerms++;
            // Give higher score for longer terms
            totalTermScore += term.length * 10;
            
            // Bonus for exact word match
            const wordRegex = new RegExp(`\\b${term}\\b`, 'i');
            if (wordRegex.test(itemNameLower)) {
              totalTermScore += 50;
            }
          }
        });
        
        // Only consider items that match at least 60% of search terms
        const matchRatio = matchedTerms / searchTerms.length;
        if (matchRatio >= 0.6) {
          score = totalTermScore * matchRatio;
        }
      }
      
      return { item, score };
    }).filter(scored => scored.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredItems.length === 0) {
      return {
        found: false,
        message: `Sorry, I couldn't find any items matching "${itemName}". Try a different search term.`
      };
    }

    // If the top score is significantly higher than others, consider it a clear match
    const topScore = scoredItems[0].score;
    const secondScore = scoredItems[1]?.score || 0;
    
    if (scoredItems.length === 1 || topScore >= 500 || (topScore > secondScore * 2 && topScore > 100)) {
      const item = scoredItems[0].item;
      const currency = localStorage.getItem('currency') || 'PHP';
      
      // Parse bulk pricing
      const pricingInfo = parseBulkPricing(item.itemName, item.price);
      
      if (pricingInfo.isBulk) {
        // Calculate bulk pricing
        const fullBulks = Math.floor(quantity / pricingInfo.bulkQuantity);
        const remainder = quantity % pricingInfo.bulkQuantity;
        
        const bulkCost = fullBulks * pricingInfo.bulkPrice;
        const remainderCost = remainder * parseFloat(pricingInfo.unitPrice);
        const totalPrice = bulkCost + remainderCost;
        
        let priceBreakdown = "";
        if (fullBulks > 0 && remainder > 0) {
          priceBreakdown = `\n\nPrice breakdown:\n• ${fullBulks} bulk(s) of ${pricingInfo.bulkQuantity} = ${formatCurrency(bulkCost, currency)}\n• ${remainder} individual = ${formatCurrency(remainderCost, currency)}`;
        } else if (fullBulks > 0) {
          priceBreakdown = `\n\nPrice breakdown:\n• ${fullBulks} bulk(s) of ${pricingInfo.bulkQuantity} = ${formatCurrency(bulkCost, currency)}`;
        } else {
          priceBreakdown = `\n\nPrice breakdown:\n• ${remainder} individual at ${formatCurrency(parseFloat(pricingInfo.unitPrice), currency)} each`;
        }
        
        return {
          found: true,
          message: `${quantity} ${item.itemName} = ${formatCurrency(totalPrice, currency)}${priceBreakdown}\n\nBulk pricing: ${pricingInfo.bulkQuantity} for ${formatCurrency(pricingInfo.bulkPrice, currency)}\nStock available: ${item.stock} units`
        };
      } else {
        // Regular individual pricing
        const totalPrice = parseFloat(item.price) * quantity;
        
        return {
          found: true,
          message: `${quantity} ${item.itemName} = ${formatCurrency(totalPrice, currency)}\n\nUnit price: ${formatCurrency(parseFloat(item.price), currency)}\nStock available: ${item.stock} units`
        };
      }
    }

    // Multiple matches - show only top 5 most relevant
    const topMatches = scoredItems.slice(0, 5);
    const itemsList = topMatches.map(scored => `• ${scored.item.itemName}`).join('\n');
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
      <div className="h-full max-w-4xl mx-auto flex flex-col mobile-content">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6 border-b border-border/40"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Price Checker</h1>
          <p className="text-muted-foreground mobile-text mt-1">Search for product prices and information</p>
        </motion.div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Loading indicator */}
          {inventoryLoading && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Loading inventory data...</span>
              </div>
            </div>
          )}
          
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
                  placeholder="Type your query (e.g., '1 555 sardines green', '7 v fresh', '10 max candy')..."
                  className="pl-10 store-input"
                />
              </div>
              <Button type="submit" disabled={!input.trim()} className="store-btn-primary px-4">
                <Send size={16} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Tip: I handle bulk pricing automatically! Try "7 v fresh" or "10 max candy" for items with bulk discounts
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}