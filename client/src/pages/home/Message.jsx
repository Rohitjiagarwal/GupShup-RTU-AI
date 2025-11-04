import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const Message = ({ messageDetails }) => {
  const messageRef = useRef(null);
  const { userProfile, selectedUser } = useSelector(
    (state) => state.userReducer
  );

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const isUser = userProfile?._id === messageDetails?.senderId;

  return (
    <div
      ref={messageRef}
      className={`chat ${isUser ? "chat-end" : "chat-start"}`}
    >
      {/* Avatar */}
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img
            alt="avatar"
            src={isUser ? userProfile?.avatar : selectedUser?.avatar}
          />
        </div>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1 max-w-[70%]">
        {/* Header */}
        <div className="chat-header flex items-center justify-between">
          <span className="font-semibold">
            {isUser ? userProfile?.username : selectedUser?.username}
          </span>
          <time className="text-xs opacity-50">
            {new Date(messageDetails?.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>

        {/* Bubble */}
        <div
          className={`chat-bubble whitespace-pre-line ${
            isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {messageDetails?.message}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default Message;
