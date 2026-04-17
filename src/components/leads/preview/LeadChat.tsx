import { useEffect } from "react";
import Box from "../../box/Box";
import ChatHeader from "../../chat/chat-content/ChatHeader";
import Messages from "../../chat/chat-content/Messages";
import ChatFooter from "../../chat/chat-content/ChatFooter";
import { chatModalCtx } from "../../../page/chat/chunk/Content";
import {
  fetchChat,
  fetchChatContact,
  fetchUserProfile,
  selectCurrentChat,
} from "../../../store/chats/chatSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { Divider } from "../../../ui";

const LeadChat = () => {
  const dispatch = useAppDispatch();
  const chats = useAppSelector((state) => state.chat.chats);
  const isChatSelected = useAppSelector(
    (state) => !!state.chat.selectedChat?.profile.uid
  );

  useEffect(() => {
    dispatch(fetchChat());
    dispatch(fetchUserProfile());
    dispatch(fetchChatContact());
  }, [dispatch]);

  useEffect(() => {
    if (!isChatSelected && chats.length > 0) {
      dispatch(selectCurrentChat(chats[0].profile.uid, "chat"));
    }
  }, [chats, isChatSelected, dispatch]);

  return (
    <chatModalCtx.Provider
      value={{ show: false, handleModal: () => {}, closeModal: () => {} }}
    >
      <Box display="flex" flexDirection="column" style={{ minHeight: "70vh" }}>
        {isChatSelected ? (
          <>
            <ChatHeader />
            <Divider />
            <Box flex={1} style={{ overflow: "hidden" }}>
              <Messages />
            </Box>
            <Box py={12}>
              <ChatFooter />
            </Box>
          </>
        ) : null}
      </Box>
    </chatModalCtx.Provider>
  );
};
export default LeadChat;
