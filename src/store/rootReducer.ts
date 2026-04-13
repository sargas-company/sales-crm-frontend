import { combineReducers } from 'redux';
import chatReducer from '../features/chats/chatSlice';
const rootReducer = combineReducers({
    chat: chatReducer,
});
export default rootReducer;