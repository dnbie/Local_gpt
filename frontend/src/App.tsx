import { useEffect, useState } from "react";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

function App() {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem("localgpt_chats");

    if (saved) {
      return JSON.parse(saved);
    }

    return [
      {
        id: crypto.randomUUID(),
        title: "New Chat",
        messages: [],
      },
    ];
  });

  const [activeChatId, setActiveChatId] = useState(chats[0].id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  useEffect(() => {
    localStorage.setItem(
      "localgpt_chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInput("");
  };

  const deleteChat = (id: string) => {
    if (chats.length === 1) {
      return;
    }

    const remaining = chats.filter(
      (chat) => chat.id !== id
    );

    setChats(remaining);

    if (id === activeChatId) {
      setActiveChatId(remaining[0].id);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !activeChat) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [
      ...activeChat.messages,
      userMessage,
    ];

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              title:
                chat.messages.length === 0
                  ? input.trim().slice(0, 30)
                  : chat.title,
              messages: updatedMessages,
            }
          : chat
      )
    );

    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Backend error");
      }

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  assistantMessage,
                ],
              }
            : chat
        )
      );
    } catch (error) {
      console.error(error);

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    role: "assistant",
                    content:
                      "❌ Could not connect to LocalGPT backend.",
                  },
                ],
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          <h2>LocalGPT</h2>
          <span>Private AI</span>
        </div>

        <button
          className="new-chat"
          onClick={createNewChat}
        >
          + New Chat
        </button>

        <div className="chat-list">

          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                chat.id === activeChatId
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveChatId(chat.id)
              }
            >
              <span className="chat-title">
                💬 {chat.title}
              </span>

              {chats.length > 1 && (
                <button
                  className="delete-chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}

        </div>

        <div className="sidebar-footer">
          🟢 Running locally
        </div>

      </aside>

      {/* MAIN AREA */}

      <section className="main">

        <header className="header">

          <div>
            <h1>LocalGPT</h1>
            <p>
              Private AI • Running Locally
            </p>
          </div>

          <div className="model">
            🟢 Qwen3 8B
          </div>

        </header>

        <main className="chat-container">

          {!activeChat ||
          activeChat.messages.length === 0 ? (
            <div className="welcome">

              <h2>
                How can I help you?
              </h2>

              <p>
                Your AI assistant is running
                completely on your PC.
              </p>

              <div className="suggestions">

                <button
                  onClick={() =>
                    setInput(
                      "Explain artificial intelligence simply"
                    )
                  }
                >
                  Explain AI
                </button>

                <button
                  onClick={() =>
                    setInput(
                      "Help me write Python code"
                    )
                  }
                >
                  Write Python
                </button>

                <button
                  onClick={() =>
                    setInput(
                      "Explain RAG with an example"
                    )
                  }
                >
                  Explain RAG
                </button>

              </div>

            </div>
          ) : (
            activeChat.messages.map(
              (message, index) => (
                <div
                  key={index}
                  className={`message-row ${message.role}`}
                >
                  <div className="message-label">
                    {message.role === "user"
                      ? "You"
                      : "LocalGPT"}
                  </div>

                  <div className="message-bubble">
                    {message.content}
                  </div>
                </div>
              )
            )
          )}

          {loading && (
            <div className="message-row assistant">

              <div className="message-label">
                LocalGPT
              </div>

              <div className="message-bubble">
                Thinking...
              </div>

            </div>
          )}

        </main>

        <div className="input-area">

          <textarea
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Ask LocalGPT anything..."
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button
            onClick={sendMessage}
            disabled={
              loading || !input.trim()
            }
          >
            {loading ? "..." : "Send"}
          </button>

        </div>

      </section>

    </div>
  );
}

export default App;