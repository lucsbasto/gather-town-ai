/**
 * ChatOverlay Component - GT-UI-004
 * Text chat overlay for workspace
 * - Chat messages display
 * - Input field with send
 * - @mentions support
 * - Emoji support
 */

import React, { useState, useRef, useEffect } from 'react';
import { designTokens, Player } from './designTokens';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

interface ChatOverlayProps {
  messages: ChatMessage[];
  currentPlayerId: string;
  players: Player[];
  onSendMessage: (text: string, mentions: string[]) => void;
  onClose?: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  currentPlayerId,
  players,
  onSendMessage,
  onClose,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { colors, spacing, card, typography, input, button } = designTokens;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Check for @ trigger
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const query = textBeforeCursor.slice(lastAtPos + 1);
      if (!query.includes(' ')) {
        setShowMentions(true);
        setMentionQuery(query.toLowerCase());
        setMentionPosition(lastAtPos);
        return;
      }
    }
    setShowMentions(false);
  };

  // Filter players for mentions
  const filteredPlayers = players.filter(p => 
    p.id !== currentPlayerId &&
    p.name.toLowerCase().includes(mentionQuery)
  );

  // Insert mention
  const insertMention = (playerName: string) => {
    const before = inputValue.slice(0, mentionPosition);
    const after = inputValue.slice(inputRef.current?.selectionStart || 0);
    setInputValue(`${before}@${playerName} ${after}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  // Handle send
  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Extract mentions
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(inputValue)) !== null) {
      const player = players.find(p => p.name.toLowerCase() === match[1].toLowerCase());
      if (player) mentions.push(player.id);
    }

    onSendMessage(inputValue.trim(), mentions);
    setInputValue('');
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    width: '320px',
    height: '400px',
    backgroundColor: colors.bgSurface,
    border: card.border,
    borderRadius: card.radius,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    zIndex: 100,
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottom: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: typography.fontSizeBase,
  };

  const messagesContainerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  };

  const messageStyle = (isOwn: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: isOwn ? 'flex-end' : 'flex-start',
  });

  const messageBubbleStyle = (isOwn: boolean): React.CSSProperties => ({
    backgroundColor: isOwn ? colors.accent : colors.bgElevated,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: '12px',
    borderBottomRightRadius: isOwn ? '4px' : '12px',
    borderBottomLeftRadius: isOwn ? '12px' : '4px',
    maxWidth: '80%',
    wordBreak: 'break-word',
    fontSize: typography.fontSizeSmall,
  };

  const senderStyle: React.CSSProperties = {
    fontSize: '11px',
    color: colors.textSecondary,
    marginBottom: '2px',
  };

  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    padding: spacing.md,
    borderTop: `1px solid ${colors.border}`,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    height: input.height,
    padding: input.padding,
    backgroundColor: colors.bgPrimary,
    border: input.border,
    borderRadius: input.radius,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSmall,
    outline: 'none',
    fontFamily: typography.fontFamily,
  };

  const sendButtonStyle: React.CSSProperties = {
    height: button.height,
    padding: `0 ${spacing.md}`,
    backgroundColor: colors.accent,
    border: 'none',
    borderRadius: button.radius,
    color: colors.textPrimary,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: typography.fontSizeSmall,
    fontFamily: typography.fontFamily,
  };

  const mentionsListStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '70px',
    left: spacing.md,
    backgroundColor: colors.bgElevated,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    maxHeight: '150px',
    overflowY: 'auto',
    width: '200px',
    zIndex: 101,
  };

  const mentionItemStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    fontSize: typography.fontSizeSmall,
  };

  // Simple emoji map (can be expanded)
  const emojiMap: Record<string, string> = {
    ':)': '😊',
    ':-)': '😊',
    ':(': '😢',
    ':-(': '😢',
    ':D': '😄',
    ':-D': '😄',
    ':p': '😜',
    ':-p': '😜',
    '<3': '❤️',
    ':+1': '👍',
    ':-1': '👎',
  };

  // Replace emojis in text
  const formatText = (text: string) => {
    let formatted = text;
    Object.entries(emojiMap).forEach(([key, emoji]) => {
      formatted = formatted.replace(new RegExp(key.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'), 'g'), emoji);
    });
    return formatted;
  };

  // Highlight @mentions
  const highlightMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => 
      part.startsWith('@') 
        ? <span key={i} style={{ color: colors.accent, fontWeight: 600 }}>{part}</span>
        : part
    );
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>Chat</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        )}
      </div>

      <div style={messagesContainerStyle}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: colors.textSecondary, 
            marginTop: 'auto',
            marginBottom: 'auto',
            fontSize: typography.fontSizeSmall,
          }}>
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.playerId === currentPlayerId;
            return (
              <div key={msg.id} style={messageStyle(isOwn)}>
                <span style={senderStyle}>{msg.playerName}</span>
                <div style={messageBubbleStyle(isOwn)}>
                  {highlightMentions(formatText(msg.text))}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {showMentions && filteredPlayers.length > 0 && (
        <div style={mentionsListStyle}>
          {filteredPlayers.map(player => (
            <div
              key={player.id}
              style={mentionItemStyle}
              onClick={() => insertMention(player.name)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bgPrimary)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 
                  player.status === 'available' ? colors.success :
                  player.status === 'busy' ? colors.danger :
                  player.status === 'in_meeting' ? colors.warning :
                  colors.muted,
              }} />
              {player.name}
            </div>
          ))}
        </div>
      )}

      <div style={inputContainerStyle}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Type a message... (@mention)"
          style={inputStyle}
        />
        <button
          onClick={handleSend}
          style={sendButtonStyle}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatOverlay;
