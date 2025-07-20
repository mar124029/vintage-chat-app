import React from "react"
import { Button } from "@/components/ui/button"
import { Smile, X } from "lucide-react"

interface EmojiButtonProps {
    onClick: () => void
    isOpen: boolean
    emojiCount: number
}

export function EmojiButton({ onClick, isOpen, emojiCount }: EmojiButtonProps) {
    return (
        <Button
            type="button"
            onClick={onClick}
            variant="ghost"
            size="sm"
            className={`relative p-2 rounded-lg transition-all duration-300 ${isOpen
                    ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/50"
                    : "bg-gradient-to-r from-slate-700/50 to-slate-600/50 text-slate-400 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-orange-500/10 hover:text-yellow-400 hover:border hover:border-yellow-500/30"
                }`}
        >
            {isOpen ? (
                <X className="w-4 h-4" />
            ) : (
                <Smile className="w-4 h-4" />
            )}

            {emojiCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                    {emojiCount}
                </span>
            )}
        </Button>
    )
} 