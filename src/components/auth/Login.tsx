import React, {FC, ReactNode, useEffect, useState} from "react"
import {Icon} from "@iconify/react"
import useTogglePassword from "../../hooks/useTogglePassword"
import {Alert, Button, IconButton, TextField} from "../../ui"
import Box from "../box/Box"
import Form from "../form/Form"
import AuthFormContainer from "./AuthFormContainer"
import FormHeading from "./FormHeading"

export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

interface Props {
  onSubmit: (inputs: LoginFormData) => void;
  hyperComponent?: ReactNode;
  isLoading?: boolean;
  serverError?: string;
}

const Login: FC<Props> = ({ onSubmit, hyperComponent, isLoading, serverError }) => {
  const { isToggle, handleTogglePassword } = useTogglePassword();
  const [inputs, setInputs] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [isRemember, setIsRemember] = useState(false);
  const [error, setError] = useState<string>("");

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setInputs((prevInputs) => ({ ...prevInputs, [name]: value }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = () => {
    const { email, password } = inputs;
    if (!email || !password) {
      setError("Please enter email & password");
      return;
    }
    // if (email.toLowerCase() !== "admin@triolo.com" || password !== "admin123") {
    //   setError(
    //     "Invalid email or password. Please enter valid email & password."
    //   );
    //   return;
    // }
    onSubmit({
      email,
      password,
      remember: isRemember,
    });
    setError("");
  };

  useEffect(() => {
    return () => {
      setIsRemember(false);
    };
  }, []);

  return (
    <AuthFormContainer>
      <Box width="100%" mb={20}>
        <Form onSubmit={handleSubmit} preventDefault>
          <FormHeading
            title="Welcome to"
            subtitle="Please sign-in to your account and start the adventure"
          />
          {hyperComponent}
          <Box display="flex" flexDirection="column" space={1}>
            {(error || serverError) && (
              <Alert severity="error" alertTitle="Authentication Failure!">
                {error || serverError}
              </Alert>
            )}
            <TextField
              type="text"
              name="email"
              label="Email"
              value={inputs.email}
              onChange={handleChangeInput}
            />
            <Box>
              <TextField
                type={!isToggle ? "password" : "text"}
                name="password"
                label="password"
                value={inputs.password}
                onChange={handleChangeInput}
                endAdornment={
                  <IconButton
                    onClick={handleTogglePassword}
                    varient="text"
                    size={38}
                    fontSize={20}
                    contentOpacity={6}
                    styles={{ right: 8 }}
                  >
                    {isToggle ? (
                      <Icon icon="mdi:eye-outline" />
                    ) : (
                      <Icon icon="mdi:eye-off-outline" />
                    )}
                  </IconButton>
                }
              />

            </Box>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Login'}
            </Button>
          </Box>
        </Form>
      </Box>
    </AuthFormContainer>
  );
};
export default Login;
