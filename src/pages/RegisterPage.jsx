import "../styles/auth.css";
import RegisterForm from "../components/auth/RegisterForm";
import IPGuard from "../components/auth/IPGuard";

export default function RegisterPage() {
  return (
    <IPGuard>
      <RegisterForm />
    </IPGuard>
  );
}
