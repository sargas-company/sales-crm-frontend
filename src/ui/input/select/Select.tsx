import { ArrowDropDown } from "@mui/icons-material";
import {
  Children,
  createContext,
  FC,
  ReactNode,
  SyntheticEvent,
  useContext,
  useEffect,
  useState,
} from "react";
import Box from "../../../components/box/Box";
import useTheme from "../../../theme/useTheme";
import { InputVarient } from "../type";
import StyledSelectWrapper, { StyledSelectButton } from "./styled";

interface DefaultProps {
  handleOnChange: (value: string, name: string, icon?: string) => void;
  currentSelection: string;
}
interface SelectProp {
  label?: string;
  defaultValue: string;
  classes?: string;
  selectId?: string;
  children: ReactNode;
  onChange?: (value: string, name?: string) => void;
  varient?: InputVarient;
  labelWidth?: string;
  width?: string;
  containerWidth?: string;
  sizes?: "small" | "normal";
}
const SelectCtx = createContext<DefaultProps | undefined>(undefined);
const Select: FC<SelectProp> = (props) => {
  const {
    theme: { mode, primaryColor },
  } = useTheme();
  const {
    label,
    defaultValue,
    classes,
    selectId,
    children,
    onChange,
    varient,
    labelWidth,
    sizes,
    width,
    containerWidth,
  } = props;
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState({
    label: "",
    value: "",
    icon: "",
  });

  useEffect(() => {
    if (defaultValue) {
      Children.forEach(
        children as any,
        (ele: { props: { label: string; value: string; icon?: string } }) => {
          if (ele.props.value.toLowerCase() === defaultValue.toLowerCase()) {
            setSelectedItem({ label: ele.props.label, value: ele.props.value, icon: ele.props.icon ?? "" });
          }
        }
      );
    } else {
      setSelectedItem({ label: "", value: "", icon: "" });
    }
  }, [defaultValue, children]);

  const handleSelectOpen = (eve: SyntheticEvent) => {
    eve.preventDefault();
    eve.stopPropagation();
    setSelectOpen(() => {
      document.addEventListener("click", handleClose);
      return true;
    });
  };
  const HandleOnChange = (value: string, label: string, icon?: string) => {
    setSelectedItem({ value, label, icon: icon ?? "" });
    onChange && onChange(value, label);
  };

  const handleClose = () => {
    setSelectOpen((prevState) => {
      if (prevState) {
        document.removeEventListener("click", handleClose);
      }
      return false;
    });
  };

  const itemListShow = selectOpen ? "show-select-item" : "";
  return (
    <StyledSelectWrapper
      theme={{ mode, primaryColor }}
      varient={varient}
      className={classes ? classes : ""}
      id={selectId ? selectId : ""}
      width={width}
      sizes={sizes}
      containerWidth={containerWidth}
    >
      <Box display="flex" flexDirection="column" onClick={handleSelectOpen}>
        <StyledSelectButton
          theme={{ mode, primaryColor }}
          as="div"
          className={`select-button input-button`}
          varient={varient}
          role="select"
          width={labelWidth}
          sizes={sizes}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {selectedItem.label || defaultValue}
            {selectedItem.icon && (
              <img src={selectedItem.icon} alt="" style={{ width: 20, height: 20, objectFit: "contain", borderRadius: 2 }} />
            )}
          </span>
        </StyledSelectButton>
        <span
          className={`input-label floating-label select-label ${
            selectOpen || defaultValue || selectedItem.value
              ? "floating-label-top"
              : ""
          }`}
        >
          {label}
        </span>
        <ArrowDropDown
          className={`select-status-arrow ${
            selectOpen ? "rotateUp" : "rotateDown"
          }`}
        />
        {(varient === "standard" || varient === "filled") && (
          <span
            className={`input-border ${
              selectOpen ? "active-border-transition" : ""
            }`}
          ></span>
        )}
      </Box>

      <SelectCtx.Provider
        value={{
          handleOnChange: HandleOnChange,
          currentSelection: selectedItem.value,
        }}
      >
        <ul className={`select-list-container ${itemListShow}`}>{children}</ul>
      </SelectCtx.Provider>
    </StyledSelectWrapper>
  );
};
export default Select;

export const SelectItem: FC<SelectItemProps> = ({
  label,
  value,
  icon,
  textAlign,
}) => {
  const han = useContext(SelectCtx);
  return (
    <li
      onClick={() => han?.handleOnChange(value, label, icon)}
      role="option"
      value={value}
      aria-label={label}
      className={`select-option-item ${
        han?.currentSelection === value ? "selected-item" : ""
      }`}
      style={textAlign ? { textAlign } : {}}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {label}
        {icon && (
          <img src={icon} alt="" style={{ width: 20, height: 20, objectFit: "contain", borderRadius: 2, flexShrink: 0 }} />
        )}
      </span>
    </li>
  );
};

interface SelectItemProps {
  label: string;
  value: string;
  icon?: string;
  textAlign?: "center" | "left" | "right";
}
