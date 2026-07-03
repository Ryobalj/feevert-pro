// src/features/realtime/pages/MessagesPage.jsx

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import UserChatList from '../components/UserChatList'
import ChatBox from '../components/ChatBox'

const MessagesPage = () => {
  const { t } = useTranslation('realtime')
  const [selectedChat, setSelectedChat] = useState(null)

  return (
    <div className="container-main py-8 md:py-12">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          {t('chat.messages') || 'Messages'}
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {t('chat.messages_subtitle') || 'All your conversations in one place'}
        </p>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 260px)', minHeight: 500 }}>
        <div className="w-full md:w-96 flex-shrink-0 h-full">
          <UserChatList
            embedded
            selectedUserId={selectedChat?.id}
            onSelectUser={setSelectedChat}
          />
        </div>

        <div className={`flex-1 h-full min-w-0 ${selectedChat ? '' : 'hidden md:flex'}`}>
          {selectedChat ? (
            <ChatBox
              key={selectedChat.id}
              embedded
              recipientId={selectedChat.id}
              recipientName={selectedChat.name}
              recipientAvatar={selectedChat.avatar}
              onClose={() => setSelectedChat(null)}
            />
          ) : (
            <div className="flex-1 glass-card !p-0 flex flex-col items-center justify-center text-center h-full">
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center text-4xl mb-4">💬</div>
              <p className="text-white/50 font-medium">{t('chat.select_conversation') || 'Select a conversation'}</p>
              <p className="text-white/30 text-sm mt-1">{t('chat.select_conversation_hint') || 'Choose a chat from the list or start a new one'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
