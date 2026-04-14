import { useEffect } from "react";
import AuthBanner from "../../components/auth/AuthBanner";
import Login, { LoginFormData } from "../../components/auth/Login";
import ColorBox from "../../components/box/ColorBox";
import AuthLayout from "../../components/layout/auth-form/AuthLayout";
import useAuth from "../../hooks/useAuth";
import useNavigation from "../../hooks/useNavigation";
import { useLoginMutation } from "../../store/auth/authApi";

const Signin = () => {
  const { isAuthenticated } = useAuth();
  const { navigate } = useNavigation();
  const [login, { isLoading, error }] = useLoginMutation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboards/crm/");
    }
  }, [isAuthenticated]);

  const handleSubmit = async (inputs: LoginFormData) => {
    try {
      await login({ email: inputs.email, password: inputs.password }).unwrap();
      navigate("/dashboards/crm/");
    } catch {}
  };

  const serverError = error
    ? "data" in error
      ? (error.data as any)?.message ?? "Invalid email or password"
      : "Login failed. Please try again."
    : undefined;

  return (
    <AuthLayout
      RightContent={
        <ColorBox backgroundTheme="foreground">
          <Login
            onSubmit={handleSubmit}
            isLoading={isLoading}
            serverError={serverError}
          />
        </ColorBox>
      }
      LeftContent={
        <AuthBanner
          bgDark="https://i.ibb.co/n8YcMNb/login-dark.png"
          bgLight="https://i.ibb.co/n8YcMNb/login-light.png"
        />
      }
    />
  );
};
export default Signin;
