import NavOptions from "./type"

import {ChatBubbleOutlineRounded, Dashboard} from "@mui/icons-material"

const navList: NavOptions[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <Dashboard />,
  },

  {
    label: "Chat",
    path: "/apps/chat/",
    icon: <ChatBubbleOutlineRounded />,
  },


];
export default navList;
