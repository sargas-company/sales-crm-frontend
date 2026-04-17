import { Divider } from "@mui/material";
import ScrollContainer from "../scroll-container/ScrollContainer";
import NavGroup from "./components/NavGroup";
import NavHeading from "./components/NavHeading";
import NavItem from "./components/NavItem";
import NavContainer from "./NavContainer";
import NavContent from "./NavContent";
import navList, { secondaryNavList } from "./navLists";

const Nav = () => {
  const renderNavItem = (nav: (typeof navList)[number], index: number) => {
    const key = String(index);
    if (nav.childrens) {
      return (
        <NavGroup
          navData={{ parent: nav.parent!, childrens: nav.childrens }}
          key={key}
        />
      );
    }
    return (
      <NavItem
        label={nav.label!}
        path={nav.path!}
        icon={nav.icon}
        key={key}
      />
    );
  };

  return (
    <NavContainer>
      <NavContent>
        <div style={{ marginBottom: "70px" }}>
          <NavHeading />
          <ScrollContainer maxHeight="calc(100vh - 10rem)" scrollBarSize="4px">
            {navList.map(renderNavItem)}
          </ScrollContainer>
        </div>
        <div>
          <Divider sx={{ mb: 1 }} />
          {secondaryNavList.map(renderNavItem)}
        </div>
      </NavContent>
    </NavContainer>
  );
};
export default Nav;
